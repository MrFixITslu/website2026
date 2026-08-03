import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, Cloud, Monitor, Network, Cpu, BarChart3, ChevronDown, CheckCircle, ArrowRight, Phone,
  ShieldCheck, Lightbulb, Map
} from "lucide-react";

const ASSESSMENT_SCOPE = [
  { num: "1", title: "Infrastructure Review", items: ["Computer Health", "Router Diagnostics", "ISP Speed Verification", "WiFi Signal Mapping"], badgeClasses: "bg-indigo-500/10 text-indigo-400" },
  { num: "2", title: "Security Audit", items: ["Password Practices", "Multi-Factor Status", "Endpoint Security", "Active User Access"], badgeClasses: "bg-rose-500/10 text-rose-400" },
  { num: "3", title: "Data Protection", items: ["Backup Integrity", "Cloud Storage Setup", "M365 Email Audits", "Recovery Testing"], badgeClasses: "bg-sky-500/10 text-sky-400" },
];

const ASSESSMENT_DELIVERABLES = [
  { icon: BarChart3, label: "Current ICT Security Score" },
  { icon: ShieldCheck, label: "Identified Risks & Vulnerabilities" },
  { icon: Lightbulb, label: "Recommended Practical Solutions" },
  { icon: Map, label: "90-Day Priority Action Roadmap" },
];

const SERVICES = [
  {
    id: "managed-it",
    icon: Monitor,
    title: "Managed IT Services",
    tagline: "Reliable IT support that keeps your business running.",
    color: "emerald",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    border: "border-emerald-500/20",
    description: "Reliable IT support that keeps your business running smoothly with proactive maintenance and responsive support.",
    features: [
      "Remote Support",
      "On-site Support",
      "Preventative Maintenance",
      "Network Monitoring",
      "Help Desk",
    ],
    sla: "4-Hour On-Site Response",
  },
  {
    id: "cloud",
    icon: Cloud,
    title: "Cloud Solutions",
    tagline: "Move your business securely into the cloud.",
    color: "sky",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-400",
    border: "border-sky-500/20",
    description: "Secure, redundant cloud environments and productivity suites designed to keep your team connected anywhere.",
    features: [
      "Microsoft 365",
      "Google Workspace",
      "Cloud Backups",
      "Cloud Migration",
      "Disaster Recovery",
    ],
    sla: "RPO < 24h / RTO < 4h",
  },
  {
    id: "software",
    icon: BarChart3,
    title: "Software Development",
    tagline: "Custom applications built around your business.",
    color: "rose",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
    border: "border-rose-500/20",
    description: "Custom applications built around your business workflows and operational goals.",
    features: [
      "Fire Finance Pro",
      "Ticket Management Systems",
      "Inventory Systems",
      "KPI Dashboards",
      "Customer Portals",
      "Business Directories",
    ],
    sla: "Fixed-Price Project Delivery",
  },
  {
    id: "ai-automation",
    icon: Cpu,
    title: "AI & Automation",
    tagline: "Reduce manual work with intelligent solutions.",
    color: "indigo",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-400",
    border: "border-indigo-500/20",
    description: "We build AI-powered solutions that automate repetitive business tasks and elevate team productivity.",
    features: [
      "AI Customer Support",
      "AI Reporting",
      "Workflow Automation",
      "Document Processing",
      "Internal Knowledge Assistants",
    ],
    sla: "Custom AI Implementation",
  },
  {
    id: "networking",
    icon: Network,
    title: "Networking & Infrastructure",
    tagline: "Enterprise-grade networking solutions.",
    color: "violet",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    border: "border-violet-500/20",
    description: "Robust physical and wireless infrastructure designed for reliable performance across your facility.",
    features: [
      "Wi-Fi",
      "Fibre",
      "Switching",
      "Firewalls",
      "VPN",
      "Structured Cabling",
    ],
    sla: "Same-Day Emergency Response",
  },
  {
    id: "cybersecurity",
    icon: Shield,
    title: "Cybersecurity",
    tagline: "Protect your business from emerging threats.",
    color: "amber",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    border: "border-amber-500/20",
    description: "Proactive security audits, endpoint protection, and training to safeguard your corporate data.",
    features: [
      "Security Audits",
      "Vulnerability Assessments",
      "Backup Solutions",
      "Endpoint Protection",
      "Security Awareness Training",
    ],
    sla: "48-Hour Audit Turnaround",
  },
];

export default function ServicesPage({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [openId, setOpenId] = useState<string | null>("managed-it");

  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="pt-10 px-6 lg:px-8 text-center space-y-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[350px] h-[350px] bg-indigo-500/6 rounded-full blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 space-y-4">
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">What We Offer</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-app-text dark:text-white">
            Services
          </h1>
          <p className="max-w-xl mx-auto text-sm text-app-text-sec font-light leading-relaxed">
            Enterprise ICT services, cloud solutions, custom software, AI automation, and cybersecurity designed for Caribbean businesses.
          </p>
        </motion.div>
      </section>

      {/* Accordion Service Cards */}
      <section className="px-6 lg:px-8 space-y-3 max-w-4xl mx-auto w-full">
        {SERVICES.map((s, i) => {
          const Icon = s.icon;
          const isOpen = openId === s.id;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`glass rounded-2xl border overflow-hidden transition-colors duration-300 ${isOpen ? s.border : "border-app-border hover:border-app-text/15"}`}
            >
              <button
                onClick={() => setOpenId(isOpen ? null : s.id)}
                className="w-full flex items-center gap-4 px-6 py-5 cursor-pointer text-left group"
              >
                <div className={`w-11 h-11 rounded-xl shrink-0 ${s.iconBg} border ${s.border} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-app-text dark:text-white group-hover:text-indigo-400 transition font-display">{s.title}</div>
                  <div className="text-[11px] text-app-text-muted font-mono mt-0.5">{s.tagline}</div>
                </div>
                <div className={`shrink-0 ml-2 transition-transform duration-300 ${isOpen ? "rotate-180" : ""} ${s.iconColor}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 space-y-5 border-t border-app-border/50 pt-5">
                      <p className="text-sm text-app-text-sec font-light leading-relaxed">{s.description}</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {s.features.map((f) => (
                          <div key={f} className="flex items-start gap-2.5">
                            <CheckCircle className={`w-4 h-4 ${s.iconColor} shrink-0 mt-0.5`} />
                            <span className="text-xs text-app-text-sec font-light">{f}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-app-border/50">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${s.iconColor} ${s.iconBg} border ${s.border} px-3 py-1 rounded-full`}>
                          SLA: {s.sla}
                        </span>
                        <button
                          onClick={() => onNavigate("contact")}
                          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                        >
                          Get a quote <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </section>

      {/* ── ICT Business Health Assessment ───────────────────────────
           Merged from the internal Launch Pack "Business Assessment (Lead Offer)" tab.
           NOTE: this is a paid entry-point diagnostic ($1,500 XCD one-time), distinct
           from the "free assessment" wording used elsewhere on this page —
           worth reconciling the messaging site-wide. */}
      <section className="px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.04] to-transparent p-6 sm:p-10 space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">Entry Offer</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-app-text dark:text-white tracking-tight max-w-xl">
                Know Your Technology Risks Before They Become Costly Business Blockades
              </h2>
              <p className="text-sm text-app-text-sec font-light max-w-xl leading-relaxed">
                A thorough diagnostic sweep uncovering hidden system bugs, network limits, server performance issues, and password vulnerabilities.
              </p>
            </div>
            <div className="shrink-0 bg-indigo-600 border border-indigo-400 rounded-xl px-5 py-3 text-white text-center">
              <span className="text-[10px] font-mono block text-indigo-200">ICT Business Health Assessment</span>
              <span className="text-2xl font-black font-display tracking-tighter block">EC$1,500</span>
              <span className="text-[9px] font-mono block text-indigo-200">One-Time Fee</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ASSESSMENT_SCOPE.map((s) => (
              <div key={s.title} className="p-4 rounded-xl border border-app-border bg-app-aside-bg/25 space-y-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${s.badgeClasses}`}>{s.num}</div>
                <p className="text-xs font-bold text-app-text dark:text-white">{s.title}</p>
                <ul className="text-[10px] text-app-text-muted space-y-1 leading-normal font-mono">
                  {s.items.map((it) => <li key={it}>• {it}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.02] space-y-3">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block tracking-wider">The Deliverable: Business Intelligence Report</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ASSESSMENT_DELIVERABLES.map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.label} className="flex items-center gap-2 text-xs font-mono text-app-text-sec">
                    <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-app-border/40">
            <button
              onClick={() => onNavigate("contact")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              Book Your Assessment <ArrowRight className="w-4 h-4" />
            </button>
            <a href="tel:+17587260035" className="flex items-center gap-2 text-sm font-semibold text-app-text-sec hover:text-indigo-400 transition">
              <Phone className="w-4 h-4" /> Or call +1 758 726 0035
            </a>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl border border-indigo-500/20 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold font-display text-app-text dark:text-white">Not sure which service you need?</h2>
            <p className="text-sm text-app-text-sec font-light">Request a free ICT assessment. We'll audit your current setup and recommend exactly what fits your budget.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => onNavigate("contact")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-md cursor-pointer"
            >
              Free Assessment <ArrowRight className="w-4 h-4" />
            </button>
            <a href="tel:+17587260035" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-app-aside-bg border border-app-border text-app-text text-sm font-semibold hover:bg-app-aside-bg/80 transition">
              <Phone className="w-4 h-4" /> Call Us
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
