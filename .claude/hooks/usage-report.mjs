#!/usr/bin/env node
// SessionEnd hook: aggregates token usage and cost for the session that just ended
// and writes reports/ws2/<date>-<session_id>.md.
//
// Transcript layout (observed in Claude Code 2.1.309 transcripts):
//   <project>/<session_id>.jsonl                          main thread
//   <project>/<session_id>/subagents/agent-<id>.jsonl     one per sub-agent (isSidechain: true, agentId)
//   <project>/<session_id>/subagents/agent-<id>.meta.json {agentType, description, model, spawnDepth, ...}
// A streamed response is split over several `assistant` records that share message.id
// and carry identical usage, so usage is counted once per message.id.
// Compactions are `system` records with subtype compact_boundary / microcompact_boundary.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// USD per million tokens, first-party Claude API rates (claude-api skill, cached 2026-10-06).
// cw5m / cw1h = cache writes with 5-minute / 1-hour TTL, cr = cache reads.
const PRICES = {
  'claude-fable-5-1':  { input: 10.00, output: 50.00, cw5m: 12.50, cw1h: 20.00, cr: 0.25 },
  'claude-opus-5-5':   { input:  4.00, output: 20.00, cw5m:  5.00, cw1h:  8.00, cr: 0.20, fast: 2 },
  'claude-sonnet-5-5': { input:  2.00, output: 10.00, cw5m:  2.50, cw1h:  4.00, cr: 0.20 },
  // Haiku 5.5 has a second rate card for prompts over 100K tokens.
  'claude-haiku-5-5':  { input:  0.10, output:  0.50, cw5m:  0.125, cw1h: 0.20, cr: 0.01,
    longPrompt: { threshold: 100_000, input: 0.50, output: 2.50, cw5m: 0.625, cw1h: 1.00, cr: 0.05 } },
};
const US_GEO_MULTIPLIER = 1.1; // inference_geo: "us"

const readStdin = () => new Promise((resolve) => {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => { data += c; });
  process.stdin.on('end', () => resolve(data));
});

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}

const normalizeModel = (m) => String(m ?? 'unknown').replace(/\[.*\]$/, '');

function emptyBucket() {
  return { requests: 0, input: 0, cw5m: 0, cw1h: 0, cr: 0, output: 0, thinking: 0, cost: 0, unpriced: 0 };
}

function addInto(target, src) {
  for (const k of Object.keys(target)) target[k] += src[k] ?? 0;
}

function costOf(model, u) {
  const p = PRICES[model];
  if (!p) return null;
  const prompt = u.input + u.cw5m + u.cw1h + u.cr;
  const rates = p.longPrompt && prompt > p.longPrompt.threshold ? p.longPrompt : p;
  let usd = (u.input * rates.input + u.cw5m * rates.cw5m + u.cw1h * rates.cw1h
    + u.cr * rates.cr + u.output * rates.output) / 1e6;
  if (u.speed === 'fast') usd *= p.fast ?? 1;
  if (u.geo === 'us') usd *= US_GEO_MULTIPLIER;
  return usd;
}

// Returns { byModel, compacts, firstTs, lastTs } for one transcript file.
function analyze(records) {
  const messages = new Map();
  const compacts = [];
  let firstTs = null, lastTs = null;
  for (const r of records) {
    if (r.timestamp) {
      if (!firstTs || r.timestamp < firstTs) firstTs = r.timestamp;
      if (!lastTs || r.timestamp > lastTs) lastTs = r.timestamp;
    }
    if (r.type === 'assistant' && r.message?.usage) {
      messages.set(r.message.id ?? r.requestId ?? r.uuid, r);
    } else if (r.type === 'system' && (r.subtype === 'compact_boundary' || r.subtype === 'microcompact_boundary')) {
      compacts.push({
        timestamp: r.timestamp,
        kind: r.subtype === 'compact_boundary' ? 'compact' : 'microcompact',
        trigger: r.compactMetadata?.trigger ?? '',
        preTokens: r.compactMetadata?.preTokens,
        messagesSummarized: r.compactMetadata?.messagesSummarized,
      });
    }
  }

  const byModel = {};
  for (const r of messages.values()) {
    const model = normalizeModel(r.message.model);
    const usage = r.message.usage;
    const cc = usage.cache_creation;
    const u = {
      requests: 1,
      input: usage.input_tokens ?? 0,
      // Without the TTL breakdown, treat all cache writes as 5-minute writes.
      cw5m: cc ? cc.ephemeral_5m_input_tokens ?? 0 : usage.cache_creation_input_tokens ?? 0,
      cw1h: cc ? cc.ephemeral_1h_input_tokens ?? 0 : 0,
      cr: usage.cache_read_input_tokens ?? 0,
      output: usage.output_tokens ?? 0,
      thinking: usage.output_tokens_details?.thinking_tokens ?? 0,
      speed: usage.speed,
      geo: usage.inference_geo,
    };
    const usd = costOf(model, u);
    u.cost = usd ?? 0;
    u.unpriced = usd === null ? 1 : 0;
    addInto(byModel[model] ??= emptyBucket(), u);
  }
  return { byModel, compacts, firstTs, lastTs };
}

function loadSubagents(transcriptPath, sessionId) {
  const dir = path.join(path.dirname(transcriptPath), sessionId, 'subagents');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => /^agent-.+\.jsonl$/.test(f))
    .map((f) => {
      const id = f.slice('agent-'.length, -'.jsonl'.length);
      let meta = {};
      try { meta = JSON.parse(fs.readFileSync(path.join(dir, `agent-${id}.meta.json`), 'utf8')); } catch { /* no meta */ }
      return { id, meta, ...analyze(readJsonl(path.join(dir, f))) };
    })
    .sort((a, b) => String(a.firstTs).localeCompare(String(b.firstTs)));
}

function total(byModel) {
  const t = emptyBucket();
  for (const b of Object.values(byModel)) addInto(t, b);
  return t;
}

const n = (x) => (x ?? 0).toLocaleString('en-US');
const usd = (x) => `$${(x ?? 0).toFixed(4)}`;
const localDate = (d) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ');

function usageTable(byModel) {
  const rows = Object.entries(byModel).sort(([, a], [, b]) => b.cost - a.cost);
  const t = total(byModel);
  return [
    '| Model | Requests | Input | Cache write 5m | Cache write 1h | Cache read | Output (thinking) | Cost |',
    '|---|---:|---:|---:|---:|---:|---:|---:|',
    ...rows.map(([m, b]) => `| \`${m}\`${b.unpriced ? ' ⚠ no price' : ''} | ${n(b.requests)} | ${n(b.input)} | ${n(b.cw5m)} | ${n(b.cw1h)} | ${n(b.cr)} | ${n(b.output)} (${n(b.thinking)}) | ${usd(b.cost)} |`),
    `| **Total** | **${n(t.requests)}** | **${n(t.input)}** | **${n(t.cw5m)}** | **${n(t.cw1h)}** | **${n(t.cr)}** | **${n(t.output)} (${n(t.thinking)})** | **${usd(t.cost)}** |`,
  ].join('\n');
}

function buildReport({ input, main, subagents, costState }) {
  const allByModel = {};
  for (const src of [main, ...subagents]) {
    for (const [m, b] of Object.entries(src.byModel)) addInto(allByModel[m] ??= emptyBucket(), b);
  }
  const compacts = [
    ...main.compacts.map((c) => ({ ...c, where: 'main' })),
    ...subagents.flatMap((s) => s.compacts.map((c) => ({ ...c, where: `sub-agent ${s.id}` }))),
  ].sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
  const grand = total(allByModel);
  const out = [];

  out.push(`# Usage report: ${input.session_id}`, '');
  out.push(`- **Generated:** ${new Date().toISOString()}`);
  out.push(`- **Session span:** ${main.firstTs ?? '?'} → ${main.lastTs ?? '?'}`);
  if (input.reason) out.push(`- **End reason:** ${input.reason}`);
  out.push(`- **Transcript:** \`${input.transcript_path}\``);
  out.push(`- **Estimated cost:** ${usd(grand.cost)} (${n(grand.requests)} API responses, ${subagents.length} sub-agent(s), ${compacts.length} compaction(s))`, '');

  out.push('## Usage by model (main thread + sub-agents)', '', usageTable(allByModel), '');

  out.push('## Main thread vs sub-agents', '');
  const mainT = total(main.byModel);
  out.push('| Scope | Requests | Output | Cost |', '|---|---:|---:|---:|');
  out.push(`| Main thread | ${n(mainT.requests)} | ${n(mainT.output)} | ${usd(mainT.cost)} |`);
  const subT = emptyBucket();
  for (const s of subagents) addInto(subT, total(s.byModel));
  out.push(`| Sub-agents | ${n(subT.requests)} | ${n(subT.output)} | ${usd(subT.cost)} |`, '');

  out.push('## Sub-agents', '');
  if (!subagents.length) {
    out.push('None.', '');
  } else {
    out.push('| Agent ID | Type | Description | Model(s) | Depth | Requests | Output | Cost |', '|---|---|---|---|---:|---:|---:|---:|');
    for (const s of subagents) {
      const t = total(s.byModel);
      out.push(`| \`${s.id}\` | ${cell(s.meta.agentType ?? '?')} | ${cell(s.meta.description)} | ${Object.keys(s.byModel).map((m) => `\`${m}\``).join(', ') || '-'} | ${s.meta.spawnDepth ?? ''} | ${n(t.requests)} | ${n(t.output)} | ${usd(t.cost)} |`);
    }
    out.push('');
  }

  out.push('## Compactions', '');
  if (!compacts.length) {
    out.push('None.', '');
  } else {
    out.push('| Time | Where | Kind | Trigger | Tokens before | Messages summarized |', '|---|---|---|---|---:|---:|');
    for (const c of compacts) {
      out.push(`| ${c.timestamp ?? ''} | ${c.where} | ${c.kind} | ${c.trigger} | ${c.preTokens == null ? '' : n(c.preTokens)} | ${c.messagesSummarized == null ? '' : n(c.messagesSummarized)} |`);
    }
    out.push('');
  }

  if (costState) {
    out.push('## Claude Code\'s own cost record', '');
    out.push(`The transcript's last \`cost-state\` record reports **${usd(costState.totalCostUSD)}**. It also counts side calls that leave no \`assistant\` record (for example title generation), so it can differ from the estimate above.`, '');
    out.push('| Model | Input | Cache write | Cache read | Output | Cost |', '|---|---:|---:|---:|---:|---:|');
    for (const [m, u] of Object.entries(costState.modelUsage ?? {})) {
      out.push(`| \`${m}\` | ${n(u.inputTokens)} | ${n(u.cacheCreationInputTokens)} | ${n(u.cacheReadInputTokens)} | ${n(u.outputTokens)} | ${usd(u.costUSD)} |`);
    }
    out.push('');
  }

  out.push('## Price table (USD per 1M tokens)', '');
  out.push('| Model | Input | Output | Cache write 5m | Cache write 1h | Cache read |', '|---|---:|---:|---:|---:|---:|');
  for (const [m, p] of Object.entries(PRICES)) {
    out.push(`| \`${m}\` | ${p.input} | ${p.output} | ${p.cw5m} | ${p.cw1h} | ${p.cr} |`);
  }
  out.push('', 'Haiku 5.5 prompts over 100K tokens use $0.50 / $2.50 (cache rates scaled the same way). Opus 5.5 fast mode is billed at 2×, and `inference_geo: "us"` at 1.1×. Thinking tokens are part of output and are not billed separately.', '');
  return out.join('\n');
}

async function main() {
  const input = JSON.parse((await readStdin()) || '{}');
  const { transcript_path: transcriptPath, session_id: sessionId } = input;
  if (!transcriptPath || !sessionId) throw new Error('stdin is missing transcript_path or session_id');
  if (!fs.existsSync(transcriptPath)) throw new Error(`transcript not found: ${transcriptPath}`);

  const records = readJsonl(transcriptPath);
  const mainStats = analyze(records);
  const subagents = loadSubagents(transcriptPath, sessionId);
  const costState = records.filter((r) => r.type === 'cost-state').at(-1);

  const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const projectDir = process.env.CLAUDE_PROJECT_DIR || scriptRoot;
  const outDir = path.join(projectDir, 'reports', 'ws2');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${localDate(new Date())}-${sessionId}.md`);
  fs.writeFileSync(outFile, buildReport({ input, main: mainStats, subagents, costState }), 'utf8');
  process.stderr.write(`usage-report: wrote ${outFile}\n`);
}

// A reporting hook must never break session shutdown: log and exit 0.
main().catch((err) => {
  process.stderr.write(`usage-report: ${err?.stack ?? err}\n`);
  process.exit(0);
});
