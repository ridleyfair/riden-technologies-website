import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { isMsConfigured } from "@/lib/ms-graph";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let env: Record<string, string | undefined> = process.env as Record<string, string | undefined>;
  try {
    const cf = getCloudflareContext().env as unknown as Record<string, string | undefined>;
    if (cf.MICROSOFT_TENANT_ID) env = { ...env, ...cf };
  } catch { /* local dev */ }

  const tenantId = env.MICROSOFT_TENANT_ID ?? "";
  const clientId = env.MICROSOFT_CLIENT_ID ?? "";
  const clientSecret = env.MICROSOFT_CLIENT_SECRET ?? "";
  const sharedMailbox = env.MICROSOFT_SHARED_MAILBOX ?? "";

  // Get a fresh token
  let fullToken = "";
  let tokenError = "";
  try {
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
    const data = await resp.json() as Record<string, unknown>;
    if (resp.ok) fullToken = data.access_token as string;
    else tokenError = JSON.stringify(data);
  } catch (e) { tokenError = String(e); }

  // Test 1: list calendars (uses Calendars.ReadWrite — the permission we actually need)
  let calendarTest: unknown = null;
  let calendarError = "";
  if (fullToken) {
    try {
      const resp = await fetch(
        `https://graph.microsoft.com/v1.0/users/${sharedMailbox}/calendars`,
        { headers: { Authorization: `Bearer ${fullToken}` } }
      );
      const data = await resp.json() as Record<string, unknown>;
      if (resp.ok) {
        const calendars = data.value as Array<{ name: string; id: string }>;
        calendarTest = { count: calendars.length, names: calendars.map(c => c.name) };
      } else {
        calendarError = JSON.stringify(data);
      }
    } catch (e) { calendarError = String(e); }
  }

  // Test 2: user profile (uses User.Read.All)
  let userTest: unknown = null;
  let userError = "";
  if (fullToken) {
    try {
      const resp = await fetch(
        `https://graph.microsoft.com/v1.0/users/${sharedMailbox}`,
        { headers: { Authorization: `Bearer ${fullToken}` } }
      );
      const data = await resp.json() as Record<string, unknown>;
      if (resp.ok) {
        userTest = { displayName: data.displayName, mail: data.mail, accountEnabled: data.accountEnabled };
      } else {
        userError = JSON.stringify(data);
      }
    } catch (e) { userError = String(e); }
  }

  return NextResponse.json({
    configured: isMsConfigured(),
    vars: {
      tenantId: tenantId ? tenantId.slice(0, 8) + "…" : "MISSING",
      clientId: clientId ? clientId.slice(0, 8) + "…" : "MISSING",
      clientSecret: clientSecret ? "SET (hidden)" : "MISSING",
      sharedMailbox: sharedMailbox || "MISSING",
    },
    tokenObtained: !!fullToken,
    tokenError: tokenError || null,
    calendarAccess: calendarTest,
    calendarError: calendarError || null,
    userAccess: userTest,
    userError: userError || null,
  });
}
