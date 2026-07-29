import { motion } from "motion/react";
import { Linkedin, Mail, ArrowRight, Users, Award, Globe, Heart, CheckCircle2, Clock, ShieldCheck, Cpu, Cloud, Wrench, Sparkles } from "lucide-react";

const TEAM = [
  {
    name: "Neil Verdant",
    role: "Founder & Lead Systems Architect",
    bio: "Over 20 years of enterprise ICT experience across telecommunications, fibre networks, and cloud infrastructure.",
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

const WHY_CHOOSE_US = [
  { title: "20+ years ICT industry experience", icon: Clock },
  { title: "Enterprise networking expertise", icon: Globe },
  { title: "Cloud & Microsoft 365 specialists", icon: Cloud },
  { title: "Custom software development", icon: Sparkles },
  { title: "AI automation solutions", icon: Cpu },
  { title: "Business process optimisation", icon: Wrench },
  { title: "Local Caribbean support", icon: Heart },
  { title: "Fast response times", icon: ShieldCheck },
];



export default function AboutPage() {
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
              Vision79 was founded with one goal—to bring world-class technology solutions to the Caribbean.
            </p>
            <p>
              With more than 20 years of experience delivering telecommunications, enterprise ICT services, fibre networks, cloud infrastructure, and software solutions, Vision79 combines technical expertise with practical business knowledge.
            </p>
            <p>
              From helping businesses modernize their operations to building custom applications that solve real problems, we focus on creating technology that delivers measurable results.
            </p>
            <p>
              Today Vision79 is growing into a technology group that develops innovative digital products while providing professional ICT consulting and managed services throughout the Caribbean.
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

      {/* ── Why Choose Us ─────────────────────────────────────────── */}
      <section className="px-6 lg:px-8 space-y-8 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">Excellence</span>
          <h2 className="text-3xl font-extrabold font-display text-app-text dark:text-white tracking-tight">Why Choose Us</h2>
        </div>
        <div className="space-y-4 relative">
          <div className="absolute left-[52px] top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/40 via-indigo-500/20 to-transparent pointer-events-none" />
          {WHY_CHOOSE_US.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-5 relative"
              >
                <div className="w-[44px] shrink-0 text-right flex justify-end">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-indigo-400/50 shrink-0 shadow-lg shadow-indigo-500/30" />
                <div className="glass rounded-xl px-4 py-3 border border-app-border flex-1">
                  <p className="text-xs font-semibold text-app-text dark:text-white">{item.title}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>



      {/* ── Team ──────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-8 space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">The Team</span>
          <h2 className="text-3xl font-extrabold font-display text-app-text dark:text-white tracking-tight">The People Behind Vision79</h2>
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
      <section className="px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="glass rounded-2xl border border-indigo-500/20 p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold font-display text-app-text dark:text-white">Ready to work with Vision79?</h2>
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
