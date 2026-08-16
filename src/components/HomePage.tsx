import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Shield, Cloud, Monitor, Network, Cpu, BarChart3, ArrowRight, Phone, Mail,
  MapPin, Star, ShieldCheck,
  Clock, Lock, Users, AlertTriangle, TrendingDown, Zap, Frown, Quote, CheckCircle2
} from "lucide-react";
import { Button } from "./ui/Button";

const SERVICES = [
  {
    icon: Shield,
    title: "Cybersecurity & Threat Defense",
    desc: "Advanced endpoint protection, network audits, and vulnerability assessments.",
  },
  {
    icon: Cloud,
    title: "Cloud Infrastructure & Backup",
    desc: "Redundant cloud backup, hot-site disaster recovery, and cloud migration.",
  },
  {
    icon: Monitor,
    title: "Managed IT Support",
    desc: "24/7 monitoring, remote helpdesk, and on-site diagnostics with SLA response.",
    highlight: true,
  },
  {
    icon: Network,
    title: "Network Architecture & VoIP",
    desc: "Enterprise LAN/WAN design, firewall configuration, and hosted VoIP systems.",
  },
  {
    icon: Cpu,
    title: "Microsoft 365 & Productivity",
    desc: "Licensing, deployment, migration, and ongoing management for your team.",
  },
  {
    icon: BarChart3,
    title: "Custom Software & SaaS",
    desc: "Purpose-built web apps, desktop software, and databases for your business.",
  },
];

const METRICS = [
  { label: "Years ICT Experience", value: "25", suffix: "+", desc: "Telecoms & enterprise IT" },
  { label: "Uptime SLA Guarantee", value: "99.9", suffix: "%", desc: "Financially backed" },
  { label: "On-Site Response Time", value: "4", suffix: "hr", desc: "Guaranteed SLA" },
  { label: "Serving the Caribbean", value: "2018", suffix: "", desc: "Since founding", static: true },
];

const WHY_CHOOSE_VISION79 = [
  { title: "Hurricane Recovery Ready", desc: "Business continuity plans built for storm season, not just server downtime.", icon: Shield },
  { title: "Proactive, Not Break-Fix", desc: "24/7 monitoring catches problems before they become outages.", icon: Clock },
  { title: "Telecommunications Heritage", desc: "25+ years of Caribbean telecoms expertise behind every engagement.", icon: Network },
  { title: "Bilingual Support", desc: "Full support in English and Kwéyòl for every client, every time.", icon: Users },
  { title: "Data Sovereignty", desc: "Your data stays governed by the standards your business answers to.", icon: Lock },
  { title: "Local Compliance", desc: "Built to meet Caribbean regulatory and data protection requirements.", icon: ShieldCheck },
];

const IMPACTS = [
  { icon: Users, title: "Customer Service", desc: "Support lines go dark, tickets pile up, clients wait." },
  { icon: TrendingDown, title: "Revenue", desc: "Every hour offline is an hour of lost transactions." },
  { icon: Zap, title: "Productivity", desc: "Staff sit idle while systems stay down." },
  { icon: Frown, title: "Reputation", desc: "Clients remember who was there when it mattered." },
];

const ASSESSMENT_STEPS = [
  { icon: Monitor, title: "Infrastructure Review", desc: "Computers, routers, WiFi, and network hardware." },
  { icon: Lock, title: "Security Audit", desc: "Passwords, MFA, endpoint protection, access controls." },
  { icon: Cloud, title: "Data Protection", desc: "Backups, cloud storage, and disaster recovery readiness." },
];

const TESTIMONIALS = [
  {
    name: "Sandra Charles",
    initials: "SC",
    role: "General Manager, Rodney Bay Marina",
    text: "Vision79 Digital transformed our marina's IT infrastructure completely. From reliable Wi-Fi to POS integration, their team delivered beyond our expectations.",
    rating: 5,
  },
  {
    name: "Marcus Joseph",
    initials: "MJ",
    role: "CFO, Island Retail Group",
    text: "Our Microsoft 365 migration was seamless. Vision79 Digital handled everything — licensing, data migration, and staff training. Highly professional.",
    rating: 5,
  },
  {
    name: "Angela Delmar",
    initials: "AD",
    role: "Director, Castries Health Associates",
    text: "The cybersecurity audit revealed critical gaps we never knew existed. Vision79 Digital's remediation plan was thorough and executed without interruption.",
    rating: 5,
  },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 60;
          const increment = value / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

interface HomePageProps {
  onNavigate: (view: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {

  return (
    <div className="space-y-20 pb-16">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative min-h-[82vh] flex flex-col justify-center overflow-hidden pt-16 grid-texture">
        {/* Ambient brand-color drift — navy/teal/coral, not generic tech-blue */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.08, 1], x: [0, 20, 0], y: [0, -15, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-v79-teal/8 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.12, 1], x: [0, -18, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-v79-coral/6 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], y: [0, 20, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-v79-navy/6 dark:bg-v79-teal/8 rounded-full blur-3xl"
          />
          {/* Abstract Caribbean archipelago rendered as a network/node diagram */}
          <svg
            aria-hidden="true"
            className="absolute -right-24 top-1/2 -translate-y-1/2 w-[560px] h-[560px] opacity-[0.14] dark:opacity-[0.22] hidden lg:block"
            viewBox="0 0 500 500"
            fill="none"
          >
            {[
              [90, 120], [180, 90], [260, 150], [340, 110], [410, 180],
              [140, 220], [230, 260], [320, 240], [400, 300],
              [110, 340], [200, 380], [300, 360], [380, 410],
            ].map(([x, y], i, arr) =>
              arr.slice(i + 1).map(([x2, y2], j) => {
                const dist = Math.hypot(x - x2, y - y2);
                if (dist > 130) return null;
                return (
                  <line
                    key={`${i}-${j}`}
                    x1={x} y1={y} x2={x2} y2={y2}
                    stroke="var(--color-v79-teal)"
                    strokeWidth="1"
                  />
                );
              })
            )}
            {[
              [90, 120], [180, 90], [260, 150], [340, 110], [410, 180],
              [140, 220], [230, 260], [320, 240], [400, 300],
              [110, 340], [200, 380], [300, 360], [380, 410],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 6 : 4} fill="var(--color-v79-coral)" />
            ))}
          </svg>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center space-y-8">
          {/* Badge Tagline */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <span className="inline-flex items-center gap-2 text-[10px] font-mono font-extrabold uppercase tracking-[0.2em] text-v79-teal bg-v79-teal/10 border border-v79-teal/25 px-4 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-v79-teal animate-pulse" />
              Enterprise ICT Partner — Since 2018
            </span>
          </motion.div>

          {/* Headline & Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight leading-tight text-app-text dark:text-white">
              Enterprise Technology<br />
              <span className="bg-gradient-to-r from-v79-teal via-v79-teal-light to-v79-teal bg-clip-text text-transparent">
                Built for Caribbean Realities.
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg sm:text-xl text-app-text-sec font-light leading-relaxed">
              V79 builds custom software, managed IT solutions, cloud services, AI automation, and digital platforms designed for Caribbean businesses, governments, schools, and entrepreneurs.
            </p>
          </motion.div>

          {/* Call to Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <Button
              onClick={() => onNavigate("contact")}
              variant="primary"
              size="lg"
              className="group"
              icon={<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            >
              Get Your Free ICT Assessment
            </Button>
            <Button onClick={() => onNavigate("services")} variant="secondary" size="lg">
              Explore Our Services
            </Button>
          </motion.div>

          {/* Contact quick bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-app-text-sec font-mono"
          >
            <a href="tel:+17587260035" className="flex items-center gap-1.5 hover:text-v79-teal transition">
              <Phone className="w-3.5 h-3.5" /> +1 758 726 0035
            </a>
            <span className="hidden sm:block text-app-border">|</span>
            <a href="mailto:vision79slu@gmail.com" className="flex items-center gap-1.5 hover:text-v79-teal transition">
              <Mail className="w-3.5 h-3.5" /> vision79slu@gmail.com
            </a>
            <span className="hidden sm:block text-app-border">|</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Castries, Saint Lucia
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── Trust Bar ─────────────────────────────────────────────── */}
      <section className="px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6 text-center space-y-1 border border-app-border hover:border-v79-teal/40 transition-colors"
            >
              <div className="text-3xl font-extrabold font-mono text-app-text dark:text-white">
                {m.static ? m.value : <AnimatedCounter value={parseFloat(m.value)} suffix={m.suffix} />}
              </div>
              <div className="text-xs font-bold text-app-text-sec uppercase tracking-wider">{m.label}</div>
              <div className="text-[10px] text-app-text-muted font-mono">{m.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Services Grid ─────────────────────────────────────────── */}
      <section className="px-6 lg:px-8 space-y-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-v79-teal">What We Do</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-app-text dark:text-white tracking-tight">
            Comprehensive ICT Services
          </h2>
          <p className="max-w-xl mx-auto text-sm text-app-text-sec font-light">
            From helpdesk to enterprise architecture, we cover every dimension of your business technology needs.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                className={`relative glass rounded-2xl p-6 space-y-4 border transition-all duration-300 group cursor-pointer ${
                  s.highlight
                    ? "border-v79-coral/35 shadow-lg shadow-v79-coral/10"
                    : "border-app-border hover:border-v79-teal/30 hover:shadow-lg hover:shadow-v79-teal/5"
                }`}
                onClick={() => onNavigate("services")}
              >
                {s.highlight && (
                  <span className="absolute -top-3 right-5 text-[9px] font-mono font-extrabold uppercase tracking-wider bg-v79-coral text-white px-2.5 py-1 rounded-full shadow-md">
                    Most Popular
                  </span>
                )}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                  s.highlight ? "bg-v79-coral/10 border-v79-coral/25 text-v79-coral" : "bg-v79-teal/10 border-v79-teal/20 text-v79-teal"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-app-text dark:text-white font-display">{s.title}</h3>
                  <p className="text-xs text-app-text-sec font-light leading-relaxed line-clamp-2">{s.desc}</p>
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-mono underline-offset-2 group-hover:underline transition ${
                  s.highlight ? "text-v79-coral" : "text-v79-teal"
                }`}>
                  Learn more <ArrowRight className="w-3 h-3" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>


      {/* ── Why Choose Vision79 Digital ───────────────────────────────
           Feature grid on a contrasting sand-tinted band to break up
           white space between the services grid and testimonials. */}
      <section className="py-16 bg-v79-sand-light/50 dark:bg-v79-navy-light/20 border-y border-app-border">
        <div className="px-6 lg:px-8 space-y-8 max-w-6xl mx-auto">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-v79-teal">Excellence</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-app-text dark:text-white tracking-tight">Why Caribbean Businesses Choose V79</h2>
            <p className="max-w-xl mx-auto text-sm text-app-text-sec font-light">
              Caribbean-rooted, enterprise-grade — we understand the unique challenges Caribbean businesses face and build solutions for this environment.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY_CHOOSE_VISION79.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-4 bg-app-bg/60 rounded-xl p-5 border border-app-border"
                >
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-v79-teal/10 border border-v79-teal/20 flex items-center justify-center text-v79-teal">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-app-text dark:text-white font-display">{item.title}</p>
                    <p className="text-xs text-app-text-sec font-light leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ── Problem Agitation ─────────────────────────────────────── */}
      <section className="py-20 bg-v79-navy dark:bg-v79-navy-dark fiber-texture relative overflow-hidden">
        <div className="px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <span className="inline-flex items-center gap-2 text-[10px] font-mono font-extrabold uppercase tracking-[0.25em] text-v79-coral-light">
              <AlertTriangle className="w-3.5 h-3.5" /> The Real Cost of Downtime
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight leading-tight">
              A single failure doesn't<br className="hidden sm:block" /> stay contained.
            </h2>
            <p className="max-w-lg mx-auto text-sm sm:text-base text-white/60 font-light leading-relaxed">
              One server outage, one missed backup, one unpatched vulnerability — and the damage spreads fast, hitting every part of your business at once.
            </p>
          </motion.div>

          {/* Cascading flow: one failure branching into four impacts */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-v79-coral/15 border border-v79-coral/40 text-v79-coral-light text-sm font-bold font-mono mx-auto"
            >
              <AlertTriangle className="w-4 h-4" /> One IT Failure
            </motion.div>

            <div className="w-px h-8 bg-gradient-to-b from-v79-coral/50 to-v79-teal/30 mx-auto" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative">
              <div className="hidden lg:block absolute top-0 left-[12.5%] right-[12.5%] h-px bg-v79-teal/20" />
              {IMPACTS.map((imp, i) => {
                const Icon = imp.icon;
                return (
                  <motion.div
                    key={imp.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="relative pt-8"
                  >
                    <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 bg-v79-teal/20" />
                    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 space-y-2 text-left h-full">
                      <div className="w-9 h-9 rounded-lg bg-v79-teal/15 border border-v79-teal/25 flex items-center justify-center text-v79-teal-light">
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-bold text-white font-display">{imp.title}</p>
                      <p className="text-xs text-white/55 font-light leading-relaxed">{imp.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <section className="px-6 lg:px-8 space-y-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-2"
        >
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-v79-teal">Client Stories</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-app-text dark:text-white tracking-tight">
            Trusted Across Saint Lucia
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative glass rounded-2xl p-6 border border-app-border space-y-4 flex flex-col"
            >
              <Quote aria-hidden="true" className="w-8 h-8 text-v79-teal/20 absolute top-5 right-5" />
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-v79-coral text-v79-coral" />
                ))}
              </div>
              <p className="text-sm text-app-text-sec font-light leading-relaxed italic flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-app-border">
                <div className="w-10 h-10 shrink-0 rounded-full bg-v79-teal/15 border border-v79-teal/25 flex items-center justify-center text-v79-teal text-xs font-bold font-display">
                  {t.initials}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="font-bold text-sm text-app-text dark:text-white truncate">{t.name}</div>
                  <div className="text-[11px] text-app-text-muted font-mono truncate">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>


      {/* ── ICT Business Health Assessment ───────────────────────────
           Standalone, visually distinct pricing/CTA block. Free
           consultation vs. paid full audit kept unambiguous. */}
      <section className="px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto rounded-3xl border-2 border-v79-teal/25 bg-app-bg grid-texture overflow-hidden shadow-xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: product + price */}
            <div className="p-8 sm:p-10 lg:p-12 space-y-5 flex flex-col justify-center">
              <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-v79-teal">ICT Business Health Assessment</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-app-text dark:text-white tracking-tight leading-tight">
                Know exactly where your<br />technology stands.
              </h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold font-mono text-app-text dark:text-white">EC$1,500</span>
                <span className="text-sm text-app-text-muted font-mono">one-time fee</span>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-v79-teal bg-v79-teal/10 border border-v79-teal/25 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Free Consultation Included
              </span>
              <p className="text-sm text-app-text-sec font-light leading-relaxed">
                Your initial consultation is free, with no obligation. The full three-part assessment below is a one-time EC$1,500 engagement.
              </p>
              <div>
                <Button onClick={() => onNavigate("contact")} variant="primary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                  Request Your Assessment
                </Button>
              </div>
            </div>

            {/* Right: 3-step checklist */}
            <div className="p-8 sm:p-10 lg:p-12 bg-v79-sand-light/40 dark:bg-v79-navy-light/25 border-t lg:border-t-0 lg:border-l border-app-border space-y-4">
              {ASSESSMENT_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 bg-app-bg/70 rounded-xl p-4 border border-app-border"
                  >
                    <div className="w-9 h-9 shrink-0 rounded-full bg-v79-teal text-white flex items-center justify-center text-xs font-bold font-mono">
                      {i + 1}
                    </div>
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Icon className="w-4 h-4 text-v79-teal mt-0.5 shrink-0" />
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-sm font-bold text-app-text dark:text-white font-display">{step.title}</p>
                        <p className="text-xs text-app-text-sec font-light leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────── */}
      <section className="px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-r from-v79-navy to-v79-navy-light p-10 sm:p-14 text-center text-white space-y-6 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px"}} />
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
              Ready to Modernize Your Business Technology?
            </h2>
            <p className="max-w-xl mx-auto text-base text-white/70 font-light">
              Get a free ICT assessment with no obligations. Our team will analyze your current setup and propose a tailored solution for your business.
            </p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate("contact")}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-v79-coral hover:bg-v79-coral-dark text-white text-sm font-extrabold shadow-lg transition-all duration-200 cursor-pointer"
            >
              Get Free Assessment <ArrowRight className="w-4 h-4" />
            </button>
            <a href="tel:+17587260035" className="flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition">
              <Phone className="w-4 h-4" /> +1 758 726 0035
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
