#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadQueue, saveQueue, QUEUE_PATH } from './outreach_approval_agent.mjs';

const ENV_FILES = [
  '/home/skids/.hermes/.env',
  '/home/skids/Riden-Technologies-Website/.env.local',
  '/home/skids/Riden-Technologies-Website/.env',
];

function loadEnv() {
  for (const file of ENV_FILES) {
    if (!fs.existsSync(file)) continue;
    for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

export function normalizeWhatsAppRecipient(phone, defaultCountryCode = '44') {
  let digits = String(phone || '').replace(/[^0-9+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `${defaultCountryCode}${digits.slice(1)}`;
  if (!/^\d{8,15}$/.test(digits)) throw new Error(`Invalid WhatsApp recipient phone: ${phone}`);
  return digits;
}

export function buildWhatsAppCloudPayload({ to, text, previewUrl = false }) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: {
      preview_url: previewUrl,
      body: String(text || '').trim(),
    },
  };
}

function findWhatsAppRecord(queue, approvalCode) {
  const code = String(approvalCode || '').trim().toUpperCase();
  for (const record of queue) {
    if (record.whatsapp?.approvalCode === code) return record;
  }
  return null;
}

function missingCredentials(env) {
  const missing = [];
  if (!env.WHATSAPP_ACCESS_TOKEN) missing.push('WHATSAPP_ACCESS_TOKEN');
  if (!env.WHATSAPP_PHONE_NUMBER_ID) missing.push('WHATSAPP_PHONE_NUMBER_ID');
  return missing;
}

function metaMessageId(data) {
  return data?.messages?.[0]?.id || data?.message_id || null;
}

export async function sendApprovedWhatsAppDraft(queue, approvalCode, opts = {}) {
  const env = opts.env || process.env;
  const fetchImpl = opts.fetchImpl || globalThis.fetch;
  const now = opts.now || new Date().toISOString();
  const record = findWhatsAppRecord(queue, approvalCode);
  if (!record) return { ok: false, error: `No WhatsApp draft found for code ${approvalCode}` };
  if (record.whatsapp.sent) return { ok: false, error: `WhatsApp draft ${record.whatsapp.approvalCode} has already been sent` };
  if (record.whatsapp.status !== 'approved') {
    return { ok: false, error: `WhatsApp draft ${record.whatsapp.approvalCode} is not approved yet` };
  }

  const missing = missingCredentials(env);
  if (missing.length > 0) return { ok: false, error: `Missing WhatsApp credentials: ${missing.join(', ')}` };
  if (typeof fetchImpl !== 'function') return { ok: false, error: 'No fetch implementation available for WhatsApp send' };

  let to;
  try {
    to = normalizeWhatsAppRecipient(record.phone, env.WHATSAPP_DEFAULT_COUNTRY_CODE || '44');
  } catch (err) {
    return { ok: false, error: err.message };
  }

  const version = env.WHATSAPP_API_VERSION || 'v20.0';
  const url = `https://graph.facebook.com/${version}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const payload = buildWhatsAppCloudPayload({ to, text: record.whatsapp.draft });
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const rawText = typeof res.text === 'function' ? await res.text() : '';
  let data = {};
  try { data = rawText ? JSON.parse(rawText) : (typeof res.json === 'function' ? await res.json() : {}); } catch { data = { raw: rawText }; }
  if (!res.ok) {
    record.auditTrail ||= [];
    record.auditTrail.push({ at: now, event: 'whatsapp_send_failed', code: record.whatsapp.approvalCode, detail: data?.error?.message || rawText || `HTTP ${res.status}` });
    return { ok: false, error: data?.error?.message || rawText || `WhatsApp Cloud API returned HTTP ${res.status}`, status: res.status, response: data };
  }

  const messageId = metaMessageId(data);
  record.whatsapp.sent = true;
  record.whatsapp.sentAt = now;
  record.whatsapp.status = 'sent';
  record.whatsapp.metaMessageId = messageId;
  record.updatedAt = now;
  record.auditTrail ||= [];
  record.auditTrail.push({
    at: now,
    event: 'whatsapp_sent',
    code: record.whatsapp.approvalCode,
    metaMessageId: messageId,
    detail: 'Approved WhatsApp draft sent via Meta WhatsApp Cloud API.',
  });
  return { ok: true, code: record.whatsapp.approvalCode, businessName: record.businessName, to, messageId, response: data };
}

function parseArgs(argv) {
  const opts = { queuePath: QUEUE_PATH, code: '', dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--queue') opts.queuePath = argv[++i];
    else if (arg === '--code') opts.code = argv[++i];
    else if (arg === '--dry-run') opts.dryRun = true;
  }
  return opts;
}

export async function run(argv = process.argv.slice(2)) {
  loadEnv();
  const opts = parseArgs(argv);
  if (!opts.code) throw new Error('Usage: node agents/whatsapp_connector.mjs --code WA-ABC123 [--dry-run]');
  const queue = loadQueue(opts.queuePath);
  const record = findWhatsAppRecord(queue, opts.code);
  if (!record) throw new Error(`No WhatsApp draft found for code ${opts.code}`);
  if (opts.dryRun) {
    const status = record.whatsapp.status;
    const to = normalizeWhatsAppRecipient(record.phone, process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '44');
    return [
      `Dry run only — no WhatsApp sent.`,
      `Code: ${record.whatsapp.approvalCode}`,
      `Business: ${record.businessName}`,
      `Recipient: ${to}`,
      `Status: ${status}`,
      '',
      record.whatsapp.draft,
    ].join('\n');
  }
  const result = await sendApprovedWhatsAppDraft(queue, opts.code);
  if (!result.ok) throw new Error(result.error);
  saveQueue(queue, opts.queuePath);
  return `WhatsApp sent: ${result.businessName} (${result.code})\nRecipient: ${result.to}\nMeta message id: ${result.messageId || 'not returned'}\nQueue file: ${opts.queuePath}`;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  run().then((out) => console.log(out)).catch((err) => {
    console.error(`Riden WhatsApp connector failed: ${err.stack || err.message || err}`);
    process.exit(1);
  });
}
