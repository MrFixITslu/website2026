import { motion } from "motion/react";
import { ArrowRight, Building2, ShoppingBag, Heart, GraduationCap, Scale, Palmtree } from "lucide-react";

const INDUSTRIES = [
  {
    icon: Palmtree,
    title: "Hotels & Hospitality",
    desc: "High-performance IT as a guest experience differentiator. We specialize in hospitality network design, PMS integrations, and guest Wi-Fi.",
    points: ["High-density guest Wi-Fi with VLAN isolation","PMS and POS system integration","Security camera network management","24/7 support aligned with hotel operations","Bandwidth management and QoS"],
    badge: "Priority Industry",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    gradient: "from-amber-500/8 to-orange-500/4",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
  },
  {
    icon: ShoppingBag,
    title: "Retail & Point of Sale",
    desc: "Resilient POS infrastructure and cloud sync solutions for Saint Lucian retailers facing power surges and connectivity drops.",
    points: ["POS system installation and maintenance","Payment gateway and merchant integration","Inventory database design and cloud sync","UPS and surge protection planning","LTE failover for connectivity continuity"],
    badge: "",
    badgeColor: "",
    gradient: "from-emerald-500/8 to-teal-500/4",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
  },
  {
    icon: Heart,
    title: "Healthcare & Medical",
    desc: "HIPAA-aligned ICT environments for Caribbean healthcare providers requiring strict data privacy and reliable uptime.",
    points: ["EMR/EHR system infrastructure support","Patient data encryption and access control","Compliance-aligned network segmentation","Medical device network integration","Backup and continuity for clinical systems"],
    badge: "Compliance-Ready",
    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    gradient: "from-rose-500/8 to-pink-500/4",
    border: "border-rose-500/20",
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10",
  },
  {
    icon: GraduationCap,
    title: "Education & Schools",
    desc: "Connected learning environments with filtered internet, device management, and e-learning infrastructure.",
    points: ["Campus-wide wireless network design","Content filtering and parental controls","Student device management (MDM)","Google Workspace / M365 EDU licensing","E-learning platform hosting and support"],
    badge: "",
    badgeColor: "",
    gradient: "from-violet-500/8 to-purple-500/4",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
  },
  {
    icon: Scale,
    title: "Legal & Professional Services",
    desc: "Security-first IT environments for law firms, accounting practices, and financial advisors handling sensitive client data.",
    points: ["Encrypted file storage and document management","Secure remote access for hybrid workers","Email archiving and legal hold configuration","Multi-Factor Authentication enforcement","Annual cybersecurity audits"],
    badge: "Security-First",
    badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    gradient: "from-indigo-500/8 to-blue-500/4",
    border: "border-indigo-500/20",
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10",
  },
  {
    icon: Building2,
    title: "Government & Non-Profits",
    desc: "Compliant ICT solutions that serve citizens and maximize limited public sector budgets with full accountability.",
    points: ["Government email and data compliance","Citizen portal and web application development","Network infrastructure for public buildings","Data sovereignty and local hosting solutions","IT procurement consulting"],
    badge: "",
    badgeColor: "",
    gradient: "from-sky-500/8 to-cyan-500/4",
    border: "border-sky-500/20",
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/10",
  },
];

export default function IndustriesPage({ onNavigate }: { onNavigate: (v: string) => void }) {
  return (
    <div className="space-y-16 pb-16">
      <section className="pt-10 px-6 lg:px-8 text-center space-y-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 space-y-4">
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">Industry Focus</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-app-text dark:text-white">
            Solutions Tailored to Your Industry
          </h1>
          <p className="max-w-xl mx-auto text-sm text-app-text-sec font-light leading-relaxed">
            Every industry has unique technology requirements. V79SL builds specialized ICT solutions for your sector's specific challenges.
          </p>
        </div>
      </section>

      <section className="px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {INDUSTRIES.map((ind, i) => {
            const Icon = ind.icon;
            return (
              <motion.div
                key={ind.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`glass rounded-2xl border ${ind.border} bg-gradient-to-br ${ind.gradient} p-6 space-y-5 hover:scale-[1.01] transition-all duration-300 group`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${ind.iconBg} border ${ind.border} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${ind.iconColor}`} />
                  </div>
                  {ind.badge && (
                    <span className={`text-[9px] font-mono font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${ind.badgeColor}`}>
                      {ind.badge}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-base font-display text-app-text dark:text-white">{ind.title}</h3>
                  <p className="text-xs text-app-text-sec font-light leading-relaxed">{ind.desc}</p>
                </div>
                <ul className="space-y-1.5">
                  {ind.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[11px] text-app-text-sec">
                      <span className={`text-base leading-none ${ind.iconColor}`}>›</span>
                      <span className="font-light">{p}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => onNavigate("contact")}
                  className={`flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest ${ind.iconColor} opacity-0 group-hover:opacity-100 transition cursor-pointer`}
                >
                  Get a tailored quote <ArrowRight className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-10 sm:p-14 text-center text-white space-y-5 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative z-10 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display">Don't see your industry?</h2>
            <p className="max-w-lg mx-auto text-sm text-indigo-100 font-light">
              V79SL works with businesses of all types. Get in touch and we'll design a custom ICT solution for your needs.
            </p>
          </div>
          <button
            onClick={() => onNavigate("contact")}
            className="relative z-10 flex items-center gap-2.5 px-7 py-3 rounded-xl bg-white text-indigo-700 text-sm font-extrabold shadow-lg hover:bg-indigo-50 transition mx-auto cursor-pointer"
          >
            Contact Our Team <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
