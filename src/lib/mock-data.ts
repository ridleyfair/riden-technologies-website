import type { Lead, Client, Project, Automation, Invoice, ChartDataPoint } from "@/types";

export const mockLeads: Lead[] = [
  { id: "1", name: "Marcus Thompson", email: "marcus@acmecorp.com", phone: "+1 555 0101", company: "Acme Corp", status: "qualified", source: "website", score: 87, value: 5000, assignedTo: "Sales Team", tags: ["hot", "enterprise"], createdAt: new Date("2026-05-01"), updatedAt: new Date("2026-05-15") },
  { id: "2", name: "Priya Patel", email: "priya@techstart.io", phone: "+1 555 0102", company: "TechStart Inc", status: "proposal", source: "referral", score: 92, value: 8500, assignedTo: "Sales Team", tags: ["hot", "saas"], createdAt: new Date("2026-05-03"), updatedAt: new Date("2026-05-16") },
  { id: "3", name: "James Wilson", email: "james@globaltrade.com", company: "GlobalTrade LLC", status: "new", source: "social", score: 61, value: 3200, tags: ["warm"], createdAt: new Date("2026-05-10"), updatedAt: new Date("2026-05-10") },
  { id: "4", name: "Sarah Chen", email: "sarah@nexusprop.com", phone: "+1 555 0104", company: "Nexus Properties", status: "negotiation", source: "ad", score: 95, value: 12000, assignedTo: "Sales Team", tags: ["hot", "real-estate"], createdAt: new Date("2026-04-28"), updatedAt: new Date("2026-05-17") },
  { id: "5", name: "David Kim", email: "david@kimlegal.com", phone: "+1 555 0105", company: "Kim Law Group", status: "won", source: "referral", score: 100, value: 6800, assignedTo: "Sales Team", tags: ["legal", "closed"], createdAt: new Date("2026-04-15"), updatedAt: new Date("2026-05-05") },
  { id: "6", name: "Emily Rodriguez", email: "emily@healthplus.com", company: "HealthPlus Clinic", status: "contacted", source: "email", score: 72, value: 4100, tags: ["healthcare"], createdAt: new Date("2026-05-12"), updatedAt: new Date("2026-05-14") },
];

export const mockClients: Client[] = [
  { id: "1", name: "Lisa Thompson", email: "lisa@retailedge.com", phone: "+1 555 0201", company: "RetailEdge Inc.", status: "active", tier: "pro_plus", revenue: 8400, websites: 3, assignedTo: "Account Manager", tags: ["retail", "vip"], createdAt: new Date("2025-11-01"), updatedAt: new Date("2026-05-01") },
  { id: "2", name: "Alex Nguyen", email: "alex@cloudscale.io", phone: "+1 555 0202", company: "CloudScale SaaS", status: "active", tier: "enterprise", revenue: 24000, websites: 8, assignedTo: "Account Manager", tags: ["saas", "enterprise"], createdAt: new Date("2025-09-15"), updatedAt: new Date("2026-05-10") },
  { id: "3", name: "Maria Santos", email: "maria@sunrisebakery.com", company: "Sunrise Bakery", status: "active", tier: "pro", revenue: 2400, websites: 1, tags: ["food", "local"], createdAt: new Date("2026-01-20"), updatedAt: new Date("2026-04-01") },
  { id: "4", name: "Tom Bradley", email: "tom@bradleylaw.com", phone: "+1 555 0204", company: "Bradley & Associates", status: "active", tier: "pro_plus", revenue: 6800, websites: 2, assignedTo: "Account Manager", tags: ["legal"], createdAt: new Date("2025-12-10"), updatedAt: new Date("2026-05-08") },
  { id: "5", name: "Zoe Harrison", email: "zoe@fitpro.com", company: "FitPro Studios", status: "inactive", tier: "pro", revenue: 1200, websites: 1, tags: ["fitness"], createdAt: new Date("2026-02-05"), updatedAt: new Date("2026-03-01") },
];

export const mockProjects: Project[] = [
  { id: "1", name: "RetailEdge Website Redesign", clientId: "1", clientName: "RetailEdge Inc.", status: "in_progress", progress: 65, dueDate: new Date("2026-06-01"), assignedTo: ["Designer A", "Dev B"], budget: 5000, spent: 3250, createdAt: new Date("2026-04-01") },
  { id: "2", name: "CloudScale CRM Integration", clientId: "2", clientName: "CloudScale SaaS", status: "review", progress: 90, dueDate: new Date("2026-05-25"), assignedTo: ["Dev A", "Dev C"], budget: 8000, spent: 7200, createdAt: new Date("2026-03-15") },
  { id: "3", name: "Bradley Law Lead Automation", clientId: "4", clientName: "Bradley & Associates", status: "planning", progress: 15, dueDate: new Date("2026-07-01"), assignedTo: ["Dev B"], budget: 3500, spent: 525, createdAt: new Date("2026-05-10") },
  { id: "4", name: "Sunrise Bakery E-Commerce", clientId: "3", clientName: "Sunrise Bakery", status: "completed", progress: 100, dueDate: new Date("2026-04-15"), assignedTo: ["Designer B", "Dev A"], budget: 2500, spent: 2400, createdAt: new Date("2026-03-01") },
];

export const mockAutomations: Automation[] = [
  { id: "1", name: "New Lead Welcome Sequence", trigger: "Lead Created", actions: 5, status: "active", runsTotal: 1247, runsToday: 8, lastRun: new Date("2026-05-19T10:30:00"), createdAt: new Date("2026-01-01") },
  { id: "2", name: "Proposal Follow-Up", trigger: "Proposal Sent", actions: 3, status: "active", runsTotal: 342, runsToday: 2, lastRun: new Date("2026-05-19T09:15:00"), createdAt: new Date("2026-01-15") },
  { id: "3", name: "Client Onboarding Flow", trigger: "Deal Won", actions: 8, status: "active", runsTotal: 89, runsToday: 1, lastRun: new Date("2026-05-18T14:00:00"), createdAt: new Date("2026-02-01") },
  { id: "4", name: "Inactive Lead Re-Engagement", trigger: "Lead Inactive 14d", actions: 4, status: "paused", runsTotal: 213, runsToday: 0, createdAt: new Date("2026-02-20") },
  { id: "5", name: "Invoice Reminder", trigger: "Invoice Overdue", actions: 2, status: "active", runsTotal: 67, runsToday: 3, lastRun: new Date("2026-05-19T08:00:00"), createdAt: new Date("2026-03-01") },
];

export const mockInvoices: Invoice[] = [
  { id: "1", number: "INV-0042", clientId: "1", clientName: "RetailEdge Inc.", amount: 2800, status: "paid", dueDate: new Date("2026-05-01"), paidAt: new Date("2026-04-28"), createdAt: new Date("2026-04-01") },
  { id: "2", number: "INV-0043", clientId: "2", clientName: "CloudScale SaaS", amount: 6000, status: "sent", dueDate: new Date("2026-05-25"), createdAt: new Date("2026-05-01") },
  { id: "3", number: "INV-0044", clientId: "4", clientName: "Bradley & Associates", amount: 1700, status: "overdue", dueDate: new Date("2026-05-10"), createdAt: new Date("2026-04-10") },
  { id: "4", number: "INV-0045", clientId: "3", clientName: "Sunrise Bakery", amount: 800, status: "paid", dueDate: new Date("2026-04-30"), paidAt: new Date("2026-04-29"), createdAt: new Date("2026-04-01") },
  { id: "5", number: "INV-0046", clientId: "1", clientName: "RetailEdge Inc.", amount: 2800, status: "draft", dueDate: new Date("2026-06-01"), createdAt: new Date("2026-05-15") },
];

export const revenueChartData: ChartDataPoint[] = [
  { month: "Dec", revenue: 32000, leads: 28, clients: 38 },
  { month: "Jan", revenue: 41000, leads: 34, clients: 42 },
  { month: "Feb", revenue: 38000, leads: 29, clients: 40 },
  { month: "Mar", revenue: 55000, leads: 45, clients: 48 },
  { month: "Apr", revenue: 62000, leads: 52, clients: 54 },
  { month: "May", revenue: 84000, leads: 67, clients: 62 },
];
