import { Users, TrendingUp, DollarSign, Clock, CheckCircle2, PhoneCall, ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { CRMMetrics, CRMLead, CRMTask } from "../../crm/types";

interface CrmMetricsDashboardProps {
  metrics: CRMMetrics | null;
  leads: CRMLead[];
  tasks: CRMTask[];
  onSelectLead: (lead: CRMLead) => void;
  onGoToPipeline: () => void;
  onGoToCockpit: () => void;
}

export function CrmMetricsDashboard({
  metrics,
  leads,
  tasks,
  onSelectLead,
  onGoToPipeline,
  onGoToCockpit
}: CrmMetricsDashboardProps) {
  if (!metrics) {
    return (
      <div className="p-12 text-center text-sm text-app-text-muted">
        Loading CRM intelligence and metrics...
      </div>
    );
  }

  // Filter pending/due tasks and followups
  const overdueTasks = tasks.filter(t => t.status === "pending" && new Date(t.dueAt) <= new Date());
  const hotLeads = leads.filter(l => l.scoreCategory === "Hot" && l.status === "Active" && l.stage !== "Won");

  return (
    <div className="space-y-8 animate-fade-in-once">
      {/* Top Level Metric KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="glass p-4 rounded-2xl border border-app-border bg-app-aside-bg/40 space-y-1">
          <div className="flex items-center justify-between text-app-text-sec">
            <span className="text-[11px] font-mono uppercase tracking-wider">Total Pipeline</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-app-text">{metrics.totalLeads}</div>
          <div className="text-[11px] text-app-text-muted">
            <span className="text-sky-500 font-semibold">{metrics.newLeads} new</span> awaiting intake
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-app-border bg-app-aside-bg/40 space-y-1">
          <div className="flex items-center justify-between text-app-text-sec">
            <span className="text-[11px] font-mono uppercase tracking-wider">Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-500">
            ${metrics.pipelineValue.toLocaleString()} <span className="text-xs font-normal text-app-text-sec">XCD</span>
          </div>
          <div className="text-[11px] text-app-text-muted">Active opportunity potential</div>
        </div>

        <div className="glass p-4 rounded-2xl border border-app-border bg-app-aside-bg/40 space-y-1">
          <div className="flex items-center justify-between text-app-text-sec">
            <span className="text-[11px] font-mono uppercase tracking-wider">Won Clients</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-app-text">{metrics.wonCustomers}</div>
          <div className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{metrics.conversionRate}% conversion rate</span>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-app-border bg-app-aside-bg/40 space-y-1">
          <div className="flex items-center justify-between text-app-text-sec">
            <span className="text-[11px] font-mono uppercase tracking-wider">Follow-Ups Due</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-bold font-mono ${metrics.followUpsDue > 0 ? "text-amber-500" : "text-app-text"}`}>
            {metrics.followUpsDue}
          </div>
          <div className="text-[11px] text-app-text-muted">Urgent calls & action items</div>
        </div>

        <div className="glass p-4 rounded-2xl border border-app-border bg-app-aside-bg/40 space-y-1">
          <div className="flex items-center justify-between text-app-text-sec">
            <span className="text-[11px] font-mono uppercase tracking-wider">Proposals Out</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-app-text">{metrics.proposalsSent}</div>
          <div className="text-[11px] text-app-text-muted">In review or negotiation</div>
        </div>
      </div>

      {/* Urgent Action Hub */}
      {(overdueTasks.length > 0 || hotLeads.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue / Due Today Reminders */}
          <div className="glass rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                <Clock className="w-4 h-4" />
                <span>Urgent Action Items & Follow-ups ({overdueTasks.length})</span>
              </div>
              <button
                onClick={onGoToCockpit}
                className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
              >
                Open Dial Cockpit →
              </button>
            </div>
            <div className="space-y-2">
              {overdueTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="bg-app-bg/80 p-3 rounded-xl border border-app-border flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-app-text">{task.title}</div>
                    <div className="text-[11px] text-app-text-sec">
                      {task.companyName || task.leadName} • Due: {new Date(task.dueAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-semibold">
                    {task.priority} Priority
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* High Value "Hot" Leads Ready for Closing */}
          <div className="glass rounded-2xl p-5 border border-sky-500/20 bg-sky-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-500 font-semibold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>AI Scored "Hot" Opportunities ({hotLeads.length})</span>
              </div>
              <button
                onClick={onGoToPipeline}
                className="text-xs text-sky-500 font-semibold hover:underline cursor-pointer"
              >
                View Pipeline →
              </button>
            </div>
            <div className="space-y-2">
              {hotLeads.slice(0, 3).map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="bg-app-bg/80 p-3 rounded-xl border border-app-border flex items-center justify-between text-xs cursor-pointer hover:border-sky-500/40 transition"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-app-text flex items-center gap-1.5">
                      <span>{lead.company}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-500 font-mono font-bold">
                        Score {lead.leadScore}
                      </span>
                    </div>
                    <div className="text-[11px] text-app-text-sec">
                      {lead.location} • {lead.serviceRequested}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-500">
                      ${(lead.estimatedValue || 0).toLocaleString()} XCD
                    </div>
                    <div className="text-[10px] text-app-text-muted">{lead.stage}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline & Revenue Trends Chart */}
        <div className="glass rounded-2xl p-6 border border-app-border bg-app-aside-bg/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-app-text font-display">Monthly Pipeline Volume & Won Revenue</h3>
              <p className="text-xs text-app-text-sec">Lead flow and won deal counts across the last 6 months.</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "currentColor" }} />
                <YAxis tick={{ fontSize: 11, fill: "currentColor" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-app-bg, #0f172a)",
                    border: "1px solid var(--color-app-border, #334155)",
                    borderRadius: "12px",
                    fontSize: "12px"
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="leads" name="Total Inquiries" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="won" name="Deals Won" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Source Performance */}
        <div className="glass rounded-2xl p-6 border border-app-border bg-app-aside-bg/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-app-text font-display">Lead Sources & Channel Efficiency</h3>
              <p className="text-xs text-app-text-sec">Lead intake channels by volume and conversion rate.</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.sourcePerformance} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "currentColor" }} />
                <YAxis dataKey="source" type="category" tick={{ fontSize: 10, fill: "currentColor" }} width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-app-bg, #0f172a)",
                    border: "1px solid var(--color-app-border, #334155)",
                    borderRadius: "12px",
                    fontSize: "12px"
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="count" name="Leads Captured" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="conversionRate" name="Conv Rate %" fill="#00e5ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution Across Saint Lucia */}
        <div className="glass rounded-2xl p-6 border border-app-border bg-app-aside-bg/40 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-500" />
              <div>
                <h3 className="text-sm font-bold text-app-text font-display">Saint Lucia District Market Density</h3>
                <p className="text-xs text-app-text-sec">Active lead volume distributed by commercial districts.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {metrics.locationDistribution.map((loc) => (
              <div
                key={loc.location}
                className="bg-app-btn-sec/30 p-3 rounded-xl border border-app-border text-center space-y-1"
              >
                <span className="text-[11px] font-medium text-app-text-sec block truncate">{loc.location}</span>
                <span className="text-lg font-bold font-mono text-app-text block">{loc.count}</span>
                <span className="text-[9px] text-app-text-muted font-mono uppercase">Opportunities</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
