import { useState, useMemo } from "react";
import { Phone, MapPin, Search, ChevronRight, AlertCircle, Sparkles } from "lucide-react";
import { CRMLead, PIPELINE_STAGES, PipelineStage, SAINT_LUCIA_LOCATIONS } from "../../crm/types";

interface CrmPipelineBoardProps {
  leads: CRMLead[];
  onSelectLead: (lead: CRMLead) => void;
  onUpdateLeadStage: (leadId: number, newStage: PipelineStage) => void;
  onQuickCall: (lead: CRMLead) => void;
}

export function CrmPipelineBoard({
  leads,
  onSelectLead,
  onUpdateLeadStage,
  onQuickCall
}: CrmPipelineBoardProps) {
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedScoreCat, setSelectedScoreCat] = useState("all");

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (lead.isArchived) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          lead.company.toLowerCase().includes(q) ||
          lead.name.toLowerCase().includes(q) ||
          lead.serviceRequested.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.phone.includes(q);
        if (!match) return false;
      }

      if (selectedLocation !== "all" && lead.location.toLowerCase() !== selectedLocation.toLowerCase()) {
        return false;
      }

      if (selectedPriority !== "all" && lead.priority !== selectedPriority) {
        return false;
      }

      if (selectedScoreCat !== "all" && lead.scoreCategory !== selectedScoreCat) {
        return false;
      }

      return true;
    });
  }, [leads, search, selectedLocation, selectedPriority, selectedScoreCat]);

  return (
    <div className="space-y-6 animate-fade-in-once">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-app-aside-bg/40 p-4 rounded-2xl border border-app-border">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-app-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter leads by company, contact, phone, or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-sky-500/80 transition"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* District filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-app-input border border-app-input-border text-app-text rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/80"
          >
            <option value="all">All Locations (Saint Lucia)</option>
            {SAINT_LUCIA_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-app-input border border-app-input-border text-app-text rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/80"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Score Category */}
          <select
            value={selectedScoreCat}
            onChange={(e) => setSelectedScoreCat(e.target.value)}
            className="bg-app-input border border-app-input-border text-app-text rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/80"
          >
            <option value="all">All AI Scores</option>
            <option value="Hot">🔥 Hot (80–100)</option>
            <option value="High Potential">⚡ High Potential (60–79)</option>
            <option value="Medium">Medium (40–59)</option>
            <option value="Low">Low (0–39)</option>
          </select>
        </div>
      </div>

      {/* Kanban Columns (Horizontal Scroll) */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter((l) => l.stage === stage);
          const stageTotalValue = stageLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

          return (
            <div
              key={stage}
              className="w-72 shrink-0 bg-app-aside-bg/30 rounded-2xl p-3 border border-app-border flex flex-col max-h-[750px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-app-border/40">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-app-text">{stage}</span>
                  <span className="w-5 h-5 rounded-full bg-app-btn-sec flex items-center justify-center text-[10px] font-mono font-bold text-app-text-sec">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-emerald-500 font-semibold">
                  ${stageTotalValue.toLocaleString()}
                </div>
              </div>

              {/* Lead Cards List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {stageLeads.length === 0 ? (
                  <div className="p-6 text-center text-xs text-app-text-muted/60 border border-dashed border-app-border/40 rounded-xl">
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const isHot = lead.scoreCategory === "Hot";
                    const isUrgent = lead.priority === "Urgent";

                    return (
                      <div
                        key={lead.id}
                        className={`p-3.5 rounded-xl border bg-app-bg transition-all duration-150 hover:shadow-md cursor-pointer space-y-2.5 relative ${
                          isHot ? "border-sky-500/40 bg-sky-500/5" : "border-app-border hover:border-app-border/80"
                        }`}
                        onClick={() => onSelectLead(lead)}
                      >
                        {/* Card Header: Company & Score */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-xs text-app-text leading-tight">{lead.company}</h4>
                            <p className="text-[11px] text-app-text-sec">{lead.name}</p>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-md shrink-0 ${
                              isHot
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                                : "bg-app-btn-sec text-app-text-sec border border-app-border"
                            }`}
                          >
                            {lead.leadScore} pts
                          </span>
                        </div>

                        {/* Service Requested */}
                        <div className="text-[11px] font-medium text-sky-500 line-clamp-1">
                          {lead.serviceRequested}
                        </div>

                        {/* Metadata row: Location & Value */}
                        <div className="flex items-center justify-between text-[10px] text-app-text-muted font-mono">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{lead.location}</span>
                          </span>
                          <span className="font-bold text-emerald-500 text-xs">
                            ${(lead.estimatedValue || 0).toLocaleString()} XCD
                          </span>
                        </div>

                        {/* Stage Mover & Quick Call Controls */}
                        <div
                          className="pt-2 border-t border-app-border/40 flex items-center justify-between"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={lead.stage}
                            onChange={(e) => onUpdateLeadStage(lead.id, e.target.value as PipelineStage)}
                            className="text-[10px] bg-app-input border border-app-input-border text-app-text rounded-md px-1.5 py-1 focus:outline-none"
                          >
                            {PIPELINE_STAGES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1">
                            {lead.phone && (
                              <button
                                onClick={() => onQuickCall(lead)}
                                className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition cursor-pointer"
                                title={`Call ${lead.name} (${lead.phone})`}
                              >
                                <Phone className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => onSelectLead(lead)}
                              className="p-1 rounded-md bg-app-btn-sec hover:bg-app-btn-sec/80 text-app-text transition cursor-pointer"
                              title="Open Lead Profile"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Duplicate warning flag */}
                        {lead.duplicateOfLeadId && (
                          <div className="mt-1 flex items-center gap-1 text-[9px] text-amber-500 font-medium">
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span>Potential duplicate of Lead #{lead.duplicateOfLeadId}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
