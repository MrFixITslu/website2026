import { useState, useMemo } from "react";
import { Phone, Mail, MessageSquare, Search, Filter, ExternalLink, Archive, CheckCircle2, ChevronRight, AlertCircle, ArrowUpDown } from "lucide-react";
import { CRMLead, PipelineStage, PIPELINE_STAGES, SAINT_LUCIA_LOCATIONS } from "../../crm/types";

interface CrmLeadTableProps {
  leads: CRMLead[];
  onSelectLead: (lead: CRMLead) => void;
  onUpdateLeadStage: (leadId: number, newStage: PipelineStage) => void;
  onConvertLead: (lead: CRMLead) => void;
  onArchiveLead: (leadId: number) => void;
  onQuickCall: (lead: CRMLead) => void;
}

export function CrmLeadTable({
  leads,
  onSelectLead,
  onUpdateLeadStage,
  onConvertLead,
  onArchiveLead,
  onQuickCall
}: CrmLeadTableProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortField, setSortField] = useState<"createdAt" | "leadScore" | "estimatedValue">("createdAt");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    return leads
      .filter((l) => {
        if (l.isArchived) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const match =
            l.company.toLowerCase().includes(q) ||
            l.name.toLowerCase().includes(q) ||
            l.email.toLowerCase().includes(q) ||
            l.phone.includes(q) ||
            l.serviceRequested.toLowerCase().includes(q);
          if (!match) return false;
        }
        if (stageFilter !== "all" && l.stage !== stageFilter) return false;
        if (locationFilter !== "all" && l.location.toLowerCase() !== locationFilter.toLowerCase()) return false;
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === "createdAt") {
          diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortField === "leadScore") {
          diff = b.leadScore - a.leadScore;
        } else if (sortField === "estimatedValue") {
          diff = (b.estimatedValue || 0) - (a.estimatedValue || 0);
        }
        return sortAsc ? -diff : diff;
      });
  }, [leads, search, stageFilter, locationFilter, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-once">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-app-aside-bg/40 p-4 rounded-2xl border border-app-border">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-app-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by name, company, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-sky-500/80 transition"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-app-input border border-app-input-border text-app-text rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/80"
          >
            <option value="all">All Stages</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-app-input border border-app-input-border text-app-text rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/80"
          >
            <option value="all">All Locations</option>
            {SAINT_LUCIA_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass rounded-2xl border border-app-border overflow-hidden bg-app-aside-bg/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-app-text border-collapse">
            <thead className="bg-app-btn-sec/40 border-b border-app-border text-[11px] font-mono text-app-text-muted uppercase">
              <tr>
                <th className="py-3 px-4">Company & Contact</th>
                <th className="py-3 px-4">Contact Channels</th>
                <th className="py-3 px-4">Service Requested</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => toggleSort("leadScore")}>
                  <div className="flex items-center gap-1">
                    <span>AI Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => toggleSort("estimatedValue")}>
                  <div className="flex items-center gap-1">
                    <span>Est. Value</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => toggleSort("createdAt")}>
                  <div className="flex items-center gap-1">
                    <span>Created</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-app-text-muted">
                    No leads found matching current criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-app-btn-sec/20 transition cursor-pointer"
                    onClick={() => onSelectLead(lead)}
                  >
                    {/* Company & Contact */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-app-text flex items-center gap-1.5">
                          <span>{lead.company}</span>
                          {lead.isConverted && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/10 text-emerald-500 font-bold">
                              Client
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-app-text-sec">{lead.name}</div>
                        {lead.duplicateOfLeadId && (
                          <div className="text-[10px] text-amber-500 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span>Dup of #{lead.duplicateOfLeadId}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Contact Channels */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1 rounded-md bg-app-btn-sec hover:bg-emerald-500/20 hover:text-emerald-500 transition text-app-text-sec"
                            title={`Call ${lead.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {lead.whatsapp && (
                          <a
                            href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            className="p-1 rounded-md bg-app-btn-sec hover:bg-sky-500/20 hover:text-sky-500 transition text-app-text-sec"
                            title={`Email ${lead.email}`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Service Requested */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-1 rounded-md bg-sky-500/10 text-sky-500 font-medium text-[11px]">
                        {lead.serviceRequested}
                      </span>
                    </td>

                    {/* Stage Dropdown */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.stage}
                        onChange={(e) => onUpdateLeadStage(lead.id, e.target.value as PipelineStage)}
                        className="bg-app-input border border-app-input-border text-app-text rounded-lg px-2 py-1 text-xs focus:outline-none"
                      >
                        {PIPELINE_STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>

                    {/* AI Score */}
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          lead.scoreCategory === "Hot"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                            : lead.scoreCategory === "High Potential"
                            ? "bg-sky-500/10 text-sky-500 border border-sky-500/30"
                            : "bg-app-btn-sec text-app-text-sec"
                        }`}
                      >
                        {lead.leadScore} pts
                      </span>
                    </td>

                    {/* Value */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-500">
                      ${(lead.estimatedValue || 0).toLocaleString()} XCD
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-app-text-sec text-[11px]">
                      {lead.location}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-[11px] text-app-text-muted font-mono">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onQuickCall(lead)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition cursor-pointer"
                          title="Dial Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        {!lead.isConverted && (
                          <button
                            onClick={() => onConvertLead(lead)}
                            className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 transition cursor-pointer"
                            title="Convert to Client"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onSelectLead(lead)}
                          className="p-1.5 rounded-lg bg-app-btn-sec hover:bg-app-btn-sec/80 text-app-text transition cursor-pointer"
                          title="View Profile Details"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
