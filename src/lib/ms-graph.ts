/**
 * Microsoft Graph API helper — pure fetch, Cloudflare Workers compatible.
 * Uses OAuth2 Client Credentials flow (app-only auth).
 *
 * Required Azure app permissions (Application, not Delegated):
 *   - Calendars.ReadWrite
 *   - OnlineMeetings.ReadWrite (for Teams meeting generation)
 *
 * Required env vars:
 *   MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET,
 *   MICROSOFT_SHARED_MAILBOX, MICROSOFT_DEFAULT_TIMEZONE
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

// ── Config ────────────────────────────────────────────────────────────────────

function getMsConfig() {
  let env: Record<string, string | undefined> = process.env as Record<string, string | undefined>;
  try {
    const cf = getCloudflareContext().env as unknown as Record<string, string | undefined>;
    if (cf.MICROSOFT_TENANT_ID) env = { ...env, ...cf };
  } catch {
    // local dev — fall through to process.env
  }
  return {
    tenantId: env.MICROSOFT_TENANT_ID ?? "",
    clientId: env.MICROSOFT_CLIENT_ID ?? "",
    clientSecret: env.MICROSOFT_CLIENT_SECRET ?? "",
    sharedMailbox: env.MICROSOFT_SHARED_MAILBOX ?? "",
    timezone: env.MICROSOFT_DEFAULT_TIMEZONE ?? "Europe/London",
  };
}

export function isMsConfigured(): boolean {
  const c = getMsConfig();
  return !!(c.tenantId && c.clientId && c.clientSecret && c.sharedMailbox);
}

// ── Token cache (module-level; persists within a CF isolate lifetime) ─────────

type TokenCache = { token: string; expiresAt: number } | null;
let tokenCache: TokenCache = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const { tenantId, clientId, clientSecret } = getMsConfig();

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Microsoft Graph not configured. Set MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, and MICROSOFT_CLIENT_SECRET."
    );
  }

  const resp = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Microsoft auth failed (${resp.status}): ${body}`);
  }

  const data = (await resp.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000, // 5-min safety buffer
  };

  return data.access_token;
}

// ── Graph helpers ─────────────────────────────────────────────────────────────

async function graphRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`https://graph.microsoft.com/v1.0${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

// ── Calendar event operations ─────────────────────────────────────────────────

export type CreateEventInput = {
  leadName: string;
  leadEmail: string;
  company?: string | null;
  service?: string | null;
  title: string;
  /** Local datetime: "YYYY-MM-DDTHH:mm:ss" — Graph interprets this in `timezone` */
  startIso: string;
  endIso: string;
  timezone: string;
  notes?: string | null;
};

export type CreatedEvent = {
  id: string;
  teamsJoinUrl: string;
  webLink: string;
};

export async function createTeamsCalendarEvent(input: CreateEventInput): Promise<CreatedEvent> {
  const { sharedMailbox } = getMsConfig();
  if (!sharedMailbox) throw new Error("MICROSOFT_SHARED_MAILBOX is not configured.");

  const bodyText = [
    `Hi ${input.leadName},`,
    "",
    "Thanks for your enquiry with Riden Technologies.",
    "",
    "We've scheduled a strategy call to discuss your requirements and how we can best help.",
    "",
    input.service ? `Service interested in: ${input.service}` : null,
    input.company ? `Company: ${input.company}` : null,
    "",
    "Please join using the Microsoft Teams link included in this invite.",
    "",
    "Kind regards,",
    "Riden Technologies",
    "www.ridentechnologies.com",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const event = {
    subject: input.title,
    body: { contentType: "text", content: bodyText },
    start: { dateTime: input.startIso, timeZone: input.timezone },
    end: { dateTime: input.endIso, timeZone: input.timezone },
    location: { displayName: "Microsoft Teams" },
    attendees: [
      {
        emailAddress: { address: input.leadEmail, name: input.leadName },
        type: "required",
      },
    ],
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
  };

  const resp = await graphRequest(
    "POST",
    `/users/${sharedMailbox}/calendar/events`,
    event
  );

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Graph create event failed (${resp.status}): ${err}`);
  }

  const created = (await resp.json()) as {
    id: string;
    webLink?: string;
    onlineMeeting?: { joinUrl?: string };
    onlineMeetingUrl?: string;
  };

  return {
    id: created.id,
    teamsJoinUrl: created.onlineMeeting?.joinUrl ?? created.onlineMeetingUrl ?? "",
    webLink: created.webLink ?? "",
  };
}

export async function updateTeamsCalendarEvent(
  eventId: string,
  patch: {
    title?: string;
    startIso?: string;
    endIso?: string;
    timezone?: string;
  }
): Promise<void> {
  const { sharedMailbox } = getMsConfig();
  const body: Record<string, unknown> = {};

  if (patch.title) body.subject = patch.title;
  if (patch.startIso && patch.timezone)
    body.start = { dateTime: patch.startIso, timeZone: patch.timezone };
  if (patch.endIso && patch.timezone)
    body.end = { dateTime: patch.endIso, timeZone: patch.timezone };

  const resp = await graphRequest(
    "PATCH",
    `/users/${sharedMailbox}/calendar/events/${eventId}`,
    body
  );

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Graph update event failed (${resp.status}): ${err}`);
  }
}

export async function deleteTeamsCalendarEvent(eventId: string): Promise<void> {
  const { sharedMailbox } = getMsConfig();
  const resp = await graphRequest(
    "DELETE",
    `/users/${sharedMailbox}/calendar/events/${eventId}`
  );

  if (!resp.ok && resp.status !== 404) {
    const err = await resp.text();
    throw new Error(`Graph delete event failed (${resp.status}): ${err}`);
  }
}

// ── Shared mailbox accessor ───────────────────────────────────────────────────

export function getSharedMailbox(): string {
  return getMsConfig().sharedMailbox;
}

// ── Outlook event type ────────────────────────────────────────────────────────

export type OutlookEvent = {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  bodyPreview: string;
  attendees: Array<{
    emailAddress: { address: string; name: string };
    type: string;
  }>;
  onlineMeeting?: { joinUrl?: string };
  onlineMeetingUrl?: string;
  webLink?: string;
  isOnlineMeeting?: boolean;
};

// ── List and get calendar events ──────────────────────────────────────────────

export async function listCalendarEvents(
  startDate: string,
  endDate: string
): Promise<OutlookEvent[]> {
  const { sharedMailbox } = getMsConfig();
  if (!sharedMailbox) throw new Error("MICROSOFT_SHARED_MAILBOX is not configured.");

  const params = new URLSearchParams({
    $select:
      "id,subject,start,end,bodyPreview,attendees,onlineMeeting,onlineMeetingUrl,webLink,isOnlineMeeting",
    $filter: `start/dateTime ge '${startDate}T00:00:00' and end/dateTime le '${endDate}T23:59:59'`,
    $orderby: "start/dateTime asc",
    $top: "100",
  });

  const resp = await graphRequest(
    "GET",
    `/users/${sharedMailbox}/calendar/events?${params}`
  );

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Graph list events failed (${resp.status}): ${err}`);
  }

  const data = (await resp.json()) as { value?: OutlookEvent[] };
  return data.value ?? [];
}

export async function getCalendarEvent(eventId: string): Promise<OutlookEvent | null> {
  const { sharedMailbox } = getMsConfig();
  const resp = await graphRequest(
    "GET",
    `/users/${sharedMailbox}/calendar/events/${eventId}`
  );
  if (resp.status === 404) return null;
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Graph get event failed (${resp.status}): ${err}`);
  }
  return (await resp.json()) as OutlookEvent;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Build local ISO start/end strings from date ("YYYY-MM-DD"), time ("HH:mm"), and duration in minutes */
export function buildStartEnd(
  date: string,
  time: string,
  durationMins: number
): { startIso: string; endIso: string } {
  const startIso = `${date}T${time}:00`;
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + durationMins;
  const endH = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const endM = String(total % 60).padStart(2, "0");
  const endIso = `${date}T${endH}:${endM}:00`;
  return { startIso, endIso };
}
