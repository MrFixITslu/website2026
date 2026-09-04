import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity, ShieldCheck, Server, Wifi, HardDrive,
  RefreshCw, CheckCircle2, Clock, AlertCircle, ArrowRight
} from "lucide-react";

interface NodeStatus {
  id: string;
  name: string;
  location: string;
  ping: number;
  status: "nominal" | "verifying" | "standby";
  type: string;
  detail: string;
}

const INITIAL_NODES: NodeStatus[] = [
  {
    id: "node-1",
    name: "Castries Financial & Gov Hub",
    location: "Castries, Saint Lucia",
    ping: 11,
    status: "nominal",
    type: "Enterprise Fiber Ring",
    detail: "Dual-WAN active, zero packet loss"
  },
  {
    id: "node-2",
    name: "Rodney Bay Marina & Resorts",
    location: "Gros Islet, Saint Lucia",
    ping: 14,
    status: "nominal",
    type: "Hospitality & POS Gateway",
    detail: "PCI-DSS compliant, guest isolation OK"
  },
  {
    id: "node-3",
    name: "Vieux Fort Commercial Gateway",
    location: "Vieux Fort, Saint Lucia",
    ping: 16,
    status: "nominal",
    type: "Logistics & Industrial WAN",
    detail: "Redundant microwave link standby"
  },
  {
    id: "node-4",
    name: "Air-Gapped Cloud Vault",
    location: "Multi-Zone Geo-Redundant",
    ping: 28,
    status: "nominal",
    type: "Immutable Disaster Backup",
    detail: "Last snapshot: 12 min ago (Verified)"
  }
];

export function LiveNocTerminal({ onConsultClick }: { onConsultClick?: () => void }) {
  const [nodes, setNodes] = useState<NodeStatus[]>(INITIAL_NODES);
  const [selectedNode, setSelectedNode] = useState<NodeStatus>(INITIAL_NODES[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>("Just now");
  const [livePings, setLivePings] = useState<number[]>([12, 11, 14, 12, 10, 13, 11, 12]);

  // Subtle live ping heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePings(prev => {
        const nextPing = Math.floor(10 + Math.random() * 5);
        return [...prev.slice(1), nextPing];
      });
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const handleRunDiagnostics = () => {
    if (isScanning) return;
    setIsScanning(true);

    setTimeout(() => {
      setNodes(prev =>
        prev.map(n => ({
          ...n,
          ping: Math.floor(10 + Math.random() * 6),
          status: "nominal"
        }))
      );
      setLastCheck("Verified 0s ago");
      setIsScanning(false);
    }, 1200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-app-border bg-app-card/95 backdrop-blur-md shadow-2xl overflow-hidden text-left transition-all">
      {/* Terminal Bar */}
      <div className="px-4 py-3 bg-v79-navy dark:bg-v79-navy-dark border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] font-mono tracking-wider uppercase font-bold text-v79-teal-light flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-v79-teal-light animate-pulse" />
            V79 NOC Telemetry // Caribbean Network Operations
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE 24/7 MONITORING ACTIVE
          </span>
          <button
            onClick={handleRunDiagnostics}
            disabled={isScanning}
            className="text-[10px] font-mono text-white/70 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/15 transition cursor-pointer disabled:opacity-50"
            title="Re-verify live Caribbean network connectivity"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? "animate-spin text-v79-teal-light" : ""}`} />
            {isScanning ? "Probing Nodes..." : "Probe Nodes"}
          </button>
        </div>
      </div>

      {/* Main Terminal Body */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Interactive Regional Nodes */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-app-text-muted pb-1">
            <span>REGIONAL COVERAGE POINTS</span>
            <span>LATENCY</span>
          </div>

          <div className="space-y-2">
            {nodes.map(node => {
              const isSelected = selectedNode.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "border-v79-teal bg-v79-teal/10 shadow-sm"
                      : "border-app-border hover:border-app-border/80 hover:bg-app-card-hover"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-v79-teal text-white"
                        : "bg-v79-teal/10 text-v79-teal"
                    }`}>
                      {node.id === "node-4" ? (
                        <HardDrive className="w-4 h-4" />
                      ) : (
                        <Server className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-app-text dark:text-white truncate flex items-center gap-1.5">
                        {node.name}
                        {isSelected && (
                          <span className="text-[9px] font-mono font-normal text-v79-teal bg-v79-teal/15 px-1.5 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-app-text-sec font-mono truncate">
                        {node.location} • {node.type}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {node.ping}ms
                    </div>
                    <div className="text-[9px] font-mono text-app-text-muted">
                      Packet Loss: 0.0%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Focused Node Inspector & SLA Guarantee */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl p-4 bg-app-bg/80 border border-app-border space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-v79-teal font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Node Inspection
              </span>
              <span className="text-[10px] font-mono text-app-text-muted">
                {lastCheck}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-app-text dark:text-white font-display">
                {selectedNode.name}
              </h4>
              <p className="text-xs text-app-text-sec font-light mt-0.5">
                {selectedNode.detail}
              </p>
            </div>

            {/* Sparkline simulation */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-app-text-muted">
                <span>Real-Time Latency Stream</span>
                <span className="text-emerald-500 font-bold">Stable (Avg 12ms)</span>
              </div>
              <div className="h-8 flex items-end gap-1.5 bg-black/5 dark:bg-white/5 p-1.5 rounded-lg border border-app-border/40">
                {livePings.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-v79-teal/70 hover:bg-v79-teal rounded-sm transition-all"
                    style={{ height: `${Math.min(100, (p / 25) * 100)}%` }}
                    title={`${p}ms`}
                  />
                ))}
              </div>
            </div>

            {/* Guaranteed SLA Rail */}
            <div className="rounded-lg p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                Guaranteed 4-Hour On-Site SLA
              </div>
              <p className="text-[11px] text-emerald-600/90 dark:text-emerald-300/80 leading-tight">
                Physical emergency technician on-site in Castries, Gros Islet, or Vieux Fort within 240 mins.
              </p>
            </div>
          </div>

          {/* Quick CTA */}
          {onConsultClick && (
            <button
              onClick={onConsultClick}
              className="w-full py-2.5 px-3 rounded-xl bg-v79-teal hover:bg-v79-teal-dark text-white text-xs font-semibold font-display flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
            >
              Protect My Business Infrastructure
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
