import { useState, useEffect, useCallback } from "react";
import { CrmHeader } from "./CrmHeader";
import { CrmMetricsDashboard } from "./CrmMetricsDashboard";
import { CrmPipelineBoard } from "./CrmPipelineBoard";
import { CrmLeadTable } from "./CrmLeadTable";
import { CrmLeadDetailModal } from "./CrmLeadDetailModal";
import { CrmColdCallCockpit } from "./CrmColdCallCockpit";
import { CrmProspectFinder } from "./CrmProspectFinder";
import { CrmTasksList } from "./CrmTasksList";
import { CrmSettings } from "./CrmSettings";
import { CrmNewLeadModal } from "./CrmNewLeadModal";
import {
  CRMLead,
  CRMMetrics,
  Prospect,
  ProspectSearchLog,
  CRMTask,
  CRMActivity,
  CRMCallRecord,
  PipelineStage,
  CallOutcome
} from "../../crm/types";

interface CrmManagerProps {
  adminToken: string | null;
  onUnauthorized?: () => void;
}

export function CrmManager({ adminToken, onUnauthorized }: CrmManagerProps) {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "pipeline" | "leads" | "cockpit" | "prospects" | "tasks" | "settings"
  >("dashboard");

  // CRM state
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [metrics, setMetrics] = useState<CRMMetrics | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [searchHistory, setSearchHistory] = useState<ProspectSearchLog[]>([]);
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [selectedLeadActivities, setSelectedLeadActivities] = useState<CRMActivity[]>([]);
  const [selectedLeadCalls, setSelectedLeadCalls] = useState<CRMCallRecord[]>([]);

  // Selection & modal states
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);

  // Status & Loading states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{ connected: boolean; model?: string }>({
    connected: false
  });

  const getHeaders = useCallback(() => {
    let token = adminToken;
    if (!token) {
      try {
        token = sessionStorage.getItem("admin-token") || localStorage.getItem("admin-token");
      } catch (e) {
        token = null;
      }
    }
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }, [adminToken]);

  // Fetch metrics & pipeline stats
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/crm/metrics", { headers: getHeaders() });
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (e) {
      console.error("Failed to load CRM metrics:", e);
    }
  }, [getHeaders, onUnauthorized]);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/crm/leads", { headers: getHeaders() });
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (e) {
      console.error("Failed to load CRM leads:", e);
    }
  }, [getHeaders, onUnauthorized]);

  // Fetch prospects & history
  const fetchProspects = useCallback(async () => {
    try {
      const [pRes, hRes] = await Promise.all([
        fetch("/api/admin/crm/prospects", { headers: getHeaders() }),
        fetch("/api/admin/crm/prospects/history", { headers: getHeaders() })
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProspects(pData);
      }
      if (hRes.ok) {
        const hData = await hRes.json();
        setSearchHistory(hData);
      }
    } catch (e) {
      console.error("Failed to load prospects:", e);
    }
  }, [getHeaders]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/crm/tasks", { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error("Failed to load CRM tasks:", e);
    }
  }, [getHeaders]);

  // Check Ollama AI status
  const checkOllamaStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/crm/ai/status", { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOllamaStatus(data);
      }
    } catch (e) {
      setOllamaStatus({ connected: false });
    }
  }, [getHeaders]);

  // Fetch details for selected lead (activities, calls, updated record)
  const fetchLeadDetails = useCallback(async (leadId: number) => {
    try {
      const [actRes, callRes, leadRes] = await Promise.all([
        fetch(`/api/admin/crm/leads/${leadId}/activities`, { headers: getHeaders() }),
        fetch(`/api/admin/crm/leads/${leadId}/calls`, { headers: getHeaders() }),
        fetch(`/api/admin/crm/leads/${leadId}`, { headers: getHeaders() })
      ]);
      if (actRes.ok) {
        const actData = await actRes.json();
        setSelectedLeadActivities(actData);
      }
      if (callRes.ok) {
        const callData = await callRes.json();
        setSelectedLeadCalls(callData);
      }
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        const actualLead: CRMLead = leadData.lead || leadData;
        setSelectedLead(actualLead);
        setLeads((prev) => prev.map((l) => (l.id === leadId ? actualLead : l)));
      }
    } catch (e) {
      console.error("Failed to load lead details:", e);
    }
  }, [getHeaders]);

  // Refresh all CRM data
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchLeads(),
        fetchProspects(),
        fetchTasks(),
        checkOllamaStatus()
      ]);
      if (selectedLead) {
        await fetchLeadDetails(selectedLead.id);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchMetrics, fetchLeads, fetchProspects, fetchTasks, checkOllamaStatus, selectedLead, fetchLeadDetails]);

  // Initial load
  useEffect(() => {
    handleRefreshAll();
  }, []);

  // Update lead stage
  const handleUpdateLeadStage = async (leadId: number, newStage: PipelineStage) => {
    try {
      const res = await fetch(`/api/admin/crm/leads/${leadId}/stage`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ stage: newStage })
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
        if (selectedLead?.id === leadId) {
          setSelectedLead(updated);
        }
        fetchMetrics();
      }
    } catch (e) {
      console.error("Failed to update stage:", e);
    }
  };

  // Update lead fields
  const handleUpdateLead = async (leadId: number, updates: Partial<CRMLead>) => {
    try {
      const res = await fetch(`/api/admin/crm/leads/${leadId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
        if (selectedLead?.id === leadId) {
          setSelectedLead(updated);
        }
      }
    } catch (e) {
      console.error("Failed to update lead:", e);
    }
  };

  // Create new lead manually
  const handleCreateLead = async (leadData: any) => {
    try {
      const res = await fetch("/api/admin/crm/leads", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(leadData)
      });
      if (res.ok) {
        const data = await res.json();
        const created: CRMLead = data.lead || data;
        setLeads((prev) => [created, ...prev.filter((l) => l.id !== created.id)]);
        fetchMetrics();
        setSelectedLead(created);
        if (created?.id) {
          fetchLeadDetails(created.id);
        }
      }
    } catch (e) {
      console.error("Failed to create lead:", e);
    }
  };

  // Add activity note
  const handleAddActivity = async (leadId: number, type: string, title: string, description: string) => {
    try {
      const res = await fetch(`/api/admin/crm/leads/${leadId}/activities`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ type, title, description })
      });
      if (res.ok) {
        const act = await res.json();
        setSelectedLeadActivities((prev) => [act, ...prev]);
      }
    } catch (e) {
      console.error("Failed to add activity:", e);
    }
  };

  // Log call record
  const handleAddCall = async (
    leadId: number,
    outcome: CallOutcome,
    durationSecs: number,
    notes: string,
    nextFollowUpAt?: string
  ) => {
    try {
      const res = await fetch(`/api/admin/crm/leads/${leadId}/calls`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ outcome, durationSecs, notes, nextFollowUpAt })
      });
      if (res.ok) {
        const call = await res.json();
        setSelectedLeadCalls((prev) => [call, ...prev]);
        await fetchLeadDetails(leadId);
        await fetchMetrics();
        await fetchTasks();
      }
    } catch (e) {
      console.error("Failed to log call:", e);
    }
  };

  // Add task
  const handleAddTask = async (
    leadId: number,
    title: string,
    dueAt: string,
    priority: "Low" | "Medium" | "High"
  ) => {
    try {
      const res = await fetch("/api/admin/crm/tasks", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ leadId, title, dueAt, priority })
      });
      if (res.ok) {
        const task = await res.json();
        setTasks((prev) => [task, ...prev]);
        fetchMetrics();
      }
    } catch (e) {
      console.error("Failed to add task:", e);
    }
  };

  // Toggle task completed/pending
  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      const res = await fetch(`/api/admin/crm/tasks/${taskId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
        fetchMetrics();
      }
    } catch (e) {
      console.error("Failed to toggle task status:", e);
    }
  };

  // Convert lead to client
  const handleConvertLead = async (
    leadId: number,
    details: { contractValue: number; billingEmail: string; notes: string }
  ) => {
    try {
      const res = await fetch(`/api/admin/crm/leads/${leadId}/convert`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(details)
      });
      if (res.ok) {
        const converted = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === leadId ? converted : l)));
        setSelectedLead(converted);
        fetchMetrics();
      }
    } catch (e) {
      console.error("Failed to convert lead:", e);
    }
  };

  // Archive lead
  const handleArchiveLead = async (leadId: number) => {
    try {
      const res = await fetch(`/api/admin/crm/leads/${leadId}/archive`, {
        method: "POST",
        headers: getHeaders()
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, isArchived: true } : l)));
        setSelectedLead(null);
        fetchMetrics();
      }
    } catch (e) {
      console.error("Failed to archive lead:", e);
    }
  };

  // Merge leads
  const handleMergeLead = async (primaryId: number, duplicateId: number) => {
    try {
      const res = await fetch("/api/admin/crm/leads/merge", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ primaryLeadId: primaryId, duplicateLeadId: duplicateId })
      });
      if (res.ok) {
        const merged = await res.json();
        setLeads((prev) =>
          prev.map((l) => (l.id === primaryId ? merged : l.id === duplicateId ? { ...l, isArchived: true } : l))
        );
        setSelectedLead(merged);
        fetchLeadDetails(primaryId);
        fetchMetrics();
      }
    } catch (e) {
      console.error("Failed to merge leads:", e);
    }
  };

  // Run public business search
  const handleRunSearch = async (params: { location?: string; category?: string; query?: string; limit?: number }) => {
    setIsSearching(true);
    try {
      const res = await fetch("/api/admin/crm/prospects/search", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        setProspects(data.prospects);
        fetchProspects();
      }
    } catch (e) {
      console.error("Search failed:", e);
    } finally {
      setIsSearching(false);
    }
  };

  // Analyze prospect with AI
  const handleAnalyzeProspect = async (prospectId: string) => {
    try {
      const res = await fetch(`/api/admin/crm/prospects/${prospectId}/analyze`, {
        method: "POST",
        headers: getHeaders()
      });
      if (res.ok) {
        const updated = await res.json();
        setProspects((prev) => prev.map((p) => (p.id === prospectId ? updated : p)));
      }
    } catch (e) {
      console.error("Analysis failed:", e);
    }
  };

  // Approve prospect into CRM
  const handleApproveProspect = async (prospectId: string) => {
    try {
      const res = await fetch(`/api/admin/crm/prospects/${prospectId}/approve`, {
        method: "POST",
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const createdLead: CRMLead = data.lead || data;
        setProspects((prev) => prev.map((p) => (p.id === prospectId ? { ...p, workflowStatus: "approved" } : p)));
        if (createdLead) {
          setLeads((prev) => [createdLead, ...prev.filter((l) => l.id !== createdLead.id)]);
        }
        fetchMetrics();
      }
    } catch (e) {
      console.error("Approval failed:", e);
    }
  };

  // Bulk approve prospects
  const handleBulkApprove = async (ids: string[]) => {
    try {
      const res = await fetch("/api/admin/crm/prospects/bulk-approve", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ prospectIds: ids })
      });
      if (res.ok) {
        const data = await res.json();
        setProspects((prev) =>
          prev.map((p) => (ids.includes(p.id) ? { ...p, workflowStatus: "approved" } : p))
        );
        fetchLeads();
        fetchMetrics();
      }
    } catch (e) {
      console.error("Bulk approval failed:", e);
    }
  };

  // Reject prospect
  const handleRejectProspect = async (prospectId: string) => {
    try {
      const res = await fetch(`/api/admin/crm/prospects/${prospectId}/reject`, {
        method: "POST",
        headers: getHeaders()
      });
      if (res.ok) {
        setProspects((prev) => prev.map((p) => (p.id === prospectId ? { ...p, workflowStatus: "rejected" } : p)));
      }
    } catch (e) {
      console.error("Rejection failed:", e);
    }
  };

  // Bulk reject prospects
  const handleBulkReject = async (ids: string[]) => {
    try {
      const res = await fetch("/api/admin/crm/prospects/bulk-reject", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ prospectIds: ids })
      });
      if (res.ok) {
        setProspects((prev) =>
          prev.map((p) => (ids.includes(p.id) ? { ...p, workflowStatus: "rejected" } : p))
        );
      }
    } catch (e) {
      console.error("Bulk rejection failed:", e);
    }
  };

  const handleOpenLead = (lead: CRMLead) => {
    setSelectedLead(lead);
    fetchLeadDetails(lead.id);
  };

  const handleQuickCall = (lead: CRMLead) => {
    setSelectedLead(lead);
    fetchLeadDetails(lead.id);
  };

  return (
    <div className="space-y-6">
      {/* Header and Mode Selector */}
      <CrmHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        metrics={metrics}
        ollamaConnected={ollamaStatus.connected}
        ollamaModel={ollamaStatus.model}
        onRefresh={handleRefreshAll}
        isRefreshing={isRefreshing}
        onNewLeadClick={() => setIsNewLeadOpen(true)}
      />

      {/* Main Tab Content */}
      {activeTab === "dashboard" && (
        <CrmMetricsDashboard
          metrics={metrics}
          leads={leads}
          tasks={tasks}
          onSelectLead={handleOpenLead}
          onGoToPipeline={() => setActiveTab("pipeline")}
          onGoToCockpit={() => setActiveTab("cockpit")}
        />
      )}

      {activeTab === "pipeline" && (
        <CrmPipelineBoard
          leads={leads}
          onSelectLead={handleOpenLead}
          onUpdateLeadStage={handleUpdateLeadStage}
          onQuickCall={handleQuickCall}
        />
      )}

      {activeTab === "leads" && (
        <CrmLeadTable
          leads={leads}
          onSelectLead={handleOpenLead}
          onUpdateLeadStage={handleUpdateLeadStage}
          onConvertLead={(lead) => {
            setSelectedLead(lead);
            fetchLeadDetails(lead.id);
          }}
          onArchiveLead={handleArchiveLead}
          onQuickCall={handleQuickCall}
        />
      )}

      {activeTab === "cockpit" && (
        <CrmColdCallCockpit
          leads={leads}
          onLogCall={handleAddCall}
          onSelectLead={handleOpenLead}
        />
      )}

      {activeTab === "prospects" && (
        <CrmProspectFinder
          prospects={prospects}
          searchHistory={searchHistory}
          onRunSearch={handleRunSearch}
          onAnalyzeProspect={handleAnalyzeProspect}
          onApproveProspect={handleApproveProspect}
          onBulkApprove={handleBulkApprove}
          onRejectProspect={handleRejectProspect}
          onBulkReject={handleBulkReject}
          isSearching={isSearching}
        />
      )}

      {activeTab === "tasks" && (
        <CrmTasksList
          tasks={tasks}
          leads={leads}
          onToggleTaskStatus={handleToggleTaskStatus}
          onAddTask={handleAddTask}
          onSelectLead={handleOpenLead}
        />
      )}

      {activeTab === "settings" && (
        <CrmSettings
          ollamaConnected={ollamaStatus.connected}
          ollamaModel={ollamaStatus.model}
          onTestOllama={checkOllamaStatus}
          leadsCount={leads.length}
          leads={leads}
        />
      )}

      {/* Modals */}
      {selectedLead && (
        <CrmLeadDetailModal
          lead={selectedLead}
          activities={selectedLeadActivities}
          calls={selectedLeadCalls}
          tasks={tasks.filter((t) => t.leadId === selectedLead.id)}
          onClose={() => setSelectedLead(null)}
          onUpdateLead={handleUpdateLead}
          onAddActivity={handleAddActivity}
          onAddCall={handleAddCall}
          onAddTask={handleAddTask}
          onToggleTaskStatus={handleToggleTaskStatus}
          onConvertLead={handleConvertLead}
          onArchiveLead={handleArchiveLead}
          onMergeLead={handleMergeLead}
          allLeads={leads}
        />
      )}

      <CrmNewLeadModal
        isOpen={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        onCreateLead={handleCreateLead}
      />
    </div>
  );
}
