import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, Zap, CloudLightning, Sun, Radio,
  CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, BatteryCharging
} from "lucide-react";

export function StormFailoverSimulator({ onConsultClick }: { onConsultClick?: () => void }) {
  const [isStormMode, setIsStormMode] = useState<boolean>(false);

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border border-app-border bg-app-card overflow-hidden shadow-xl text-left transition-all">
      {/* Header with Mode Switcher */}
      <div className={`p-6 sm:p-8 transition-colors duration-500 border-b border-app-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
        isStormMode
          ? "bg-v79-navy text-white dark:bg-v79-navy-dark"
          : "bg-v79-teal/5 dark:bg-v79-teal/10"
      }`}>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide uppercase border transition-colors duration-300">
            {isStormMode ? (
              <span className="text-v79-coral flex items-center gap-1.5 border-v79-coral/30 bg-v79-coral/10 px-2 py-0.5 rounded-full">
                <CloudLightning className="w-3.5 h-3.5 animate-bounce" />
                SIMULATION: TROPICAL STORM / GRID OUTAGE ACTIVE
              </span>
            ) : (
              <span className="text-v79-teal flex items-center gap-1.5 border-v79-teal/30 bg-v79-teal/10 px-2 py-0.5 rounded-full">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                NORMAL CARIBBEAN BUSINESS OPERATION
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight">
            Interactive Continuity: Storm &amp; Power Surge Simulator
          </h3>
          <p className="text-xs sm:text-sm text-app-text-sec dark:text-white/70 font-light max-w-xl">
            See how Vision79's hybrid architecture protects Caribbean hotels, clinics, and offices when local power drops and severe weather hits.
          </p>
        </div>

        {/* Toggle Controls */}
        <div className="flex items-center gap-3 bg-app-bg p-1.5 rounded-2xl border border-app-border shrink-0 shadow-inner">
          <button
            onClick={() => setIsStormMode(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-display transition-all flex items-center gap-2 cursor-pointer ${
              !isStormMode
                ? "bg-v79-teal text-white shadow-md"
                : "text-app-text-sec hover:text-app-text"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Normal Day
          </button>
          <button
            onClick={() => setIsStormMode(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-display transition-all flex items-center gap-2 cursor-pointer ${
              isStormMode
                ? "bg-v79-coral text-white shadow-md animate-pulse"
                : "text-app-text-sec hover:text-v79-coral"
            }`}
          >
            <CloudLightning className="w-3.5 h-3.5" />
            Test Storm Outage
          </button>
        </div>
      </div>

      {/* Grid of 3 Core Resilience Pillars */}
      <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pillar 1: Electrical Power & Voltage */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 space-y-3 ${
          isStormMode
            ? "border-v79-coral/40 bg-v79-coral/5 dark:bg-v79-coral/10"
            : "border-app-border bg-app-bg/50"
        }`}>
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isStormMode ? "bg-v79-coral text-white" : "bg-v79-teal/15 text-v79-teal"
            }`}>
              <BatteryCharging className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
              isStormMode ? "bg-v79-coral/20 text-v79-coral" : "bg-emerald-500/10 text-emerald-600"
            }`}>
              {isStormMode ? "UPS Battery Engaged" : "Commercial Grid"}
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-sm text-app-text dark:text-white font-display">
              1. Surge &amp; Power Continuity
            </h4>
            <p className="text-xs text-app-text-sec font-light leading-relaxed">
              {isStormMode
                ? "Grid voltage drops to 0V. True online double-conversion UPS instantly regulates voltage with zero millisecond transfer delay, preventing server motherboards from burning."
                : "Continuous line conditioning regulates fluctuating island voltage (spikes/sags) to safeguard sensitive servers and network switches."}
            </p>
          </div>

          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {isStormMode ? "Zero downtime transfer: 0ms" : "Conditioned power input: 230V ±1%"}
          </div>
        </div>

        {/* Pillar 2: Dual-WAN Internet Redundancy */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 space-y-3 ${
          isStormMode
            ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10"
            : "border-app-border bg-app-bg/50"
        }`}>
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isStormMode ? "bg-amber-500 text-white" : "bg-v79-teal/15 text-v79-teal"
            }`}>
              <Radio className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
              isStormMode ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600"
            }`}>
              {isStormMode ? "Satellite WAN Engaged" : "Fiber Primary"}
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-sm text-app-text dark:text-white font-display">
              2. Redundant Dual-WAN Routing
            </h4>
            <p className="text-xs text-app-text-sec font-light leading-relaxed">
              {isStormMode
                ? "Subsea fiber line disruption detected. Firewall automatically routes credit card POS machines and front-desk reservations through secondary satellite/microwave links."
                : "High-speed enterprise fiber routes all team collaboration, VoIP phones, and customer transactions."}
            </p>
          </div>

          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {isStormMode ? "Credit card POS transactions remain online" : "99.9% uptime SLA active"}
          </div>
        </div>

        {/* Pillar 3: Air-Gapped Immutable Backups */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 space-y-3 ${
          isStormMode
            ? "border-v79-teal/40 bg-v79-teal/5 dark:bg-v79-teal/10"
            : "border-app-border bg-app-bg/50"
        }`}>
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isStormMode ? "bg-v79-teal text-white" : "bg-v79-teal/15 text-v79-teal"
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
              isStormMode ? "bg-v79-teal/20 text-v79-teal" : "bg-emerald-500/10 text-emerald-600"
            }`}>
              {isStormMode ? "Air-Gap Vault Locked" : "Cloud Sync Active"}
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-sm text-app-text dark:text-white font-display">
              3. Disaster Recovery &amp; RTO
            </h4>
            <p className="text-xs text-app-text-sec font-light leading-relaxed">
              {isStormMode
                ? "Immutable cloud snapshots ensure company financial data and patient records cannot be deleted or corrupted during sudden hardware crashes or ransomware."
                : "Automated daily and hourly encrypted delta snapshots sync across off-island secure data centers."}
            </p>
          </div>

          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {isStormMode ? "Recovery Point Objective (RPO): <1 hr" : "Data sovereignty compliant"}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 bg-app-bg/60 border-t border-app-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-app-text-sec">
          <Shield className="w-4 h-4 text-v79-teal shrink-0" />
          <span>Need a customized storm recovery plan for your property or business?</span>
        </div>
        {onConsultClick && (
          <button
            onClick={onConsultClick}
            className="font-bold text-v79-teal hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            Review Your Disaster Preparedness
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
