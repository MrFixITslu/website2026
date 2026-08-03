import { useState } from "react";
import { motion } from "motion/react";
import { Linkedin, Mail, ArrowRight, Users, Award, CheckCircle2, AlertTriangle, Zap } from "lucide-react";

const TEAM = [
  {
    name: "Neil Verdant",
    role: "Founder & Lead Systems Architect",
    bio: "Over 25 years of enterprise ICT experience across telecommunications, fibre networks, and cloud infrastructure.",
    linkedin: "https://linkedin.com",
    email: "vision79slu@gmail.com",
    initials: "NV",
    color: "from-indigo-500 to-violet-600",
  },
  {
    name: "Open Position",
    role: "Senior Network Engineer",
    bio: "We're growing our team. If you have hands-on experience with enterprise networking and fibre, we want to hear from you.",
    linkedin: null,
    email: "vision79slu@gmail.com",
    isOpen: true,
    initials: "?",
    color: "from-emerald-500 to-teal-600",
  },
  {
    name: "Open Position",
    role: "IT Solutions Consultant",
    bio: "Join our growing team. Help Caribbean businesses identify their ICT challenges and present tailored solutions.",
    linkedin: null,
    email: "vision79slu@gmail.com",
    isOpen: true,
    initials: "?",
    color: "from-amber-500 to-orange-600",
  },
];

// NOTE: "Why Choose Us" was merged into the "Why Choose Vision79 Digital"
// section on the Home page (see HomePage.tsx), which now uses this section's
// timeline list style.

const CHALLENGES = [
  { title: "Internal Limits", desc: "Severely limited internal IT expertise, leaving critical networks unmanaged." },
  { title: "Cyber Threats", desc: "Increasing ransomware, phishing, and local credential compromise vectors." },
  { title: "Infrastructure", desc: "Unmanaged networks, poor Wi-Fi cover, and frequent hardware dropouts." },
  { title: "Poor Backups", desc: "Unverified back-up configurations, aging equipment, and lack of recovery testing." },
];

const IMPACT_AREAS = ["Customer Service", "Financial Revenue", "Employee Productivity", "Business Reputation"];

const CARIBBEAN_BUILT = [
  "Hurricane Recovery Ready",
  "Proactive, Not Break-Fix",
  "Telecommunications Heritage",
];

const SERVICE_PROMISE = [
  { title: "Professional Comms", desc: "Clear, prompt updates.", detail: "Every email, phone call, or dispatch is logged in our ticketing portal and explained in straightforward, jargon-free English." },
  { title: "Clear Expectations", desc: "Guaranteed responsibilities.", detail: "We establish precise operational frameworks, ensuring you always know exactly who handles password resets, router reboots, or hardware upgrades." },
  { title: "Transparent Reporting", desc: "Comprehensive audits.", detail: "On the first Monday of every month, retainers receive automated reports auditing ticket resolution speed, system utilization, server health, and backup verification logs." },
  { title: "Security-First", desc: "Zero compromised shortcuts.", detail: "Every change we configure adheres to the principle of least-privilege, utilizing strong MFA, segregated WiFi access controls, and localized database firewalls." },
  { title: "Business-Focused", desc: "ROI-based choices.", detail: "We prioritize practical, cost-effective recommendations that improve your bottom line rather than upselling unnecessary technology." },
];



export default function AboutPage() {
  const [showPromiseDetail, setShowPromiseDetail] = useState(false);

  return (
    <div className="space-y-20 pb-16">
      {/* ── Mission Hero / Our Story ──────────────────────────────── */}
      <section className="relative px-6 lg:px-8 pt-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-[400px] h-[400px] bg-indigo-500/6 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">About Vision79</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-app-text dark:text-white leading-tight"
          >
            Our Story
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base text-app-text-sec font-light leading-relaxed space-y-4 text-left glass p-8 rounded-2xl border border-app-border"
          >
            <p>
              Vision79 Digital was founded with one goal—to bring world-class technology solutions to the Caribbean.
            </p>
            <p>
              With more than 25 years of experience delivering telecommunications, enterprise ICT services, fibre networks, cloud infrastructure, and software solutions, Vision79 Digital combines technical expertise with practical business knowledge.
            </p>
            <p>
              From helping businesses modernize their operations to building custom applications that solve real problems, we focus on creating technology that delivers measurable results.
            </p>
            <p>
              Today Vision79 Digital is growing into a technology group that develops innovative digital products while providing professional ICT consulting and managed services throughout the Caribbean.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Mission & Vision ──────────────────────────────────────── */}
      <section className="px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent space-y-4"
          >
            <div className="text-xs font-mono font-extrabold uppercase tracking-widest text-indigo-400">Mission</div>
            <h2 className="text-xl font-extrabold font-display text-app-text dark:text-white">Empowering Caribbean Businesses</h2>
            <p className="text-sm text-app-text-sec font-light leading-relaxed">
              To empower Caribbean businesses through innovative technology, automation, and digital transformation.
            </p>
            <div className="pt-3 border-t border-indigo-500/15 space-y-2.5">
              <p className="text-xs font-semibold text-indigo-400 italic">"Keep businesses connected, secure, and productive."</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-app-btn-sec border border-app-border text-app-text-sec">✓ Resiliency</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-app-btn-sec border border-app-border text-app-text-sec">✓ Affordable Enterprise Class</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-app-btn-sec border border-app-border text-app-text-sec">✓ Proactive Sovereignty</span>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent space-y-4"
          >
            <div className="text-xs font-mono font-extrabold uppercase tracking-widest text-emerald-400">Vision</div>
            <h2 className="text-xl font-extrabold font-display text-app-text dark:text-white">Trusted Technology Innovation</h2>
            <p className="text-sm text-app-text-sec font-light leading-relaxed">
              To become the Caribbean's most trusted technology innovation company by creating software and ICT solutions that improve how people live and work.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── The Challenge We Solve ────────────────────────────────── */}
      <section className="px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-2"
        >
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">Why It Matters</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-app-text dark:text-white tracking-tight">The Challenge Facing Caribbean Organizations</h2>
          <p className="max-w-2xl mx-auto text-sm text-app-text-sec font-light leading-relaxed">
            Technology is critical to modern enterprise survival. Yet most Caribbean organizations are hamstrung by the same severe vulnerabilities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CHALLENGES.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5 border border-rose-500/15 bg-rose-500/[0.02] space-y-1.5"
            >
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <p className="text-xs font-bold font-mono uppercase tracking-wide">{c.title}</p>
              </div>
              <p className="text-[11px] text-app-text-muted leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="p-4 rounded-xl bg-rose-500/[0.03] border border-rose-500/15 space-y-2.5"
        >
          <p className="text-[10px] font-mono uppercase text-rose-400 font-bold">A Single Failure in Your Technology Stack Impacts:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-semibold text-app-text-sec">
            {IMPACT_AREAS.map((area) => (
              <span key={area} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" /> {area}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div className="space-y-1 flex-1">
            <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block font-bold">Built for the Caribbean</span>
            <p className="text-xs text-app-text-sec leading-relaxed">
              We design with island realities in mind: local internet bottlenecks, hurricane preparedness, and Saint Lucian regulatory conditions.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 font-mono text-[11px] text-app-text-sec shrink-0">
            {CARIBBEAN_BUILT.map((item) => (
              <p key={item} className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {item}
              </p>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-8 space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">The Team</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-app-text dark:text-white tracking-tight">The People Behind Vision79</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TEAM.map((member, i) => (
            <motion.div
              key={member.name + i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`glass rounded-2xl p-6 border border-app-border space-y-4 ${member.isOpen ? "border-dashed" : ""} hover:border-indigo-500/30 transition-colors`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-extrabold text-xl font-display shadow-lg`}>
                  {member.initials}
                </div>
                <div>
                  <div className="font-bold text-sm text-app-text dark:text-white">{member.name}</div>
                  <div className="text-[11px] text-indigo-400 font-mono">{member.role}</div>
                </div>
              </div>
              <p className="text-xs text-app-text-sec font-light leading-relaxed">{member.bio}</p>
              <div className="flex items-center gap-3 pt-1 border-t border-app-border">
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-app-text-muted hover:text-indigo-400 transition">
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                <a href={`mailto:${member.email}`} className="flex items-center gap-1.5 text-[10px] font-mono text-app-text-muted hover:text-indigo-400 transition">
                  <Mail className="w-3.5 h-3.5" />
                  {member.isOpen ? "Send Application" : "Contact"}
                </a>
                {member.isOpen && (
                  <span className="ml-auto text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Hiring</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Our Service Promise ───────────────────────────────────── */}
      <section className="px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.01] p-6 sm:p-8 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h2 className="text-lg font-extrabold font-display text-app-text dark:text-white">Our Service Promise</h2>
            </div>
            <button
              onClick={() => setShowPromiseDetail(!showPromiseDetail)}
              className="text-xs font-mono text-indigo-400 hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
            >
              {showPromiseDetail ? "Hide Details" : "Read Full Scope"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {SERVICE_PROMISE.map((p) => (
              <div key={p.title} className="p-4 rounded-xl bg-app-btn-sec/30 border border-emerald-500/15 text-center space-y-1">
                <span className="text-emerald-500 font-bold block text-lg">✓</span>
                <p className="text-xs font-bold text-app-text dark:text-white">{p.title}</p>
                <p className="text-[10px] text-app-text-muted leading-tight font-mono">{p.desc}</p>
              </div>
            ))}
          </div>

          {showPromiseDetail && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="text-xs text-app-text-sec space-y-2 pt-4 border-t border-app-border/40 font-light leading-relaxed"
            >
              {SERVICE_PROMISE.map((p) => (
                <p key={p.title}><strong className="text-app-text dark:text-white font-semibold">{p.title}:</strong> {p.detail}</p>
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl border border-indigo-500/20 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold font-display text-app-text dark:text-white">Ready to work with Vision79?</h2>
            <p className="text-sm text-app-text-sec font-light">Let's have a conversation about your ICT challenges.</p>
          </div>
          <a
            href="mailto:vision79slu@gmail.com"
            className="shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            Get in Touch <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </section>
    </div>
  );
}
