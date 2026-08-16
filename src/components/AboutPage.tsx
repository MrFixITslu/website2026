import { useState } from "react";
import { motion } from "motion/react";
import { Linkedin, Mail, ArrowRight, CheckCircle2, AlertTriangle, Zap, ShieldCheck, Compass, Heart } from "lucide-react";
import { Button } from "./ui/Button";

const TEAM = [
  {
    name: "Neil Verdant",
    role: "Founder & Lead Systems Architect",
    bio: "Over 25 years of enterprise ICT experience across telecommunications, fibre networks, and cloud infrastructure.",
    linkedin: "https://linkedin.com",
    email: "vision79slu@gmail.com",
    initials: "NV",
  },
  {
    name: "Open Position",
    role: "Senior Network Engineer",
    bio: "We're growing our team. If you have hands-on experience with enterprise networking and fibre, we want to hear from you.",
    linkedin: null,
    email: "vision79slu@gmail.com",
    isOpen: true,
    initials: "?",
  },
  {
    name: "Open Position",
    role: "IT Solutions Consultant",
    bio: "Join our growing team. Help Caribbean businesses identify their ICT challenges and present tailored solutions.",
    linkedin: null,
    email: "vision79slu@gmail.com",
    isOpen: true,
    initials: "?",
  },
];

const VALUES = [
  { label: "Resiliency", icon: ShieldCheck },
  { label: "Affordable Enterprise Class", icon: Compass },
  { label: "Proactive Sovereignty", icon: Zap },
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
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative px-6 lg:px-8 pt-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-[400px] h-[400px] bg-v79-teal/6 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-v79-teal">About Vision79</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-app-text dark:text-white leading-tight"
          >
            Our Story
          </motion.h1>
        </div>
      </section>

      {/* ── About / Founder — split screen ───────────────────────────
           Left: mission, vision, values as badges. Right: founder
           image (or heritage/team imagery placeholder). */}
      <section className="px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-5"
          >
            <p className="text-sm text-app-text-sec font-light leading-relaxed">
              Vision79 Digital was founded with one goal — to bring world-class technology solutions to the Caribbean. With more than 25 years of experience delivering telecommunications, enterprise ICT services, fibre networks, cloud infrastructure, and software solutions, we combine technical expertise with practical business knowledge.
            </p>
            <div className="space-y-3 pt-2">
              <div>
                <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-v79-teal">Mission</span>
                <p className="text-sm text-app-text dark:text-white font-semibold mt-1">
                  Empowering Caribbean businesses through innovative technology, automation, and digital transformation.
                </p>
              </div>
              <div>
                <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-v79-teal">Vision</span>
                <p className="text-sm text-app-text dark:text-white font-semibold mt-1">
                  To become the Caribbean's most trusted technology innovation company.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {VALUES.map((v) => {
                const Icon = v.icon;
                return (
                  <span key={v.label} className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-3 py-1.5 rounded-full bg-v79-teal/10 border border-v79-teal/25 text-v79-teal">
                    <Icon className="w-3 h-3" /> {v.label}
                  </span>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative aspect-square rounded-2xl bg-gradient-to-br from-v79-navy to-v79-navy-light overflow-hidden flex items-center justify-center border border-v79-teal/20"
          >
            <div className="absolute inset-0 fiber-texture" />
            <div className="relative z-10 text-center space-y-2">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-extrabold text-3xl font-display">
                NV
              </div>
              <p className="text-white font-bold text-sm font-display">Neil Verdant</p>
              <p className="text-white/50 text-xs font-mono">Founder & Lead Systems Architect</p>
            </div>
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
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-v79-teal">Why It Matters</span>
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
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="glass rounded-2xl p-5 border border-v79-coral/15 bg-v79-coral/[0.02] space-y-1.5 hover:shadow-lg hover:shadow-v79-coral/5 hover:border-v79-coral/30 transition-[border-color,box-shadow] duration-300"
            >
              <div className="flex items-center gap-2 text-v79-coral-light">
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
          className="p-4 rounded-xl bg-v79-coral/[0.03] border border-v79-coral/15 space-y-2.5"
        >
          <p className="text-[10px] font-mono uppercase text-v79-coral-light font-bold">A Single Failure in Your Technology Stack Impacts:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-semibold text-app-text-sec">
            {IMPACT_AREAS.map((area) => (
              <span key={area} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-v79-coral shrink-0" /> {area}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="p-5 rounded-xl border border-v79-coral/20 bg-v79-coral/[0.02] flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div className="space-y-1 flex-1">
            <span className="text-[10px] font-mono text-v79-coral uppercase tracking-widest block font-bold">Built for the Caribbean</span>
            <p className="text-xs text-app-text-sec leading-relaxed">
              We design with island realities in mind: local internet bottlenecks, hurricane preparedness, and Saint Lucian regulatory conditions.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 font-mono text-[11px] text-app-text-sec shrink-0">
            {CARIBBEAN_BUILT.map((item) => (
              <p key={item} className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-v79-coral shrink-0" /> {item}
              </p>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-8 space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-v79-teal">The Team</span>
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
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`glass rounded-2xl p-6 border border-app-border space-y-4 ${member.isOpen ? "border-dashed" : ""} hover:border-v79-teal/30 hover:shadow-lg transition-[border-color,box-shadow] duration-300`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl font-display shadow-lg ${member.isOpen ? "bg-gradient-to-br from-v79-coral to-v79-coral-dark" : "bg-gradient-to-br from-v79-navy to-v79-teal-dark"}`}>
                  {member.initials}
                </div>
                <div>
                  <div className="font-bold text-sm text-app-text dark:text-white">{member.name}</div>
                  <div className="text-[11px] text-v79-teal font-mono">{member.role}</div>
                </div>
              </div>
              <p className="text-xs text-app-text-sec font-light leading-relaxed">{member.bio}</p>
              <div className="flex items-center gap-3 pt-1 border-t border-app-border">
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-app-text-muted hover:text-v79-teal transition">
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                <a href={`mailto:${member.email}`} className="flex items-center gap-1.5 text-[10px] font-mono text-app-text-muted hover:text-v79-teal transition">
                  <Mail className="w-3.5 h-3.5" />
                  {member.isOpen ? "Send Application" : "Contact"}
                </a>
                {member.isOpen && (
                  <span className="ml-auto text-[9px] font-mono font-bold uppercase tracking-widest text-v79-teal-light bg-v79-teal/10 border border-v79-teal/20 px-2 py-0.5 rounded-full">Hiring</span>
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
          className="glass rounded-2xl border border-v79-teal/15 bg-v79-teal/[0.01] p-6 sm:p-8 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-v79-teal-light">
              <CheckCircle2 className="w-5 h-5" />
              <h2 className="text-lg font-extrabold font-display text-app-text dark:text-white">Our Service Promise</h2>
            </div>
            <button
              onClick={() => setShowPromiseDetail(!showPromiseDetail)}
              className="text-xs font-mono text-v79-teal hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
            >
              {showPromiseDetail ? "Hide Details" : "Read Full Scope"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {SERVICE_PROMISE.map((p) => (
              <div key={p.title} className="p-4 rounded-xl bg-app-btn-sec/30 border border-v79-teal/15 text-center space-y-1">
                <span className="text-v79-teal font-bold block text-lg">✓</span>
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
          className="glass rounded-2xl border border-v79-teal/20 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold font-display text-app-text dark:text-white">Ready to work with Vision79?</h2>
            <p className="text-sm text-app-text-sec font-light">Let's have a conversation about your ICT challenges.</p>
          </div>
          <Button href="mailto:vision79slu@gmail.com" variant="primary" className="shrink-0" icon={<ArrowRight className="w-4 h-4" />}>
            Get in Touch
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
