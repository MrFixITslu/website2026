import { useState } from "react";
import { Sparkles, Sliders, CheckCircle2, XCircle, RefreshCw, Download, Database, Shield } from "lucide-react";
import { CRMLead } from "../../crm/types";

interface CrmSettingsProps {
  ollamaConnected: boolean;
  ollamaModel?: string;
  onTestOllama: () => Promise<void>;
  leadsCount: number;
  leads?: CRMLead[];
}

export function CrmSettings({
  ollamaConnected,
  ollamaModel,
  onTestOllama,
  leadsCount,
  leads = []
}: CrmSettingsProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await onTestOllama();
      setTestResult("Connection checked successfully.");
    } catch (e: any) {
      setTestResult(`Check failed: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleExportJson = () => {
    try {
      const jsonStr = JSON.stringify(leads, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `v79_crm_leads_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed:", e);
      window.open("/api/admin/crm/leads", "_blank");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-once max-w-4xl">
      {/* Header */}
      <div className="bg-app-aside-bg/40 p-5 rounded-2xl border border-app-border space-y-1">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-sky-500" />
          <h2 className="text-base font-bold text-app-text font-display">
            CRM Intelligence & System Configuration
          </h2>
        </div>
        <p className="text-xs text-app-text-sec">
          Configure local AI inference engine, lead scoring parameters, and data protection settings.
        </p>
      </div>

      {/* Ollama Local AI Integration Card */}
      <div className="glass p-6 rounded-3xl border border-app-border bg-app-aside-bg/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-app-text">Local Ollama AI Inference Engine</h3>
              <p className="text-xs text-app-text-sec">
                Powers deterministic lead scoring, sales call preparation cards, and prospect ICT analysis.
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-semibold border ${
              ollamaConnected
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
            }`}
          >
            {ollamaConnected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Ollama Online ({ollamaModel || "llama3"})</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Offline — Heuristic Fallback Active</span>
              </>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-app-bg/80 border border-app-border space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-app-text-muted uppercase block mb-1">
                Local Host Endpoint
              </label>
              <input
                type="text"
                disabled
                value="http://localhost:11434"
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-app-text-muted uppercase block mb-1">
                Configured Model
              </label>
              <input
                type="text"
                disabled
                value={ollamaModel || "llama3 (or mistral/phi3)"}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-app-text-sec">
              Safe Graceful Degradation: If Ollama is offline or processing, the CRM automatically utilizes the V79 Deterministic Scoring Algorithm.
            </span>
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-4 py-2 rounded-xl bg-app-text text-app-bg text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
              <span>Test Ollama Link</span>
            </button>
          </div>

          {testResult && (
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-500 text-xs font-mono">
              {testResult}
            </div>
          )}
        </div>
      </div>

      {/* Scoring Weights Information */}
      <div className="glass p-6 rounded-3xl border border-app-border bg-app-aside-bg/30 space-y-4">
        <h3 className="font-bold text-sm text-app-text">Deterministic Lead Scoring Logic (0–100 Scale)</h3>
        <p className="text-xs text-app-text-sec">
          Every incoming inquiry and prospect is evaluated across four core criteria:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-app-border bg-app-bg/80 space-y-1">
            <div className="flex items-center justify-between font-semibold text-app-text">
              <span>Contact Channel Completeness</span>
              <span className="font-mono text-emerald-500 font-bold">+25 pts</span>
            </div>
            <p className="text-[11px] text-app-text-sec">
              Direct telephone, verified WhatsApp, valid corporate email address.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-app-border bg-app-bg/80 space-y-1">
            <div className="flex items-center justify-between font-semibold text-app-text">
              <span>High-Value Service Scope</span>
              <span className="font-mono text-emerald-500 font-bold">+35 pts</span>
            </div>
            <p className="text-[11px] text-app-text-sec">
              Network infrastructure, VoIP/PBX, cybersecurity, enterprise managed IT retainer.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-app-border bg-app-bg/80 space-y-1">
            <div className="flex items-center justify-between font-semibold text-app-text">
              <span>Saint Lucia Commercial Center</span>
              <span className="font-mono text-emerald-500 font-bold">+20 pts</span>
            </div>
            <p className="text-[11px] text-app-text-sec">
              Located in key commercial zones (Gros Islet, Rodney Bay, Castries, Vieux Fort).
            </p>
          </div>

          <div className="p-3 rounded-xl border border-app-border bg-app-bg/80 space-y-1">
            <div className="flex items-center justify-between font-semibold text-app-text">
              <span>Website Opportunity / Problem Scope</span>
              <span className="font-mono text-emerald-500 font-bold">+20 pts</span>
            </div>
            <p className="text-[11px] text-app-text-sec">
              Absence of modern web presence or stated challenge/urgency in visitor inquiry.
            </p>
          </div>
        </div>
      </div>

      {/* Data Export & Backup */}
      <div className="glass p-6 rounded-3xl border border-app-border bg-app-aside-bg/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-app-text">Data Export & Resilience</h3>
              <p className="text-xs text-app-text-sec">
                {leadsCount} total leads securely persisted in local storage.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportJson}
            className="px-4 py-2 rounded-xl bg-app-btn-sec hover:bg-app-btn-sec/80 text-app-text text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Raw JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
}
