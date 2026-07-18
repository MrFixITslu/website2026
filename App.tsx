import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Download, 
  Search, 
  Info,
  Layers,
  TrendingUp,
  Package,
  AlertTriangle,
  Monitor,
  Globe,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Gamepad2,
  GraduationCap,
  Star,
  Coins,
  Heart
} from "lucide-react";
import { SaaSApp, CategoryFilter, SaaSAd } from "./types";
import { AppLogo } from "./components/AppLogo";
import { CourseDetailPage } from "./components/CourseDetailPage";
import { ServicesPriceList } from "./components/ServicesPriceList";
import { OnboardingFeedback } from "./components/OnboardingFeedback";

const isPromoActive = (app: SaaSApp) => {
  if (app.category !== "courses" || !app.createdAt) return false;
  const createdDate = new Date(app.createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30;
};

export default function App() {
  const [apps, setApps] = useState<SaaSApp[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<SaaSApp | null>(null);
  const [showServicesPriceList, setShowServicesPriceList] = useState<boolean>(false);
  const [selectedToolForFeedback, setSelectedToolForFeedback] = useState<SaaSApp | null>(null);

  // Ad carousel variables
  const [ads, setAds] = useState<SaaSAd[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState<number>(0);

  // Fetch ads
  const fetchAds = async () => {
    try {
      const res = await fetch("/api/ads");
      if (res.ok) {
        const data = await res.json();
        setAds(data);
      }
    } catch (e) {
      console.error("Failed to load campaigns", e);
    }
  };

  // Theme Management
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return (localStorage.getItem("vision79-theme") as "light" | "dark") || "dark";
    } catch (e) {
      return "dark";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("vision79-theme", theme);
    } catch (e) {}
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");

  // Counter animation tracking keys
  const [pulsingAppId, setPulsingAppId] = useState<number | null>(null);

  // Fetch applications list
  const fetchApps = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch("/api/apps");
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setApps(data);
    } catch (err: any) {
      console.error("Error fetching apps:", err);
      setErrorMsg(err.message || "Failed to load marketplace applications from standard database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [ads]);

  // Handle Incrementation of dynamic triggers
  const handleAppLaunch = async (app: SaaSApp) => {
    try {
      setPulsingAppId(app.id);
      setTimeout(() => setPulsingAppId(null), 1000);

      const res = await fetch("/api/apps/increment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id })
      });

      if (!res.ok) {
        throw new Error("Failed to record launch metric.");
      }

      const updatedRow = await res.json();
      setApps(apps.map(a => a.id === app.id ? updatedRow : a));

      // Redirect or launch after writing the log metric
      if (app.accessUrl) {
        window.open(app.accessUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      console.error("Increment error:", err);
    }
  };

  const handleAdminRedirect = () => {
    window.location.href = "/admin";
  };

  const handleSelectCategory = (category: CategoryFilter) => {
    setSelectedCategory(category);
    setSelectedCourse(null);
    setShowServicesPriceList(false);
    setSelectedToolForFeedback(null);
  };

  // Filters application dataset logic
  const filteredApps = apps.filter((app) => {
    if (!app) return false;
    const categoryMatches = selectedCategory === "all" || app.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const searchMatches = 
      (app.name || "").toLowerCase().includes(q) ||
      (app.subtitle || "").toLowerCase().includes(q) ||
      (app.description || "").toLowerCase().includes(q);
    return categoryMatches && searchMatches;
  });

  return (
    <div className="flex flex-col min-h-screen border border-app-border bg-app-bg text-app-text selection:bg-app-border/40 antialiased">
      
      {/* PROFESSIONAL POLISH SYSTEM HEADER */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-b-app-border bg-app-header-bg backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedCategory("all"); setSearchQuery(""); setSelectedCourse(null); setShowServicesPriceList(false); setSelectedToolForFeedback(null); }}>
          <div className="w-8 h-8 rounded-md flex items-center justify-center font-black text-xs tracking-tighter bg-app-text text-app-bg">V79</div>
          <span className="font-bold text-lg tracking-tighter text-app-text font-display">VISION79</span>
          <div className="h-4 w-px bg-app-border mx-2"></div>
          <span className="text-xs text-app-text-muted font-mono tracking-widest uppercase">Marketplace</span>
        </div>
        
        <nav className="flex items-center gap-6 text-sm font-medium">
          <button 
            id="btn-explore"
            onClick={() => { setSelectedCategory("all"); setSelectedCourse(null); setShowServicesPriceList(false); setSelectedToolForFeedback(null); }}
            className="transition font-sans text-app-text font-semibold cursor-pointer"
          >
            Explore
          </button>

          {/* Theme Toggle Switcher */}
          <button
            id="btn-theme-toggle"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-app-border bg-app-btn-sec text-app-text hover:bg-app-btn-sec/80 transition-all duration-200 flex items-center justify-center cursor-pointer"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </nav>
      </header>

      {/* MID CONTAINER HOUSING SPLIT-PANEL */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT ASIDE BAR PANEL */}
        <aside className="w-64 border-r border-app-border p-6 flex flex-col gap-6 bg-app-aside-bg shrink-0 hidden md:flex">
          
          {/* SERVICE PRICE LIST NAV */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest font-mono">Solutions</h3>
            <button 
              id="filter-services"
              onClick={() => { setShowServicesPriceList(true); setSelectedCourse(null); setSelectedToolForFeedback(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-250 border text-left text-sm ${
                showServicesPriceList
                  ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-500 dark:text-emerald-400 font-extrabold shadow-sm"
                  : "text-app-text-sec hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-500/[0.04] border-app-border bg-app-btn-sec/20"
              }`}
            >
              <Coins className="w-4 h-4 stroke-[1.8] text-emerald-500 dark:text-emerald-400" />
              <span className="font-semibold">Services</span>
            </button>
          </div>

          {/* CATEGORIES WITH THE LIST OF TOOLS */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest font-mono">Tool Categories</h3>
            <ul className="space-y-1 text-sm">
              <li 
                id="filter-all"
                onClick={() => handleSelectCategory("all")}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                  selectedCategory === "all" && !showServicesPriceList
                    ? "bg-sky-500/10 border border-sky-500/20 text-sky-500 dark:text-sky-400 font-semibold"
                    : "text-app-text-sec hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-500/[0.04] border border-transparent"
                }`}
              >
                <Layers className="w-4 h-4 stroke-[1.8] text-sky-500 dark:text-sky-400" />
                All Tools
              </li>
              <li 
                id="filter-web"
                onClick={() => handleSelectCategory("web")}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                  selectedCategory === "web" && !showServicesPriceList
                    ? "bg-purple-500/10 border border-purple-500/20 text-purple-500 dark:text-purple-400 font-semibold"
                    : "text-app-text-sec hover:text-purple-500 dark:hover:text-purple-400 hover:bg-purple-500/[0.04] border border-transparent"
                }`}
              >
                <Globe className="w-4 h-4 stroke-[1.8] text-purple-500 dark:text-purple-400" />
                Web Apps
              </li>
              <li 
                id="filter-desktop"
                onClick={() => handleSelectCategory("desktop")}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                  selectedCategory === "desktop" && !showServicesPriceList
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 font-semibold"
                    : "text-app-text-sec hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/[0.04] border border-transparent"
                }`}
              >
                <Monitor className="w-4 h-4 stroke-[1.8] text-amber-500 dark:text-amber-400" />
                Desktop
              </li>
              <li 
                id="filter-games"
                onClick={() => handleSelectCategory("games")}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                  selectedCategory === "games" && !showServicesPriceList
                    ? "bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 font-semibold"
                    : "text-app-text-sec hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/[0.04] border border-transparent"
                }`}
              >
                <Gamepad2 className="w-4 h-4 stroke-[1.8] text-rose-500 dark:text-rose-400" />
                Games
              </li>
              <li 
                id="filter-courses"
                onClick={() => handleSelectCategory("courses")}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                  selectedCategory === "courses" && !showServicesPriceList
                    ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-semibold"
                    : "text-app-text-sec hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/[0.04] border border-transparent"
                }`}
              >
                <GraduationCap className="w-4 h-4 stroke-[1.8] text-indigo-500 dark:text-indigo-400" />
                Courses
              </li>
            </ul>
          </div>

          {/* Golden Rating Callout Widget */}
          <div className="mt-auto p-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.03] space-y-2">
            <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
              <Star className="w-4.5 h-4.5 fill-amber-500 text-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-wide font-mono">Per-Tool Ratings</span>
            </div>
            <p className="text-[10px] text-app-text-sec leading-relaxed">
              Click on any tool, course, or game card to read community comments, submit suggestions, and rate its onboarding with gold stars!
            </p>
          </div>

        </aside>

        {/* RIGHT CORE CONTENT WRAPPER */}
        <main className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <div className="p-6 sm:p-10 flex-1">
            
            <AnimatePresence mode="wait">
              {showServicesPriceList ? (
                <motion.div
                  key="services-price-list-view"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                >
                  <ServicesPriceList 
                    onBack={() => setShowServicesPriceList(false)}
                  />
                </motion.div>
              ) : selectedToolForFeedback ? (
                <motion.div
                  key="onboarding-feedback-view"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                >
                  <OnboardingFeedback 
                    app={selectedToolForFeedback}
                    onBack={() => setSelectedToolForFeedback(null)}
                  />
                </motion.div>
              ) : selectedCourse ? (
                <motion.div
                  key="course-detail-view"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                >
                  <CourseDetailPage 
                    course={selectedCourse}
                    onBack={() => setSelectedCourse(null)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="explore"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-8"
                >
                  {/* Hero Text Block */}
                  <div className="flex flex-col gap-1.5 max-w-3xl">
                    <h1 className="text-4xl font-extrabold tracking-tight font-display text-app-text dark:text-white">
                      Discover the Stack.
                    </h1>
                    <p className="text-app-text-sec text-base font-light leading-snug">
                      High-performance tools, custom-built applications, and enterprise ICT solutions designed to power Saint Lucian enterprises.
                    </p>
                  </div>

                  {/* PROFESSIONAL ABOUT VISION79 SHOWCASE CARD */}
                  <div className="p-6 sm:p-8 rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.02] relative overflow-hidden space-y-6 shadow-xl">
                    {/* Visual gradients */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-65 h-65 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-app-border/45">
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                            Saint Lucia Premium Managed Service Provider
                          </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-app-text dark:text-white tracking-tight leading-tight">
                          VISION79 ICT Systems Integration
                        </h2>
                        <p className="text-xs sm:text-sm text-app-text-sec font-light leading-relaxed">
                          We design resilient, high-availability system architecture, secure digital assets against advanced threat vectors, and provide flawless proactive support for Saint Lucian enterprises and Caribbean SMEs.
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 w-full sm:w-auto">
                        <a 
                          href="tel:+17587260035"
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md border border-indigo-500 cursor-pointer text-center"
                        >
                          📞 Call <strong className="font-extrabold">VISION79</strong>: 1 758 726 0035
                        </a>
                        <a 
                          href="mailto:vision79slu@gmail.com"
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all border border-zinc-700 cursor-pointer text-center font-mono"
                        >
                          ✉️ vision79slu@gmail.com
                        </a>
                      </div>
                    </div>

                    {/* Breakdown of core services with beautiful hover interaction */}
                    <div className="relative z-10 space-y-3.5">
                      <span className="text-[10px] font-mono uppercase font-extrabold text-indigo-400/80 tracking-widest block">
                        Our ICT Services Portfolio:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl border border-app-border bg-app-aside-bg/30 space-y-2 hover:border-indigo-500/35 hover:bg-indigo-500/[0.02] transition duration-300">
                          <div className="text-xl">🛡️</div>
                          <h4 className="font-bold text-xs text-app-text dark:text-white uppercase tracking-wider font-mono">Managed Support</h4>
                          <p className="text-[11px] text-app-text-sec leading-relaxed font-light">
                            Proactive 24/7 endpoint monitoring, remote desktop support desk, and prompt on-site diagnostics to minimize operational downtime.
                          </p>
                        </div>
                        <div className="p-4 rounded-xl border border-app-border bg-app-aside-bg/30 space-y-2 hover:border-emerald-500/35 hover:bg-emerald-500/[0.02] transition duration-300">
                          <div className="text-xl">☁️</div>
                          <h4 className="font-bold text-xs text-app-text dark:text-white uppercase tracking-wider font-mono">Cloud Backup Nodes</h4>
                          <p className="text-[11px] text-app-text-sec leading-relaxed font-light">
                            Redundant automated cloud storage clusters, hot-site disaster recovery strategies, and safe databases.
                          </p>
                        </div>
                        <div className="p-4 rounded-xl border border-app-border bg-app-aside-bg/30 space-y-2 hover:border-amber-500/35 hover:bg-amber-500/[0.02] transition duration-300">
                          <div className="text-xl">🔒</div>
                          <h4 className="font-bold text-xs text-app-text dark:text-white uppercase tracking-wider font-mono">Cyber Security</h4>
                          <p className="text-[11px] text-app-text-sec leading-relaxed font-light">
                            Advanced endpoint threat defense, active network vulnerability audits, local registry compliance, and perimeter security.
                          </p>
                        </div>
                        <div className="p-4 rounded-xl border border-app-border bg-app-aside-bg/30 space-y-2 hover:border-rose-500/35 hover:bg-rose-500/[0.02] transition duration-300">
                          <div className="text-xl">💻</div>
                          <h4 className="font-bold text-xs text-app-text dark:text-white uppercase tracking-wider font-mono">SaaS Engineering</h4>
                          <p className="text-[11px] text-app-text-sec leading-relaxed font-light">
                            Engineered high-performance cloud databases, custom desktop executables, responsive web applications, and web integration.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                {/* PROMOTION ADS HERO CAROUSEL */}
                {ads.length > 0 && (
                  <div className="relative overflow-hidden rounded-2xl border border-app-border bg-app-aside-bg/40 shadow-lg group">
                    <div className="relative h-[340px] sm:h-[180px] w-full select-none">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentAdIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          onClick={() => {
                            const link = ads[currentAdIndex]?.linkUrl;
                            if (link && (link.startsWith("course:") || link.includes("/courses/"))) {
                              const courseIdStr = link.split("/").pop()?.split(":").pop();
                              const foundCourse = apps.find(a => a.id === Number(courseIdStr));
                              if (foundCourse) {
                                setSelectedCourse(foundCourse);
                                setShowServicesPriceList(false);
                              }
                            } else if (link && (link === "/services-pricing" || link.includes("service") || link.includes("pricing"))) {
                              setShowServicesPriceList(true);
                              setSelectedCourse(null);
                            } else if (link) {
                              window.open(link, "_blank", "noopener,noreferrer");
                            }
                          }}
                          className="absolute inset-0 flex flex-col sm:flex-row items-stretch cursor-pointer"
                        >
                          {/* Image side */}
                          <div className="relative w-full sm:w-2/5 h-48 sm:h-full bg-cover bg-center shrink-0 border-b sm:border-b-0 sm:border-r border-app-border overflow-hidden bg-zinc-800">
                            <img 
                              src={ads[currentAdIndex].imageUrl} 
                              alt={ads[currentAdIndex].title} 
                              className="w-full h-full object-cover group-hover:scale-102 transition duration-700" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded border border-white/20 text-[8px] font-mono font-bold tracking-widest text-emerald-400 uppercase flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Spotlight
                            </div>
                          </div>

                          {/* Content side */}
                          <div className="p-6 flex-1 flex flex-col justify-center space-y-2 bg-gradient-to-r from-app-aside-bg/10 to-app-aside-bg/30 relative">
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-500 font-semibold tracking-wider uppercase">
                              <Megaphone className="w-3.5 h-3.5" />
                              <span>Featured Solution</span>
                            </div>
                            <h2 className="text-xl font-bold tracking-tight text-app-text font-display leading-tight">
                              {ads[currentAdIndex].title}
                            </h2>
                            <p className="text-xs text-app-text-sec font-light max-w-xl leading-relaxed">
                              {ads[currentAdIndex].subtitle}
                            </p>
                            <div className="pt-2 text-[10px] font-mono text-app-text-muted group-hover:text-indigo-400 transition flex items-center gap-1.5">
                              Learn more <span className="text-xs">→</span>
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Navigation overrides */}
                    {ads.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentAdIndex((prev) => (prev - 1 + ads.length) % ads.length);
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border border-app-border bg-app-bg/80 text-app-text backdrop-blur-md hover:bg-app-btn-sec/90 cursor-pointer opacity-0 group-hover:opacity-100 transition duration-200"
                          title="Previous slide"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentAdIndex((prev) => (prev + 1) % ads.length);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border border-app-border bg-app-bg/80 text-app-text backdrop-blur-md hover:bg-app-btn-sec/90 cursor-pointer opacity-0 group-hover:opacity-100 transition duration-200"
                          title="Next slide"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        <div className="absolute bottom-3 right-6 flex items-center gap-1.5">
                          {ads.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentAdIndex(idx);
                              }}
                              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                                idx === currentAdIndex ? "bg-indigo-500 w-3" : "bg-app-text-muted/40"
                              }`}
                              title={`Go to slide ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Enhanced Search Input */}
                <div className="relative flex items-center max-w-2xl">
                  <Search className="absolute left-4 text-app-text-muted w-5 h-5 placeholder-muted" />
                  <input 
                    id="search-input"
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                    placeholder="Search tools, databases, frameworks, and extensions..." 
                    className="w-full bg-app-input border border-app-input-border rounded-full py-3.5 pl-12 pr-6 text-sm focus:outline-none focus:ring-1 focus:ring-app-border focus:border-app-border transition-all text-app-text placeholder:text-app-text-muted/60"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 text-app-text-muted hover:text-app-text text-xs font-mono font-bold cursor-pointer"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                {/* Apps Grid Layout */}
                <div className="pt-2">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[1, 2, 3].map((placeholder) => (
                        <div key={placeholder} className="glass p-5 rounded-2xl h-60 animate-pulse flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="w-12 h-12 bg-app-border/60 rounded-xl" />
                            <div className="h-4 bg-app-border/50 rounded w-2/3" />
                            <div className="h-3 bg-app-border/50 rounded w-1/2" />
                          </div>
                          <div className="h-9 bg-app-border/60 rounded w-full" />
                        </div>
                      ))}
                    </div>
                  ) : errorMsg ? (
                    <div className="text-center py-12 glass rounded-2xl border-app-border space-y-3">
                      <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                      <p className="text-xs text-app-text-muted font-mono">{errorMsg}</p>
                      <button onClick={fetchApps} className="px-3 py-1.5 bg-app-btn-sec border border-app-border rounded text-xs text-app-text">
                        Retry Sync
                      </button>
                    </div>
                  ) : filteredApps.length === 0 ? (
                    <div className="text-center py-16 bg-app-aside-bg rounded-2xl border border-app-border space-y-3 text-app-text-sec">
                      <Package className="w-10 h-10 mx-auto text-app-text-muted" />
                      <p className="text-sm">No SaaS matches your filter settings.</p>
                      <button 
                        onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
                        className="px-3 py-1 text-xs border border-app-border rounded bg-app-btn-sec text-app-text hover:bg-app-btn-sec/80 cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredApps.map((app, idx) => {
                        const isPulsing = pulsingAppId === app.id;
                        const isWeb = app.category === "web";
                        const isCourse = app.category === "courses";
                        
                        const priceNum = app.price !== undefined && app.price !== null ? Number(app.price) : 0;
                        const hasPromo = isCourse && isPromoActive(app);
                        const promoPriceNum = priceNum * 0.5;

                        const pricingText = 
                          isCourse ? (priceNum > 0 ? `$${priceNum.toFixed(2)}` : "Free Masterclass") :
                          app.pricingType === "free" ? "Free" : 
                          app.pricingType === "free_trial" ? (priceNum > 0 ? `Trial / $${priceNum.toFixed(2)}` : "Free Trial") : 
                          (priceNum > 0 ? `$${priceNum.toFixed(2)}` : "Subscription");

                        let badgeColor = "bg-app-btn-sec text-app-text-sec border border-app-border";
                        if (app.category === "desktop") {
                          badgeColor = "bg-blue-600/10 text-blue-500 font-medium border border-blue-500/20";
                        } else if (app.category === "games") {
                          badgeColor = "bg-amber-600/10 text-amber-500 font-medium border border-amber-500/20";
                        } else if (app.category === "courses") {
                          badgeColor = "bg-violet-600/10 text-violet-500 font-bold border border-violet-500/20";
                        }

                        return (
                          <div 
                            key={app.id !== undefined && app.id !== null ? app.id : `fallback-${idx}`}
                            onClick={() => {
                              if (isCourse) {
                                setSelectedCourse(app);
                              } else {
                                setSelectedToolForFeedback(app);
                              }
                            }}
                            className="glass p-5 rounded-2xl flex flex-col justify-between gap-4 group hover:border-app-text/30 transition-all duration-300 shadow-sm hover:shadow cursor-pointer hover:shadow-lg hover:bg-indigo-500/[0.01]"
                          >
                            <div className="space-y-4">
                              {/* Top Badges */}
                              <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-app-btn-sec rounded-xl flex items-center justify-center border border-app-border">
                                  <AppLogo logoUrl={app.logoUrl} />
                                </div>
                                <div className="flex flex-col items-end gap-1 font-mono">
                                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${badgeColor}`}>
                                    {isCourse ? "Course 📚" : app.category}
                                  </span>
                                  {hasPromo ? (
                                    <span className="flex flex-col items-end gap-0.5">
                                      <span className="text-[9px] line-through text-app-text-muted font-mono">
                                        ${priceNum.toFixed(2)}
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 border rounded uppercase bg-emerald-500/15 text-emerald-400 border-emerald-500/25 font-bold font-mono animate-pulse">
                                        🔥 ${promoPriceNum.toFixed(2)} (50% OFF)
                                      </span>
                                    </span>
                                  ) : (
                                    <span className={`text-[10px] px-2 py-0.5 border rounded uppercase ${
                                      isCourse 
                                        ? "bg-violet-500/10 text-violet-500 border-violet-500/20 font-bold font-mono" 
                                        : "border-app-border bg-app-btn-sec/50 text-app-text-muted"
                                    }`}>
                                      {pricingText}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Content titles */}
                              <div>
                                <h4 className="font-bold text-app-text group-hover:text-indigo-400 transition font-display text-base tracking-tight">
                                  {app.name}
                                </h4>
                                <p className="text-[11px] text-app-text-sec font-mono mt-1 tracking-wide leading-tight">
                                  {app.subtitle}
                                </p>
                                
                                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-500 font-mono">
                                  <div className="flex items-center gap-0.5 text-yellow-500">
                                    <Star className="w-3 h-3 fill-current text-yellow-500" />
                                    <span className="font-bold">
                                      {app.rating > 0 ? app.rating.toFixed(1) : "New"}
                                    </span>
                                  </div>
                                  <span className="text-app-text-muted select-none">•</span>
                                  <span className="text-app-text-muted hover:underline transition">
                                    {isCourse ? `By ${app.instructor || "Expert Professor"}` : "Onboarding & Reviews"}
                                  </span>
                                </div>

                                <p className="text-xs text-app-text-muted mt-2.5 line-clamp-3 leading-relaxed">
                                  {app.description}
                                </p>
                              </div>
                            </div>

                            {/* Footer count action button block */}
                            <div className="flex items-center justify-between pt-1.5 border-t border-app-border/40 mt-2">
                              <div className="flex items-center space-x-1 font-mono text-[10px] text-app-text-sec">
                                <span className="font-semibold">{(app.launchCount !== undefined && app.launchCount !== null ? app.launchCount : 0).toLocaleString()}</span>
                                <span className="text-app-text-muted font-normal">
                                  {isCourse ? "Students" : isWeb ? "Launches" : "Downloads"}
                                </span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isCourse) {
                                    setSelectedCourse(app);
                                  } else {
                                    handleAppLaunch(app);
                                  }
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                                  isCourse 
                                    ? "bg-violet-600 text-white hover:bg-violet-500" 
                                    : isPulsing
                                    ? "bg-app-text text-app-bg scale-95 opacity-80"
                                    : "bg-app-text text-app-bg hover:opacity-90"
                                }`}
                              >
                                {isCourse ? "Study Class 🎓" : app.pricingType === "premium" ? "Subscribe 🔒" : isWeb ? "Launch ↗" : "Download ↓"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* SYSTEM FOOTER OF DESIGN SPEC */}
          <footer className="h-10 border-t border-app-border bg-app-header-bg flex items-center justify-between px-8 text-[10px] text-app-text-sec font-mono uppercase tracking-[0.2em] shrink-0 mt-auto">
            <div className="flex items-center gap-4">
              <span>System Status</span>
              <div className="flex items-center gap-2 text-app-text font-bold">
                <div className="status-dot"></div> Operational
              </div>
            </div>
            <div className="flex items-center gap-6 hidden sm:flex">
              <span>© 2026 VISION79 INC</span>
              <span>Secure Layer</span>
              <span>Terms API</span>
            </div>
          </footer>
        </main>

      </div>
    </div>
  );
}
