import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppCloudPayload,
  normalizeWhatsAppRecipient,
  sendApprovedWhatsAppDraft,
} from '../agents/whatsapp_connector.mjs';
import { buildApprovalRecord } from '../agents/outreach_approval_agent.mjs';

const draft = {
  leadId: 'lead_1234567890',
  businessName: 'Kenley Plumbers',
  phone: '07424 542122',
  target: 'London plumbers',
  whatsapp: 'Hi Kenley Plumbers, hope you’re well...\n\nThanks,\nRidley from Riden Technologies',
  email: { subject: 'Quick website idea', body: 'Hi' },
};

test('normalizeWhatsAppRecipient converts UK mobile numbers to WhatsApp E.164 without plus sign', () => {
  assert.equal(normalizeWhatsAppRecipient('07424 542122', '44'), '447424542122');
  assert.equal(normalizeWhatsAppRecipient('+44 7424 542122', '44'), '447424542122');
  assert.equal(normalizeWhatsAppRecipient('0044 7424 542122', '44'), '447424542122');
});

test('buildWhatsAppCloudPayload creates a text message payload for Meta Cloud API', () => {
  assert.deepEqual(buildWhatsAppCloudPayload({ to: '447424542122', text: 'Hello' }), {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: '447424542122',
    type: 'text',
    text: { preview_url: false, body: 'Hello' },
  });
});

test('sendApprovedWhatsAppDraft refuses to send unapproved queue records', async () => {
  const record = buildApprovalRecord(draft, { batchId: 'batch_wa' });
  const queue = [record];
  const result = await sendApprovedWhatsAppDraft(queue, record.whatsapp.approvalCode, {
    env: { WHATSAPP_ACCESS_TOKEN: 'token', WHATSAPP_PHONE_NUMBER_ID: 'phone_id' },
    fetchImpl: async () => { throw new Error('fetch should not be called'); },
  });

  assert.equal(result.ok, false);
  assert.match(result.error, /not approved/i);
  assert.equal(record.whatsapp.sent, false);
});

test('sendApprovedWhatsAppDraft sends approved WhatsApp draft and records Meta message id', async () => {
  const record = buildApprovalRecord(draft, { batchId: 'batch_wa' });
  record.whatsapp.status = 'approved';
  const queue = [record];
  const calls = [];
  const result = await sendApprovedWhatsAppDraft(queue, record.whatsapp.approvalCode, {
    now: '2026-06-14T20:00:00.000Z',
    env: {
      WHATSAPP_ACCESS_TOKEN: 'test_token',
      WHATSAPP_PHONE_NUMBER_ID: '123456789',
      WHATSAPP_DEFAULT_COUNTRY_CODE: '44',
      WHATSAPP_API_VERSION: 'v20.0',
    },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        json: async () => ({ messages: [{ id: 'wamid.test123' }] }),
        text: async () => JSON.stringify({ messages: [{ id: 'wamid.test123' }] }),
      };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.messageId, 'wamid.test123');
  assert.equal(record.whatsapp.sent, true);
  assert.equal(record.whatsapp.sentAt, '2026-06-14T20:00:00.000Z');
  assert.equal(record.whatsapp.metaMessageId, 'wamid.test123');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://graph.facebook.com/v20.0/123456789/messages');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test_token');
  assert.equal(JSON.parse(calls[0].options.body).to, '447424542122');
});

test('sendApprovedWhatsAppDraft refuses missing WhatsApp credentials', async () => {
  const record = buildApprovalRecord(draft, { batchId: 'batch_wa' });
  record.whatsapp.status = 'approved';
  const result = await sendApprovedWhatsAppDraft([record], record.whatsapp.approvalCode, { env: {} });

  assert.equal(result.ok, false);
  assert.match(result.error, /WHATSAPP_ACCESS_TOKEN/);
  assert.equal(record.whatsapp.sent, false);
});
