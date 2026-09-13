import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  CRMLead,
  CRMActivity,
  CRMCallRecord,
  CRMTask,
  CRMProposal,
  Prospect,
  ProspectSearchLog,
  CRMMetrics,
  PIPELINE_STAGES,
  PipelineStage,
  LeadStatus,
  LeadPriority,
  ScoreCategory
} from "../src/crm/types";
import {
  SAINT_LUCIA_PUBLIC_BUSINESS_DIRECTORY,
  calculateDeterministicAnalysis,
  analyzeBusinessWithAI,
  CRMAnalysisResult
} from "./crm_engine";

const DATA_DIR = path.join(process.cwd(), "data");
const CRM_LEADS_FILE = path.join(DATA_DIR, "vision79_crm_leads.json");
const CRM_ACTIVITIES_FILE = path.join(DATA_DIR, "vision79_crm_activities.json");
const CRM_CALLS_FILE = path.join(DATA_DIR, "vision79_crm_calls.json");
const CRM_TASKS_FILE = path.join(DATA_DIR, "vision79_crm_tasks.json");
const CRM_PROPOSALS_FILE = path.join(DATA_DIR, "vision79_crm_proposals.json");
const CRM_PROSPECTS_FILE = path.join(DATA_DIR, "vision79_crm_prospects.json");
const CRM_SEARCHES_FILE = path.join(DATA_DIR, "vision79_crm_searches.json");

function ensureFile(filePath: string, defaultData: any) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), "utf-8");
  }
}

function readJSON<T>(filePath: string, defaultData: T): T {
  try {
    ensureFile(filePath, defaultData);
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.trim()) return defaultData;
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`[CRM Storage] Error reading ${filePath}:`, err);
    return defaultData;
  }
}

function writeJSON<T>(filePath: string, data: T) {
  try {
    ensureFile(filePath, data);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[CRM Storage] Error writing ${filePath}:`, err);
  }
}

export class CRMStorage {
  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    ensureFile(CRM_LEADS_FILE, []);
    ensureFile(CRM_ACTIVITIES_FILE, []);
    ensureFile(CRM_CALLS_FILE, []);
    ensureFile(CRM_TASKS_FILE, []);
    ensureFile(CRM_PROPOSALS_FILE, []);
    ensureFile(CRM_PROSPECTS_FILE, []);
    ensureFile(CRM_SEARCHES_FILE, []);
  }

  // --- Lead Management ---

  getLeads(filters?: {
    stage?: PipelineStage;
    status?: LeadStatus;
    search?: string;
    priority?: LeadPriority;
    includeArchived?: boolean;
  }): CRMLead[] {
    let list = readJSON<CRMLead[]>(CRM_LEADS_FILE, []);

    if (!filters?.includeArchived) {
      list = list.filter(l => !l.isArchived);
    }

    if (filters?.stage) {
      list = list.filter(l => l.stage === filters.stage);
    }

    if (filters?.status) {
      list = list.filter(l => l.status === filters.status);
    }

    if (filters?.priority) {
      list = list.filter(l => l.priority === filters.priority);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.location && l.location.toLowerCase().includes(q)) ||
        (l.businessCategory && l.businessCategory.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getLeadById(id: number): CRMLead | null {
    const list = readJSON<CRMLead[]>(CRM_LEADS_FILE, []);
    return list.find(l => l.id === Number(id)) || null;
  }

  detectDuplicate(email: string, phone: string, company: string): CRMLead | null {
    const list = readJSON<CRMLead[]>(CRM_LEADS_FILE, []);
    const normEmail = (email || "").trim().toLowerCase();
    const cleanPhone = (phone || "").replace(/\D/g, "");
    const normCompany = (company || "").trim().toLowerCase();

    for (const lead of list) {
      if (lead.isArchived) continue;

      if (normEmail && lead.email && lead.email.trim().toLowerCase() === normEmail) {
        return lead;
      }

      const leadPhone = (lead.phone || "").replace(/\D/g, "");
      if (cleanPhone.length >= 7 && leadPhone.length >= 7 && cleanPhone.slice(-7) === leadPhone.slice(-7)) {
        return lead;
      }

      if (normCompany && lead.company && lead.company.trim().toLowerCase() === normCompany) {
        return lead;
      }
    }
    return null;
  }

  async addLead(leadInput: Partial<CRMLead>, author: string = "Website Form"): Promise<{ lead: CRMLead; isDuplicate: boolean; duplicateOf?: CRMLead }> {
    const list = readJSON<CRMLead[]>(CRM_LEADS_FILE, []);

    // Duplicate detection
    const existingDuplicate = this.detectDuplicate(
      leadInput.email || "",
      leadInput.phone || "",
      leadInput.company || ""
    );

    const nextId = list.reduce((max, l) => Math.max(max, l.id || 0), 0) + 1;

    // AI/deterministic scoring for new lead
    const analysis = calculateDeterministicAnalysis({
      businessName: leadInput.company || leadInput.name || "Prospect",
      category: leadInput.businessCategory || leadInput.serviceRequested,
      location: leadInput.location || "Saint Lucia",
      website: leadInput.website,
      phone: leadInput.phone,
      email: leadInput.email,
      description: leadInput.message
    });

    const now = new Date().toISOString();
    const newLead: CRMLead = {
      id: nextId,
      name: (leadInput.name || "").trim(),
      company: (leadInput.company || "").trim(),
      email: (leadInput.email || "").trim(),
      phone: (leadInput.phone || "").trim(),
      whatsapp: leadInput.whatsapp || leadInput.phone || "",
      serviceRequested: leadInput.serviceRequested || leadInput.biggestChallenge || "General ICT Inquiry",
      message: leadInput.message || "",
      employees: leadInput.employees || "",
      biggestChallenge: leadInput.biggestChallenge || "",
      leadSource: leadInput.leadSource || "Website Contact Form",
      pageOrigin: leadInput.pageOrigin || "/contact",
      stage: leadInput.stage || "New",
      status: "Active",
      priority: leadInput.priority || (analysis.leadScore >= 80 ? "High" : "Medium"),
      estimatedValue: leadInput.estimatedValue || (analysis.leadScore >= 80 ? 10000 : 5000),
      location: leadInput.location || "Castries",
      businessCategory: leadInput.businessCategory || "Commercial",
      website: leadInput.website || "",
      facebookUrl: leadInput.facebookUrl || "",
      instagramUrl: leadInput.instagramUrl || "",
      linkedinUrl: leadInput.linkedinUrl || "",
      leadScore: analysis.leadScore,
      scoreCategory: analysis.scoreCategory,
      aiAnalysis: analysis,
      isConverted: false,
      isArchived: false,
      duplicateOfLeadId: existingDuplicate ? existingDuplicate.id : undefined,
      adminNotes: existingDuplicate ? `[Flag] Possible duplicate of Lead #${existingDuplicate.id} (${existingDuplicate.company})` : "",
      createdAt: now,
      updatedAt: now
    };

    list.unshift(newLead);
    writeJSON(CRM_LEADS_FILE, list);

    // Record activity
    this.addActivity({
      leadId: newLead.id,
      type: "status_change",
      title: "Lead Captured",
      description: `New lead created from ${newLead.leadSource}. Priority: ${newLead.priority}, Score: ${newLead.leadScore} (${newLead.scoreCategory}).`,
      author
    });

    if (existingDuplicate) {
      this.addActivity({
        leadId: newLead.id,
        type: "note",
        title: "Duplicate Detected",
        description: `System flagged possible duplicate match with existing Lead #${existingDuplicate.id} (${existingDuplicate.name} - ${existingDuplicate.company}).`,
        author: "CRM System"
      });
    }

    return {
      lead: newLead,
      isDuplicate: Boolean(existingDuplicate),
      duplicateOf: existingDuplicate || undefined
    };
  }

  updateLead(id: number, updates: Partial<CRMLead>, author: string = "Admin"): CRMLead {
    const list = readJSON<CRMLead[]>(CRM_LEADS_FILE, []);
    const idx = list.findIndex(l => l.id === Number(id));
    if (idx === -1) throw new Error(`Lead #${id} not found`);

    const prev = list[idx];
    const now = new Date().toISOString();

    // Stage change tracking
    if (updates.stage && updates.stage !== prev.stage) {
      this.addActivity({
        leadId: prev.id,
        type: "stage_change",
        title: "Stage Updated",
        description: `Stage moved from "${prev.stage}" to "${updates.stage}".`,
        metadata: { from: prev.stage, to: updates.stage },
        author
      });
    }

    // Status change tracking
    if (updates.status && updates.status !== prev.status) {
      this.addActivity({
        leadId: prev.id,
        type: "status_change",
        title: "Status Updated",
        description: `Status changed to "${updates.status}".`,
        author
      });
    }

    const updated: CRMLead = {
      ...prev,
      ...updates,
      updatedAt: now
    };

    list[idx] = updated;
    writeJSON(CRM_LEADS_FILE, list);
    return updated;
  }

  convertLeadToClient(id: number, details: { contractValue?: number; billingEmail?: string; notes?: string }, author: string = "Admin"): CRMLead {
    const lead = this.getLeadById(id);
    if (!lead) throw new Error(`Lead #${id} not found`);

    const clientId = `V79-CLI-${Date.now().toString().slice(-6)}`;
    const converted = this.updateLead(id, {
      isConverted: true,
      convertedAt: new Date().toISOString(),
      stage: "Won",
      status: "Converted",
      estimatedValue: details.contractValue ?? lead.estimatedValue,
      convertedClientDetails: {
        clientId,
        contractValue: details.contractValue ?? lead.estimatedValue,
        billingEmail: details.billingEmail || lead.email,
        notes: details.notes || ""
      }
    }, author);

    this.addActivity({
      leadId: id,
      type: "conversion",
      title: "Converted to Customer",
      description: `Lead officially converted to Client ${clientId} with value $${(details.contractValue ?? lead.estimatedValue ?? 0).toLocaleString()} XCD.`,
      author
    });

    return converted;
  }

  archiveLead(id: number, author: string = "Admin"): CRMLead {
    return this.updateLead(id, { isArchived: true, status: "Archived" }, author);
  }

  deleteLead(id: number): boolean {
    const list = readJSON<CRMLead[]>(CRM_LEADS_FILE, []);
    const filtered = list.filter(l => l.id !== Number(id));
    if (filtered.length === list.length) return false;
    writeJSON(CRM_LEADS_FILE, filtered);
    return true;
  }

  mergeLeads(primaryId: number, duplicateId: number, author: string = "Admin"): CRMLead {
    const primary = this.getLeadById(primaryId);
    const duplicate = this.getLeadById(duplicateId);
    if (!primary || !duplicate) throw new Error("Both leads must exist to perform merge");

    const mergedNotes = `${primary.adminNotes ? primary.adminNotes + "\n\n" : ""}[Merged from Lead #${duplicate.id} on ${new Date().toLocaleDateString()}]:\n${duplicate.message || ""}\n${duplicate.adminNotes || ""}`;

    // Update primary
    const updatedPrimary = this.updateLead(primaryId, {
      adminNotes: mergedNotes,
      phone: primary.phone || duplicate.phone,
      whatsapp: primary.whatsapp || duplicate.whatsapp,
      website: primary.website || duplicate.website,
      facebookUrl: primary.facebookUrl || duplicate.facebookUrl,
      instagramUrl: primary.instagramUrl || duplicate.instagramUrl,
      linkedinUrl: primary.linkedinUrl || duplicate.linkedinUrl,
      estimatedValue: Math.max(primary.estimatedValue || 0, duplicate.estimatedValue || 0)
    }, author);

    // Archive duplicate
    this.updateLead(duplicateId, {
      isArchived: true,
      mergedIntoLeadId: primaryId,
      status: "Archived",
      adminNotes: `Merged into Lead #${primaryId}`
    }, author);

    this.addActivity({
      leadId: primaryId,
      type: "note",
      title: "Leads Merged",
      description: `Lead #${duplicate.id} (${duplicate.company}) merged into this record.`,
      author
    });

    return updatedPrimary;
  }

  // --- Activities ---

  getActivities(leadId?: number): CRMActivity[] {
    const list = readJSON<CRMActivity[]>(CRM_ACTIVITIES_FILE, []);
    if (leadId !== undefined) {
      return list
        .filter(a => a.leadId === Number(leadId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addActivity(act: Omit<CRMActivity, "id" | "createdAt">): CRMActivity {
    const list = readJSON<CRMActivity[]>(CRM_ACTIVITIES_FILE, []);
    const newAct: CRMActivity = {
      ...act,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    list.unshift(newAct);
    writeJSON(CRM_ACTIVITIES_FILE, list);
    return newAct;
  }

  // --- Calls ---

  getCalls(leadId?: number): CRMCallRecord[] {
    const list = readJSON<CRMCallRecord[]>(CRM_CALLS_FILE, []);
    if (leadId !== undefined) {
      return list
        .filter(c => c.leadId === Number(leadId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addCall(record: Omit<CRMCallRecord, "id" | "createdAt">): CRMCallRecord {
    const list = readJSON<CRMCallRecord[]>(CRM_CALLS_FILE, []);
    const newRecord: CRMCallRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    list.unshift(newRecord);
    writeJSON(CRM_CALLS_FILE, list);

    // Update lead follow-up & stage automatically based on outcome
    const lead = this.getLeadById(record.leadId);
    if (lead) {
      let nextStage: PipelineStage = lead.stage;
      let nextStatus: LeadStatus = lead.status;

      if (record.outcome === "Interested" || record.outcome === "Meeting Scheduled") {
        if (lead.stage === "New" || lead.stage === "Researching" || lead.stage === "Contacted") {
          nextStage = record.outcome === "Meeting Scheduled" ? "Meeting Scheduled" : "Qualified";
        }
      } else if (record.outcome === "Not Interested" || record.outcome === "Wrong Number") {
        if (record.outcome === "Not Interested") nextStage = "Lost";
      } else if (record.outcome === "Do Not Contact") {
        nextStatus = "Lost";
      } else if (lead.stage === "New") {
        nextStage = "Contacted";
      }

      this.updateLead(lead.id, {
        stage: nextStage,
        status: nextStatus,
        nextFollowUpAt: record.nextFollowUpAt || lead.nextFollowUpAt
      }, record.caller || "Admin");

      this.addActivity({
        leadId: lead.id,
        type: "call",
        title: `Call: ${record.outcome}`,
        description: `${record.caller} called lead. Outcome: ${record.outcome}. Notes: ${record.notes || "None"}${record.nextFollowUpAt ? `. Next follow-up: ${new Date(record.nextFollowUpAt).toLocaleString()}` : ""}`,
        author: record.caller || "Admin"
      });
    }

    return newRecord;
  }

  // --- Tasks & Follow-ups ---

  getTasks(leadId?: number): CRMTask[] {
    const list = readJSON<CRMTask[]>(CRM_TASKS_FILE, []);
    if (leadId !== undefined) {
      return list.filter(t => t.leadId === Number(leadId));
    }
    return list.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }

  addTask(task: Omit<CRMTask, "id" | "createdAt">): CRMTask {
    const list = readJSON<CRMTask[]>(CRM_TASKS_FILE, []);
    const lead = this.getLeadById(task.leadId);

    const newTask: CRMTask = {
      ...task,
      id: crypto.randomUUID(),
      leadName: lead?.name,
      companyName: lead?.company,
      createdAt: new Date().toISOString()
    };
    list.push(newTask);
    writeJSON(CRM_TASKS_FILE, list);

    this.addActivity({
      leadId: task.leadId,
      type: "task",
      title: "Task Created",
      description: `Task assigned: "${task.title}". Due: ${new Date(task.dueAt).toLocaleDateString()}.`,
      author: task.assignedTo || "Admin"
    });

    return newTask;
  }

  updateTaskStatus(taskId: string, status: "pending" | "completed" | "cancelled"): CRMTask {
    const list = readJSON<CRMTask[]>(CRM_TASKS_FILE, []);
    const idx = list.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error(`Task ${taskId} not found`);

    list[idx].status = status;
    writeJSON(CRM_TASKS_FILE, list);
    return list[idx];
  }

  // --- Prospects & Prospect Finder ---

  getProspects(filters?: {
    status?: string;
    location?: string;
    category?: string;
    search?: string;
  }): Prospect[] {
    let list = readJSON<Prospect[]>(CRM_PROSPECTS_FILE, []);

    if (filters?.status && filters.status !== "all") {
      list = list.filter(p => p.workflowStatus === filters.status);
    }
    if (filters?.location && filters.location !== "all") {
      list = list.filter(p => p.location.toLowerCase() === filters.location!.toLowerCase());
    }
    if (filters?.category && filters.category !== "all") {
      list = list.filter(p => p.category.toLowerCase().includes(filters.category!.toLowerCase()));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p =>
        p.businessName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.phone && p.phone.includes(q))
      );
    }

    return list.sort((a, b) => b.leadScore - a.leadScore);
  }

  async runProspectSearch(params: {
    location?: string;
    category?: string;
    query?: string;
    searchProviderKey?: string;
    limit?: number;
  }): Promise<{ discovered: Prospect[]; duplicatesCount: number; newCount: number }> {
    const existingProspects = readJSON<Prospect[]>(CRM_PROSPECTS_FILE, []);
    const existingLeads = readJSON<CRMLead[]>(CRM_LEADS_FILE, []);
    const limit = params.limit || 10;

    // Filter through Saint Lucia public directory and query matches
    let candidates = SAINT_LUCIA_PUBLIC_BUSINESS_DIRECTORY;

    if (params.location && params.location !== "all") {
      candidates = candidates.filter(b => (b.location || "").toLowerCase().includes(params.location!.toLowerCase()));
    }
    if (params.category && params.category !== "all") {
      candidates = candidates.filter(b => (b.category || "").toLowerCase().includes(params.category!.toLowerCase()));
    }
    if (params.query && params.query.trim()) {
      const q = params.query.toLowerCase();
      candidates = candidates.filter(b =>
        b.businessName.toLowerCase().includes(q) ||
        (b.description || "").toLowerCase().includes(q)
      );
    }

    let duplicatesCount = 0;
    const newlyDiscovered: Prospect[] = [];

    for (const b of candidates.slice(0, limit)) {
      const existsInProspects = existingProspects.some(p => p.businessName.toLowerCase() === b.businessName.toLowerCase());
      const existsInLeads = existingLeads.some(l => l.company.toLowerCase() === b.businessName.toLowerCase());

      if (existsInProspects || existsInLeads) {
        duplicatesCount++;
        continue;
      }

      const analysis = calculateDeterministicAnalysis(b);
      const newProspect: Prospect = {
        id: `prospect-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        businessName: b.businessName,
        category: b.category || "Commercial",
        industry: b.industry || "General Industry",
        location: b.location || params.location || "Saint Lucia",
        website: b.website,
        phone: b.phone,
        email: b.email,
        facebookUrl: b.facebookUrl,
        instagramUrl: b.instagramUrl,
        linkedinUrl: b.linkedinUrl,
        description: b.description || "",
        companySize: b.companySize || "1–10",
        sourceUrl: b.facebookUrl || b.website || "https://stlucia.org/business",
        discoveredAt: new Date().toISOString(),
        workflowStatus: "discovered",
        aiAnalysis: analysis,
        leadScore: analysis.leadScore,
        scoreCategory: analysis.scoreCategory
      };

      existingProspects.unshift(newProspect);
      newlyDiscovered.push(newProspect);
    }

    writeJSON(CRM_PROSPECTS_FILE, existingProspects);

    // Record Search Log
    const searchLogs = readJSON<ProspectSearchLog[]>(CRM_SEARCHES_FILE, []);
    const newLog: ProspectSearchLog = {
      id: crypto.randomUUID(),
      query: params.query || `Search in ${params.location || "All Saint Lucia"}`,
      location: params.location || "All Saint Lucia",
      category: params.category || "All Categories",
      totalFound: candidates.length,
      newProspects: newlyDiscovered.length,
      duplicates: duplicatesCount,
      approvedCount: 0,
      rejectedCount: 0,
      searchProvider: params.searchProviderKey ? "External Search Provider" : "Saint Lucia Verified Public Registry",
      timestamp: new Date().toISOString()
    };
    searchLogs.unshift(newLog);
    writeJSON(CRM_SEARCHES_FILE, searchLogs);

    return {
      discovered: newlyDiscovered,
      duplicatesCount,
      newCount: newlyDiscovered.length
    };
  }

  getSearchHistory(): ProspectSearchLog[] {
    return readJSON<ProspectSearchLog[]>(CRM_SEARCHES_FILE, []);
  }

  async analyzeProspect(prospectId: string, ollamaUrl?: string, model?: string): Promise<Prospect> {
    const list = readJSON<Prospect[]>(CRM_PROSPECTS_FILE, []);
    const idx = list.findIndex(p => p.id === prospectId);
    if (idx === -1) throw new Error(`Prospect ${prospectId} not found`);

    const p = list[idx];
    const aiResult = await analyzeBusinessWithAI({
      businessName: p.businessName,
      category: p.category,
      industry: p.industry,
      location: p.location,
      website: p.website,
      phone: p.phone,
      email: p.email,
      facebookUrl: p.facebookUrl,
      instagramUrl: p.instagramUrl,
      linkedinUrl: p.linkedinUrl,
      description: p.description
    }, ollamaUrl, model);

    list[idx].aiAnalysis = aiResult;
    list[idx].leadScore = aiResult.leadScore;
    list[idx].scoreCategory = aiResult.scoreCategory;
    list[idx].workflowStatus = "ai_analyzed";

    writeJSON(CRM_PROSPECTS_FILE, list);
    return list[idx];
  }

  approveProspectToLead(prospectId: string, author: string = "Admin"): CRMLead {
    const list = readJSON<Prospect[]>(CRM_PROSPECTS_FILE, []);
    const idx = list.findIndex(p => p.id === prospectId);
    if (idx === -1) throw new Error(`Prospect ${prospectId} not found`);

    const p = list[idx];
    const { lead } = this.addLead({
      name: p.businessName,
      company: p.businessName,
      phone: p.phone || "",
      email: p.email || "",
      whatsapp: p.phone || "",
      serviceRequested: p.aiAnalysis?.recommendedServices[0] || "ICT Modernization",
      message: `[Discovered Lead] ${p.description}`,
      location: p.location,
      businessCategory: p.category,
      website: p.website,
      facebookUrl: p.facebookUrl,
      instagramUrl: p.instagramUrl,
      linkedinUrl: p.linkedinUrl,
      leadSource: "Prospect Finder",
      pageOrigin: "Public Business Discovery",
      stage: "Researching",
      priority: p.leadScore >= 80 ? "High" : "Medium",
      estimatedValue: p.leadScore >= 80 ? 12000 : 6000
    }, author);

    list[idx].workflowStatus = "approved";
    list[idx].convertedLeadId = lead.id;
    writeJSON(CRM_PROSPECTS_FILE, list);

    return lead;
  }

  bulkApproveProspects(prospectIds: string[], author: string = "Admin"): CRMLead[] {
    const leads: CRMLead[] = [];
    for (const id of prospectIds) {
      try {
        const lead = this.approveProspectToLead(id, author);
        leads.push(lead);
      } catch (e) {
        console.warn(`[CRM] Failed to approve prospect ${id}:`, e);
      }
    }
    return leads;
  }

  rejectProspect(prospectId: string): boolean {
    const list = readJSON<Prospect[]>(CRM_PROSPECTS_FILE, []);
    const idx = list.findIndex(p => p.id === prospectId);
    if (idx === -1) return false;
    list[idx].workflowStatus = "rejected";
    writeJSON(CRM_PROSPECTS_FILE, list);
    return true;
  }

  bulkRejectProspects(prospectIds: string[]): number {
    const list = readJSON<Prospect[]>(CRM_PROSPECTS_FILE, []);
    let count = 0;
    for (const id of prospectIds) {
      const idx = list.findIndex(p => p.id === id);
      if (idx !== -1) {
        list[idx].workflowStatus = "rejected";
        count++;
      }
    }
    writeJSON(CRM_PROSPECTS_FILE, list);
    return count;
  }

  // --- Analytics & Reports ---

  getMetrics(): CRMMetrics {
    const leads = readJSON<CRMLead[]>(CRM_LEADS_FILE, []).filter(l => !l.isArchived);
    const tasks = readJSON<CRMTask[]>(CRM_TASKS_FILE, []);

    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.stage === "New").length;
    const qualifiedLeads = leads.filter(l => l.stage === "Qualified" || l.stage === "Meeting Scheduled").length;
    const contactedLeads = leads.filter(l => l.stage === "Contacted").length;
    const wonCustomers = leads.filter(l => l.stage === "Won" || l.isConverted).length;
    const lostLeads = leads.filter(l => l.stage === "Lost").length;
    const proposalsSent = leads.filter(l => l.stage === "Proposal/Quote Sent" || l.stage === "Negotiation").length;

    const conversionRate = totalLeads > 0 ? Math.round((wonCustomers / totalLeads) * 100) : 0;
    const pipelineValue = leads.reduce((sum, l) => sum + (l.stage !== "Lost" ? (l.estimatedValue || 0) : 0), 0);

    const now = new Date();
    const followUpsDue = tasks.filter(t => t.status === "pending" && new Date(t.dueAt) <= now).length +
      leads.filter(l => l.nextFollowUpAt && new Date(l.nextFollowUpAt) <= now && l.status === "Active").length;

    // Source performance
    const sourcesMap: Record<string, { count: number; won: number; value: number }> = {};
    for (const l of leads) {
      const src = l.leadSource || "Direct";
      if (!sourcesMap[src]) sourcesMap[src] = { count: 0, won: 0, value: 0 };
      sourcesMap[src].count++;
      if (l.stage === "Won" || l.isConverted) {
        sourcesMap[src].won++;
        sourcesMap[src].value += l.estimatedValue || 0;
      }
    }

    const sourcePerformance = Object.entries(sourcesMap).map(([source, data]) => ({
      source,
      count: data.count,
      conversionRate: data.count > 0 ? Math.round((data.won / data.count) * 100) : 0,
      wonValue: data.value
    }));

    // Location distribution
    const locationMap: Record<string, number> = {};
    for (const l of leads) {
      const loc = l.location || "Other Saint Lucia";
      locationMap[loc] = (locationMap[loc] || 0) + 1;
    }

    const locationDistribution = Object.entries(locationMap).map(([location, count]) => ({
      location,
      count
    }));

    // Monthly trends computed strictly from actual leads (last 6 calendar months)
    const monthlyTrends: { month: string; leads: number; won: number; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const targetYear = d.getFullYear();
      const targetMonth = d.getMonth();
      const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      const monthLeads = leads.filter(l => {
        if (!l.createdAt) return false;
        const created = new Date(l.createdAt);
        return !isNaN(created.getTime()) && created.getFullYear() === targetYear && created.getMonth() === targetMonth;
      });

      const wonInMonth = monthLeads.filter(l => l.stage === "Won" || l.isConverted);
      const wonVal = wonInMonth.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

      monthlyTrends.push({
        month: monthLabel,
        leads: monthLeads.length,
        won: wonInMonth.length,
        value: wonVal
      });
    }

    return {
      totalLeads,
      newLeads,
      qualifiedLeads,
      contactedLeads,
      followUpsDue,
      proposalsSent,
      wonCustomers,
      lostLeads,
      conversionRate,
      pipelineValue,
      sourcePerformance,
      monthlyTrends,
      locationDistribution
    };
  }
}

export const crmStorage = new CRMStorage();
