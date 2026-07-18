import { motion } from "motion/react";
import { Linkedin, Mail, ArrowRight, Users, Award, Globe, Heart } from "lucide-react";

const TEAM = [
  {
    name: "Neil Verdant",
    role: "Founder & Lead Systems Architect",
    bio: "Over 15 years of enterprise ICT experience across Saint Lucia, Barbados, and Trinidad. Specializes in network architecture, cybersecurity, and cloud infrastructure design.",
    linkedin: "https://linkedin.com",
    email: "vision79slu@gmail.com",
    initials: "NV",
    color: "from-indigo-500 to-violet-600",
  },
  {
    name: "Open Position",
    role: "Senior Network Engineer",
    bio: "We're growing our team. If you have hands-on experience with Cisco, Mikrotik, Fortinet, or enterprise switching, we want to hear from you.",
    linkedin: null,
    email: "vision79slu@gmail.com",
    isOpen: true,
    initials: "?",
    color: "from-emerald-500 to-teal-600",
  },
  {
    name: "Open Position",
    role: "IT Sales & Solutions Consultant",
    bio: "Join our growing sales team. Help Caribbean businesses identify their ICT challenges and present tailored V79SL solutions. Flexible remote role.",
    linkedin: null,
    email: "vision79slu@gmail.com",
    isOpen: true,
    initials: "?",
    color: "from-amber-500 to-orange-600",
  },
];

const VALUES = [
  {
    icon: Award,
    title: "Excellence in Delivery",
    desc: "We hold ourselves to the highest standard in every installation, migration, and support interaction — no shortcuts, no excuses.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
  {
    icon: Users,
    title: "Client Partnership",
    desc: "We don't just fix problems; we embed ourselves as trusted long-term technology partners for every client business.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    icon: Globe,
    title: "Caribbean-First Thinking",
    desc: "Our solutions account for Caribbean realities — power instability, hurricane preparedness, limited local ISP redundancy.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  {
    icon: Heart,
    title: "Community Investment",
    desc: "V79SL actively supports Saint Lucian youth in technology through affordable training, mentorship, and certification preparation.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
];

const MILESTONES = [
  { year: "2018", event: "V79SL founded in Castries, providing freelance IT support to local SMEs." },
  { year: "2020", event: "Expanded into cloud infrastructure and Microsoft 365 managed services." },
  { year: "2022", event: "Launched the V79 SaaS Marketplace and custom software development division." },
  { year: "2023", event: "Secured first hotel and hospitality contracts in the Rodney Bay corridor." },
  { year: "2024", event: "Established formal cybersecurity audit and penetration testing practice." },
  { year: "2026", event: "Operating across 5 Eastern Caribbean islands with 450+ protected nodes." },
];

export default function AboutPage() {
  return (
    <div className="space-y-20 pb-16">
      {/* ── Mission Hero ──────────────────────────────────────────── */}
      <section className="relative px-6 lg:px-8 pt-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-[400px] h-[400px] bg-indigo-500/6 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">Our Story</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-app-text dark:text-white leading-tight"
          >
            Powering Caribbean Business with Technology That Actually Works
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base text-app-text-sec font-light leading-relaxed"
          >
            V79SL was founded on a simple belief: Caribbean businesses deserve the same caliber of enterprise ICT solutions as any Fortune 500 company. We combine world-class technical expertise with a deep understanding of our local environment to deliver technology that truly works here.
          </motion.p>
        </div>
      </section>

      {/* ── Mission / Vision ──────────────────────────────────────── */}
      <section className="px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent space-y-4"
          >
            <div className="text-xs font-mono font-extrabold uppercase tracking-widest text-indigo-400">Our Mission</div>
            <h2 className="text-xl font-extrabold font-display text-app-text dark:text-white">To Accelerate Caribbean Digital Growth</h2>
            <p className="text-sm text-app-text-sec font-light leading-relaxed">
              We empower Saint Lucian and Eastern Caribbean businesses to compete in the global digital economy by delivering resilient, secure, and cutting-edge ICT infrastructure. Every solution we build is designed to maximize operational efficiency and minimize downtime.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent space-y-4"
          >
            <div className="text-xs font-mono font-extrabold uppercase tracking-widest text-emerald-400">Our Vision</div>
            <h2 className="text-xl font-extrabold font-display text-app-text dark:text-white">The Caribbean's Most Trusted MSP</h2>
            <p className="text-sm text-app-text-sec font-light leading-relaxed">
              To become the definitive Managed Services Partner for every hotel, retailer, healthcare provider, and government institution across the Caribbean — recognized not just for technical capability, but for genuine client outcomes and community impact.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Core Values ───────────────────────────────────────────── */}
      <section className="px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">Principles</span>
          <h2 className="text-3xl font-extrabold font-display text-app-text dark:text-white tracking-tight">The Values We Work By</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUES.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`glass rounded-2xl p-6 border ${v.border} space-y-4 hover:scale-[1.01] transition-all`}
              >
                <div className={`w-10 h-10 rounded-xl ${v.bg} border ${v.border} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${v.color}`} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-app-text dark:text-white">{v.title}</h3>
                  <p className="text-xs text-app-text-sec font-light leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Timeline ──────────────────────────────────────────────── */}
      <section className="px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">Our Journey</span>
          <h2 className="text-3xl font-extrabold font-display text-app-text dark:text-white tracking-tight">From Freelance to Full MSP</h2>
        </div>
        <div className="max-w-2xl mx-auto space-y-4 relative">
          <div className="absolute left-[52px] top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/40 via-indigo-500/20 to-transparent pointer-events-none" />
          {MILESTONES.map((m, i) => (
            <motion.div
              key={m.year}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-5 relative"
            >
              <div className="w-[44px] shrink-0 text-right">
                <span className="text-[11px] font-mono font-extrabold text-indigo-400">{m.year}</span>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-indigo-400/50 shrink-0 mt-1 shadow-lg shadow-indigo-500/30" />
              <div className="glass rounded-xl px-4 py-3 border border-app-border flex-1">
                <p className="text-xs text-app-text-sec font-light">{m.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">The Team</span>
          <h2 className="text-3xl font-extrabold font-display text-app-text dark:text-white tracking-tight">The People Behind V79SL</h2>
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

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-8">
        <div className="glass rounded-2xl border border-indigo-500/20 p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold font-display text-app-text dark:text-white">Ready to work with V79SL?</h2>
            <p className="text-sm text-app-text-sec font-light">Let's have a conversation about your ICT challenges.</p>
          </div>
          <a
            href="mailto:vision79slu@gmail.com"
            className="shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            Get in Touch <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
