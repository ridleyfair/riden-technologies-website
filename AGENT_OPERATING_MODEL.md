# Riden Technologies Agent Operating Model

## Goal

Build Riden Technologies into an agent-operated web/service business where specialist agents monitor, research, draft, build, and report through Telegram while the founder keeps approval over high-impact actions.

## Control Layer

Hermes Agent is the orchestration layer.

It connects:
- GitHub repo: `/home/skids/Riden-Technologies-Website`
- Website: `https://ridentechnologies.com`
- Telegram alerts and commands
- Scheduled cron jobs
- Coding models: OpenAI Codex / Claude Code
- Research/scraping tools: Apify and ScrapingBee
- Creative tools/workflows: Higgsfield and image/video generation
- Business portal/database: leads, possible clients, projects, bookings, generated sites, outreach

## Autonomy Levels

### Level 1 — Observe and report
Agents can monitor, inspect, summarize, and alert. No mutations.

Examples:
- uptime checks
- build checks
- competitor monitoring
- daily lead opportunity reports

### Level 2 — Draft and queue
Agents can create drafts or proposed actions, but the founder approves before anything external happens.

Examples:
- outreach email drafts
- website copy drafts
- proposed GitHub issues
- proposed lead scoring

### Level 3 — Internal writes
Agents can write to internal systems when rules are clear.

Examples:
- add possible clients
- enrich lead records
- mark failed checks
- create internal tasks

### Level 4 — External action with approval
Agents can send outreach, deploy, or publish only after Telegram approval.

Examples:
- send emails
- deploy code
- publish generated website
- update DNS/domain records

### Level 5 — Trusted automation
Only for mature, low-risk, repeatable workflows with rollback.

Examples:
- restart failed services
- renew a scrape job
- send templated follow-up after explicit opt-in

## Initial Specialist Agents

### 1. Uptime Agent
Status: created.
Schedule: every 30 minutes.
Purpose: check public pages and alert if unhealthy.
Current job ID: `fa348399621c`.

### 2. Repo Maintenance Agent
Status: created.
Schedule: daily at 08:00.
Purpose: non-destructive pull/build/site health check.
Current job ID: `48f07519fcf4`.

### 3. Lead Discovery Agent
Status: next to build.
Tools: Apify, ScrapingBee, browser/web.
Purpose: find local businesses likely to need websites.
Inputs:
- industry
- city/region
- lead quality rules
Outputs:
- new possible clients in portal/database
- Telegram summary
Guardrail: no outreach until approved.

### 4. Lead Enrichment Agent
Tools: ScrapingBee, web, browser.
Purpose: enrich leads with website quality, contact info, business category, pain points, and outreach angle.
Guardrail: avoid duplicate records.

### 5. Outreach Draft Agent
Tools: portal database, LLM, email templates.
Purpose: draft personalized outreach.
Guardrail: draft only until approval workflow is implemented.

### 6. Website Factory Agent
Tools: app generation API, repo, templates, LLM.
Purpose: generate a client website draft from a brief or enriched business info.
Guardrail: publish only after founder approval.

### 7. Developer Agent
Tools: GitHub, Claude Code, OpenAI Codex.
Purpose: fix bugs, add features, run tests/builds, create branches/PRs.
Guardrail: no direct deploy without approval.

### 8. Security/QA Agent
Tools: repo, build/test, static review.
Purpose: review public API routes, auth, migration endpoints, secrets, deployment safety.
Guardrail: report and create fix branches; do not mutate production DB.

## Telegram Command Center

Telegram should become the founder-facing control room.

Important alert types:
- site down / degraded
- build failed
- new hot leads found
- lead enrichment complete
- outreach drafts ready
- client brief submitted
- website draft ready
- deploy approval requested
- security issue found

Example commands once gateway is configured:
- `/sethome` — set current Telegram chat as delivery target
- `approve` — approve requested action
- `reject` — reject requested action
- `summarize leads today`
- `generate site for lead <id>`
- `run maintenance check`
- `create bugfix branch for this issue`

## Required Secrets

Do not paste these into chat. Add them via local `.env`, Hermes setup, or provider dashboards.

Hermes Telegram:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALLOWED_USERS`
- `TELEGRAM_HOME_CHANNEL` after `/sethome`

Scraping:
- `APIFY_TOKEN`
- `SCRAPINGBEE_API_KEY`

Website / Cloudflare production:
- `DATABASE_URL`
- `AUTH_SECRET`
- `ANTHROPIC_API_KEY` if the website generation route uses Claude API directly
- `SENDGRID_API_KEY` if email sending is enabled
- `SCRAPINGBEE_API_KEY`

## Immediate Next Build Order

1. Configure Telegram gateway.
2. Redirect existing cron alerts to Telegram.
3. Add Apify and ScrapingBee credentials locally.
4. Build a Lead Discovery Agent in observe/report mode.
5. Add database insertion only after verifying schema and duplicate rules.
6. Add Outreach Draft Agent.
7. Add approval-based sending.
8. Add coding/security agents for continuous product improvement.
