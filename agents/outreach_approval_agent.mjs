#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const QUEUE_PATH = '/home/skids/Riden-Technologies-Website/agent_reports/outreach_approval_queue.json';

function shortCode(prefix, ...parts) {
  const digest = crypto
    .createHash('sha256')
    .update(parts.map((p) => String(p ?? '')).join('|'))
    .digest('base64url')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 6);
  return `${prefix}-${digest}`;
}

export function buildApprovalRecord(draft, opts = {}) {
  const batchId = opts.batchId || new Date().toISOString();
  const now = opts.now || new Date().toISOString();
  const base = `${batchId}|${draft.leadId}|${draft.businessName}|${draft.phone}`;
  return {
    id: crypto.createHash('sha1').update(base).digest('hex').slice(0, 16),
    batchId,
    leadId: draft.leadId,
    businessName: draft.businessName,
    phone: draft.phone,
    target: draft.target,
    status: 'pending_review',
    createdAt: now,
    updatedAt: now,
    whatsapp: {
      approvalCode: shortCode('WA', base, 'whatsapp'),
      status: 'pending_review',
      draft: draft.whatsapp,
      sent: false,
      sentAt: null,
    },
    email: {
      approvalCode: shortCode('EM', base, 'email'),
      status: 'pending_review',
      subject: draft.email?.subject || '',
      draft: draft.email?.body || '',
      sent: false,
      sentAt: null,
    },
    guardrails: {
      requiresHumanApproval: true,
      sendPolicy: 'Approval only. This queue records intent; it does not send WhatsApp or email.',
      maxAutonomy: 'draft_and_queue_only',
    },
    auditTrail: [
      { at: now, event: 'created_pending_review', detail: 'Draft added to approval queue; no message sent.' },
    ],
  };
}

export function normalizeApprovalCommand(input) {
  const text = String(input || '').trim();
  const match = text.match(/^(approve|reject|rewrite)\s+((?:WA|EM)-[A-Z0-9]{6})(?:\s+([\s\S]+))?$/i);
  if (!match) return null;
  return {
    action: match[1].toLowerCase(),
    code: match[2].toUpperCase(),
    instruction: (match[3] || '').trim(),
  };
}

function findChannelByCode(queue, code) {
  for (const record of queue) {
    if (record.whatsapp?.approvalCode === code) return { record, channel: 'whatsapp', item: record.whatsapp };
    if (record.email?.approvalCode === code) return { record, channel: 'email', item: record.email };
  }
  return null;
}

export function applyApprovalCommand(queue, input, opts = {}) {
  const command = normalizeApprovalCommand(input);
  if (!command) return { ok: false, error: 'Command must look like: approve WA-ABC123, reject EM-ABC123 reason, or rewrite WA-ABC123 instruction.' };
  const found = findChannelByCode(queue, command.code);
  if (!found) return { ok: false, error: `No queued draft found for code ${command.code}` };

  const now = opts.now || new Date().toISOString();
  const nextStatus = command.action === 'approve'
    ? 'approved'
    : command.action === 'reject'
      ? 'rejected'
      : 'rewrite_requested';

  found.item.status = nextStatus;
  found.item.sent = false;
  found.item.updatedAt = now;
  if (command.instruction) found.item.instruction = command.instruction;
  found.record.updatedAt = now;
  found.record.auditTrail ||= [];
  found.record.auditTrail.push({
    at: now,
    event: `${found.channel}_${nextStatus}`,
    code: command.code,
    instruction: command.instruction,
    detail: 'Approval queue updated only. No outbound message was sent.',
  });

  const statuses = [found.record.whatsapp?.status, found.record.email?.status];
  if (statuses.every((s) => s === 'approved')) found.record.status = 'approved';
  else if (statuses.every((s) => ['rejected', 'approved'].includes(s))) found.record.status = 'reviewed';
  else if (statuses.includes('rewrite_requested')) found.record.status = 'rewrite_requested';
  else found.record.status = 'pending_review';

  return { ok: true, action: command.action, code: command.code, channel: found.channel, record: found.record };
}

export function summarizeQueue(queue) {
  const summary = {
    records: queue.length,
    channels: queue.length * 2,
    pending_review: 0,
    approved: 0,
    rejected: 0,
    rewrite_requested: 0,
    sent: 0,
  };
  for (const record of queue) {
    for (const channel of ['whatsapp', 'email']) {
      const item = record[channel];
      if (!item) continue;
      summary[item.status] = (summary[item.status] || 0) + 1;
      if (item.sent) summary.sent += 1;
    }
  }
  return summary;
}

export function mergeRecords(existing, records) {
  const byKey = new Map(existing.map((record) => [`${record.leadId}|${record.batchId}`, record]));
  for (const record of records) {
    const key = `${record.leadId}|${record.batchId}`;
    if (!byKey.has(key)) byKey.set(key, record);
  }
  return [...byKey.values()];
}

export function loadQueue(queuePath = QUEUE_PATH) {
  if (!fs.existsSync(queuePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  return Array.isArray(parsed) ? parsed : parsed.queue || [];
}

export function saveQueue(queue, queuePath = QUEUE_PATH) {
  fs.mkdirSync(path.dirname(queuePath), { recursive: true });
  fs.writeFileSync(queuePath, JSON.stringify({ updatedAt: new Date().toISOString(), queue, summary: summarizeQueue(queue) }, null, 2));
}

export function queueFromDraftReport(report, opts = {}) {
  const batchId = opts.batchId || report.batchId || `drafts_${new Date().toISOString()}`;
  return (report.drafts || []).map((draft) => buildApprovalRecord(draft, { batchId }));
}

function formatQueue(records, summary, queuePath) {
  const lines = [
    '✅ Riden Outreach Approval Queue Updated',
    `Queued records: ${summary.records}`,
    `Pending review: ${summary.pending_review}`,
    `Approved: ${summary.approved}`,
    `Rejected: ${summary.rejected}`,
    `Rewrite requested: ${summary.rewrite_requested}`,
    `Sent: ${summary.sent}`,
    '',
    'Commands you can approve later:',
  ];
  for (const record of records.slice(0, 5)) {
    lines.push(`${record.businessName}`);
    lines.push(`  WhatsApp: approve ${record.whatsapp.approvalCode} / rewrite ${record.whatsapp.approvalCode} make it warmer / reject ${record.whatsapp.approvalCode}`);
    lines.push(`  Email: approve ${record.email.approvalCode} / rewrite ${record.email.approvalCode} shorter / reject ${record.email.approvalCode}`);
  }
  lines.push('', `Queue file: ${queuePath}`);
  lines.push('Guardrail: approval queue only — no WhatsApp or email has been sent.');
  return lines.join('\n');
}

export async function run(argv = process.argv.slice(2)) {
  const args = [...argv];
  const commandIdx = args.indexOf('--command');
  const reportIdx = args.indexOf('--report');
  const queueIdx = args.indexOf('--queue');
  const queuePath = queueIdx >= 0 ? args[queueIdx + 1] : QUEUE_PATH;
  let queue = loadQueue(queuePath);

  if (reportIdx >= 0) {
    const reportPath = args[reportIdx + 1];
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const batchId = `report_${path.basename(reportPath).replace(/\.json$/, '')}`;
    const newRecords = queueFromDraftReport(report, { batchId });
    queue = mergeRecords(queue, newRecords);
    saveQueue(queue, queuePath);
    return formatQueue(newRecords, summarizeQueue(queue), queuePath);
  }

  if (commandIdx >= 0) {
    const input = args.slice(commandIdx + 1).join(' ');
    const result = applyApprovalCommand(queue, input);
    if (!result.ok) throw new Error(result.error);
    saveQueue(queue, queuePath);
    return `Approval command applied: ${result.action} ${result.code} (${result.channel})\nNo WhatsApp or email sent.\nQueue file: ${queuePath}`;
  }

  return formatQueue(queue, summarizeQueue(queue), queuePath);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  run().then((out) => console.log(out)).catch((err) => {
    console.error(`Riden Outreach Approval Agent failed: ${err.stack || err.message || err}`);
    process.exit(1);
  });
}
