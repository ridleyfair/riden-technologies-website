import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { relativeTime } from "@/lib/relative-time";

const PIPELINE_COLORS: Record<string, string> = {
  new: "#3B82F6",
  contacted: "#8B5CF6",
  qualified: "#06B6D4",
  proposal: "#F59E0B",
  negotiation: "#EC4899",
  won: "#10B981",
  lost: "#EF4444",
};

function last6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({
      key: `${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`,
      label: d.toLocaleString("en-US", { month: "short" }),
    });
  }
  return months;
}

function emptyChartData() {
  return last6Months().map((m) => ({ month: m.label, revenue: 0, leads: 0, clients: 0 }));
}

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();

  // Try full query set first (requires migration to have been run for value/websites columns)
  try {
    const [
      revenueRows,
      clientRows,
      leadRows,
      pipelineRows,
      overdueRows,
      recentLeads,
      revByMonth,
      leadsByMonth,
      clientsByMonth,
      recentInvoiceActivity,
    ] = await Promise.all([
      sql`SELECT COALESCE(SUM(amount),0) AS total,
            COALESCE(SUM(CASE WHEN "createdAt" >= DATE_TRUNC('month', NOW()) THEN amount ELSE 0 END),0) AS this_month,
            COALESCE(SUM(CASE WHEN "createdAt" >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
                             AND "createdAt" < DATE_TRUNC('month', NOW()) THEN amount ELSE 0 END),0) AS last_month
          FROM "Invoice" WHERE status = 'paid'`,

      sql`SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'active') AS active,
            COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days') AS new_month,
            COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '60 days'
                             AND "createdAt" < NOW() - INTERVAL '30 days') AS prev_month,
            COALESCE(SUM(websites),0) AS websites
          FROM "Client"`,

      sql`SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '7 days') AS new_week,
            COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '14 days'
                             AND "createdAt" < NOW() - INTERVAL '7 days') AS prev_week
          FROM "Lead"`,

      sql`SELECT status, COUNT(*) AS count FROM "Lead" GROUP BY status ORDER BY status`,

      sql`SELECT COUNT(*) AS count FROM "Invoice" WHERE status = 'overdue'`,

      sql`SELECT id, name, company, status, COALESCE(value, 0) AS value, "createdAt"
          FROM "Lead" ORDER BY "createdAt" DESC LIMIT 5`,

      sql`SELECT
            TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') AS month_key,
            COALESCE(SUM(amount),0) AS revenue
          FROM "Invoice"
          WHERE status = 'paid' AND "createdAt" >= NOW() - INTERVAL '6 months'
          GROUP BY month_key ORDER BY MIN("createdAt")`,

      sql`SELECT
            TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') AS month_key,
            COUNT(*) AS leads
          FROM "Lead"
          WHERE "createdAt" >= NOW() - INTERVAL '6 months'
          GROUP BY month_key ORDER BY MIN("createdAt")`,

      sql`SELECT
            TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') AS month_key,
            COUNT(*) AS clients
          FROM "Client"
          WHERE "createdAt" >= NOW() - INTERVAL '6 months'
          GROUP BY month_key ORDER BY MIN("createdAt")`,

      sql`SELECT number, "clientName", amount, status, "createdAt"
          FROM "Invoice" ORDER BY "createdAt" DESC LIMIT 5`,
    ]);

    return buildResponse(user.name, {
      revenueRows, clientRows, leadRows, pipelineRows, overdueRows,
      recentLeads, revByMonth, leadsByMonth, clientsByMonth, recentInvoiceActivity,
    });
  } catch {
    // Fallback: some columns may not exist yet (migration not run).
    // Run safe queries using only base columns.
    try {
      const [leadRows, clientRows, invoiceRows, pipelineRows, recentLeads] = await Promise.all([
        sql`SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '7 days') AS new_week,
              COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '14 days'
                               AND "createdAt" < NOW() - INTERVAL '7 days') AS prev_week
            FROM "Lead"`,
        sql`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'active') AS active FROM "Client"`,
        sql`SELECT COALESCE(SUM(amount),0) AS total FROM "Invoice" WHERE status = 'paid'`,
        sql`SELECT status, COUNT(*) AS count FROM "Lead" GROUP BY status ORDER BY status`,
        sql`SELECT id, name, company, status, "createdAt" FROM "Lead" ORDER BY "createdAt" DESC LIMIT 5`,
      ]);

      const newLeadsW = Number(leadRows[0]?.new_week ?? 0);
      const prevLeadsW = Number(leadRows[0]?.prev_week ?? 0);
      const leadsGrowth = prevLeadsW > 0 ? Math.round(((newLeadsW - prevLeadsW) / prevLeadsW) * 1000) / 10 : 0;

      const pipeline = (pipelineRows as Array<{ status: string; count: string }>).map((r) => ({
        name: r.status.charAt(0).toUpperCase() + r.status.slice(1),
        value: Number(r.count),
        color: PIPELINE_COLORS[r.status] ?? "#64748b",
      }));

      return NextResponse.json({
        user: { name: user.name },
        kpis: {
          totalRevenue: Number(invoiceRows[0]?.total ?? 0),
          revenueGrowth: 0,
          activeClients: Number(clientRows[0]?.active ?? 0),
          clientsGrowth: 0,
          newLeads: newLeadsW,
          leadsGrowth,
          websitesLive: 0,
          overdueInvoices: 0,
        },
        pipeline,
        recentLeads: (recentLeads as Array<{ id: string; name: string; company: string; status: string; createdAt: string }>)
          .map((l) => ({ ...l, value: 0 })),
        revenueChart: emptyChartData(),
        recentActivity: (recentLeads as Array<{ id: string; name: string; company: string; createdAt: string }>)
          .slice(0, 3)
          .map((l) => ({
            action: "New lead",
            detail: `${l.name}${l.company ? " — " + l.company : ""}`,
            time: relativeTime(l.createdAt),
            type: "lead",
          })),
      });
    } catch {
      return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
    }
  }
}

function buildResponse(
  userName: string,
  {
    revenueRows, clientRows, leadRows, pipelineRows, overdueRows,
    recentLeads, revByMonth, leadsByMonth, clientsByMonth, recentInvoiceActivity,
  }: Record<string, unknown[]>
) {
  const thisMonth = Number((revenueRows[0] as Record<string, unknown>)?.this_month ?? 0);
  const lastMonth = Number((revenueRows[0] as Record<string, unknown>)?.last_month ?? 0);
  const revenueGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  const newClients = Number((clientRows[0] as Record<string, unknown>)?.new_month ?? 0);
  const prevClients = Number((clientRows[0] as Record<string, unknown>)?.prev_month ?? 0);
  const clientsGrowth = prevClients > 0 ? ((newClients - prevClients) / prevClients) * 100 : 0;

  const newLeadsW = Number((leadRows[0] as Record<string, unknown>)?.new_week ?? 0);
  const prevLeadsW = Number((leadRows[0] as Record<string, unknown>)?.prev_week ?? 0);
  const leadsGrowth = prevLeadsW > 0 ? ((newLeadsW - prevLeadsW) / prevLeadsW) * 100 : 0;

  const months = last6Months();
  const revMap = Object.fromEntries(
    (revByMonth as Array<{ month_key: string; revenue: string }>).map((r) => [r.month_key, Number(r.revenue)])
  );
  const leadMap = Object.fromEntries(
    (leadsByMonth as Array<{ month_key: string; leads: string }>).map((r) => [r.month_key, Number(r.leads)])
  );
  const clientMap = Object.fromEntries(
    (clientsByMonth as Array<{ month_key: string; clients: string }>).map((r) => [r.month_key, Number(r.clients)])
  );

  const revenueChart = months.map((m) => ({
    month: m.label,
    revenue: revMap[m.key] ?? 0,
    leads: leadMap[m.key] ?? 0,
    clients: clientMap[m.key] ?? 0,
  }));

  const pipeline = (pipelineRows as Array<{ status: string; count: string }>).map((r) => ({
    name: r.status.charAt(0).toUpperCase() + r.status.slice(1),
    value: Number(r.count),
    color: PIPELINE_COLORS[r.status] ?? "#64748b",
  }));

  const activity = [
    ...(recentLeads as Array<{ id: string; name: string; company: string; createdAt: string }>)
      .slice(0, 3)
      .map((l) => ({
        action: "New lead",
        detail: `${l.name}${l.company ? " — " + l.company : ""}`,
        time: relativeTime(l.createdAt),
        type: "lead",
      })),
    ...(recentInvoiceActivity as Array<{
      number: string; clientName: string; amount: number; status: string; createdAt: string;
    }>)
      .slice(0, 3)
      .map((i) => ({
        action: i.status === "paid" ? "Invoice paid" : "Invoice created",
        detail: `${i.number} — ${i.clientName} ($${Number(i.amount).toLocaleString()})`,
        time: relativeTime(i.createdAt),
        type: "invoice",
      })),
  ].slice(0, 6);

  return NextResponse.json({
    user: { name: userName },
    kpis: {
      totalRevenue: Number((revenueRows[0] as Record<string, unknown>)?.total ?? 0),
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      activeClients: Number((clientRows[0] as Record<string, unknown>)?.active ?? 0),
      clientsGrowth: Math.round(clientsGrowth * 10) / 10,
      newLeads: newLeadsW,
      leadsGrowth: Math.round(leadsGrowth * 10) / 10,
      websitesLive: Number((clientRows[0] as Record<string, unknown>)?.websites ?? 0),
      overdueInvoices: Number((overdueRows[0] as Record<string, unknown>)?.count ?? 0),
    },
    pipeline,
    recentLeads: recentLeads as Array<{ id: string; name: string; company: string; status: string; value: number }>,
    revenueChart,
    recentActivity: activity,
  });
}
