import { PhoneCall, Search, LayoutDashboard, Kanban, Users, CheckSquare, Sparkles, RefreshCw } from "lucide-react";
import { CRMMetrics } from "../../crm/types";

interface CrmHeaderProps {
  activeTab: "dashboard" | "pipeline" | "leads" | "cockpit" | "prospects" | "tasks" | "settings";
  setActiveTab: (tab: "dashboard" | "pipeline" | "leads" | "cockpit" | "prospects" | "tasks" | "settings") => void;
  metrics: CRMMetrics | null;
  ollamaConnected: boolean;
  ollamaModel?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  onNewLeadClick: () => void;
}

export function CrmHeader({
  activeTab,
  setActiveTab,
  metrics,
  ollamaConnected,
  ollamaModel,
  onRefresh,
  isRefreshing,
  onNewLeadClick
}: CrmHeaderProps) {
  const followUpsDue = metrics?.followUpsDue || 0;
  const newLeads = metrics?.newLeads || 0;

  return (
    <div className="space-y-4 border-b border-app-border/40 pb-5">
      {/* Top Banner with Brand Logo and System Status */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white p-1.5 shadow-sm border border-app-border flex items-center justify-center shrink-0">
            <img
              src="/v79-digital-logo.svg"
              alt="V79 Digital Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-app-text font-display">
                V79 <span className="text-sky-500 font-bold">CRM & Lead Engine</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-md bg-sky-500/10 text-sky-500 border border-sky-500/20 font-semibold">
                Saint Lucia Enterprise
              </span>
            </div>
            <p className="text-xs text-app-text-sec">
              Client acquisition, automated contact form intake, call tracking & AI lead intelligence.
            </p>
          </div>
        </div>

        {/* Right Status & Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* AI Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition ${
              ollamaConnected
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
            }`}
            title={ollamaConnected ? `Ollama Active (${ollamaModel || "llama3"})` : "Ollama Offline — Rule-based AI Engine Active"}
          >
            <span className={`w-2 h-2 rounded-full ${ollamaConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <Sparkles className="w-3.5 h-3.5" />
            <span>{ollamaConnected ? `Ollama: ${ollamaModel || "Active"}` : "AI: Heuristic Engine"}</span>
          </div>

          {/* Refresh Button */}
          <button
            id="crm-btn-refresh"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-app-border bg-app-btn-sec text-app-text hover:bg-app-btn-sec/80 transition cursor-pointer disabled:opacity-50"
            title="Refresh CRM Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          {/* New Lead Quick Action */}
          <button
            id="crm-btn-new-lead"
            onClick={onNewLeadClick}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Main CRM Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          id="crm-tab-dashboard"
          onClick={() => setActiveTab("dashboard")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-app-text text-app-bg shadow-sm"
              : "text-app-text-sec hover:text-app-text hover:bg-app-btn-sec"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          id="crm-tab-pipeline"
          onClick={() => setActiveTab("pipeline")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "pipeline"
              ? "bg-app-text text-app-bg shadow-sm"
              : "text-app-text-sec hover:text-app-text hover:bg-app-btn-sec"
          }`}
        >
          <Kanban className="w-4 h-4" />
          <span>Sales Pipeline</span>
          {newLeads > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-sky-500 text-white">
              {newLeads}
            </span>
          )}
        </button>

        <button
          id="crm-tab-leads"
          onClick={() => setActiveTab("leads")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "leads"
              ? "bg-app-text text-app-bg shadow-sm"
              : "text-app-text-sec hover:text-app-text hover:bg-app-btn-sec"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Lead Directory</span>
          {metrics && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-app-border text-app-text-sec">
              {metrics.totalLeads}
            </span>
          )}
        </button>

        <button
          id="crm-tab-cockpit"
          onClick={() => setActiveTab("cockpit")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "cockpit"
              ? "bg-app-text text-app-bg shadow-sm"
              : "text-app-text-sec hover:text-app-text hover:bg-app-btn-sec"
          }`}
        >
          <PhoneCall className="w-4 h-4 text-emerald-500" />
          <span>Cold-Call Cockpit</span>
          {followUpsDue > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white animate-pulse">
              {followUpsDue} due
            </span>
          )}
        </button>

        <button
          id="crm-tab-prospects"
          onClick={() => setActiveTab("prospects")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "prospects"
              ? "bg-app-text text-app-bg shadow-sm"
              : "text-app-text-sec hover:text-app-text hover:bg-app-btn-sec"
          }`}
        >
          <Search className="w-4 h-4 text-sky-500" />
          <span>Prospect Finder (Saint Lucia)</span>
        </button>

        <button
          id="crm-tab-tasks"
          onClick={() => setActiveTab("tasks")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "tasks"
              ? "bg-app-text text-app-bg shadow-sm"
              : "text-app-text-sec hover:text-app-text hover:bg-app-btn-sec"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Tasks & Follow-ups</span>
        </button>

        <button
          id="crm-tab-settings"
          onClick={() => setActiveTab("settings")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 cursor-pointer ml-auto ${
            activeTab === "settings"
              ? "bg-app-text text-app-bg shadow-sm"
              : "text-app-text-sec hover:text-app-text hover:bg-app-btn-sec"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>AI & Engine Settings</span>
        </button>
      </div>
    </div>
  );
}
