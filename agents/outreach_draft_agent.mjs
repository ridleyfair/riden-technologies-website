#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { buildApprovalRecord, loadQueue, mergeRecords, saveQueue, QUEUE_PATH } from './outreach_approval_agent.mjs';

const ENV_FILES = [
  '/home/skids/.hermes/.env',
  '/home/skids/Riden-Technologies-Website/.env.local',
  '/home/skids/Riden-Technologies-Website/.env',
];
const REPORT_DIR = '/home/skids/Riden-Technologies-Website/agent_reports';
const DEFAULT_SIGNOFF = 'Ridley from Riden Technologies';

function loadEnv() {
  for (const file of ENV_FILES) {
    if (!fs.existsSync(file)) continue;
    for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function cleanBusinessName(lead) {
  return String(lead.company || lead.name || 'there').trim();
}

export function parseLeadNotes(notes = '') {
  const text = String(notes || '');
  const target = text.match(/^Target:\s*(.+)$/mi)?.[1]?.trim() || null;
  const ratingText = text.match(/^Google rating:\s*(.+)$/mi)?.[1]?.trim() || null;
  const hasNoWebsite = /No website listed|No website\b/i.test(text);
  const reasonsText = text.match(/^Reasons:\s*(.+)$/mi)?.[1]?.trim() || '';
  const niche = text.match(/^Niche:\s*(.+)$/mi)?.[1]?.trim() || null;
  const recommendedTemplate = text.match(/^Recommended template:\s*(.+)$/mi)?.[1]?.trim() || null;
  const primaryOutreachAngle = text.match(/^Primary outreach angle:\s*(.+)$/mi)?.[1]?.trim() || null;
  const websiteQuality = text.match(/^Website quality:\s*(.+)$/mi)?.[1]?.trim() || null;
  const reasons = reasonsText ? reasonsText.split(';').map((x) => x.trim()).filter(Boolean) : [];
  return { target, ratingText, hasNoWebsite, reasons, niche, recommendedTemplate, primaryOutreachAngle, websiteQuality };
}

function reasonPhrase(parsed) {
  if (parsed.hasNoWebsite) return 'I noticed there wasn’t much of a website presence showing';
  if (parsed.reasons.some((r) => /weak conversion/i.test(r))) return 'I noticed the website could probably do more to turn visitors into enquiries';
  if (parsed.reasons.some((r) => /slow|thin/i.test(r))) return 'I noticed the current site looked like it could be sharpened up a bit';
  return 'I thought there might be a good opportunity to improve how the business shows up online';
}

function reputationPhrase(parsed) {
  const match = String(parsed.ratingText || '').match(/([0-9.]+)\s*\((\d+)\s+reviews?\)/i);
  if (match) {
    const rating = Number(match[1]);
    const reviews = Number(match[2]);
    if (rating >= 4.5 && reviews >= 5) return `You’ve already got some great reviews online (${parsed.ratingText}), so`;
    if (rating >= 4 && reviews >= 2) return `You’ve already got a good start with your Google reviews (${parsed.ratingText}), so`;
  }
  return 'From what I could see,';
}

export function buildWhatsAppDraft(lead, opts = {}) {
  const signoff = opts.signoff || DEFAULT_SIGNOFF;
  const business = cleanBusinessName(lead);
  const parsed = parseLeadNotes(lead.notes);
  const rep = reputationPhrase(parsed);
  const reason = reasonPhrase(parsed);

  return [
    `Hi ${business}, hope you’re well — I came across ${business} while looking at plumbing businesses around London.`,
    '',
    `${rep} ${reason}. I run Riden Technologies — we build clean, mobile-friendly websites for local trade businesses that help turn Google searches into enquiries.`,
    '',
    'Would you be open to me sending over a quick example of what we could put together for you?',
    '',
    `Thanks,\n${signoff}`,
  ].join('\n');
}

export function buildEmailDraft(lead, opts = {}) {
  const signoff = opts.signoff || DEFAULT_SIGNOFF;
  const business = cleanBusinessName(lead);
  const parsed = parseLeadNotes(lead.notes);
  const reason = reasonPhrase(parsed);
  const rep = reputationPhrase(parsed);
  const subject = `Quick website idea for ${business}`;
  const body = [
    `Hi ${business},`,
    '',
    `I came across ${business} while looking at plumbing businesses around London. ${rep} ${reason}.`,
    '',
    'I run Riden Technologies — we build clean, mobile-friendly websites for local trade businesses. The aim is simple: make the business look professional online and make it easier for people searching on Google to enquire.',
    '',
    'Would you be open to me sending over a quick example of what we could put together for you?',
    '',
    'Thanks,',
    signoff,
  ].join('\n');
  return { subject, body };
}

export function shouldDraftForLead(lead) {
  return lead?.source === 'agent-lead-discovery'
    && String(lead?.status || '').toLowerCase() === 'new'
    && Boolean(String(lead?.phone || '').trim());
}

function parseArgs(argv) {
  const opts = { limit: 5, target: 'London plumbers', signoff: DEFAULT_SIGNOFF };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--limit') opts.limit = Number(argv[++i]);
    else if (arg === '--target') opts.target = argv[++i];
    else if (arg === '--signoff') opts.signoff = argv[++i];
  }
  return opts;
}

async function fetchLeads(sql, opts) {
  const rows = await sql`
    SELECT id, name, company, phone, service, score, status, source, notes, "createdAt"
    FROM "Lead"
    WHERE source = 'agent-lead-discovery'
      AND status = 'new'
      AND coalesce(phone, '') <> ''
      AND coalesce(notes, '') ILIKE ${`%Target: ${opts.target}%`}
    ORDER BY score DESC, "createdAt" DESC
    LIMIT ${opts.limit}
  `;
  return rows.filter(shouldDraftForLead);
}

function slugName(name) {
  return String(name || 'outreach')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'outreach';
}

function formatTelegramReport(drafts, reportPath, opts, approvalRecords = [], queuePath = QUEUE_PATH) {
  const lines = [
    '💬 Riden Outreach Draft Agent',
    `Target: ${opts.target}`,
    `Drafts ready: ${drafts.length}`,
    'Mode: draft + approval queue only — no WhatsApp or email sent',
    '',
  ];

  for (const [idx, draft] of drafts.slice(0, 5).entries()) {
    const approval = approvalRecords.find((record) => record.leadId === draft.leadId);
    lines.push(`${idx + 1}. ${draft.businessName}`);
    lines.push(`   Phone: ${draft.phone}`);
    if (approval) {
      lines.push(`   WhatsApp approval: approve ${approval.whatsapp.approvalCode} / rewrite ${approval.whatsapp.approvalCode} make it warmer / reject ${approval.whatsapp.approvalCode}`);
      lines.push(`   Email approval: approve ${approval.email.approvalCode} / rewrite ${approval.email.approvalCode} shorter / reject ${approval.email.approvalCode}`);
    }
    lines.push(`   WhatsApp draft:`);
    lines.push(indent(draft.whatsapp, '   '));
    lines.push('');
  }
  lines.push(`Full JSON report saved: ${reportPath}`);
  lines.push(`Approval queue saved: ${queuePath}`);
  lines.push('Next step: reply with an approval/rewrite/reject command. Approval still does not send until WhatsApp/email connectors are installed.');
  return lines.join('\n');
}

function indent(text, prefix) {
  return String(text).split('\n').map((line) => `${prefix}${line}`).join('\n');
}

export async function run(argv = process.argv.slice(2)) {
  loadEnv();
  const opts = parseArgs(argv);
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  const sql = neon(process.env.DATABASE_URL);
  const leads = await fetchLeads(sql, opts);
  const drafts = leads.map((lead) => ({
    leadId: lead.id,
    businessName: cleanBusinessName(lead),
    phone: lead.phone,
    score: lead.score,
    target: opts.target,
    whatsapp: buildWhatsAppDraft(lead, { signoff: opts.signoff }),
    email: buildEmailDraft(lead, { signoff: opts.signoff }),
    guardrails: {
      sent: false,
      sendPolicy: 'Manual review/send only. Agent did not send WhatsApp or email.',
    },
  }));

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const batchId = `${slugName(opts.target)}_${stamp}`;
  const approvalRecords = drafts.map((draft) => buildApprovalRecord(draft, { batchId }));
  const existingQueue = loadQueue(QUEUE_PATH);
  const mergedQueue = mergeRecords(existingQueue, approvalRecords);
  saveQueue(mergedQueue, QUEUE_PATH);
  const reportPath = path.join(REPORT_DIR, `${slugName(opts.target)}-outreach-drafts_${stamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ target: opts.target, signoff: opts.signoff, batchId, drafts, approvalRecords, approvalQueuePath: QUEUE_PATH }, null, 2));
  return formatTelegramReport(drafts, reportPath, opts, approvalRecords, QUEUE_PATH);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  run().then((report) => console.log(report)).catch((err) => {
    console.error(`Riden Outreach Draft Agent failed: ${err.stack || err.message || err}`);
    process.exit(1);
  });
}
