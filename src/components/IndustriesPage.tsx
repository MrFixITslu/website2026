import { motion } from "motion/react";
import { ArrowRight, Building2, ShoppingBag, Heart, GraduationCap, Scale, Palmtree, Briefcase, Landmark } from "lucide-react";
import { Button } from "./ui/Button";

const INDUSTRIES = [
  {
    icon: Briefcase,
    title: "Small Businesses",
    desc: "Reliable, right-sized IT support, backup, and cloud solutions designed for growing Caribbean businesses.",
    points: ["Day-to-day IT helpdesk", "Secure cloud backups", "Office networking & Wi-Fi", "Hardware procurement"],
    badge: "SME Focused",
    badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    gradient: "from-indigo-500/8 to-blue-500/4",
    border: "border-indigo-500/20",
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10",
  },
  {
    icon: GraduationCap,
    title: "Schools",
    desc: "Connected learning environments with filtered internet, device management, and e-learning infrastructure.",
    points: ["Campus wireless networking", "Content filtering & security", "Student device management", "E-learning support"],
    badge: "",
    badgeColor: "",
    gradient: "from-violet-500/8 to-purple-500/4",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
  },
  {
    icon: Building2,
    title: "Government",
    desc: "Compliant ICT solutions that serve citizens and maximize public sector budgets with full accountability.",
    points: ["Government email & data compliance", "Citizen portal & web applications", "Secure network infrastructure", "Data sovereignty solutions"],
    badge: "",
    badgeColor: "",
    gradient: "from-sky-500/8 to-cyan-500/4",
    border: "border-sky-500/20",
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/10",
  },
  {
    icon: Palmtree,
    title: "Hospitality",
    desc: "High-performance IT as a guest experience differentiator. Hospitality network design, PMS integrations, and guest Wi-Fi.",
    points: ["High-density guest Wi-Fi", "PMS and POS system integration", "Security camera management", "24/7 operational support"],
    badge: "Priority Industry",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    gradient: "from-amber-500/8 to-orange-500/4",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
  },
  {
    icon: Heart,
    title: "Healthcare",
    desc: "Secure ICT environments for Caribbean healthcare providers requiring strict data privacy and reliable uptime.",
    points: ["EMR/EHR infrastructure support", "Patient data encryption", "Compliance-aligned segmentation", "Clinical system backups"],
    badge: "Compliance-Ready",
    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    gradient: "from-rose-500/8 to-pink-500/4",
    border: "border-rose-500/20",
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10",
  },
  {
    icon: ShoppingBag,
    title: "Retail",
    desc: "Resilient POS infrastructure and cloud sync solutions for retailers facing power surges and connectivity drops.",
    points: ["POS installation & maintenance", "Payment gateway integration", "Inventory database cloud sync", "UPS & surge protection"],
    badge: "",
    badgeColor: "",
    gradient: "from-emerald-500/8 to-teal-500/4",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
  },
  {
    icon: Landmark,
    title: "Financial Services",
    desc: "Security-first IT environments for financial institutions, accounting practices, and advisory firms.",
    points: ["Encrypted file storage", "Secure remote access", "Multi-Factor Authentication", "Annual cybersecurity audits"],
    badge: "Security-First",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    gradient: "from-teal-500/8 to-cyan-500/4",
    border: "border-teal-500/20",
    iconColor: "text-teal-400",
    iconBg: "bg-teal-500/10",
  },
  {
    icon: Scale,
    title: "Non-Profit Organisations",
    desc: "Cost-effective technology solutions, cloud collaboration tools, and grants-aligned ICT consulting.",
    points: ["M365 non-profit licensing", "Secure donor database setup", "Remote collaboration tools", "Budget-friendly IT support"],
    badge: "",
    badgeColor: "",
    gradient: "from-purple-500/8 to-indigo-500/4",
    border: "border-purple-500/20",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10",
  },
];

export default function IndustriesPage({ onNavigate }: { onNavigate: (v: string) => void }) {
  return (
    <div className="space-y-16 pb-16">
      <section className="pt-10 px-6 lg:px-8 text-center space-y-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 space-y-4">
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">Industry Focus</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-app-text dark:text-white">
            Industries We Support
          </h1>
          <p className="max-w-xl mx-auto text-sm text-app-text-sec font-light leading-relaxed">
            We proudly support small businesses, schools, government, hospitality, healthcare, retail, financial services, and non-profit organisations.
          </p>
        </motion.div>
      </section>

      <section className="px-6 lg:px-8 max-w-7xl mx-auto">
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

      <section className="px-6 lg:px-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl border border-indigo-500/20 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold font-display text-app-text dark:text-white">Don't see your industry?</h2>
            <p className="text-sm text-app-text-sec font-light max-w-lg">
              Vision79 works with organizations of all types. Get in touch and we'll design a custom ICT solution for your needs.
            </p>
          </div>
          <Button onClick={() => onNavigate("contact")} variant="primary" className="shrink-0" icon={<ArrowRight className="w-4 h-4" />}>
            Contact Our Team
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
