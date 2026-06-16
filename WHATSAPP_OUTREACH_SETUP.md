# Riden WhatsApp Outreach Setup

This repo now has a WhatsApp connector for the existing approval queue.

Important guardrail:
- It does not send drafts automatically.
- A WhatsApp draft must already be approved in `agent_reports/outreach_approval_queue.json`.
- Sending is a separate explicit command using the `WA-XXXXXX` approval code.

## Required Meta / WhatsApp Cloud API details

Create or use a Meta Business app with WhatsApp Cloud API enabled, then add these to `.env.local` or the runtime environment:

```env
WHATSAPP_ACCESS_TOKEN="<Meta system-user access token>"
WHATSAPP_PHONE_NUMBER_ID="<WhatsApp phone number ID from Meta>"
WHATSAPP_BUSINESS_ACCOUNT_ID="<optional WABA ID for reference>"
WHATSAPP_DEFAULT_COUNTRY_CODE="44"
WHATSAPP_API_VERSION="v20.0"
```

Use a dedicated WhatsApp Business number/SIM for outreach, not a personal WhatsApp number.

## Dry run an approved draft

```bash
cd /home/skids/Riden-Technologies-Website && node agents/whatsapp_connector.mjs --code WA-ABC123 --dry-run
```

This prints the recipient and draft. It does not send.

## Send an approved draft

```bash
cd /home/skids/Riden-Technologies-Website && node agents/whatsapp_connector.mjs --code WA-ABC123
```

The connector will refuse to send if:
- the code does not exist,
- the WhatsApp channel is not `approved`,
- the message was already sent,
- credentials are missing,
- the phone number cannot be normalised.

On success it updates the queue item:
- `whatsapp.status = "sent"`
- `whatsapp.sent = true`
- `whatsapp.sentAt = <timestamp>`
- `whatsapp.metaMessageId = <Meta returned message id>`
- audit trail event `whatsapp_sent`

## Existing approval flow

Generate drafts as before:

```bash
cd /home/skids/Riden-Technologies-Website && node agents/outreach_draft_agent.mjs --target "London plumbers" --limit 3
```

Approve one WhatsApp draft:

```bash
cd /home/skids/Riden-Technologies-Website && node agents/outreach_approval_agent.mjs --command approve WA-ABC123
```

Then dry run/send with the connector above.
