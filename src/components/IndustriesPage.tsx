import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Building2, ShoppingBag, Heart, GraduationCap, Scale, Palmtree, Briefcase, Landmark, Check, ChevronDown } from "lucide-react";
import { Button } from "./ui/Button";

const INDUSTRIES = [
  {
    tab: "Small Business",
    icon: Briefcase,
    title: "Small Businesses",
    desc: "Reliable, right-sized IT support, backup, and cloud solutions designed for growing Caribbean businesses. We scale with you, from your first office to your fifth.",
    points: ["Day-to-day IT helpdesk", "Secure cloud backups", "Office networking & Wi-Fi", "Hardware procurement"],
  },
  {
    tab: "Education",
    icon: GraduationCap,
    title: "Schools",
    desc: "Connected learning environments with filtered internet, device management, and e-learning infrastructure built for Caribbean classrooms.",
    points: ["Campus wireless networking", "Content filtering & security", "Student device management", "E-learning support"],
  },
  {
    tab: "Government",
    icon: Building2,
    title: "Government",
    desc: "Compliant ICT solutions that serve citizens and maximize public sector budgets, with full accountability and local data sovereignty.",
    points: ["Government email & data compliance", "Citizen portal & web applications", "Secure network infrastructure", "Data sovereignty solutions"],
  },
  {
    tab: "Hospitality",
    icon: Palmtree,
    title: "Hospitality",
    desc: "High-performance IT as a guest experience differentiator. Network design, PMS integrations, and guest Wi-Fi built for demanding uptime.",
    points: ["High-density guest Wi-Fi", "PMS and POS system integration", "Security camera management", "24/7 operational support"],
  },
  {
    tab: "Healthcare",
    icon: Heart,
    title: "Healthcare",
    desc: "Secure ICT environments for Caribbean healthcare providers requiring strict data privacy, compliance, and reliable uptime.",
    points: ["EMR/EHR infrastructure support", "Patient data encryption", "Compliance-aligned segmentation", "Clinical system backups"],
  },
  {
    tab: "Retail",
    icon: ShoppingBag,
    title: "Retail",
    desc: "Resilient POS infrastructure and cloud sync solutions for retailers facing power surges and connectivity drops.",
    points: ["POS installation & maintenance", "Payment gateway integration", "Inventory database cloud sync", "UPS & surge protection"],
  },
  {
    tab: "Financial",
    icon: Landmark,
    title: "Financial Services",
    desc: "Security-first IT environments for financial institutions, accounting practices, and advisory firms handling sensitive data.",
    points: ["Encrypted file storage", "Secure remote access", "Multi-Factor Authentication", "Annual cybersecurity audits"],
  },
  {
    tab: "Non-Profit",
    icon: Scale,
    title: "Non-Profit Organisations",
    desc: "Cost-effective technology solutions, cloud collaboration tools, and grants-aligned ICT consulting for mission-driven teams.",
    points: ["M365 non-profit licensing", "Secure donor database setup", "Remote collaboration tools", "Budget-friendly IT support"],
  },
];

export default function IndustriesPage({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [active, setActive] = useState(0);
  const [openMobile, setOpenMobile] = useState<number | null>(0);
  const activeIndustry = INDUSTRIES[active];
  const ActiveIcon = activeIndustry.icon;

  return (
    <div className="space-y-16 pb-16">
      <section className="pt-10 px-6 lg:px-8 text-center space-y-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[350px] h-[350px] bg-v79-teal/6 rounded-full blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 space-y-4">
          <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-v79-teal">Industry Focus</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-app-text dark:text-white">
            Industries We Support
          </h1>
          <p className="max-w-xl mx-auto text-sm text-app-text-sec font-light leading-relaxed">
            We proudly support small businesses, schools, government, hospitality, healthcare, retail, financial services, and non-profit organisations.
          </p>
        </motion.div>
      </section>

      {/* ── Desktop: horizontal tabs ─────────────────────────────── */}
      <section className="hidden md:block px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-wrap justify-center gap-2 border-b border-app-border pb-1">
          {INDUSTRIES.map((ind, i) => (
            <button
              key={ind.tab}
              onClick={() => setActive(i)}
              className={`px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wide rounded-t-lg transition-colors cursor-pointer border-b-2 ${
                active === i
                  ? "text-v79-teal border-v79-teal"
                  : "text-app-text-muted border-transparent hover:text-app-text-sec"
              }`}
            >
              {ind.tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-2xl border border-app-border p-8 lg:p-10 grid lg:grid-cols-2 gap-8"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-v79-teal/10 border border-v79-teal/20 flex items-center justify-center text-v79-teal">
                <ActiveIcon className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold font-display text-app-text dark:text-white">{activeIndustry.title}</h2>
              <p className="text-sm text-app-text-sec font-light leading-relaxed">{activeIndustry.desc}</p>
              <button
                onClick={() => onNavigate("contact")}
                className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-widest text-v79-coral hover:underline underline-offset-2 cursor-pointer"
              >
                Get a tailored quote <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <ul className="space-y-3 self-center">
              {activeIndustry.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-app-text-sec">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-v79-teal/15 border border-v79-teal/25 flex items-center justify-center text-v79-teal mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  <span className="font-light">{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ── Mobile: accordion ────────────────────────────────────── */}
      <section className="md:hidden px-6 space-y-3">
        {INDUSTRIES.map((ind, i) => {
          const Icon = ind.icon;
          const isOpen = openMobile === i;
          return (
            <div key={ind.tab} className="glass rounded-xl border border-app-border overflow-hidden">
              <button
                onClick={() => setOpenMobile(isOpen ? null : i)}
                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
              >
                <div className="w-9 h-9 shrink-0 rounded-lg bg-v79-teal/10 border border-v79-teal/20 flex items-center justify-center text-v79-teal">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-sm font-bold text-app-text dark:text-white font-display">{ind.title}</span>
                <ChevronDown className={`w-4 h-4 text-app-text-muted transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-xs text-app-text-sec font-light leading-relaxed">{ind.desc}</p>
                      <ul className="space-y-2">
                        {ind.points.map((p) => (
                          <li key={p} className="flex items-start gap-2 text-xs text-app-text-sec">
                            <span className="w-4 h-4 shrink-0 rounded-full bg-v79-teal/15 border border-v79-teal/25 flex items-center justify-center text-v79-teal mt-0.5">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                            <span className="font-light">{p}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => onNavigate("contact")}
                        className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-widest text-v79-coral cursor-pointer"
                      >
                        Get a tailored quote <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </section>

      <section className="px-6 lg:px-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl border border-v79-teal/20 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
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
