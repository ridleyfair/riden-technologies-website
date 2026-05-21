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

  const configured = isMsConfigured();

  // Step 1: get token
  let token = "";
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
    if (resp.ok) token = (data.access_token as string).slice(0, 20) + "…";
    else tokenError = JSON.stringify(data);
  } catch (e) { tokenError = String(e); }

  // Step 2: check mailbox exists
  let mailboxCheck: unknown = null;
  let mailboxError = "";
  if (token) {
    try {
      const fullToken = await (async () => {
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
        const d = await resp.json() as { access_token: string };
        return d.access_token;
      })();

      const resp = await fetch(
        `https://graph.microsoft.com/v1.0/users/${sharedMailbox}`,
        { headers: { Authorization: `Bearer ${fullToken}` } }
      );
      const data = await resp.json() as Record<string, unknown>;
      if (resp.ok) {
        mailboxCheck = {
          displayName: data.displayName,
          mail: data.mail,
          userPrincipalName: data.userPrincipalName,
          accountEnabled: data.accountEnabled,
        };
      } else {
        mailboxError = JSON.stringify(data);
      }
    } catch (e) { mailboxError = String(e); }
  }

  return NextResponse.json({
    configured,
    vars: {
      tenantId: tenantId ? tenantId.slice(0, 8) + "…" : "MISSING",
      clientId: clientId ? clientId.slice(0, 8) + "…" : "MISSING",
      clientSecret: clientSecret ? "SET (hidden)" : "MISSING",
      sharedMailbox: sharedMailbox || "MISSING",
    },
    tokenObtained: !!token,
    tokenPreview: token || null,
    tokenError: tokenError || null,
    mailboxCheck: mailboxCheck || null,
    mailboxError: mailboxError || null,
  });
}
