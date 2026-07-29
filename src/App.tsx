import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon, Menu, X, ArrowRight, Phone, Mail, MapPin, CheckCircle, Shield, Cloud, Monitor, Network, Cpu, BarChart3, Star } from "lucide-react";
import HomePage from "./components/HomePage";
import AboutPage from "./components/AboutPage";
import ServicesPage from "./components/ServicesPage";
import IndustriesPage from "./components/IndustriesPage";
import ResourcesPage from "./components/ResourcesPage";
import ContactPage from "./components/ContactPage";
import { SaaSApp, SaaSAd } from "./types";
import { CourseDetailPage } from "./components/CourseDetailPage";
import { ServicesPriceList } from "./components/ServicesPriceList";
import { OnboardingFeedback } from "./components/OnboardingFeedback";

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "industries", label: "Industries" },
  { id: "solutions", label: "Solutions" },
  { id: "resources", label: "Resources" },
  { id: "contact", label: "Contact" },
];

export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try { return (localStorage.getItem("vision79-theme") as "light" | "dark") || "dark"; }
    catch { return "dark"; }
  });

  // Solutions marketplace state
  const [apps, setApps] = useState<SaaSApp[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<SaaSApp | null>(null);
  const [showServicesPriceList, setShowServicesPriceList] = useState(false);
  const [selectedToolForFeedback, setSelectedToolForFeedback] = useState<SaaSApp | null>(null);
  const [ads, setAds] = useState<SaaSAd[]>([]);

  useEffect(() => {
    try { localStorage.setItem("vision79-theme", theme); } catch {}
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme !== "dark");
  }, [theme]);

  useEffect(() => {
    fetch("/api/apps").then(res => res.json()).then(data => setApps(data)).catch(() => {});
    fetch("/api/ads").then(res => res.json()).then(data => setAds(data)).catch(() => {});
  }, []);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const topPos = el.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top: topPos, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-app-bg text-app-text antialiased selection:bg-indigo-500/20 selection:text-indigo-400">
      {/* Apple-inspired Sticky Header */}
      <header className="h-16 flex items-center justify-between px-6 lg:px-12 border-b border-app-border bg-app-header-bg/90 backdrop-blur-xl sticky top-0 z-50">
        <button onClick={() => scrollTo("home")} className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs tracking-tighter bg-indigo-600 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">V79</div>
          <span className="font-display tracking-tight text-app-text uppercase">
            <span className="font-bold text-sm sm:text-base">VISION79 DIGITAL</span>
            <span className="font-normal text-xs sm:text-sm text-app-text-sec"> | ICT SOLUTIONS</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1.5">
          {SECTIONS.map(sec => (
            <button
              key={sec.id}
              onClick={() => scrollTo(sec.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeSection === sec.id
                  ? "bg-indigo-500/10 text-indigo-400 font-bold"
                  : "text-app-text-sec hover:text-app-text hover:bg-app-aside-bg"
              }`}
            >
              {sec.label}
            </button>
          ))}
          <button
            onClick={() => setTheme(p => p === "dark" ? "light" : "dark")}
            className="ml-3 p-2 rounded-lg border border-app-border bg-app-btn-sec text-app-text hover:bg-app-btn-sec/80 transition-all cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </nav>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={() => setTheme(p => p === "dark" ? "light" : "dark")} className="p-2 rounded-lg border border-app-border bg-app-btn-sec cursor-pointer">
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
          <button onClick={() => setMobileNavOpen(p => !p)} className="p-2 rounded-lg border border-app-border bg-app-btn-sec cursor-pointer">
            {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed top-16 left-0 right-0 z-40 bg-app-header-bg/95 backdrop-blur-2xl border-b border-app-border p-5 flex flex-col gap-2 shadow-2xl"
          >
            {SECTIONS.map(sec => (
              <button
                key={sec.id}
                onClick={() => scrollTo(sec.id)}
                className={`px-4 py-3 rounded-xl text-sm font-semibold text-left transition cursor-pointer ${
                  activeSection === sec.id ? "bg-indigo-500/15 text-indigo-400 font-bold" : "text-app-text-sec hover:text-app-text hover:bg-app-aside-bg"
                }`}
              >
                {sec.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continuous One-Page Apple-Inspired Flow */}
      <main className="flex-1 space-y-32 pb-24">
        <section id="home" className="scroll-mt-20">
          <HomePage onNavigate={(v) => scrollTo(v === "solutions" ? "solutions" : v === "contact" ? "contact" : "services")} />
        </section>

        <div className="w-full max-w-7xl mx-auto px-6"><div className="h-px bg-gradient-to-r from-transparent via-app-border to-transparent" /></div>

        <section id="about" className="scroll-mt-20">
          <AboutPage />
        </section>

        <div className="w-full max-w-7xl mx-auto px-6"><div className="h-px bg-gradient-to-r from-transparent via-app-border to-transparent" /></div>

        <section id="services" className="scroll-mt-20">
          <ServicesPage onNavigate={(v) => scrollTo(v === "contact" ? "contact" : "services")} />
        </section>

        <div className="w-full max-w-7xl mx-auto px-6"><div className="h-px bg-gradient-to-r from-transparent via-app-border to-transparent" /></div>

        <section id="industries" className="scroll-mt-20">
          <IndustriesPage onNavigate={(v) => scrollTo(v === "contact" ? "contact" : "industries")} />
        </section>

        <div className="w-full max-w-7xl mx-auto px-6"><div className="h-px bg-gradient-to-r from-transparent via-app-border to-transparent" /></div>

        <section id="solutions" className="scroll-mt-20 max-w-7xl mx-auto px-6 lg:px-12 w-full">
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">Products & Solutions</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-app-text dark:text-white">Our Software & Marketplace</h2>
              <p className="text-app-text-sec text-sm font-light">Explore specialized Caribbean business platforms, financial tools, and digital solutions.</p>
            </div>
            {showServicesPriceList ? (
              <ServicesPriceList onBack={() => setShowServicesPriceList(false)} />
            ) : selectedCourse ? (
              <CourseDetailPage course={selectedCourse} onBack={() => setSelectedCourse(null)} />
            ) : selectedToolForFeedback ? (
              <OnboardingFeedback app={selectedToolForFeedback} onBack={() => setSelectedToolForFeedback(null)} />
            ) : (
              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  { title: "Fire Finance Pro", desc: "Smart financial management for individuals and small businesses.", tag: "Featured Product", action: () => setShowServicesPriceList(true) },
                  { title: "V79 Digital Platform", desc: "Digital transformation and custom workflow suites for Caribbean enterprises.", tag: "Enterprise", action: () => setShowServicesPriceList(true) },
                  { title: "Real-Time KPI Dashboards", desc: "Operational performance monitoring and live metrics for teams.", tag: "Analytics", action: () => setShowServicesPriceList(true) },
                ].map((item, idx) => (
                  <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                    className="glass rounded-2xl p-6 border border-app-border hover:border-indigo-500/40 space-y-4 transition-all group flex flex-col justify-between">
                    <div className="space-y-3">
                      <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">{item.tag}</span>
                      <h3 className="text-lg font-bold font-display text-app-text dark:text-white group-hover:text-indigo-400 transition">{item.title}</h3>
                      <p className="text-xs text-app-text-sec font-light leading-relaxed">{item.desc}</p>
                    </div>
                    <button onClick={item.action} className="flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer pt-2">
                      Learn More <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="w-full max-w-7xl mx-auto px-6"><div className="h-px bg-gradient-to-r from-transparent via-app-border to-transparent" /></div>

        <section id="resources" className="scroll-mt-20">
          <ResourcesPage onNavigate={(v) => scrollTo(v === "contact" ? "contact" : "resources")} />
        </section>

        <div className="w-full max-w-7xl mx-auto px-6"><div className="h-px bg-gradient-to-r from-transparent via-app-border to-transparent" /></div>

        <section id="contact" className="scroll-mt-20">
          <ContactPage />
        </section>
      </main>

      {/* Spacious Apple-Inspired Footer - Zero Overlap */}
      <footer className="border-t border-app-border bg-app-header-bg py-12 px-6 lg:px-12 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-app-border">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs bg-indigo-600 text-white">V79</div>
              <span className="font-bold text-base font-display text-app-text tracking-tight uppercase">VISION79 DIGITAL | ICT SOLUTIONS</span>
            </div>
            <p className="text-xs text-app-text-sec font-light max-w-sm leading-relaxed">
              World-class managed IT, cybersecurity, cloud infrastructure, and software development for businesses across Saint Lucia and the Eastern Caribbean.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-app-text uppercase tracking-wider font-mono text-[11px]">Quick Links</div>
            <ul className="space-y-1.5 text-app-text-sec font-light">
              {SECTIONS.map(s => (
                <li key={s.id}>
                  <button onClick={() => scrollTo(s.id)} className="hover:text-indigo-400 transition cursor-pointer">{s.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-app-text uppercase tracking-wider font-mono text-[11px]">Contact Us</div>
            <div className="space-y-1.5 text-app-text-sec font-light">
              <div>Castries, Saint Lucia</div>
              <div>Phone: <a href="tel:+17587260035" className="text-indigo-400 hover:underline">+1 758 726 0035</a></div>
              <div>Email: <a href="mailto:vision79slu@gmail.com" className="text-indigo-400 hover:underline font-semibold">vision79slu@gmail.com</a></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-app-text-muted font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>System Operational · 99.9% Uptime SLA</span>
          </div>
          <div>© 2026 VISION79 DIGITAL INC. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
