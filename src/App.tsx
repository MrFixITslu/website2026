import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon, Menu, X } from "lucide-react";
import { SaaSApp, CategoryFilter, SaaSAd, AppView } from "./types";
import { AppLogo } from "./components/AppLogo";
import { CourseDetailPage } from "./components/CourseDetailPage";
import { ServicesPriceList } from "./components/ServicesPriceList";
import { OnboardingFeedback } from "./components/OnboardingFeedback";
import HomePage from "./components/HomePage";
import AboutPage from "./components/AboutPage";
import ServicesPage from "./components/ServicesPage";
import IndustriesPage from "./components/IndustriesPage";
import ResourcesPage from "./components/ResourcesPage";
import ContactPage from "./components/ContactPage";
import {
  Layers, Globe, Monitor, Gamepad2, GraduationCap,
  Star, Search, Package, AlertTriangle, ChevronLeft,
  ChevronRight, Megaphone, Coins
} from "lucide-react";

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "industries", label: "Industries" },
  { id: "solutions", label: "Solutions" },
  { id: "resources", label: "Resources" },
  { id: "contact", label: "Contact" },
];

const isPromoActive = (app: SaaSApp) => {
  if (app.category !== "courses" || !app.createdAt) return false;
  const diff = Math.abs(new Date().getTime() - new Date(app.createdAt).getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) <= 30;
};

function getCourseIdFromUrl(): number | null {
  const match = window.location.pathname.match(/^\/course\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export default function App() {
  const [view, setView] = useState<AppView>("home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Marketplace state (Solutions tab)
  const [apps, setApps] = useState<SaaSApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<SaaSApp | null>(null);
  const [showServicesPriceList, setShowServicesPriceList] = useState(false);
  const [selectedToolForFeedback, setSelectedToolForFeedback] = useState<SaaSApp | null>(null);
  const [ads, setAds] = useState<SaaSAd[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [pulsingAppId, setPulsingAppId] = useState<number | null>(null);

  // Theme
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try { return (localStorage.getItem("vision79-theme") as "light" | "dark") || "dark"; }
    catch { return "dark"; }
  });

  useEffect(() => {
    try { localStorage.setItem("vision79-theme", theme); } catch {}
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme !== "dark");
  }, [theme]);

  const fetchApps = async () => {
    try {
      setLoading(true); setErrorMsg(null);
      const res = await fetch("/api/apps");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setApps(await res.json());
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load applications");
    } finally { setLoading(false); }
  };

  const fetchAds = async () => {
    try {
      const res = await fetch("/api/ads");
      if (res.ok) setAds(await res.json());
    } catch {}
  };

  useEffect(() => { fetchApps(); fetchAds(); }, []);

  useEffect(() => {
    if (apps.length === 0) return;
    const courseId = getCourseIdFromUrl();
    if (courseId !== null && !selectedCourse) {
      const match = apps.find(a => a.id === courseId && a.category === "courses");
      if (match) { setSelectedCourse(match); setView("solutions"); }
    }
  }, [apps]);

  useEffect(() => {
    if (selectedCourse) {
      const url = `/course/${selectedCourse.id}`;
      if (window.location.pathname !== url) window.history.pushState({ courseId: selectedCourse.id }, "", url);
    } else if (window.location.pathname.startsWith("/course/")) {
      window.history.pushState({}, "", "/");
    }
  }, [selectedCourse]);

  useEffect(() => {
    const handlePop = () => {
      const courseId = getCourseIdFromUrl();
      if (courseId !== null) {
        const match = apps.find(a => a.id === courseId && a.category === "courses");
        if (match) { setSelectedCourse(match); return; }
      }
      setSelectedCourse(null);
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [apps]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const t = setInterval(() => setCurrentAdIndex(p => (p + 1) % ads.length), 6000);
    return () => clearInterval(t);
  }, [ads]);

  const handleAppLaunch = async (app: SaaSApp) => {
    try {
      setPulsingAppId(app.id); setTimeout(() => setPulsingAppId(null), 1000);
      const res = await fetch("/api/apps/increment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id })
      });
      if (res.ok) {
        const updated = await res.json();
        setApps(apps.map(a => a.id === app.id ? updated : a));
      }
      if (app.accessUrl) window.open(app.accessUrl, "_blank", "noopener,noreferrer");
    } catch {}
  };

  const navigate = (v: string) => {
    setView(v as AppView);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredApps = apps.filter(app => {
    if (!app) return false;
    const catOk = selectedCategory === "all" || app.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const textOk = [(app.name || ""), (app.subtitle || ""), (app.description || "")]
      .some(s => s.toLowerCase().includes(q));
    return catOk && textOk;
  });

  const MarketplaceView = () => (
    <AnimatePresence mode="wait">
      {showServicesPriceList ? (
        <motion.div key="spl" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}>
          <ServicesPriceList onBack={() => setShowServicesPriceList(false)} />
        </motion.div>
      ) : selectedToolForFeedback ? (
        <motion.div key="feedback" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}>
          <OnboardingFeedback app={selectedToolForFeedback} onBack={() => setSelectedToolForFeedback(null)} />
        </motion.div>
      ) : selectedCourse ? (
        <motion.div key="course" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}>
          <CourseDetailPage course={selectedCourse} onBack={() => setSelectedCourse(null)} />
        </motion.div>
      ) : (
        <motion.div key="explore" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="space-y-8">
          <div className="flex flex-col gap-1.5 max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight font-display text-app-text dark:text-white">Solutions & Marketplace</h1>
            <p className="text-app-text-sec text-sm font-light">Our SaaS tools, courses, and specialized platforms — all in one place.</p>
          </div>

          {/* Solutions Quick Links */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "ICT Services & Pricing", desc: "Managed service plans, SLAs, and pricing", action: () => setShowServicesPriceList(true), color: "emerald" },
              { label: "V79 Academy", desc: "Courses, certifications, masterclasses", action: () => { setSelectedCategory("courses"); setShowServicesPriceList(false); }, color: "violet" },
              { label: "V79 App Marketplace", desc: "Web apps, desktop tools, and games", action: () => { setSelectedCategory("all"); setShowServicesPriceList(false); }, color: "indigo" },
            ].map(s => (
              <button key={s.label} onClick={s.action} className={`glass p-5 rounded-2xl border border-app-border hover:border-${s.color}-500/30 text-left space-y-1.5 transition-all cursor-pointer hover:bg-${s.color}-500/[0.02] group`}>
                <div className={`text-xs font-bold font-display text-app-text dark:text-white group-hover:text-${s.color}-400 transition`}>{s.label}</div>
                <div className="text-[11px] text-app-text-sec font-light">{s.desc}</div>
              </button>
            ))}
          </div>

          {ads.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-app-border bg-app-aside-bg/40 shadow-lg group">
              <div className="relative h-[200px] sm:h-[160px] w-full select-none">
                <AnimatePresence mode="wait">
                  <motion.div key={currentAdIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
                    onClick={() => { const link = ads[currentAdIndex]?.linkUrl; if (link?.includes("service") || link === "/services-pricing") setShowServicesPriceList(true); else if (link) window.open(link, "_blank", "noopener,noreferrer"); }}
                    className="absolute inset-0 flex flex-col sm:flex-row items-stretch cursor-pointer">
                    <div className="relative w-full sm:w-2/5 h-32 sm:h-full bg-zinc-800 overflow-hidden shrink-0">
                      <img src={ads[currentAdIndex].imageUrl} alt={ads[currentAdIndex].title} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" referrerPolicy="no-referrer" />
                      <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded border border-white/20 text-[8px] font-mono font-bold tracking-widest text-emerald-400 uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Spotlight
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 font-semibold uppercase"><Megaphone className="w-3 h-3" />Featured</div>
                      <h2 className="text-base font-bold text-app-text font-display leading-tight">{ads[currentAdIndex].title}</h2>
                      <p className="text-[11px] text-app-text-sec font-light">{ads[currentAdIndex].subtitle}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              {ads.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); setCurrentAdIndex(p => (p - 1 + ads.length) % ads.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border border-app-border bg-app-bg/80 text-app-text backdrop-blur-md opacity-0 group-hover:opacity-100 transition cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={e => { e.stopPropagation(); setCurrentAdIndex(p => (p + 1) % ads.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border border-app-border bg-app-bg/80 text-app-text backdrop-blur-md opacity-0 group-hover:opacity-100 transition cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                </>
              )}
            </div>
          )}

          <div className="relative flex items-center max-w-2xl">
            <Search className="absolute left-4 text-app-text-muted w-5 h-5" />
            <input id="search-input" type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value.toLowerCase())}
              placeholder="Search tools, databases, frameworks, extensions..."
              className="w-full bg-app-input border border-app-input-border rounded-full py-3 pl-12 pr-6 text-sm focus:outline-none focus:ring-1 focus:ring-app-border transition-all text-app-text placeholder:text-app-text-muted/60" />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-4 text-app-text-muted hover:text-app-text text-xs font-mono font-bold cursor-pointer">CLEAR</button>}
          </div>

          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1,2,3].map(n => <div key={n} className="glass p-5 rounded-2xl h-60 animate-pulse" />)}
              </div>
            ) : errorMsg ? (
              <div className="text-center py-12 glass rounded-2xl space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-xs text-app-text-muted font-mono">{errorMsg}</p>
                <button onClick={fetchApps} className="px-3 py-1.5 bg-app-btn-sec border border-app-border rounded text-xs text-app-text cursor-pointer">Retry</button>
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center py-16 bg-app-aside-bg rounded-2xl border border-app-border space-y-3 text-app-text-sec">
                <Package className="w-10 h-10 mx-auto text-app-text-muted" />
                <p className="text-sm">No results match your filters.</p>
                <button onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }} className="px-3 py-1 text-xs border border-app-border rounded bg-app-btn-sec text-app-text cursor-pointer">Reset</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredApps.map((app, idx) => {
                  const isCourse = app.category === "courses";
                  const isWeb = app.category === "web";
                  const isPulsing = pulsingAppId === app.id;
                  const priceNum = Number(app.price || 0);
                  const hasPromo = isCourse && isPromoActive(app) && priceNum > 0;
                  const promoPriceNum = priceNum * 0.5;
                  const pricingText = isCourse ? (priceNum > 0 ? `$${priceNum.toFixed(2)}` : "Free") : app.pricingType === "free" ? "Free" : priceNum > 0 ? `$${priceNum.toFixed(2)}` : "Subscription";
                  const badgeColor = isCourse ? "bg-violet-600/10 text-violet-500 border border-violet-500/20" : app.category === "desktop" ? "bg-blue-600/10 text-blue-500 border border-blue-500/20" : "bg-app-btn-sec text-app-text-sec border border-app-border";
                  return (
                    <a href={isCourse ? `/course/${app.id}` : "#"} key={app.id ?? `fb-${idx}`}
                      onClick={e => { if (isCourse) { e.preventDefault(); setSelectedCourse(app); } else { e.preventDefault(); setSelectedToolForFeedback(app); } }}
                      className="glass p-5 rounded-2xl flex flex-col justify-between gap-4 group hover:border-app-text/30 transition-all duration-300 shadow-sm hover:shadow-lg hover:bg-indigo-500/[0.01] no-underline text-inherit cursor-pointer">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 bg-app-btn-sec rounded-xl flex items-center justify-center border border-app-border"><AppLogo logoUrl={app.logoUrl} /></div>
                          <div className="flex flex-col items-end gap-1 font-mono">
                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${badgeColor}`}>{isCourse ? "Course 📚" : app.category}</span>
                            {hasPromo ? (
                              <span className="text-[10px] px-2 py-0.5 border rounded uppercase bg-emerald-500/15 text-emerald-400 border-emerald-500/25 font-bold animate-pulse">🔥 ${promoPriceNum.toFixed(2)} (50% OFF)</span>
                            ) : (
                              <span className={`text-[10px] px-2 py-0.5 border rounded uppercase ${isCourse ? "bg-violet-500/10 text-violet-500 border-violet-500/20 font-bold" : "border-app-border bg-app-btn-sec/50 text-app-text-muted"}`}>{pricingText}</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-app-text group-hover:text-indigo-400 transition font-display text-base tracking-tight">{app.name}</h4>
                          <p className="text-[11px] text-app-text-sec font-mono mt-1 tracking-wide">{app.subtitle}</p>
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            <span className="font-bold text-yellow-500">{app.rating || 4.8}</span>
                            <span className="text-app-text-muted">•</span>
                            <span className="text-app-text-muted">{isCourse ? `By ${app.instructor || "Expert"}` : "Reviews"}</span>
                          </div>
                          <p className="text-xs text-app-text-muted mt-2.5 line-clamp-3 leading-relaxed">{app.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-app-border/40">
                        <div className="flex items-center space-x-1 font-mono text-[10px] text-app-text-sec">
                          <span className="font-semibold">{(app.launchCount || 0).toLocaleString()}</span>
                          <span className="text-app-text-muted">{isCourse ? "Students" : isWeb ? "Launches" : "Downloads"}</span>
                        </div>
                        {isCourse ? (
                          <a href={`/course/${app.id}`} onClick={e => { e.preventDefault(); setSelectedCourse(app); }} className="px-4 py-2 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 no-underline cursor-pointer">Take Course 🎓</a>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); handleAppLaunch(app); }} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${isPulsing ? "bg-app-text text-app-bg scale-95 opacity-80" : "bg-app-text text-app-bg hover:opacity-90"}`}>
                            {app.pricingType === "premium" ? "Subscribe 🔒" : isWeb ? "Launch ↗" : "Download ↓"}
                          </button>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderContent = () => {
    switch (view) {
      case "home":        return <HomePage onNavigate={navigate} />;
      case "about":       return <AboutPage />;
      case "services":    return <ServicesPage onNavigate={navigate} />;
      case "industries":  return <IndustriesPage onNavigate={navigate} />;
      case "solutions":   return <div className="p-6 sm:p-10"><MarketplaceView /></div>;
      case "resources":   return <ResourcesPage onNavigate={navigate} />;
      case "contact":     return <ContactPage />;
      default:            return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-app-bg text-app-text antialiased">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 lg:px-8 border-b border-app-border bg-app-header-bg backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => navigate("home")} className="flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 rounded-md flex items-center justify-center font-black text-xs tracking-tighter bg-app-text text-app-bg">V79</div>
          <span className="font-bold text-lg tracking-tighter text-app-text font-display">VISION79</span>
          <div className="h-4 w-px bg-app-border mx-1 hidden sm:block" />
          <span className="text-[10px] text-app-text-muted font-mono tracking-widest uppercase hidden sm:block">ICT Solutions</span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => navigate(item.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${view === item.id ? "bg-indigo-500/10 text-indigo-400 font-semibold" : "text-app-text-sec hover:text-app-text hover:bg-app-aside-bg"}`}>
              {item.label}
            </button>
          ))}
          <button onClick={() => setTheme(p => p === "dark" ? "light" : "dark")}
            className="ml-2 p-1.5 rounded-lg border border-app-border bg-app-btn-sec text-app-text hover:bg-app-btn-sec/80 transition-all cursor-pointer">
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </nav>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={() => setTheme(p => p === "dark" ? "light" : "dark")} className="p-1.5 rounded-lg border border-app-border bg-app-btn-sec cursor-pointer">
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
          <button onClick={() => setMobileNavOpen(p => !p)} className="p-1.5 rounded-lg border border-app-border bg-app-btn-sec cursor-pointer">
            {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
            className="md:hidden fixed top-16 left-0 right-0 z-40 bg-app-header-bg border-b border-app-border p-4 flex flex-col gap-1 shadow-xl backdrop-blur-md">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => navigate(item.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium text-left transition cursor-pointer ${view === item.id ? "bg-indigo-500/10 text-indigo-400 font-semibold" : "text-app-text-sec hover:text-app-text hover:bg-app-aside-bg"}`}>
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-app-border bg-app-header-bg px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md flex items-center justify-center font-black text-xs bg-app-text text-app-bg">V79</div>
            <div>
              <div className="font-bold text-sm font-display text-app-text">VISION79 ICT Solutions</div>
              <div className="text-[10px] text-app-text-muted font-mono">Castries, Saint Lucia · +1 758 726 0035</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-app-text-muted uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />System Operational</div>
            <span>© 2026 VISION79 INC</span>
            <button onClick={() => navigate("contact")} className="hover:text-indigo-400 transition cursor-pointer">Privacy</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
