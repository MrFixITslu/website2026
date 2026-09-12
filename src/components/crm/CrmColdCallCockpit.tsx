import { useState } from "react";
import { Phone, MessageSquare, Clock, Sparkles, ChevronRight, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { CRMLead, CallOutcome } from "../../crm/types";

interface CrmColdCallCockpitProps {
  leads: CRMLead[];
  onLogCall: (leadId: number, outcome: CallOutcome, durationSecs: number, notes: string, nextFollowUpAt?: string) => void;
  onSelectLead: (lead: CRMLead) => void;
}

export function CrmColdCallCockpit({
  leads,
  onLogCall,
  onSelectLead
}: CrmColdCallCockpitProps) {
  // Filter queue: active uncontacted or follow-ups
  const [queueFilter, setQueueFilter] = useState<"all" | "hot" | "due">("all");
  const [copied, setCopied] = useState(false);

  // Call form state
  const [notes, setNotes] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [savingOutcome, setSavingOutcome] = useState<string | null>(null);

  const activeQueue = leads.filter((l) => {
    if (l.isArchived || l.isConverted || l.stage === "Lost") return false;
    if (queueFilter === "hot") return l.scoreCategory === "Hot";
    if (queueFilter === "due") {
      return l.nextFollowUpAt && new Date(l.nextFollowUpAt) <= new Date();
    }
    return true;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const activeLead: CRMLead | undefined = activeQueue[currentIndex] || activeQueue[0];

  const handleCopyPhone = (phone: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(phone).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const recordOutcome = async (outcome: CallOutcome) => {
    if (!activeLead) return;
    setSavingOutcome(outcome);
    try {
      await onLogCall(
        activeLead.id,
        outcome,
        180, // Default ~3 min logged
        notes.trim() || `Logged from Cockpit: ${outcome}`,
        nextFollowUp || undefined
      );
      setNotes("");
      setNextFollowUp("");
      // Advance to next lead in queue automatically
      if (currentIndex < activeQueue.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } finally {
      setSavingOutcome(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-once">
      {/* Cockpit Header & Queue Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-app-aside-bg/40 p-4 rounded-2xl border border-app-border">
        <div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-app-text font-display">Cold-Call & Outreach Cockpit</h2>
          </div>
          <p className="text-xs text-app-text-sec">
            Rapid outbound dialer with on-demand AI call prep and one-click outcome recording.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setQueueFilter("all"); setCurrentIndex(0); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              queueFilter === "all" ? "bg-app-text text-app-bg" : "bg-app-btn-sec text-app-text hover:bg-app-btn-sec/80"
            }`}
          >
            All Leads ({leads.filter(l => !l.isArchived && !l.isConverted).length})
          </button>
          <button
            onClick={() => { setQueueFilter("hot"); setCurrentIndex(0); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              queueFilter === "hot" ? "bg-amber-500 text-white" : "bg-app-btn-sec text-app-text hover:bg-app-btn-sec/80"
            }`}
          >
            🔥 Hot Opportunities
          </button>
          <button
            onClick={() => { setQueueFilter("due"); setCurrentIndex(0); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              queueFilter === "due" ? "bg-red-500 text-white" : "bg-app-btn-sec text-app-text hover:bg-app-btn-sec/80"
            }`}
          >
            ⏰ Due Follow-ups
          </button>
        </div>
      </div>

      {!activeLead ? (
        <div className="glass p-12 text-center text-sm text-app-text-muted rounded-2xl border border-app-border space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <p className="font-semibold text-app-text">Queue is currently clear!</p>
          <p className="text-xs text-app-text-sec">All leads in this filter have been processed or moved forward.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Lead & Dialing Card (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass p-6 rounded-3xl border border-app-border bg-app-aside-bg/40 space-y-6">
              {/* Queue Position Bar */}
              <div className="flex items-center justify-between text-xs text-app-text-muted font-mono pb-3 border-b border-app-border/40">
                <span>Lead {currentIndex + 1} of {activeQueue.length} in Queue</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(currentIndex - 1)}
                    className="px-2 py-1 rounded bg-app-btn-sec text-app-text hover:bg-app-btn-sec/80 disabled:opacity-30 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentIndex >= activeQueue.length - 1}
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="px-2 py-1 rounded bg-app-btn-sec text-app-text hover:bg-app-btn-sec/80 disabled:opacity-30 cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {/* Company & Contact Profile */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold font-display text-app-text">{activeLead.company}</h3>
                    <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-sky-500/10 text-sky-500">
                      Score {activeLead.leadScore}
                    </span>
                  </div>
                  <p className="text-xs text-app-text-sec mt-0.5">
                    Contact: <span className="font-semibold text-app-text">{activeLead.name}</span> • {activeLead.location}
                  </p>
                </div>

                <button
                  onClick={() => onSelectLead(activeLead)}
                  className="text-xs text-sky-500 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Large Dialing Action Button */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    Phone / WhatsApp Contact
                  </span>
                  <span className="text-2xl font-mono font-black text-app-text tracking-tight">
                    {activeLead.phone}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${activeLead.phone}`}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Now</span>
                  </a>

                  {activeLead.whatsapp && (
                    <a
                      href={`https://wa.me/${activeLead.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 transition"
                      title="Open WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => handleCopyPhone(activeLead.phone)}
                    className="p-2.5 rounded-xl bg-app-btn-sec hover:bg-app-btn-sec/80 text-app-text transition cursor-pointer"
                    title="Copy Phone Number"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Rapid One-Click Outcome Buttons */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-app-text-muted uppercase tracking-wider block">
                  Select Call Outcome:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <button
                    disabled={savingOutcome !== null}
                    onClick={() => recordOutcome("No Answer")}
                    className="p-2.5 rounded-xl bg-app-btn-sec hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 border border-app-border transition font-medium cursor-pointer text-center"
                  >
                    No Answer
                  </button>
                  <button
                    disabled={savingOutcome !== null}
                    onClick={() => recordOutcome("Call Back")}
                    className="p-2.5 rounded-xl bg-app-btn-sec hover:bg-sky-500/10 hover:text-sky-500 hover:border-sky-500/30 border border-app-border transition font-medium cursor-pointer text-center"
                  >
                    Call Back Req.
                  </button>
                  <button
                    disabled={savingOutcome !== null}
                    onClick={() => recordOutcome("Interested")}
                    className="p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/30 transition font-bold cursor-pointer text-center"
                  >
                    ⚡ Interested
                  </button>
                  <button
                    disabled={savingOutcome !== null}
                    onClick={() => recordOutcome("Meeting Scheduled")}
                    className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 transition font-bold cursor-pointer text-center"
                  >
                    📅 Booked Meeting
                  </button>
                  <button
                    disabled={savingOutcome !== null}
                    onClick={() => recordOutcome("Called")}
                    className="p-2.5 rounded-xl bg-app-btn-sec hover:bg-app-btn-sec/80 border border-app-border transition font-medium cursor-pointer text-center"
                  >
                    Left Voicemail
                  </button>
                  <button
                    disabled={savingOutcome !== null}
                    onClick={() => recordOutcome("Not Interested")}
                    className="p-2.5 rounded-xl bg-app-btn-sec hover:bg-red-500/10 hover:text-red-500 border border-app-border transition font-medium cursor-pointer text-center"
                  >
                    Not Interested
                  </button>
                  <button
                    disabled={savingOutcome !== null}
                    onClick={() => recordOutcome("Wrong Number")}
                    className="p-2.5 rounded-xl bg-app-btn-sec hover:bg-app-btn-sec/80 border border-app-border transition font-medium cursor-pointer text-center text-app-text-muted"
                  >
                    Wrong Number
                  </button>
                  <button
                    disabled={savingOutcome !== null}
                    onClick={() => recordOutcome("Do Not Contact")}
                    className="p-2.5 rounded-xl bg-app-btn-sec hover:bg-red-500/10 hover:text-red-500 border border-app-border transition font-medium cursor-pointer text-center text-red-500"
                  >
                    Do Not Call
                  </button>
                </div>
              </div>

              {/* Call Note & Follow-up Scheduler */}
              <div className="space-y-3 pt-2">
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Quick call notes (e.g. Owner requested quote for 10 PCs and Wi-Fi)..."
                  className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-3 text-xs focus:outline-none focus:border-sky-500/80"
                />
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-app-text-muted shrink-0" />
                  <input
                    type="datetime-local"
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                    className="bg-app-input border border-app-input-border text-app-text rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    placeholder="Set follow-up date"
                  />
                  <span className="text-[11px] text-app-text-muted">Schedule next contact reminder</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: AI Call Prep Card & Talking Points (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass p-5 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 space-y-4">
              <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider font-mono">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>AI Live Call Preparation</span>
              </div>

              {activeLead.aiAnalysis?.callPrep ? (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="font-bold text-app-text block mb-1">Company Profile & Context:</span>
                    <p className="text-app-text-sec text-[11px] leading-relaxed">
                      {activeLead.aiAnalysis.callPrep.whatTheyDo}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-app-text block mb-1">Identified Pain Point:</span>
                    <p className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                      {activeLead.aiAnalysis.callPrep.identifiedNeed}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-app-text block mb-1">Recommended Opening Pitch:</span>
                    <div className="p-3 rounded-xl bg-app-bg/90 border border-indigo-500/20 text-app-text italic text-[11px] leading-relaxed">
                      "{activeLead.aiAnalysis.callPrep.recommendedPitch}"
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-app-text block mb-1">Discovery Questions:</span>
                    <ul className="space-y-1.5 list-disc list-inside text-app-text-sec text-[11px] pl-1">
                      {activeLead.aiAnalysis.callPrep.discoveryQuestions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-app-border/40 text-[11px]">
                    <span className="font-bold text-app-text block">Recommended Next Action:</span>
                    <span className="text-emerald-500 font-semibold">{activeLead.aiAnalysis.callPrep.suggestedNextAction}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-app-bg/50 border border-app-border text-xs text-app-text-sec space-y-1">
                  <p className="font-semibold text-app-text">Pitch Guideline:</p>
                  <p>Inquire about their current internet reliability in {activeLead.location} and present V79 Digital's Managed IT Support.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
