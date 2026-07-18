import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, Cloud, Monitor, Network, Cpu, BarChart3, ChevronDown, CheckCircle, ArrowRight, Phone
} from "lucide-react";

const SERVICES = [
  {
    id: "managed-it",
    icon: Monitor,
    title: "Managed IT Support",
    tagline: "Proactive monitoring, rapid response, guaranteed SLAs",
    color: "emerald",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    border: "border-emerald-500/20",
    description:
      "Our Managed IT Support service provides continuous monitoring of your entire IT environment — servers, workstations, networking equipment, and cloud services — so problems are identified and resolved before they impact your operations.",
    features: [
      "24/7 remote monitoring and alerting",
      "4-hour on-site response SLA across Saint Lucia",
      "Remote desktop support & helpdesk ticketing",
      "Patch management and update scheduling",
      "Hardware lifecycle management and vendor coordination",
      "Monthly system health and performance reports",
    ],
    sla: "4-Hour On-Site Response",
  },
  {
    id: "cybersecurity",
    icon: Shield,
    title: "Cybersecurity & Threat Defense",
    tagline: "Protect assets, audit vulnerabilities, enforce compliance",
    color: "indigo",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-400",
    border: "border-indigo-500/20",
    description:
      "Caribbean businesses are increasingly targeted by ransomware, phishing, and social engineering attacks. Our cybersecurity practice delivers end-to-end threat defense — from perimeter hardening to real-time endpoint detection and response.",
    features: [
      "Comprehensive network vulnerability assessments",
      "Endpoint Detection & Response (EDR) deployment",
      "Firewall configuration and hardening",
      "Phishing simulation and staff awareness training",
      "Dark web credential monitoring",
      "Incident response planning and tabletop exercises",
    ],
    sla: "48-Hour Audit Turnaround",
  },
  {
    id: "cloud",
    icon: Cloud,
    title: "Cloud Infrastructure & Backup",
    tagline: "Redundant backups, disaster recovery, cloud migration",
    color: "sky",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-400",
    border: "border-sky-500/20",
    description:
      "With the Caribbean's unique risk profile — hurricanes, power surges, limited ISP redundancy — robust cloud infrastructure is not optional. We design and operate bulletproof backup architectures using industry-leading cloud platforms.",
    features: [
      "Automated daily cloud backup with verification",
      "3-2-1 backup strategy implementation",
      "Hot-site disaster recovery within hours, not days",
      "Cloud migration planning and execution",
      "Azure / AWS / Google Cloud management",
      "Backup restoration testing and documentation",
    ],
    sla: "RPO < 24h / RTO < 4h",
  },
  {
    id: "networking",
    icon: Network,
    title: "Network Architecture & VoIP",
    tagline: "Enterprise LAN/WAN design, hosted phone systems",
    color: "violet",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    border: "border-violet-500/20",
    description:
      "A poorly designed network is the root cause of most business IT problems. We design and implement enterprise-grade LAN/WAN infrastructure with proper segmentation, QoS, and failover so your team stays productive.",
    features: [
      "Enterprise wired and wireless network design",
      "Cisco, Mikrotik, Ubiquiti, and Fortinet deployment",
      "VLAN segmentation for guest, staff, and secure zones",
      "Hosted VoIP and SIP trunk configuration",
      "ISP failover with LTE/Satellite backup",
      "Network documentation and change management",
    ],
    sla: "Same-Day Emergency Response",
  },
  {
    id: "microsoft365",
    icon: Cpu,
    title: "Microsoft 365 & Productivity",
    tagline: "Licensing, migration, training, ongoing management",
    color: "amber",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    border: "border-amber-500/20",
    description:
      "Microsoft 365 is the gold standard for modern business productivity and communication. We handle everything from license procurement to full mailbox migration and ongoing tenant management.",
    features: [
      "Microsoft 365 licensing and CSP procurement",
      "Email and calendar migration from legacy systems",
      "SharePoint and Teams deployment and configuration",
      "Active Directory and Azure AD integration",
      "Multi-Factor Authentication and Conditional Access setup",
      "Staff onboarding and ongoing M365 training",
    ],
    sla: "Migration in 5 Business Days",
  },
  {
    id: "software",
    icon: BarChart3,
    title: "Custom Software & SaaS Development",
    tagline: "Bespoke web applications, databases, desktop software",
    color: "rose",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
    border: "border-rose-500/20",
    description:
      "Off-the-shelf software rarely fits Caribbean business workflows perfectly. Our development team builds purpose-built web applications, databases, and desktop tools engineered to match your exact operational requirements.",
    features: [
      "Custom web application development (React / Next.js)",
      "Database design and implementation (SQL / SQLite)",
      "Desktop application development (Electron / Windows)",
      "API integrations with payment gateways and ERPs",
      "Business automation and workflow digitization",
      "Ongoing SaaS platform maintenance and hosting",
    ],
    sla: "Fixed-Price Project Delivery",
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
        <div className="relative z-10 space-y-4">
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">What We Offer</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-app-text dark:text-white">
            Enterprise ICT Services
          </h1>
          <p className="max-w-xl mx-auto text-sm text-app-text-sec font-light leading-relaxed">
            From day-to-day helpdesk to transformational cloud migrations — a complete range of managed services for Caribbean businesses.
          </p>
        </div>
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

      {/* CTA */}
      <section className="px-6 lg:px-8">
        <div className="glass rounded-2xl border border-indigo-500/20 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
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
        </div>
      </section>
    </div>
  );
}
