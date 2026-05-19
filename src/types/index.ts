export type UserRole = "owner" | "admin" | "sales" | "designer" | "developer" | "support" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type LeadSource = "website" | "referral" | "social" | "email" | "cold" | "ad" | "event" | "other";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  source: LeadSource;
  score: number;
  value: number;
  assignedTo?: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ClientStatus = "active" | "inactive" | "churned" | "prospect";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  status: ClientStatus;
  tier: "starter" | "growth" | "enterprise";
  revenue: number;
  websites: number;
  assignedTo?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = "planning" | "in_progress" | "review" | "completed" | "paused";

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  status: ProjectStatus;
  progress: number;
  dueDate: Date;
  assignedTo: string[];
  budget: number;
  spent: number;
  createdAt: Date;
}

export type AutomationStatus = "active" | "paused" | "draft";

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  actions: number;
  status: AutomationStatus;
  runsTotal: number;
  runsToday: number;
  lastRun?: Date;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
}

export interface KPIData {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: string;
  trend: "up" | "down" | "neutral";
}

export interface ChartDataPoint {
  month: string;
  revenue: number;
  leads: number;
  clients: number;
}
