import { useState } from "react";
import { X, Phone, Mail, MessageSquare, Globe, MapPin, Calendar, CheckSquare, Plus, Clock, Sparkles, CheckCircle2, UserCheck, AlertCircle, Send, FileText } from "lucide-react";
import { CRMLead, CRMActivity, CRMCallRecord, CRMTask, PipelineStage, PIPELINE_STAGES, CallOutcome } from "../../crm/types";

interface CrmLeadDetailModalProps {
  lead: CRMLead;
  activities: CRMActivity[];
  calls: CRMCallRecord[];
  tasks: CRMTask[];
  onClose: () => void;
  onUpdateLead: (leadId: number, updates: Partial<CRMLead>) => void;
  onAddActivity: (leadId: number, type: string, title: string, description: string) => void;
  onAddCall: (leadId: number, outcome: CallOutcome, durationSecs: number, notes: string, nextFollowUpAt?: string) => void;
  onAddTask: (leadId: number, title: string, dueAt: string, priority: "Low" | "Medium" | "High") => void;
  onToggleTaskStatus: (taskId: string, currentStatus: string) => void;
  onConvertLead: (leadId: number, details: { contractValue: number; billingEmail: string; notes: string }) => void;
  onArchiveLead: (leadId: number) => void;
  onMergeLead: (primaryId: number, duplicateId: number) => void;
  allLeads: CRMLead[];
}

export function CrmLeadDetailModal({
  lead,
  activities,
  calls,
  tasks,
  onClose,
  onUpdateLead,
  onAddActivity,
  onAddCall,
  onAddTask,
  onToggleTaskStatus,
  onConvertLead,
  onArchiveLead,
  onMergeLead,
  allLeads
}: CrmLeadDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "calls" | "tasks" | "ai" | "convert">("overview");

  // Note form state
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Call form state
  const [callOutcome, setCallOutcome] = useState<CallOutcome>("Called");
  const [callDuration, setCallDuration] = useState("3");
  const [callNotes, setCallNotes] = useState("");
  const [callNextFollowUp, setCallNextFollowUp] = useState("");
  const [savingCall, setSavingCall] = useState(false);

  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [savingTask, setSavingTask] = useState(false);

  // Conversion form state
  const [contractValue, setContractValue] = useState(lead.estimatedValue || 10000);
  const [billingEmail, setBillingEmail] = useState(lead.email);
  const [conversionNotes, setConversionNotes] = useState("");

  // Merge modal state
  const [mergeTargetId, setMergeTargetId] = useState<string>("");
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await onAddActivity(lead.id, "note", "Note Added", noteText.trim());
      setNoteText("");
    } finally {
      setAddingNote(false);
    }
  };

  const handleSaveCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCall(true);
    try {
      await onAddCall(
        lead.id,
        callOutcome,
        (parseInt(callDuration) || 0) * 60,
        callNotes.trim(),
        callNextFollowUp || undefined
      );
      setCallNotes("");
      setCallNextFollowUp("");
    } finally {
      setSavingCall(false);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setSavingTask(true);
    try {
      await onAddTask(
        lead.id,
        taskTitle.trim(),
        taskDue || new Date(Date.now() + 86400000).toISOString(),
        taskPriority
      );
      setTaskTitle("");
      setTaskDue("");
    } finally {
      setSavingTask(false);
    }
  };

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    onConvertLead(lead.id, {
      contractValue: Number(contractValue),
      billingEmail,
      notes: conversionNotes
    });
    setActiveTab("overview");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-app-bg border border-app-border rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-once">
        {/* Header */}
        <div className="p-6 border-b border-app-border bg-app-aside-bg/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold font-display text-app-text">{lead.company}</h2>
              <span
                className={`px-2 py-0.5 text-xs font-mono font-bold rounded-md ${
                  lead.scoreCategory === "Hot"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                    : "bg-sky-500/10 text-sky-500 border border-sky-500/30"
                }`}
              >
                Score {lead.leadScore} ({lead.scoreCategory})
              </span>
              {lead.isConverted && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-500 text-white flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Client
                </span>
              )}
            </div>
            <p className="text-xs text-app-text-sec mt-0.5">
              Lead #{lead.id} • {lead.name} • {lead.location} • Source: {lead.leadSource}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Stage Selector */}
            <select
              value={lead.stage}
              onChange={(e) => onUpdateLead(lead.id, { stage: e.target.value as PipelineStage })}
              className="bg-app-input border border-app-input-border text-app-text text-xs rounded-xl px-3 py-2 font-medium focus:outline-none"
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {!lead.isConverted && (
              <button
                onClick={() => setActiveTab("convert")}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Convert to Client</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-app-btn-sec text-app-text-muted hover:text-app-text transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="px-6 border-b border-app-border/60 bg-app-aside-bg/20 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-3 border-b-2 transition cursor-pointer ${
              activeTab === "overview"
                ? "border-sky-500 text-sky-500"
                : "border-transparent text-app-text-sec hover:text-app-text"
            }`}
          >
            Overview & Details
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "timeline"
                ? "border-sky-500 text-sky-500"
                : "border-transparent text-app-text-sec hover:text-app-text"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Activity Timeline ({activities.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("calls")}
            className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "calls"
                ? "border-sky-500 text-sky-500"
                : "border-transparent text-app-text-sec hover:text-app-text"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Records ({calls.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "tasks"
                ? "border-sky-500 text-sky-500"
                : "border-transparent text-app-text-sec hover:text-app-text"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks & Reminders ({tasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ai"
                ? "border-sky-500 text-sky-500"
                : "border-transparent text-app-text-sec hover:text-app-text"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Intelligence & Call Prep</span>
          </button>
          {!lead.isConverted && (
            <button
              onClick={() => setActiveTab("convert")}
              className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "convert"
                  ? "border-sky-500 text-sky-500"
                  : "border-transparent text-app-text-sec hover:text-app-text"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Convert Client</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Duplicate Flag Alert */}
              {lead.duplicateOfLeadId && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 text-xs text-amber-700 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Potential Duplicate Match Detected</p>
                    <p>This lead shares contact details with Lead #{lead.duplicateOfLeadId}. You can merge these records to combine notes and activities.</p>
                    <button
                      onClick={() => {
                        setMergeTargetId(String(lead.duplicateOfLeadId));
                        setShowMergeConfirm(true);
                      }}
                      className="mt-1 px-3 py-1 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-500 transition cursor-pointer"
                    >
                      Merge with Lead #{lead.duplicateOfLeadId}
                    </button>
                  </div>
                </div>
              )}

              {/* Converted Client Card */}
              {lead.isConverted && lead.convertedClientDetails && (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Client Account Active: {lead.convertedClientDetails.clientId}
                    </span>
                    <span className="font-mono">
                      Contract Value: ${lead.convertedClientDetails.contractValue?.toLocaleString()} XCD
                    </span>
                  </div>
                  <p className="text-app-text-sec">
                    Billing Contact: {lead.convertedClientDetails.billingEmail} • Notes: {lead.convertedClientDetails.notes || "None"}
                  </p>
                </div>
              )}

              {/* Contact Information & Channels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass p-4 rounded-2xl border border-app-border space-y-3">
                  <h3 className="text-xs font-bold font-mono text-app-text-muted uppercase">Direct Contact Points</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-app-text-sec">Phone:</span>
                      <a href={`tel:${lead.phone}`} className="font-mono text-sky-500 hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </a>
                    </div>
                    {lead.whatsapp && (
                      <div className="flex items-center justify-between">
                        <span className="text-app-text-sec">WhatsApp:</span>
                        <a
                          href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-emerald-500 hover:underline flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Chat on WhatsApp
                        </a>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-app-text-sec">Email:</span>
                      <a href={`mailto:${lead.email}`} className="font-mono text-sky-500 hover:underline flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {lead.email}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-app-text-sec">Location:</span>
                      <span className="text-app-text flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lead.location} (Saint Lucia)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass p-4 rounded-2xl border border-app-border space-y-3">
                  <h3 className="text-xs font-bold font-mono text-app-text-muted uppercase">Digital & Web Presence</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-app-text-sec">Website:</span>
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline flex items-center gap-1 truncate max-w-[200px]">
                          <Globe className="w-3 h-3 shrink-0" />
                          {lead.website}
                        </a>
                      ) : (
                        <span className="text-amber-500 font-medium">None (Prime Opportunity)</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-app-text-sec">Facebook:</span>
                      {lead.facebookUrl ? (
                        <a href={lead.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">
                          View Page
                        </a>
                      ) : (
                        <span className="text-app-text-muted">Not listed</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-app-text-sec">Instagram:</span>
                      {lead.instagramUrl ? (
                        <a href={lead.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">
                          View Instagram
                        </a>
                      ) : (
                        <span className="text-app-text-muted">Not listed</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-app-text-sec">LinkedIn:</span>
                      {lead.linkedinUrl ? (
                        <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">
                          View Company
                        </a>
                      ) : (
                        <span className="text-app-text-muted">Not listed</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Inquiry & Service Details */}
              <div className="glass p-4 rounded-2xl border border-app-border space-y-3 text-xs">
                <h3 className="text-xs font-bold font-mono text-app-text-muted uppercase">Inquiry & Business Scope</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-app-text-sec block">Service Requested:</span>
                    <span className="font-semibold text-sky-500">{lead.serviceRequested}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-app-text-sec block">Biggest Challenge:</span>
                    <span className="font-semibold text-app-text">{lead.biggestChallenge || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-app-text-sec block">Company Size:</span>
                    <span className="font-semibold text-app-text">{lead.employees || "1–10 employees"}</span>
                  </div>
                </div>
                {lead.message && (
                  <div className="mt-2 pt-2 border-t border-app-border/40">
                    <span className="text-[11px] text-app-text-sec block mb-1">Message from Contact:</span>
                    <div className="p-3 rounded-xl bg-app-bg text-app-text italic">
                      "{lead.message}"
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Notes Section */}
              <div className="glass p-4 rounded-2xl border border-app-border space-y-2 text-xs">
                <h3 className="text-xs font-bold font-mono text-app-text-muted uppercase">Internal Admin Notes</h3>
                <textarea
                  rows={3}
                  defaultValue={lead.adminNotes || ""}
                  onBlur={(e) => onUpdateLead(lead.id, { adminNotes: e.target.value })}
                  placeholder="Record internal consultation notes, client objections, or specific agreements..."
                  className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-3 text-xs focus:outline-none focus:border-sky-500/80"
                />
              </div>

              {/* Quick Actions Footer */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => onArchiveLead(lead.id)}
                  className="text-xs text-red-500 hover:text-red-400 font-medium transition cursor-pointer"
                >
                  Archive Lead
                </button>
                <div className="text-[11px] text-app-text-muted font-mono">
                  Created: {new Date(lead.createdAt).toLocaleString()} • Last Updated: {new Date(lead.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVITY TIMELINE */}
          {activeTab === "timeline" && (
            <div className="space-y-6">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="glass p-4 rounded-2xl border border-app-border space-y-3">
                <h3 className="text-xs font-bold font-mono text-app-text-muted uppercase">Add Activity or Consultation Note</h3>
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Describe an interaction, client update, or milestone..."
                  className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-3 text-xs focus:outline-none focus:border-sky-500/80"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addingNote || !noteText.trim()}
                    className="px-4 py-2 rounded-xl bg-app-text text-app-bg text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Note</span>
                  </button>
                </div>
              </form>

              {/* Timeline list */}
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <div className="p-8 text-center text-xs text-app-text-muted border border-dashed border-app-border rounded-xl">
                    No activity recorded yet for this lead.
                  </div>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="p-3.5 rounded-xl border border-app-border bg-app-aside-bg/30 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-sky-500">{act.title}</span>
                        <span className="text-app-text-muted font-mono">{new Date(act.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-app-text">{act.description}</p>
                      <div className="text-[10px] text-app-text-muted font-mono">By: {act.author}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CALL RECORDS & COCKPIT */}
          {activeTab === "calls" && (
            <div className="space-y-6">
              {/* Record Call Form */}
              <form onSubmit={handleSaveCall} className="glass p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">
                    Log Call with {lead.name}
                  </h3>
                  <a
                    href={`tel:${lead.phone}`}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-500 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Dial {lead.phone}</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-mono text-app-text-muted uppercase block mb-1">Call Outcome</label>
                    <select
                      value={callOutcome}
                      onChange={(e) => setCallOutcome(e.target.value as CallOutcome)}
                      className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2 text-xs focus:outline-none"
                    >
                      <option value="Called">Called (General)</option>
                      <option value="No Answer">No Answer / Voicemail</option>
                      <option value="Call Back">Call Back Requested</option>
                      <option value="Interested">Interested / Follow-up</option>
                      <option value="Meeting Scheduled">Meeting / Demo Scheduled</option>
                      <option value="Not Interested">Not Interested</option>
                      <option value="Wrong Number">Wrong Number</option>
                      <option value="Do Not Contact">Do Not Contact</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-app-text-muted uppercase block mb-1">Duration (Minutes)</label>
                    <input
                      type="number"
                      min="0"
                      value={callDuration}
                      onChange={(e) => setCallDuration(e.target.value)}
                      className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-app-text-muted uppercase block mb-1">Next Follow-Up Date/Time</label>
                    <input
                      type="datetime-local"
                      value={callNextFollowUp}
                      onChange={(e) => setCallNextFollowUp(e.target.value)}
                      className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-app-text-muted uppercase block mb-1">Call Notes & Objections</label>
                  <textarea
                    rows={2}
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Discussed requirements, customer concerns, scheduled survey..."
                    className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-3 text-xs focus:outline-none focus:border-sky-500/80"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingCall}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Save Call Record
                  </button>
                </div>
              </form>

              {/* Call History List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono text-app-text-muted uppercase">Past Call Records</h4>
                {calls.length === 0 ? (
                  <div className="p-6 text-center text-xs text-app-text-muted border border-dashed border-app-border rounded-xl">
                    No calls logged yet. Use the form above to record your interactions.
                  </div>
                ) : (
                  calls.map((c) => (
                    <div key={c.id} className="p-3.5 rounded-xl border border-app-border bg-app-aside-bg/30 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-emerald-500">{c.outcome} ({c.durationSecs ? Math.round(c.durationSecs / 60) : 0} mins)</span>
                        <span className="text-app-text-muted font-mono">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-app-text">{c.notes || "No call notes."}</p>
                      {c.nextFollowUpAt && (
                        <div className="text-[11px] text-amber-500 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Next Follow-up scheduled for: {new Date(c.nextFollowUpAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TASKS & REMINDERS */}
          {activeTab === "tasks" && (
            <div className="space-y-6">
              {/* Add Task Form */}
              <form onSubmit={handleSaveTask} className="glass p-4 rounded-2xl border border-app-border space-y-3">
                <h3 className="text-xs font-bold font-mono text-app-text-muted uppercase">Create Follow-Up Reminder / Task</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Task description (e.g. Send revised firewall quotation)..."
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <input
                    type="date"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="bg-app-input border border-app-input-border text-app-text rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={savingTask || !taskTitle.trim()}
                    className="px-4 py-2 rounded-xl bg-app-text text-app-bg text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                  >
                    Add Task
                  </button>
                </div>
              </form>

              {/* Task list */}
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-app-text-muted border border-dashed border-app-border rounded-xl">
                    No active tasks for this lead.
                  </div>
                ) : (
                  tasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-app-border bg-app-aside-bg/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={t.status === "completed"}
                          onChange={() => onToggleTaskStatus(t.id, t.status)}
                          className="w-4 h-4 rounded text-sky-500 cursor-pointer"
                        />
                        <span className={`font-medium ${t.status === "completed" ? "line-through text-app-text-muted" : "text-app-text"}`}>
                          {t.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-app-text-muted font-mono">
                          Due: {new Date(t.dueAt).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] rounded bg-app-btn-sec text-app-text-sec font-mono">
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: AI INTELLIGENCE & CALL PREPARATION */}
          {activeTab === "ai" && (
            <div className="space-y-6">
              {/* Score Breakdown Banner */}
              <div className="glass p-5 rounded-2xl border border-sky-500/20 bg-sky-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-sm text-app-text">Lead Opportunity Score: {lead.leadScore} / 100</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                    {lead.scoreCategory} Opportunity
                  </span>
                </div>
                <p className="text-xs text-app-text-sec">
                  {lead.aiAnalysis?.summary || `${lead.company} has strong potential for V79 Digital modernizations.`}
                </p>

                {/* Score Factor Breakdown */}
                {lead.aiAnalysis?.scoreBreakdown && lead.aiAnalysis.scoreBreakdown.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-app-border/40">
                    <span className="text-[10px] font-mono uppercase text-app-text-muted block">Score Factors:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {lead.aiAnalysis.scoreBreakdown.map((item, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-app-bg/80 border border-app-border text-xs flex items-center justify-between">
                          <span className="text-app-text-sec">{item.factor}</span>
                          <span className="font-mono font-bold text-emerald-500">+{item.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Call Prep Card */}
              {lead.aiAnalysis?.callPrep && (
                <div className="glass p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider font-mono">
                    <Phone className="w-4 h-4" />
                    <span>Executive Call Preparation Card</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-bold text-app-text block mb-0.5">What They Do & Context:</span>
                      <p className="text-app-text-sec">{lead.aiAnalysis.callPrep.whatTheyDo}</p>
                    </div>

                    <div>
                      <span className="font-bold text-app-text block mb-0.5">Identified Digital Pain Point:</span>
                      <p className="text-app-text-sec">{lead.aiAnalysis.callPrep.identifiedNeed}</p>
                    </div>

                    <div>
                      <span className="font-bold text-app-text block mb-0.5">Tailored V79 Digital Pitch:</span>
                      <div className="p-3 rounded-xl bg-app-bg/80 border border-app-border text-app-text leading-relaxed">
                        "{lead.aiAnalysis.callPrep.recommendedPitch}"
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-app-text block mb-1">Targeted Discovery Questions to Ask:</span>
                      <ul className="space-y-1.5 list-disc list-inside text-app-text-sec pl-1">
                        {lead.aiAnalysis.callPrep.discoveryQuestions.map((q, idx) => (
                          <li key={idx} className="text-xs">{q}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-app-border/40 flex items-center justify-between text-[11px]">
                      <span className="text-app-text-muted">Suggested Next Action:</span>
                      <span className="font-semibold text-emerald-500">{lead.aiAnalysis.callPrep.suggestedNextAction}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Services Match */}
              {lead.aiAnalysis?.recommendedServices && (
                <div className="glass p-4 rounded-2xl border border-app-border space-y-2">
                  <h4 className="text-xs font-bold font-mono text-app-text-muted uppercase">Recommended V79 Digital Solutions</h4>
                  <div className="flex flex-wrap gap-2">
                    {lead.aiAnalysis.recommendedServices.map((svc, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-500 text-xs font-semibold border border-sky-500/20">
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: CONVERT CLIENT */}
          {activeTab === "convert" && (
            <form onSubmit={handleConvert} className="glass p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-app-text font-display">Convert {lead.company} to Active Customer</h3>
                <p className="text-xs text-app-text-sec">
                  This will graduate this lead into a client account, record contract value in won revenue, and initialize client onboarding.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-app-text-muted uppercase block mb-1">Contract / Project Value (XCD)</label>
                  <input
                    type="number"
                    required
                    value={contractValue}
                    onChange={(e) => setContractValue(Number(e.target.value))}
                    className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-app-text-muted uppercase block mb-1">Billing Email</label>
                  <input
                    type="email"
                    required
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-app-text-muted uppercase block mb-1">Contract Scope & Onboarding Notes</label>
                <textarea
                  rows={3}
                  value={conversionNotes}
                  onChange={(e) => setConversionNotes(e.target.value)}
                  placeholder="Details on scope of work, monthly retainer agreement, key milestones..."
                  className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-3 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="px-4 py-2 rounded-xl bg-app-btn-sec text-app-text font-semibold hover:bg-app-btn-sec/80 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Customer Conversion</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Confirmation modal for merge */}
      {showMergeConfirm && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-app-bg border border-amber-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 text-xs shadow-2xl">
            <h4 className="text-sm font-bold text-app-text">Confirm Lead Merge</h4>
            <p className="text-app-text-sec">
              Merging will combine all contact information, messages, and call notes from Lead #{mergeTargetId} into this record. Lead #{mergeTargetId} will be marked as merged and archived.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowMergeConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-app-btn-sec text-app-text font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onMergeLead(lead.id, Number(mergeTargetId));
                  setShowMergeConfirm(false);
                  onClose();
                }}
                className="px-4 py-1.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-500"
              >
                Execute Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
