import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildApprovalRecord,
  normalizeApprovalCommand,
  applyApprovalCommand,
  summarizeQueue,
} from '../agents/outreach_approval_agent.mjs';

const draft = {
  leadId: 'lead_1234567890',
  businessName: 'Kenley Plumbers',
  phone: '+44 7424 542122',
  target: 'London plumbers',
  whatsapp: 'Hi Kenley Plumbers, hope you’re well...',
  email: {
    subject: 'Quick website idea for Kenley Plumbers',
    body: 'Hi Kenley Plumbers,\n\nI came across Kenley Plumbers...',
  },
};

test('buildApprovalRecord creates stable short approval codes for WhatsApp and email', () => {
  const record = buildApprovalRecord(draft, { batchId: 'batch_001' });

  assert.equal(record.status, 'pending_review');
  assert.equal(record.businessName, 'Kenley Plumbers');
  assert.match(record.whatsapp.approvalCode, /^WA-[A-Z0-9]{6}$/);
  assert.match(record.email.approvalCode, /^EM-[A-Z0-9]{6}$/);
  assert.equal(record.whatsapp.sent, false);
  assert.equal(record.email.sent, false);
  assert.equal(record.guardrails.requiresHumanApproval, true);
});

test('normalizeApprovalCommand understands approve, reject, and rewrite commands', () => {
  assert.deepEqual(normalizeApprovalCommand('approve WA-ABC123'), {
    action: 'approve',
    code: 'WA-ABC123',
    instruction: '',
  });
  assert.deepEqual(normalizeApprovalCommand('reject em-abc123 too generic'), {
    action: 'reject',
    code: 'EM-ABC123',
    instruction: 'too generic',
  });
  assert.deepEqual(normalizeApprovalCommand('rewrite WA-ABC123 make it shorter'), {
    action: 'rewrite',
    code: 'WA-ABC123',
    instruction: 'make it shorter',
  });
});

test('applyApprovalCommand updates only the matching channel and never marks as sent', () => {
  const record = buildApprovalRecord(draft, { batchId: 'batch_001' });
  const queue = [record];
  const result = applyApprovalCommand(queue, `approve ${record.whatsapp.approvalCode}`);

  assert.equal(result.ok, true);
  assert.equal(queue[0].whatsapp.status, 'approved');
  assert.equal(queue[0].email.status, 'pending_review');
  assert.equal(queue[0].whatsapp.sent, false);
  assert.match(queue[0].auditTrail.at(-1).event, /approved/);
});

test('summarizeQueue counts pending, approved, rejected, and rewrite_requested items', () => {
  const a = buildApprovalRecord({ ...draft, leadId: 'a', businessName: 'A' }, { batchId: 'batch_001' });
  const b = buildApprovalRecord({ ...draft, leadId: 'b', businessName: 'B' }, { batchId: 'batch_001' });
  const queue = [a, b];
  applyApprovalCommand(queue, `approve ${a.whatsapp.approvalCode}`);
  applyApprovalCommand(queue, `reject ${b.email.approvalCode} not right fit`);
  applyApprovalCommand(queue, `rewrite ${b.whatsapp.approvalCode} warmer tone`);

  assert.deepEqual(summarizeQueue(queue), {
    records: 2,
    channels: 4,
    pending_review: 1,
    approved: 1,
    rejected: 1,
    rewrite_requested: 1,
    sent: 0,
  });
});
