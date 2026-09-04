import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Calculator, TrendingDown, DollarSign, Clock,
  ArrowRight, ShieldCheck, AlertTriangle
} from "lucide-react";

export function DowntimeRiskCalculator({ onConsultClick }: { onConsultClick?: () => void }) {
  const [employees, setEmployees] = useState<number>(15);
  const [hourlyWage, setHourlyWage] = useState<number>(35); // EC$
  const [hourlyRevenue, setHourlyRevenue] = useState<number>(650); // EC$
  const [unmanagedHours, setUnmanagedHours] = useState<number>(8); // Hours typical break-fix IT takes

  // Math
  const idlePayrollCost = employees * hourlyWage * unmanagedHours;
  const lostRevenueCost = hourlyRevenue * unmanagedHours;
  const totalUnmanagedCost = idlePayrollCost + lostRevenueCost;

  // With Vision79 4-Hour SLA (capped at 4 hours max, usually resolved in under 2 hrs via proactive monitoring)
  const v79CappedHours = Math.min(unmanagedHours, 4);
  const v79Cost = (employees * hourlyWage * v79CappedHours) + (hourlyRevenue * v79CappedHours);
  const estimatedSavings = Math.max(0, totalUnmanagedCost - v79Cost);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-app-border bg-app-card overflow-hidden shadow-2xl text-left">
      {/* Header */}
      <div className="p-6 sm:p-8 bg-v79-navy dark:bg-v79-navy-dark text-white border-b border-white/10 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide uppercase bg-v79-coral/20 text-v79-coral-light border border-v79-coral/30">
          <Calculator className="w-3.5 h-3.5" />
          Caribbean Business Risk Modeling (EC$)
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight">
          What Does 1 Hour of IT Downtime Cost Your Company?
        </h3>
        <p className="text-xs sm:text-sm text-white/70 font-light max-w-xl">
          Calculate the hidden financial drain of idle staff payroll, lost POS checkout transactions, and broken customer communications during an unmanaged outage.
        </p>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sliders (Left Column) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Slider 1: Team Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-app-text-sec font-bold">Number of Employees Affected:</span>
              <span className="text-app-text dark:text-white font-extrabold px-2 py-0.5 rounded bg-app-bg border border-app-border">
                {employees} staff
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={100}
              step={1}
              value={employees}
              onChange={(e) => setEmployees(parseInt(e.target.value, 10))}
              className="w-full accent-v79-teal h-2 bg-app-border rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-app-text-muted">
              <span>3 (Small Office)</span>
              <span>50 (Mid-Sized)</span>
              <span>100+ (Resort / Enterprise)</span>
            </div>
          </div>

          {/* Slider 2: Average Hourly Wage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-app-text-sec font-bold">Average Hourly Pay per Employee:</span>
              <span className="text-app-text dark:text-white font-extrabold px-2 py-0.5 rounded bg-app-bg border border-app-border">
                EC${hourlyWage} / hr
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={150}
              step={5}
              value={hourlyWage}
              onChange={(e) => setHourlyWage(parseInt(e.target.value, 10))}
              className="w-full accent-v79-teal h-2 bg-app-border rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-app-text-muted">
              <span>EC$15/hr</span>
              <span>EC$60/hr</span>
              <span>EC$150/hr</span>
            </div>
          </div>

          {/* Slider 3: Estimated Hourly Revenue Lost */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-app-text-sec font-bold">Estimated Hourly Revenue at Risk:</span>
              <span className="text-app-text dark:text-white font-extrabold px-2 py-0.5 rounded bg-app-bg border border-app-border">
                EC${hourlyRevenue.toLocaleString()} / hr
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={4000}
              step={50}
              value={hourlyRevenue}
              onChange={(e) => setHourlyRevenue(parseInt(e.target.value, 10))}
              className="w-full accent-v79-teal h-2 bg-app-border rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-app-text-muted">
              <span>EC$0 (Internal Only)</span>
              <span>EC$1,500/hr</span>
              <span>EC$4,000/hr (Busy POS / Clinic)</span>
            </div>
          </div>

          {/* Slider 4: Unmanaged Outage Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-app-text-sec font-bold">Outage Duration Without SLA:</span>
              <span className="text-rose-600 dark:text-rose-400 font-extrabold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                {unmanagedHours} hours offline
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={24}
              step={1}
              value={unmanagedHours}
              onChange={(e) => setUnmanagedHours(parseInt(e.target.value, 10))}
              className="w-full accent-v79-coral h-2 bg-app-border rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-app-text-muted">
              <span>2 hrs (Partial drop)</span>
              <span>8 hrs (Full business day)</span>
              <span>24 hrs (Catastrophic)</span>
            </div>
          </div>
        </div>

        {/* Results Card (Right Column) */}
        <div className="lg:col-span-5 rounded-2xl bg-app-bg p-6 border border-app-border flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-v79-coral font-extrabold block">
              Estimated Financial Damage
            </span>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tracking-tight">
                EC${totalUnmanagedCost.toLocaleString()}
              </div>
              <p className="text-[11px] text-app-text-muted font-mono">
                Total exposure across {unmanagedHours} unmanaged outage hours
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-app-border text-xs">
              <div className="flex justify-between text-app-text-sec">
                <span>Idle Payroll Paid (No Output):</span>
                <span className="font-mono font-bold text-app-text dark:text-white">
                  EC${idlePayrollCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-app-text-sec">
                <span>Missed Customer Sales / Billing:</span>
                <span className="font-mono font-bold text-app-text dark:text-white">
                  EC${lostRevenueCost.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Savings with Vision79 */}
            {estimatedSavings > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  Saved With Vision79 4-Hour SLA
                </div>
                <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  + EC${estimatedSavings.toLocaleString()} protected
                </div>
                <p className="text-[10px] text-emerald-600/90 dark:text-emerald-300/80 leading-snug">
                  By capping downtime to our guaranteed 4-hour SLA or resolving it instantly via proactive alerts, you prevent multi-day operational gridlock.
                </p>
              </div>
            )}
          </div>

          {onConsultClick && (
            <button
              onClick={onConsultClick}
              className="w-full py-3 px-4 rounded-xl bg-v79-teal hover:bg-v79-teal-dark text-white text-xs font-bold font-display flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
            >
              Protect My Business from Costly Downtime
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
