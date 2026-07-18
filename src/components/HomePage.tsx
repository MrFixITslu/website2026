import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Shield, Cloud, Monitor, Network, Cpu, BarChart3, ArrowRight, Phone, Mail,
  CheckCircle, MapPin, Star, ChevronDown
} from "lucide-react";

const SERVICES = [
  {
    icon: Shield,
    title: "Cybersecurity & Threat Defense",
    desc: "Advanced endpoint protection, network audits, vulnerability assessments, and perimeter security architecture.",
    color: "indigo",
    gradient: "from-indigo-500/10 to-indigo-600/5",
    border: "border-indigo-500/20",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-400",
  },
  {
    icon: Cloud,
    title: "Cloud Infrastructure & Backup",
    desc: "Redundant automated cloud backup clusters, hot-site disaster recovery, and cloud migration for Caribbean businesses.",
    color: "sky",
    gradient: "from-sky-500/10 to-sky-600/5",
    border: "border-sky-500/20",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-400",
  },
  {
    icon: Monitor,
    title: "Managed IT Support",
    desc: "24/7 endpoint monitoring, remote helpdesk, and on-site diagnostics with guaranteed SLA response times.",
    color: "emerald",
    gradient: "from-emerald-500/10 to-emerald-600/5",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    icon: Network,
    title: "Network Architecture & VoIP",
    desc: "Enterprise-grade LAN/WAN design, firewall configuration, and hosted VoIP phone systems for modern offices.",
    color: "violet",
    gradient: "from-violet-500/10 to-violet-600/5",
    border: "border-violet-500/20",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
  },
  {
    icon: Cpu,
    title: "Microsoft 365 & Productivity",
    desc: "Licensing, deployment, email migration, and ongoing management of Microsoft 365 for your entire team.",
    color: "amber",
    gradient: "from-amber-500/10 to-amber-600/5",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
  },
  {
    icon: BarChart3,
    title: "Custom Software & SaaS",
    desc: "Purpose-built web applications, desktop software, and business databases engineered for Caribbean enterprises.",
    color: "rose",
    gradient: "from-rose-500/10 to-rose-600/5",
    border: "border-rose-500/20",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
  },
];

const METRICS = [
  { label: "Uptime SLA", value: "99.9", suffix: "%", desc: "Guaranteed availability" },
  { label: "Helpdesk Tickets Resolved", value: "1500", suffix: "+", desc: "Since 2018" },
  { label: "Network Nodes Protected", value: "450", suffix: "+", desc: "Across the Caribbean" },
  { label: "Response Time", value: "4", suffix: "hr", desc: "On-site SLA guarantee" },
];

const TESTIMONIALS = [
  {
    name: "Sandra Charles",
    role: "General Manager, Rodney Bay Marina",
    text: "V79SL transformed our marina's IT infrastructure completely. From reliable Wi-Fi to POS integration, their team delivered beyond our expectations.",
    rating: 5,
  },
  {
    name: "Marcus Joseph",
    role: "CFO, Island Retail Group",
    text: "Our Microsoft 365 migration was seamless. V79SL handled everything — licensing, data migration, and staff training. Highly professional.",
    rating: 5,
  },
  {
    name: "Angela Delmar",
    role: "Director, Castries Health Associates",
    text: "The cybersecurity audit revealed critical gaps we never knew existed. V79SL's remediation plan was thorough and executed without interruption.",
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
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-20 pb-16">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative min-h-[82vh] flex flex-col justify-center overflow-hidden pt-16">
        {/* Background gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/6 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <span className="inline-flex items-center gap-2 text-[10px] font-mono font-extrabold uppercase tracking-[0.25em] text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-4 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Saint Lucia's Premier ICT Managed Services Partner
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight leading-tight text-app-text dark:text-white">
              Enterprise ICT Solutions<br />
              <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 bg-clip-text text-transparent">
                Built for the Caribbean
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-app-text-sec font-light leading-relaxed">
              V79SL delivers world-class Managed IT, Cybersecurity, Cloud, and Custom Software solutions to businesses across Saint Lucia and the Eastern Caribbean.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => onNavigate("contact")}
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all duration-200 cursor-pointer"
            >
              Request a Free Consultation
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onNavigate("services")}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-app-aside-bg/60 hover:bg-app-aside-bg border border-app-border text-app-text text-sm font-semibold transition-all duration-200 cursor-pointer"
            >
              Explore Services
            </button>
          </motion.div>

          {/* Contact quick bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-app-text-sec font-mono"
          >
            <a href="tel:+17587260035" className="flex items-center gap-1.5 hover:text-indigo-400 transition">
              <Phone className="w-3.5 h-3.5" /> +1 758 726 0035
            </a>
            <span className="hidden sm:block text-app-border">|</span>
            <a href="mailto:vision79slu@gmail.com" className="flex items-center gap-1.5 hover:text-indigo-400 transition">
              <Mail className="w-3.5 h-3.5" /> vision79slu@gmail.com
            </a>
            <span className="hidden sm:block text-app-border">|</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Castries, Saint Lucia
            </span>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-app-text-muted"
        >
          <span className="text-[9px] font-mono uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* ── Metrics ───────────────────────────────────────────────── */}
      <section className="px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6 text-center space-y-1 border border-app-border hover:border-indigo-500/30 transition-colors"
            >
              <div className="text-3xl font-extrabold font-display text-app-text dark:text-white">
                <AnimatedCounter value={parseFloat(m.value)} suffix={m.suffix} />
              </div>
              <div className="text-xs font-bold text-app-text-sec uppercase tracking-wider">{m.label}</div>
              <div className="text-[10px] text-app-text-muted font-mono">{m.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Services Grid ─────────────────────────────────────────── */}
      <section className="px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">What We Do</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-app-text dark:text-white tracking-tight">
            Comprehensive ICT Services
          </h2>
          <p className="max-w-xl mx-auto text-sm text-app-text-sec font-light">
            From helpdesk to enterprise architecture, we cover every dimension of your business technology needs.
          </p>
        </div>
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
                className={`glass rounded-2xl p-6 space-y-4 border ${s.border} bg-gradient-to-br ${s.gradient} hover:scale-[1.01] transition-all duration-300 group cursor-pointer`}
                onClick={() => onNavigate("services")}
              >
                <div className={`w-11 h-11 rounded-xl ${s.iconBg} flex items-center justify-center border ${s.border}`}>
                  <Icon className={`w-5 h-5 ${s.iconColor}`} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-app-text dark:text-white font-display">{s.title}</h3>
                  <p className="text-xs text-app-text-sec font-light leading-relaxed">{s.desc}</p>
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-mono ${s.iconColor} opacity-0 group-hover:opacity-100 transition`}>
                  Learn more <ArrowRight className="w-3 h-3" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Why V79SL ─────────────────────────────────────────────── */}
      <section className="px-6 lg:px-8">
        <div className="rounded-3xl border border-app-border bg-gradient-to-br from-indigo-500/[0.04] to-violet-500/[0.03] p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">Why Choose V79SL</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-app-text dark:text-white tracking-tight">
                  Caribbean-Rooted.<br />Enterprise-Grade.
                </h2>
                <p className="text-sm text-app-text-sec font-light leading-relaxed">
                  We understand the unique challenges Caribbean businesses face — from hurricane preparedness and power redundancy to internet failover and local compliance. Our solutions are built for this environment.
                </p>
              </div>
              <button
                onClick={() => onNavigate("about")}
                className="flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
              >
                Meet the V79SL team <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                "99.9% uptime SLA with real financial accountability",
                "On-site response guaranteed across Saint Lucia",
                "Hurricane & power surge business continuity planning",
                "Satellite & LTE internet failover configuration",
                "Local data compliance & privacy-first architecture",
                "Bilingual support (English & Kwéyòl) for all clients",
              ].map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-app-aside-bg/40 border border-app-border hover:border-emerald-500/30 transition"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-app-text-sec font-light">{point}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <section className="px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">Client Stories</span>
          <h2 className="text-3xl font-extrabold font-display text-app-text dark:text-white tracking-tight">
            Trusted Across Saint Lucia
          </h2>
        </div>
        <div className="relative max-w-2xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ opacity: activeTestimonial === i ? 1 : 0, y: activeTestimonial === i ? 0 : 12 }}
              transition={{ duration: 0.4 }}
              className={`${activeTestimonial === i ? "relative" : "absolute inset-0 pointer-events-none"} glass rounded-2xl p-8 border border-app-border text-center space-y-4`}
            >
              <div className="flex justify-center gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-app-text-sec font-light leading-relaxed italic">"{t.text}"</p>
              <div className="space-y-0.5">
                <div className="font-bold text-sm text-app-text dark:text-white">{t.name}</div>
                <div className="text-[11px] text-app-text-muted font-mono">{t.role}</div>
              </div>
            </motion.div>
          ))}
          <div className="flex justify-center gap-2 mt-4">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`transition-all duration-200 rounded-full cursor-pointer ${activeTestimonial === i ? "w-5 h-1.5 bg-indigo-500" : "w-1.5 h-1.5 bg-app-border"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────── */}
      <section className="px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-10 sm:p-14 text-center text-white space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px"}} />
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
              Ready to Modernize Your Business Technology?
            </h2>
            <p className="max-w-xl mx-auto text-base text-indigo-100 font-light">
              Get a free ICT assessment with no obligations. Our team will analyze your current setup and propose a tailored solution for your business.
            </p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate("contact")}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white text-indigo-700 text-sm font-extrabold shadow-lg hover:bg-indigo-50 transition-all duration-200 cursor-pointer"
            >
              Get Free Assessment <ArrowRight className="w-4 h-4" />
            </button>
            <a href="tel:+17587260035" className="flex items-center gap-2 text-sm font-semibold text-indigo-100 hover:text-white transition">
              <Phone className="w-4 h-4" /> +1 758 726 0035
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
