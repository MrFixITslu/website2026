import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import {
  Sun, Moon, Menu, X, Search, Package, AlertTriangle,
  ChevronLeft, ChevronRight, ChevronDown, Megaphone, Star,
} from "lucide-react";
import HomePage from "./components/HomePage";
import AboutPage from "./components/AboutPage";
import ServicesPage from "./components/ServicesPage";
import IndustriesPage from "./components/IndustriesPage";
import ResourcesPage from "./components/ResourcesPage";
import ContactPage from "./components/ContactPage";
import { SaaSApp, SaaSAd, CategoryFilter } from "./types";
import { AppLogo } from "./components/AppLogo";
import { AppCardSkeleton, SectionLoadingFallback } from "./components/ui/Skeleton";

// Lazy-loaded: only needed once a user actually opens a course or tool
// feedback flow, not on initial marketing-site paint. CourseDetailPage
// alone pulls in the 950-line CourseCertification module, so this keeps
// that entirely out of the bundle everyone downloads to see the homepage.
const CourseDetailPage = lazy(() =>
  import("./components/CourseDetailPage").then(m => ({ default: m.CourseDetailPage }))
);
const OnboardingFeedback = lazy(() =>
  import("./components/OnboardingFeedback").then(m => ({ default: m.OnboardingFeedback }))
);

const isPromoActive = (app: SaaSApp) => {
  if (app.category !== "courses" || !app.createdAt) return false;
  const diff = Math.abs(new Date().getTime() - new Date(app.createdAt).getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) <= 30;
};

function getCourseIdFromUrl(): number | null {
  const match = window.location.pathname.match(/^\/course\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

const SECTIONS = [
  { id: "home", label: "Home", subItems: [
    { id: "services-overview", label: "What We Do" },
    { id: "why-v79", label: "Why Choose V79" },
    { id: "cost-of-downtime", label: "Cost of Downtime" },
    { id: "testimonials", label: "Client Stories" },
    { id: "free-assessment", label: "ICT Health Assessment" },
  ]},
  { id: "about", label: "About" },
  { id: "services", label: "Services", subItems: [
    { id: "managed-it", label: "Managed IT Services" },
    { id: "cloud", label: "Cloud Solutions" },
    { id: "software", label: "Custom Software" },
    { id: "ai-automation", label: "AI Automation" },
    { id: "networking", label: "Network & VoIP" },
    { id: "cybersecurity", label: "Cybersecurity" },
    { id: "assessment", label: "ICT Health Assessment" },
  ]},
  { id: "industries", label: "Industries" },
  { id: "solutions", label: "Solutions" },
  { id: "resources", label: "Resources" },
  { id: "contact", label: "Contact" },
];

// The subset of Services sub-items that are actual accordion cards in
// ServicesPage (as opposed to "assessment", which is always-visible
// content with nothing to expand). Clicking one of these in the nav should
// open its card automatically, not just scroll to its still-collapsed header.
const SERVICE_ACCORDION_IDS = ["managed-it", "cloud", "software", "ai-automation", "networking", "cybersecurity"];

export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Which top-level nav item's sub-menu is currently open (desktop dropdown
  // or mobile accordion) — null means none open. Only one at a time.
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  // Nav-triggered jumps use a brief fade-to-background / fade-in instead of
  // a visible scroll: the jump itself happens instantly while the overlay
  // is fully opaque, so fast-moving content never flashes past on screen —
  // an eased scroll animation still shows that motion no matter how it's
  // tuned, since it's still a real scroll the eye has to track. This is a
  // clean dissolve from one section straight to the next instead.
  const [navTransitioning, setNavTransitioning] = useState(false);
  // Which service accordion card in ServicesPage is expanded. Lifted up
  // here (rather than local state inside ServicesPage) so clicking a
  // specific service in the Services dropdown — e.g. "Cloud Solutions" —
  // can open that exact card automatically, instead of just scrolling to
  // its (still collapsed) header and making the user click it again.
  const [openServiceId, setOpenServiceId] = useState<string | null>("managed-it");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try { return (localStorage.getItem("vision79-theme") as "light" | "dark") || "dark"; }
    catch { return "dark"; }
  });

  // Solutions marketplace state
  const [apps, setApps] = useState<SaaSApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<SaaSApp | null>(null);
  const [selectedToolForFeedback, setSelectedToolForFeedback] = useState<SaaSApp | null>(null);
  const [ads, setAds] = useState<SaaSAd[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [pulsingAppId, setPulsingAppId] = useState<number | null>(null);

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

  // Deep-link support: /course/123 selects the course and scrolls to Solutions
  useEffect(() => {
    if (apps.length === 0) return;
    const courseId = getCourseIdFromUrl();
    if (courseId !== null && !selectedCourse) {
      const match = apps.find(a => a.id === courseId && a.category === "courses");
      if (match) {
        setSelectedCourse(match);
        setActiveSection("solutions");
        requestAnimationFrame(() => scrollTo("solutions"));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const filteredApps = apps.filter(app => {
    if (!app) return false;
    const catOk = selectedCategory === "all" || app.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const textOk = [(app.name || ""), (app.subtitle || ""), (app.description || "")]
      .some(s => s.toLowerCase().includes(q));
    return catOk && textOk;
  });

  // Keep nav highlight in sync while the user scrolls, not just on click
  useEffect(() => {
    const sectionEls = SECTIONS
      .map(s => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sectionEls.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-72px 0px -60% 0px", threshold: [0.1, 0.25, 0.5, 0.75] }
    );
    sectionEls.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Close an open dropdown when clicking outside it, or pressing Escape
  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openDropdown]);

  // parentId: when scrolling to a sub-anchor (e.g. a specific service card),
  // pass its top-level parent's id so the nav highlight stays glued to the
  // right top-level item immediately, rather than briefly going blank until
  // the scroll-spy above catches up once the smooth-scroll settles.
  const NAV_FADE_IN_MS = 200;
  const NAV_FADE_OUT_MS = 260;

  const navTransitionSeq = useRef(0);

  const scrollTo = (id: string, parentId?: string) => {
    setActiveSection(parentId || id);
    setMobileNavOpen(false);
    setOpenDropdown(null);
    setMobileExpanded(null);

    // Jumping straight to a specific service (e.g. "Cloud Solutions" from
    // the Services dropdown) should land with that card already open —
    // otherwise the user has to click it again after arriving, which
    // defeats the point of a direct link to it.
    if (SERVICE_ACCORDION_IDS.includes(id)) {
      setOpenServiceId(id);
    }

    // If a nav item is clicked again before a prior transition finished
    // (e.g. clicking two different sections in quick succession), only the
    // LAST click should actually jump/fade-out — otherwise the first
    // click's queued jump can land and flash briefly before the second
    // click's jump overwrites it.
    const requestId = ++navTransitionSeq.current;

    const jump = () => {
      const el = document.getElementById(id);
      if (el) {
        const topPos = el.getBoundingClientRect().top + window.pageYOffset - 72;
        window.scrollTo(0, topPos); // instant — hidden behind the fade overlay
      }
    };

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      jump();
      return;
    }

    setNavTransitioning(true);
    window.setTimeout(() => {
      if (navTransitionSeq.current !== requestId) return; // superseded by a newer click
      jump();
      // Give the browser a frame to actually paint the new scroll position
      // before starting the fade-out, or the reveal can catch the tail end
      // of the jump rather than a clean, already-settled destination.
      requestAnimationFrame(() => {
        if (navTransitionSeq.current === requestId) setNavTransitioning(false);
      });
    }, NAV_FADE_IN_MS);
  };

  const isSectionActive = (sec: typeof SECTIONS[number]) =>
    activeSection === sec.id || (sec.subItems?.some(si => si.id === activeSection) ?? false);

  return (
    <MotionConfig reducedMotion="user">
    <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden bg-app-bg text-app-text antialiased selection:bg-v79-teal/20 selection:text-v79-teal">
      {/* Nav transition overlay: fades to the page background, jumps the
          scroll position instantly while fully opaque, then fades back in
          — so a nav click never shows content flying past mid-scroll.
          Starts below the header (top-16 matches the header's h-16) so the
          sticky header itself never gets covered/flickers during a
          transition — it should feel like a fixed anchor, not something
          that disappears every time you click a nav link. */}
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{ opacity: navTransitioning ? 1 : 0 }}
        transition={{ duration: (navTransitioning ? NAV_FADE_IN_MS : NAV_FADE_OUT_MS) / 1000, ease: "easeInOut" }}
        className="fixed top-16 inset-x-0 bottom-0 z-[45] bg-app-bg pointer-events-none"
      />
      {/* Apple-inspired Sticky Header */}
      <header className="h-16 flex items-center justify-between px-6 lg:px-12 border-b border-app-border bg-app-header-bg/90 backdrop-blur-xl fixed top-0 inset-x-0 z-50">
        <button onClick={() => scrollTo("home")} className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs tracking-tighter bg-v79-coral text-white shadow-md shadow-v79-coral/20 group-hover:scale-105 transition-transform">V79</div>
          <span className="font-display tracking-tight text-app-text uppercase">
            <span className="font-bold text-sm sm:text-base">VISION79 DIGITAL</span>
            <span className="font-normal text-xs sm:text-sm text-app-text-sec"> | ICT SOLUTIONS</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav ref={navRef} className="hidden md:flex items-center gap-1.5">
          {SECTIONS.map(sec => {
            const active = isSectionActive(sec);
            const hasSubItems = !!sec.subItems?.length;
            return (
              <div key={sec.id} className="relative">
                <div
                  className={`relative flex items-center rounded-lg cursor-pointer focus-within:ring-2 focus-within:ring-v79-teal/50 ${
                    active ? "text-v79-teal font-bold" : "text-app-text-sec hover:text-app-text"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 bg-v79-teal/10 rounded-lg"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {!active && (
                    <span className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 bg-app-aside-bg transition-opacity" />
                  )}
                  <button
                    onClick={() => scrollTo(sec.id)}
                    className="relative z-10 pl-3.5 pr-1.5 py-1.5 text-xs font-semibold tracking-wide cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded-lg"
                  >
                    {sec.label}
                  </button>
                  {hasSubItems && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(p => (p === sec.id ? null : sec.id));
                      }}
                      aria-label={`${sec.label} sub-sections`}
                      aria-expanded={openDropdown === sec.id}
                      className="relative z-10 pl-0.5 pr-2.5 py-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded-lg"
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === sec.id ? "rotate-180" : ""}`} />
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {hasSubItems && openDropdown === sec.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1.5 min-w-[210px] bg-app-header-bg border border-app-border rounded-xl shadow-2xl p-1.5 z-50"
                    >
                      {sec.subItems!.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => scrollTo(sub.id, sec.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold tracking-wide cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 ${
                            activeSection === sub.id
                              ? "text-v79-teal bg-v79-teal/10"
                              : "text-app-text-sec hover:text-app-text hover:bg-app-aside-bg"
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          <button
            onClick={() => setTheme(p => p === "dark" ? "light" : "dark")}
            className="ml-3 p-2 rounded-lg border border-app-border bg-app-btn-sec text-app-text hover:bg-app-btn-sec/80 transition-all cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-v79-coral-light" /> : <Moon className="w-4 h-4 text-v79-teal" />}
          </button>
        </nav>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={() => setTheme(p => p === "dark" ? "light" : "dark")} className="p-2 rounded-lg border border-app-border bg-app-btn-sec cursor-pointer">
            {theme === "dark" ? <Sun className="w-4 h-4 text-v79-coral-light" /> : <Moon className="w-4 h-4 text-v79-teal" />}
          </button>
          <button onClick={() => { setMobileNavOpen(p => !p); setMobileExpanded(null); }} className="relative p-2 rounded-lg border border-app-border bg-app-btn-sec cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50">
            <AnimatePresence mode="wait" initial={false}>
              {mobileNavOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="block"
                >
                  <X className="w-4 h-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="block"
                >
                  <Menu className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
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
            className="md:hidden fixed top-16 left-0 right-0 z-40 bg-app-header-bg/95 backdrop-blur-2xl border-b border-app-border p-5 flex flex-col gap-2 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            {SECTIONS.map(sec => {
              const active = isSectionActive(sec);
              const hasSubItems = !!sec.subItems?.length;
              const expanded = mobileExpanded === sec.id;
              return (
                <div key={sec.id}>
                  <div
                    className={`relative flex items-center rounded-xl ${
                      active ? "text-v79-teal font-bold" : "text-app-text-sec hover:text-app-text hover:bg-app-aside-bg transition-colors"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-active-pill-mobile"
                        className="absolute inset-0 bg-v79-teal/15 rounded-xl"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <button
                      onClick={() => scrollTo(sec.id)}
                      className="relative z-10 flex-1 px-4 py-3 text-sm font-semibold text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded-xl"
                    >
                      {sec.label}
                    </button>
                    {hasSubItems && (
                      <button
                        onClick={() => setMobileExpanded(p => (p === sec.id ? null : sec.id))}
                        aria-label={`${sec.label} sub-sections`}
                        aria-expanded={expanded}
                        className="relative z-10 px-4 py-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded-xl"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {hasSubItems && expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-3"
                      >
                        {sec.subItems!.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => scrollTo(sub.id, sec.id)}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 ${
                              activeSection === sub.id
                                ? "text-v79-teal font-semibold"
                                : "text-app-text-muted hover:text-app-text hover:bg-app-aside-bg"
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continuous One-Page Apple-Inspired Flow */}
      <main className="flex-1 space-y-32 pb-24 pt-16">
        <section id="home" className="scroll-mt-20">
          <HomePage onNavigate={(v) => scrollTo(SECTIONS.some(s => s.id === v) ? v : "services")} />
        </section>

        <div className="w-full max-w-7xl mx-auto px-6"><div className="h-px bg-gradient-to-r from-transparent via-app-border to-transparent" /></div>

        <section id="about" className="scroll-mt-20">
          <AboutPage />
        </section>

        <div className="w-full max-w-7xl mx-auto px-6"><div className="h-px bg-gradient-to-r from-transparent via-app-border to-transparent" /></div>

        <section id="services" className="scroll-mt-20">
          <ServicesPage
            onNavigate={(v) => scrollTo(SECTIONS.some(s => s.id === v) ? v : "services")}
            openId={openServiceId}
            setOpenId={setOpenServiceId}
          />
        </section>

        <div className="w-full max-w-7xl mx-auto px-6"><div className="h-px bg-gradient-to-r from-transparent via-app-border to-transparent" /></div>

        <section id="industries" className="scroll-mt-20">
          <IndustriesPage onNavigate={(v) => scrollTo(SECTIONS.some(s => s.id === v) ? v : "industries")} />
        </section>

        <div className="w-full max-w-7xl mx-auto px-6"><div className="h-px bg-gradient-to-r from-transparent via-app-border to-transparent" /></div>

        <section id="solutions" className="scroll-mt-20 max-w-7xl mx-auto px-6 lg:px-12 w-full">
          <AnimatePresence mode="wait">
            {selectedToolForFeedback ? (
              <motion.div key="feedback" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}>
                <Suspense fallback={<SectionLoadingFallback />}>
                  <OnboardingFeedback app={selectedToolForFeedback} onBack={() => setSelectedToolForFeedback(null)} />
                </Suspense>
              </motion.div>
            ) : selectedCourse ? (
              <motion.div key="course" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}>
                <Suspense fallback={<SectionLoadingFallback />}>
                  <CourseDetailPage course={selectedCourse} onBack={() => setSelectedCourse(null)} />
                </Suspense>
              </motion.div>
            ) : (
              <motion.div key="explore" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="space-y-8">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">Products & Solutions</span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-app-text dark:text-white">Our Software & Marketplace</h2>
                  <p className="text-app-text-sec text-sm font-light">Our SaaS tools, courses, and specialized platforms — all in one place.</p>
                </div>

                {/* Solutions Quick Links */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: "V79 Academy", desc: "Courses, certifications, masterclasses", action: () => { window.location.href = "https://v79academy.v79sl.duckdns.org/academy"; }, classes: "hover:border-violet-500/30 hover:bg-violet-500/[0.02]", textClasses: "group-hover:text-violet-400" },
                    { label: "V79 App Marketplace", desc: "Web apps, desktop tools, and games", action: () => { setSelectedCategory("all"); scrollTo("app-marketplace-grid"); }, classes: "hover:border-indigo-500/30 hover:bg-indigo-500/[0.02]", textClasses: "group-hover:text-indigo-400" },
                  ].map(s => (
                    <button key={s.label} onClick={s.action} className={`glass p-5 rounded-2xl border border-app-border text-left space-y-1.5 transition-all cursor-pointer group ${s.classes}`}>
                      <div className={`text-xs font-bold font-display text-app-text dark:text-white transition ${s.textClasses}`}>{s.label}</div>
                      <div className="text-[11px] text-app-text-sec font-light">{s.desc}</div>
                    </button>
                  ))}
                </div>

                {ads.length > 0 && (
                  <div className="relative overflow-hidden rounded-2xl border border-app-border bg-app-aside-bg/40 shadow-lg group">
                    <div className="relative h-[200px] sm:h-[160px] w-full select-none">
                      <AnimatePresence mode="wait">
                        <motion.div key={currentAdIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
                          onClick={() => { const link = ads[currentAdIndex]?.linkUrl; if (link?.includes("service") || link === "/services-pricing") scrollTo("services"); else if (link) window.open(link, "_blank", "noopener,noreferrer"); }}
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

                <div id="app-marketplace-grid" className="scroll-mt-24">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[1, 2, 3].map(n => <AppCardSkeleton key={n} />)}
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
                                  <span className="font-bold text-yellow-500">{app.rating || 0}</span>
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
        </section>

        <div className="w-full max-w-7xl mx-auto px-6"><div className="h-px bg-gradient-to-r from-transparent via-app-border to-transparent" /></div>

        <section id="resources" className="scroll-mt-20">
          <ResourcesPage onNavigate={(v) => scrollTo(SECTIONS.some(s => s.id === v) ? v : "resources")} />
        </section>

        <div className="w-full max-w-7xl mx-auto px-6"><div className="h-px bg-gradient-to-r from-transparent via-app-border to-transparent" /></div>

        <section id="contact" className="scroll-mt-20">
          <ContactPage />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-app-border bg-v79-navy dark:bg-v79-navy-dark py-12 px-6 lg:px-12 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-white/10">
          <div className="space-y-3 col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs bg-v79-coral text-white">V79</div>
              <span className="font-bold text-base font-display text-white tracking-tight uppercase">VISION79 DIGITAL | ICT SOLUTIONS</span>
            </div>
            <p className="text-xs text-white/60 font-light max-w-sm leading-relaxed">
              World-class managed IT, cybersecurity, cloud infrastructure, and software development for businesses across Saint Lucia and the Eastern Caribbean.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">Services</div>
            <ul className="space-y-1.5 text-white/60 font-light">
              <li><button onClick={() => scrollTo("services")} className="hover:text-v79-teal-light transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded">Cybersecurity</button></li>
              <li><button onClick={() => scrollTo("services")} className="hover:text-v79-teal-light transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded">Cloud & Backup</button></li>
              <li><button onClick={() => scrollTo("services")} className="hover:text-v79-teal-light transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded">Managed IT Support</button></li>
              <li><button onClick={() => scrollTo("services")} className="hover:text-v79-teal-light transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded">Custom Software</button></li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">Industries</div>
            <ul className="space-y-1.5 text-white/60 font-light">
              <li><button onClick={() => scrollTo("industries")} className="hover:text-v79-teal-light transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded">Small Business</button></li>
              <li><button onClick={() => scrollTo("industries")} className="hover:text-v79-teal-light transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded">Government</button></li>
              <li><button onClick={() => scrollTo("industries")} className="hover:text-v79-teal-light transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded">Healthcare</button></li>
              <li><button onClick={() => scrollTo("industries")} className="hover:text-v79-teal-light transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded">Hospitality</button></li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">Company</div>
            <ul className="space-y-1.5 text-white/60 font-light">
              {SECTIONS.filter(s => ["about", "resources", "contact"].includes(s.id)).map(s => (
                <li key={s.id}>
                  <button onClick={() => scrollTo(s.id)} className="hover:text-v79-teal-light transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded">{s.label}</button>
                </li>
              ))}
              <li>Castries, Saint Lucia</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 pb-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-white/60 font-light border-b border-white/10">
          <div>Phone: <a href="tel:+17587260035" className="text-v79-teal-light hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded">+1 758 726 0035</a></div>
          <span className="hidden sm:block text-white/20">|</span>
          <div>Email: <a href="mailto:vision79slu@gmail.com" className="text-v79-teal-light hover:underline font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v79-teal/50 rounded">vision79slu@gmail.com</a></div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-v79-teal-light animate-pulse" />
            <span>System Operational · 99.9% Uptime SLA</span>
          </div>
          <div className="flex items-center gap-4">
            <span>© 2026 VISION79 DIGITAL INC. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
    </MotionConfig>
  );
}
