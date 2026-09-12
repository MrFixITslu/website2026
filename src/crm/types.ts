export type PipelineStage =
  | "New"
  | "Researching"
  | "Contacted"
  | "Qualified"
  | "Meeting Scheduled"
  | "Proposal/Quote Sent"
  | "Negotiation"
  | "Won"
  | "Lost";

export const PIPELINE_STAGES: PipelineStage[] = [
  "New",
  "Researching",
  "Contacted",
  "Qualified",
  "Meeting Scheduled",
  "Proposal/Quote Sent",
  "Negotiation",
  "Won",
  "Lost"
];

export type LeadPriority = "Low" | "Medium" | "High" | "Urgent";
export type LeadStatus = "Active" | "Converted" | "Archived" | "Lost";
export type ScoreCategory = "Hot" | "High Potential" | "Medium" | "Low";

export interface AIAnalysisResult {
  summary: string;
  category: string;
  problems: string[];
  recommendedServices: string[];
  leadScore: number;
  scoreCategory: ScoreCategory;
  scoreBreakdown: {
    factor: string;
    points: number;
    description: string;
  }[];
  bestApproach: string;
  callPrep: {
    whatTheyDo: string;
    identifiedNeed: string;
    recommendedPitch: string;
    discoveryQuestions: string[];
    suggestedNextAction: string;
  };
  generatedBy: "ollama" | "heuristic_engine";
  modelName?: string;
  timestamp: string;
}

export interface CRMLead {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  whatsapp?: string;
  serviceRequested: string;
  message: string;
  employees?: string;
  biggestChallenge?: string;
  leadSource: string; // e.g., "Website Contact Form", "Prospect Finder", "Cold Outreach", "Referral"
  pageOrigin?: string;
  stage: PipelineStage;
  status: LeadStatus;
  priority: LeadPriority;
  estimatedValue?: number; // In XCD or USD
  location: string; // District in Saint Lucia (e.g. "Gros Islet", "Castries", "Rodney Bay")
  businessCategory: string; // e.g. "Restaurant & Hospitality", "Retail", "Healthcare", "Legal"
  website?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  leadScore: number; // 0–100
  scoreCategory: ScoreCategory;
  aiAnalysis?: AIAnalysisResult;
  isConverted: boolean;
  convertedAt?: string;
  convertedClientDetails?: {
    clientId?: string;
    contractValue?: number;
    billingEmail?: string;
    notes?: string;
  };
  isArchived: boolean;
  duplicateOfLeadId?: number;
  mergedIntoLeadId?: number;
  adminNotes?: string;
  tiquetSyncStatus?: "pending" | "sent" | "failed";
  nextFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType =
  | "status_change"
  | "stage_change"
  | "note"
  | "call"
  | "email"
  | "meeting"
  | "proposal"
  | "task"
  | "conversion"
  | "ai_analysis";

export interface CRMActivity {
  id: string;
  leadId: number;
  type: ActivityType;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  author: string;
}

export type CallOutcome =
  | "Called"
  | "No Answer"
  | "Call Back"
  | "Interested"
  | "Meeting Scheduled"
  | "Not Interested"
  | "Wrong Number"
  | "Do Not Contact";

export interface CRMCallRecord {
  id: string;
  leadId: number;
  outcome: CallOutcome;
  durationSecs?: number;
  notes: string;
  nextFollowUpAt?: string;
  caller: string;
  createdAt: string;
}

export interface CRMTask {
  id: string;
  leadId: number;
  title: string;
  dueAt: string;
  priority: "Low" | "Medium" | "High";
  status: "pending" | "completed" | "cancelled";
  assignedTo: string;
  createdAt: string;
  leadName?: string;
  companyName?: string;
}

export interface CRMProposal {
  id: string;
  leadId: number;
  title: string;
  amount: number;
  currency: "XCD" | "USD";
  services: string[];
  status: "Draft" | "Sent" | "Accepted" | "Declined";
  sentAt?: string;
  notes?: string;
  createdAt: string;
}

export type ProspectWorkflowStatus =
  | "discovered"
  | "ai_analyzed"
  | "admin_review"
  | "approved"
  | "rejected";

export interface Prospect {
  id: string;
  businessName: string;
  category: string;
  industry: string;
  location: string; // Saint Lucia community
  website?: string;
  phone?: string;
  email?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  description: string;
  companySize?: string;
  sourceUrl: string;
  discoveredAt: string;
  workflowStatus: ProspectWorkflowStatus;
  aiAnalysis?: AIAnalysisResult;
  leadScore: number;
  scoreCategory: ScoreCategory;
  convertedLeadId?: number;
}

export interface ProspectSearchLog {
  id: string;
  query: string;
  location: string;
  category: string;
  totalFound: number;
  newProspects: number;
  duplicates: number;
  approvedCount: number;
  rejectedCount: number;
  searchProvider: string;
  timestamp: string;
}

export interface CRMMetrics {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  contactedLeads: number;
  followUpsDue: number;
  proposalsSent: number;
  wonCustomers: number;
  lostLeads: number;
  conversionRate: number; // percentage
  pipelineValue: number; // total estimated currency
  sourcePerformance: {
    source: string;
    count: number;
    conversionRate: number;
    wonValue: number;
  }[];
  monthlyTrends: {
    month: string;
    leads: number;
    won: number;
    value: number;
  }[];
  locationDistribution: {
    location: string;
    count: number;
  }[];
}

export const SAINT_LUCIA_LOCATIONS = [
  "Gros Islet",
  "Rodney Bay",
  "Castries",
  "Vieux Fort",
  "Soufrière",
  "Dennery",
  "Micoud",
  "Laborie",
  "Choiseul",
  "Anse La Raye",
  "Canaries",
  "Marigot Bay",
  "Cap Estate"
];

export const V79_SERVICE_CATALOG = [
  "Website Development",
  "Website Modernization",
  "Business Automation",
  "CRM Implementation",
  "Ticketing & Helpdesk",
  "Inventory Management",
  "Cybersecurity & Firewall",
  "Network Design & Cabling",
  "Wi-Fi Optimization",
  "Cloud & Microsoft 365",
  "Automated Disaster Backup",
  "Managed IT Support",
  "Digital Transformation",
  "Custom Web & SaaS Apps",
  "AI Workflow Integration"
];
