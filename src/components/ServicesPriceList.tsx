import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  CheckCircle2, 
  HelpCircle, 
  Layers, 
  ShieldCheck, 
  Users, 
  Coins, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Check, 
  Shield, 
  Flame, 
  Info,
  DollarSign,
  AlertCircle,
  Building,
  Globe,
  Mail,
  Copy,
  FileText,
  Smartphone,
  Server,
  Cloud,
  Network,
  Lock,
  ArrowRight,
  BookOpen,
  Calendar,
  Sparkles,
  Search,
  CheckSquare,
  AlertTriangle,
  Play
} from "lucide-react";

interface ServicesPriceListProps {
  onBack: () => void;
}

export function ServicesPriceList({ onBack }: ServicesPriceListProps) {
  // Navigation Tabs for the V79 ICT Solutions Launch Pack - Part 1
  const [activeTab, setActiveTab] = useState<"profile" | "website" | "assessment" | "email">("profile");

  // Currency selector for prices (XCD / USD)
  const [currency, setCurrency] = useState<"XCD" | "USD">("XCD");
  const XCD_TO_USD_PEG = 2.70;

  // Form states for the Assessment booking simulator
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [assessmentStatus, setAssessmentStatus] = useState<"idle" | "success">("idle");

  // Form states for the Outreach Email customizer
  const [emailRecipient, setEmailRecipient] = useState("Business Owner");
  const [emailCompany, setEmailCompany] = useState("Caribbean Enterprise");
  const [emailSender, setEmailSender] = useState("VISION79 ICT Specialist");
  const [copiedState, setCopiedState] = useState(false);

  // Help state toggles
  const [showPromiseDetail, setShowPromiseDetail] = useState(false);

  const getDisplayPrice = (xcdAmount: number) => {
    if (currency === "USD") {
      return `USD ${(xcdAmount / XCD_TO_USD_PEG).toFixed(2)}`;
    }
    return `EC$ ${xcdAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // The Sales Email Template content based on the variables
  const emailSubject = `ICT Business Health Assessment for ${emailCompany}`;
  const emailBodyText = `Hello ${emailRecipient},

I hope you are doing well.

Many Caribbean businesses rely heavily on technology every day, but often do not have the resources to properly manage cybersecurity, backups, user support, and their overall ICT environment.

V79 ICT Solutions helps businesses reduce technology risks by providing professional ICT management, cybersecurity support, Microsoft 365 services, and network solutions.

We are offering an ICT Business Health Assessment designed to identify:

- Technology risks
- Cybersecurity gaps
- Backup weaknesses
- Opportunities to improve reliability and efficiency

Following the assessment, we provide a practical improvement roadmap based on your business needs.

I would welcome the opportunity to meet and discuss how we can support your organization.

Regards,

${emailSender}
V79 ICT Solutions`;

  const handleCopyToClipboard = () => {
    const textToCopy = `Subject: ${emailSubject}\n\n${emailBodyText}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleBookAssessmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientCompany) return;
    setAssessmentStatus("success");
  };

  return (
    <div id="services-pricing-layout" className="w-full flex flex-col min-h-screen text-app-text antialiased">
      
      {/* STICKY HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-app-border bg-app-aside-bg/85 p-4 sticky top-0 backdrop-blur-md z-40">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-mono font-medium hover:text-indigo-400 text-app-text-sec transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Main Marketplace
        </button>
        <div className="flex items-center gap-3">
          {/* Currency Switcher */}
          <div className="flex items-center bg-app-btn-sec/30 border border-app-border rounded-lg p-0.5">
            <button 
              onClick={() => setCurrency("XCD")}
              className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition cursor-pointer ${currency === "XCD" ? "bg-indigo-600 text-white" : "text-app-text-muted hover:text-app-text"}`}
            >
              XCD (EC$)
            </button>
            <button 
              onClick={() => setCurrency("USD")}
              className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition cursor-pointer ${currency === "USD" ? "bg-indigo-600 text-white" : "text-app-text-muted hover:text-app-text"}`}
            >
              USD ($)
            </button>
          </div>
          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono tracking-wider px-2.5 py-1 rounded-full uppercase font-bold">
            V79 ICT Launch Pack
          </span>
        </div>
      </div>

      {/* MIDNIGHT CARIBBEAN BRAND HERO */}
      <div className="bg-gradient-to-r from-zinc-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-12 border-b border-app-border flex flex-col gap-4 relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_40%)]" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-indigo-500 text-white font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wide">
              V79 ICT SOLUTIONS
            </span>
            <span className="text-zinc-500 text-xs font-mono select-none">|</span>
            <span className="text-[10px] text-zinc-300 font-mono tracking-wider uppercase font-semibold">Managed Services & Solutions Blueprint</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white font-display">
            V79 ICT Solutions Launch Pack <span className="text-indigo-400 font-light">— Part 1</span>
          </h1>
          
          <p className="text-sm sm:text-base text-zinc-300 font-light max-w-3xl leading-relaxed">
            Enterprise-level ICT support designed for organizations that need reliable technology but do not have the resources or need for a full internal IT department. Empowering Caribbean businesses with resilient, secure, and affordable technology solutions.
          </p>

          {/* LAUNCH PACK INDEX TABS DECK */}
          <div className="pt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 border cursor-pointer ${
                activeTab === "profile" 
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20" 
                  : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              1. Company Profile
            </button>
            <button
              onClick={() => setActiveTab("website")}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 border cursor-pointer ${
                activeTab === "website" 
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20" 
                  : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              2. Website Positioning
            </button>
            <button
              onClick={() => setActiveTab("assessment")}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 border cursor-pointer ${
                activeTab === "assessment" 
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20" 
                  : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              3. Business Assessment (Lead Offer)
            </button>
            <button
              onClick={() => setActiveTab("email")}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 border cursor-pointer ${
                activeTab === "email" 
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20" 
                  : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              4. Sales Outreach Toolkit
            </button>
          </div>
        </div>
      </div>

      {/* CORE CONTENT BOX */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-8 flex-1">
        
        <AnimatePresence mode="wait">
          
          {/* TAB 1: COMPANY PROFILE */}
          {activeTab === "profile" && (
            <motion.div
              key="profile-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Profile Intro Banner */}
              <div className="p-6 rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.01] flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest block">Core Identity</span>
                  <h2 className="text-2xl font-bold font-display text-app-text tracking-tight">Managed Technology Services for Caribbean Businesses</h2>
                  <p className="text-xs text-app-text-muted max-w-3xl leading-relaxed">
                    V79 ICT Solutions is a Caribbean-focused ICT services provider helping businesses improve reliability, security, and efficiency through professional, enterprise-level technology management.
                  </p>
                </div>
                <div className="p-4 bg-app-btn-sec border border-app-border rounded-xl text-center shrink-0 w-full md:w-auto">
                  <p className="text-[9px] font-mono uppercase text-app-text-muted">Primary Brand Mandate</p>
                  <p className="text-base font-black text-indigo-400 font-display mt-1">"Keep businesses connected, secure, and productive."</p>
                </div>
              </div>

              {/* Grid 1: Mission and Who We Are */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-app-border bg-app-aside-bg/25 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 mb-1">
                    <Building className="w-5 h-5" />
                    <h3 className="font-bold text-lg font-display">Who We Are</h3>
                  </div>
                  <p className="text-xs text-app-text-sec leading-relaxed">
                    V79 ICT Solutions provides high-performance managed IT assistance designed specifically for Caribbean organizations that need dependable, reliable, and expert computer networks but do not have the budget or organizational requirement to staff a full-time, round-the-clock internal IT department.
                  </p>
                  <p className="text-xs text-app-text-sec leading-relaxed">
                    By outsourcing your technical management to V79, you gain access to an enterprise-grade technical team, cutting-edge software suites, state-of-the-art backup policies, and rigid cybersecurity compliance without administrative overhead.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-app-border bg-app-aside-bg/25 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 mb-1">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-bold text-lg font-display">Our Mission</h3>
                  </div>
                  <p className="text-xs text-app-text-sec leading-relaxed">
                    To empower Caribbean businesses with reliable, secure, and affordable ICT solutions that improve daily operations, eliminate costly technological downtime, and aggressively reduce modern technology-related business risks.
                  </p>
                  <div className="pt-2 border-t border-app-border/40 space-y-1">
                    <span className="text-[10px] text-app-text-muted font-mono uppercase block font-semibold">Values We Deliver:</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">✓ Resiliency</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">✓ Affordable Enterprise Class</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">✓ Proactive Sovereignty</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: THE CHALLENGES WE SOLVE */}
              <div className="p-6 rounded-2xl border border-red-500/10 bg-red-500/[0.01] space-y-4">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-bold text-lg font-display">The Challenge Facing Caribbean Organizations</h3>
                </div>
                <p className="text-xs text-app-text-sec leading-relaxed">
                  Technology is critical to modern enterprise survival. Yet, most Caribbean organizations are hamstrung by severe vulnerabilities:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-app-btn-sec/45 border border-app-border space-y-1.5">
                    <p className="text-xs font-bold text-app-text font-mono uppercase tracking-wider text-indigo-400">1. Internal Limits</p>
                    <p className="text-[11px] text-app-text-muted leading-normal">Severely limited internal IT expertise, leaving critical networks unmanaged.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-app-btn-sec/45 border border-app-border space-y-1.5">
                    <p className="text-xs font-bold text-app-text font-mono uppercase tracking-wider text-indigo-400">2. Cyber Threats</p>
                    <p className="text-[11px] text-app-text-muted leading-normal">Increasing ransomware, phishing, and local credential compromise vectors.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-app-btn-sec/45 border border-app-border space-y-1.5">
                    <p className="text-xs font-bold text-app-text font-mono uppercase tracking-wider text-indigo-400">3. Infrastructure</p>
                    <p className="text-[11px] text-app-text-muted leading-normal">Unmanaged networks, poor Wi-Fi cover, and frequent hardware dropouts.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-app-btn-sec/45 border border-app-border space-y-1.5">
                    <p className="text-xs font-bold text-app-text font-mono uppercase tracking-wider text-indigo-400">4. Poor Backups</p>
                    <p className="text-[11px] text-app-text-muted leading-normal">Unverified back-up configurations, aging equipment, and lack of recovery testing.</p>
                  </div>
                </div>

                <div className="p-4 bg-red-500/[0.03] border border-red-500/15 rounded-xl space-y-2">
                  <p className="text-[10px] font-mono uppercase text-red-400 font-bold leading-none">A Single Failure in Your Technology Stack Impacts:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-semibold text-app-text-sec pt-1">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> Customer Service</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> Financial Revenue</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> Employee Productivity</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> Business Reputation</span>
                  </div>
                </div>
              </div>

              {/* CORE SERVICE SECTOR MODULES */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">Solutions Breakdown</span>
                  <h3 className="text-xl font-bold font-display tracking-tight">Our Services — What We Provide</h3>
                  <p className="text-xs text-app-text-muted leading-relaxed">
                    V79 acts as your trusted technology partner, organizing our expertise into five operational pillars.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Pillar 1: Managed ICT Support */}
                  <div className="p-6 rounded-2xl border border-app-border bg-app-aside-bg/15 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-app-text">Managed ICT Support</h4>
                        <p className="text-[11px] text-app-text-muted font-mono mt-0.5">Your complete outsourced IT department</p>
                      </div>
                      <p className="text-xs text-app-text-sec leading-relaxed">
                        Comprehensive daily user assistance, computer deployment, device management, and regular technology scorecards.
                      </p>
                    </div>
                    <ul className="text-xs text-app-text-sec space-y-1.5 pt-2 border-t border-app-border/40 font-mono">
                      <li className="flex items-center gap-2">✔ User Support Desk</li>
                      <li className="flex items-center gap-2">✔ Device Management</li>
                      <li className="flex items-center gap-2">✔ Network Monitoring</li>
                      <li className="flex items-center gap-2">✔ Technology Reporting</li>
                    </ul>
                  </div>

                  {/* Pillar 2: Cybersecurity Protection */}
                  <div className="p-6 rounded-2xl border border-app-border bg-app-aside-bg/15 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-app-text">Cybersecurity Protection</h4>
                        <p className="text-[11px] text-app-text-muted font-mono mt-0.5">Helping businesses reduce cyber risk</p>
                      </div>
                      <p className="text-xs text-app-text-sec leading-relaxed">
                        Layered defenses shielding systems, emails, and credentials from bad actors. Continuous vulnerability monitoring.
                      </p>
                    </div>
                    <ul className="text-xs text-app-text-sec space-y-1.5 pt-2 border-t border-app-border/40 font-mono">
                      <li className="flex items-center gap-2">✔ Security Assessments</li>
                      <li className="flex items-center gap-2">✔ MFA Deployments</li>
                      <li className="flex items-center gap-2">✔ Endpoint Protection</li>
                      <li className="flex items-center gap-2">✔ Security Awareness Training</li>
                    </ul>
                  </div>

                  {/* Pillar 3: Cloud & Microsoft 365 Services */}
                  <div className="p-6 rounded-2xl border border-app-border bg-app-aside-bg/15 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                        <Cloud className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-app-text">Cloud & Microsoft 365</h4>
                        <p className="text-[11px] text-app-text-muted font-mono mt-0.5">Helping businesses work smarter</p>
                      </div>
                      <p className="text-xs text-app-text-sec leading-relaxed">
                        Setting up and optimizing Microsoft 365 licenses, secure tenant configuration, Teams collaboration, and user management.
                      </p>
                    </div>
                    <ul className="text-xs text-app-text-sec space-y-1.5 pt-2 border-t border-app-border/40 font-mono">
                      <li className="flex items-center gap-2">✔ License Optimization</li>
                      <li className="flex items-center gap-2">✔ Exchange Email Migrations</li>
                      <li className="flex items-center gap-2">✔ SharePoint Setup</li>
                      <li className="flex items-center gap-2">✔ Microsoft Teams Config</li>
                    </ul>
                  </div>

                  {/* Pillar 4: Network & Connectivity */}
                  <div className="p-6 rounded-2xl border border-app-border bg-app-aside-bg/15 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <Network className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-app-text">Network & Connectivity</h4>
                        <p className="text-[11px] text-app-text-muted font-mono mt-0.5">Improving business reliability</p>
                      </div>
                      <p className="text-xs text-app-text-sec leading-relaxed">
                        Stable office connectivity solutions, high-performance commercial WiFi, next-gen hardware firewalls, and remote worker VPNs.
                      </p>
                    </div>
                    <ul className="text-xs text-app-text-sec space-y-1.5 pt-2 border-t border-app-border/40 font-mono">
                      <li className="flex items-center gap-2">✔ WiFi Assessments</li>
                      <li className="flex items-center gap-2">✔ Firewall Deployments</li>
                      <li className="flex items-center gap-2">✔ Secure VPN Solutions</li>
                      <li className="flex items-center gap-2">✔ Relocation Support</li>
                    </ul>
                  </div>

                  {/* Pillar 5: Backup & Business Continuity */}
                  <div className="p-6 rounded-2xl border border-app-border bg-app-aside-bg/15 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-app-text">Backup & Business Continuity</h4>
                        <p className="text-[11px] text-app-text-muted font-mono mt-0.5">Protecting what matters</p>
                      </div>
                      <p className="text-xs text-app-text-sec leading-relaxed">
                        Shielding vital databases and documents with automated cloud snapshots, ransomware-immune backups, and recovery planning.
                      </p>
                    </div>
                    <ul className="text-xs text-app-text-sec space-y-1.5 pt-2 border-t border-app-border/40 font-mono">
                      <li className="flex items-center gap-2">✔ Automated Cloud Backups</li>
                      <li className="flex items-center gap-2">✔ Disaster Recovery Plans</li>
                      <li className="flex items-center gap-2">✔ Backup Restorations Testing</li>
                      <li className="flex items-center gap-2">✔ Recovery Assistance</li>
                    </ul>
                  </div>

                  {/* Pillar 6: Why Choose Us Summary */}
                  <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block font-bold">Why V79?</span>
                      <h4 className="font-bold text-sm uppercase tracking-wider text-app-text font-display">Caribbean Understanding</h4>
                      <p className="text-xs text-app-text-sec leading-relaxed">
                        We design with island realities in mind: local internet bottlenecks, hurricane preparedness, and Saint Lucian regulatory conditions.
                      </p>
                    </div>
                    <div className="space-y-1.5 font-mono text-[11px] text-app-text-sec pt-2 border-t border-app-border/30">
                      <p className="flex items-start gap-1"><span className="text-amber-500 shrink-0">⚡</span> Hurricane Recovery Ready</p>
                      <p className="flex items-start gap-1"><span className="text-amber-500 shrink-0">⚡</span> Proactive, Not Break-Fix</p>
                      <p className="flex items-start gap-1"><span className="text-amber-500 shrink-0">⚡</span> Telecommunications Heritage</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SERVICE PROMISE CHECKLIST */}
              <div className="p-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.01] space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <h3 className="font-bold text-lg font-display">Our Service Promise</h3>
                  </div>
                  <button 
                    onClick={() => setShowPromiseDetail(!showPromiseDetail)}
                    className="text-xs font-mono text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {showPromiseDetail ? "Hide Details" : "Read Full Scope"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-4 rounded-xl bg-app-btn-sec/30 border border-emerald-500/15 text-center space-y-1">
                    <span className="text-emerald-500 font-bold block text-lg">✓</span>
                    <p className="text-xs font-bold text-app-text">Professional Comms</p>
                    <p className="text-[10px] text-app-text-muted leading-tight font-mono">Clear, prompt updates.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-app-btn-sec/30 border border-emerald-500/15 text-center space-y-1">
                    <span className="text-emerald-500 font-bold block text-lg">✓</span>
                    <p className="text-xs font-bold text-app-text">Clear Expectations</p>
                    <p className="text-[10px] text-app-text-muted leading-tight font-mono">Guaranteed responsibilities.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-app-btn-sec/30 border border-emerald-500/15 text-center space-y-1">
                    <span className="text-emerald-500 font-bold block text-lg">✓</span>
                    <p className="text-xs font-bold text-app-text">Transparent Reporting</p>
                    <p className="text-[10px] text-app-text-muted leading-tight font-mono">Comprehensive audits.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-app-btn-sec/30 border border-emerald-500/15 text-center space-y-1">
                    <span className="text-emerald-500 font-bold block text-lg">✓</span>
                    <p className="text-xs font-bold text-app-text">Security-First</p>
                    <p className="text-[10px] text-app-text-muted leading-tight font-mono">Zero compromised shortcuts.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-app-btn-sec/30 border border-emerald-500/15 text-center space-y-1">
                    <span className="text-emerald-500 font-bold block text-lg">✓</span>
                    <p className="text-xs font-bold text-app-text">Business-Focused</p>
                    <p className="text-[10px] text-app-text-muted leading-tight font-mono">ROI-based choices.</p>
                  </div>
                </div>

                {showPromiseDetail && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="text-xs text-app-text-muted space-y-2 pt-4 border-t border-app-border/40 font-mono"
                  >
                    <p><strong>Professional Communication:</strong> Every email, phone call, or dispatch is logged in our ticketing portal and explained in straightforward, jargon-free English.</p>
                    <p><strong>Clear Service Expectations:</strong> We establish precise operational frameworks, ensuring you always know exactly who handles password resets, router reboots, or hardware upgrades.</p>
                    <p><strong>Transparent Reporting:</strong> On the first Monday of every month, retainers receive automated reports auditing ticket resolution speed, system utilization, server health, and backup verification logs.</p>
                    <p><strong>Security-First Approach:</strong> Every change we configure adheres to the principle of least-privilege, utilizing strong MFA, segregated WiFi access controls, and localized database firewalls.</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: WEBSITE POSITIONING BLUEPRINT */}
          {activeTab === "website" && (
            <motion.div
              key="website-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest block">Structural Positioning Map</span>
                <h2 className="text-2xl font-bold font-display tracking-tight text-app-text">Website Blueprint & Client Message Wireframe</h2>
                <p className="text-xs text-app-text-muted max-w-3xl leading-relaxed">
                  Below is the interactive structure and copy mapping designed for the customer-facing V79 website, optimized for converting local Caribbean leads.
                </p>
              </div>

              {/* WEB REPLICA INTERACTIVE PREVIEW */}
              <div className="border border-indigo-500/25 rounded-2xl overflow-hidden bg-app-aside-bg/40 shadow-2xl">
                {/* Browser bar */}
                <div className="bg-zinc-950 px-4 py-2 border-b border-app-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-[9px] text-zinc-500 font-mono ml-4 select-none">https://www.v79solutions.com/blueprint</span>
                  </div>
                  <span className="text-[9px] text-indigo-400 font-mono px-2 py-0.5 rounded bg-indigo-500/10">Interactive Mockup</span>
                </div>

                {/* Homepage Simulator Content */}
                <div className="divide-y divide-app-border/40">
                  
                  {/* Hero Section */}
                  <div className="p-8 sm:p-12 text-center space-y-6 bg-gradient-to-b from-indigo-950/20 via-transparent to-transparent">
                    <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-extrabold border border-indigo-500/30 px-3 py-1 rounded-full">
                      [Homepage Hero Section]
                    </span>
                    <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight text-app-text">
                      Technology Support That Keeps Your Business Moving
                    </h3>
                    <p className="text-xs sm:text-sm text-app-text-sec max-w-xl mx-auto leading-relaxed">
                      Reliable ICT management, cybersecurity, and cloud solutions designed for Caribbean businesses. Reduce downtime. Improve security. Focus on your business.
                    </p>
                    <div className="flex justify-center gap-3 pt-2">
                      <button 
                        onClick={() => setActiveTab("assessment")}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                      >
                        Book ICT Assessment
                      </button>
                      <button 
                        onClick={() => setActiveTab("email")}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition cursor-pointer border border-zinc-700"
                      >
                        Talk to an ICT Specialist
                      </button>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="p-8 space-y-4">
                    <div className="text-center">
                      <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-extrabold">Section 2: Contextual Friction</span>
                      <h4 className="font-bold text-lg font-display text-app-text mt-1">Your Technology Should Support Your Business — Not Slow It Down</h4>
                    </div>
                    <p className="text-xs text-app-text-muted text-center max-w-xl mx-auto">
                      Many businesses struggle with unmanaged tech. V79 ICT Solutions provides the expertise and support needed to operate confidently.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-3 max-w-4xl mx-auto">
                      <div className="p-3 rounded-lg bg-red-500/[0.02] border border-red-500/10 text-center space-y-1">
                        <span className="text-red-400 text-xs font-mono">❌ Failures</span>
                        <p className="text-[10px] text-app-text-muted leading-tight font-mono">Frequent disruptions</p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-500/[0.02] border border-red-500/10 text-center space-y-1">
                        <span className="text-red-400 text-xs font-mono">❌ Cyber Risk</span>
                        <p className="text-[10px] text-app-text-muted leading-tight font-mono">Vulnerable targets</p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-500/[0.02] border border-red-500/10 text-center space-y-1">
                        <span className="text-red-400 text-xs font-mono">❌ Poor Backups</span>
                        <p className="text-[10px] text-app-text-muted leading-tight font-mono">Insecure offsites</p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-500/[0.02] border border-red-500/10 text-center space-y-1">
                        <span className="text-red-400 text-xs font-mono">❌ Limited IT</span>
                        <p className="text-[10px] text-app-text-muted leading-tight font-mono">Understaffed tech</p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-500/[0.02] border border-red-500/10 text-center space-y-1">
                        <span className="text-red-400 text-xs font-mono">❌ Cloud Bloat</span>
                        <p className="text-[10px] text-app-text-muted leading-tight font-mono">Unmanaged M365</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 3 */}
                  <div className="p-8 space-y-6">
                    <div className="text-center">
                      <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-extrabold">Section 3: Core Service Offerings</span>
                      <h4 className="font-bold text-lg font-display text-app-text mt-1">Our Services</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="p-4 rounded-xl border border-app-border bg-app-btn-sec/15 text-center">
                        <Smartphone className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-app-text">Managed ICT Support</p>
                        <p className="text-[10px] text-app-text-muted mt-1 leading-normal">Your outsourced IT department.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-app-border bg-app-btn-sec/15 text-center">
                        <Lock className="w-5 h-5 text-red-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-app-text">Cybersecurity</p>
                        <p className="text-[10px] text-app-text-muted mt-1 leading-normal">Protect against modern threats.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-app-border bg-app-btn-sec/15 text-center">
                        <Cloud className="w-5 h-5 text-sky-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-app-text">Microsoft 365</p>
                        <p className="text-[10px] text-app-text-muted mt-1 leading-normal">Get more cloud license value.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-app-border bg-app-btn-sec/15 text-center">
                        <Network className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-app-text">Network Solutions</p>
                        <p className="text-[10px] text-app-text-muted mt-1 leading-normal">Reliable office & team WiFi.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-app-border bg-app-btn-sec/15 text-center">
                        <Server className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-app-text">Business Continuity</p>
                        <p className="text-[10px] text-app-text-muted mt-1 leading-normal">Recover quickly if disaster hits.</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className="p-8 space-y-6">
                    <div className="text-center">
                      <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-extrabold">Section 4: Market Segments</span>
                      <h4 className="font-bold text-lg font-display text-app-text mt-1">Who We Support</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl border border-app-border bg-app-btn-sec/20 space-y-2">
                        <Building className="w-4 h-4 text-indigo-400" />
                        <p className="text-xs font-bold text-app-text">Small & Medium Businesses</p>
                        <p className="text-[11px] text-app-text-muted leading-relaxed">Professional ICT support without the overhead of hiring full-time, round-the-clock IT personnel.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-app-border bg-app-btn-sec/20 space-y-2">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <p className="text-xs font-bold text-app-text">Professional Services</p>
                        <p className="text-[11px] text-app-text-muted leading-relaxed">Law firms, accountants, consultants, and financial brokerages requiring secured, audit-ready systems.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-app-border bg-app-btn-sec/20 space-y-2">
                        <Globe className="w-4 h-4 text-amber-400" />
                        <p className="text-xs font-bold text-app-text">Hospitality & Tourism</p>
                        <p className="text-[11px] text-app-text-muted leading-relaxed">Hotels, luxury private villas, and tourism agencies requiring ultra-stable guest WiFi networks.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-app-border bg-app-btn-sec/20 space-y-2">
                        <Award className="w-4 h-4 text-purple-400" />
                        <p className="text-xs font-bold text-app-text">Education & Training</p>
                        <p className="text-[11px] text-app-text-muted leading-relaxed">Schools, trade centers, and corporate training academies requiring managed computer classrooms.</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 5 */}
                  <div className="p-8 space-y-6 bg-zinc-950/20">
                    <div className="text-center">
                      <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-extrabold">Section 5: Implementation Timeline</span>
                      <h4 className="font-bold text-lg font-display text-app-text mt-1">How We Work</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
                      <div className="relative p-4 rounded-xl border border-app-border bg-app-bg text-center space-y-1">
                        <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1">1</span>
                        <p className="text-xs font-bold text-app-text">Assess</p>
                        <p className="text-[10px] text-app-text-muted leading-normal">We audit and analyze your current technology environment.</p>
                      </div>
                      <div className="relative p-4 rounded-xl border border-app-border bg-app-bg text-center space-y-1">
                        <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1">2</span>
                        <p className="text-xs font-bold text-app-text">Improve</p>
                        <p className="text-[10px] text-app-text-muted leading-normal">We identify critical vulnerabilities and prescribe actionable solutions.</p>
                      </div>
                      <div className="relative p-4 rounded-xl border border-app-border bg-app-bg text-center space-y-1">
                        <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1">3</span>
                        <p className="text-xs font-bold text-app-text">Manage</p>
                        <p className="text-[10px] text-app-text-muted leading-normal">We establish 24/7 proactive monitoring, backups, and user helpdesk.</p>
                      </div>
                      <div className="relative p-4 rounded-xl border border-app-border bg-app-bg text-center space-y-1">
                        <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1">4</span>
                        <p className="text-xs font-bold text-app-text">Optimize</p>
                        <p className="text-[10px] text-app-text-muted leading-normal">We continuously adjust and upgrade systems as your team scales.</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: FIRST SALES OFFER — BUSINESS HEALTH ASSESSMENT */}
          {activeTab === "assessment" && (
            <motion.div
              key="assessment-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest block">Entry Offer Hook</span>
                <h2 className="text-2xl font-bold font-display tracking-tight text-app-text">V79 ICT Business Health Assessment</h2>
                <p className="text-xs text-app-text-muted max-w-3xl leading-relaxed">
                  We don't lead with generic support contracts. We begin with a low-risk, high-value, comprehensive technological wellness audit.
                </p>
              </div>

              {/* SALES OFFER HERO BOARD */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Offer Specs */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Lead Callout Card */}
                  <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-950/50 via-slate-900/60 to-zinc-950 border-2 border-indigo-500/30 rounded-2xl relative overflow-hidden space-y-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-wider block">Special Introductory Package</span>
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                          Know Your Technology Risks Before They Become Costly Business Blockades
                        </h3>
                      </div>
                      <div className="text-right shrink-0 bg-indigo-600 border border-indigo-400 rounded-xl px-4 py-2 text-white">
                        <span className="text-[10px] font-mono block text-indigo-200">Investment</span>
                        <span className="text-xl font-black font-display tracking-tighter block">{getDisplayPrice(1500)}</span>
                        <span className="text-[9px] font-mono block text-indigo-200">One-Time Fee</span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed font-light">
                      A thorough diagnostic sweep designed to uncover hidden system bugs, network limits, server performance issues, and password vulnerabilities before they cause costly hardware failures or credential theft.
                    </p>
                  </div>

                  {/* 3 Review Pillars */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-mono uppercase text-app-text-muted tracking-wider font-bold">Scope of the Review:</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl border border-app-border bg-app-aside-bg/15 space-y-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs font-mono">1</div>
                        <p className="text-xs font-bold text-app-text">Infrastructure Review</p>
                        <ul className="text-[10px] text-app-text-muted space-y-1 leading-normal font-mono">
                          <li>• Computer Health</li>
                          <li>• Router Diagnostics</li>
                          <li>• ISP Speed Verification</li>
                          <li>• WiFi Signal Mapping</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl border border-app-border bg-app-aside-bg/15 space-y-2">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xs font-mono">2</div>
                        <p className="text-xs font-bold text-app-text">Security Audit</p>
                        <ul className="text-[10px] text-app-text-muted space-y-1 leading-normal font-mono">
                          <li>• Password Practices</li>
                          <li>• Multi-Factor Status</li>
                          <li>• Endpoint Security</li>
                          <li>• Active User Access</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl border border-app-border bg-app-aside-bg/15 space-y-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs font-mono">3</div>
                        <p className="text-xs font-bold text-app-text">Data Protection</p>
                        <ul className="text-[10px] text-app-text-muted space-y-1 leading-normal font-mono">
                          <li>• Backup Integrity</li>
                          <li>• Cloud Storage Setup</li>
                          <li>• M365 Email Audits</li>
                          <li>• Recovery Testing</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div className="p-5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.01] space-y-3">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block tracking-wider">The Deliverable: Business Intelligence Report</span>
                    <p className="text-xs text-app-text-sec">
                      Following the deep diagnostic audit, you receive a clean, readable executive report containing:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-app-text-sec">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500">📊</span>
                        <span>Current ICT Security Score</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500">⚠️</span>
                        <span>Identified Risks & Vulnerabilities</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500">💡</span>
                        <span>Recommended Practical Solutions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500">🗺️</span>
                        <span>90-Day Priority Action Roadmap</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Side: Interactive Lead Simulator Form */}
                <div className="lg:col-span-5 bg-app-aside-bg/30 border border-app-border rounded-2xl p-6 space-y-5 shadow-xl">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-extrabold block">Interactive Form</span>
                    <h4 className="font-bold text-base text-app-text font-display">Book or Inquire About the Assessment</h4>
                    <p className="text-xs text-app-text-muted leading-relaxed">
                      Fill out this mockup request to experience our engagement workflow.
                    </p>
                  </div>

                  {assessmentStatus === "success" ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] text-center space-y-3.5"
                    >
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-emerald-500/20">
                        ✓
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-emerald-400 font-display">Assessment Booking Simulated!</p>
                        <p className="text-xs text-app-text-sec">
                          Thank you, <strong>{clientName}</strong> of <strong>{clientCompany}</strong>. In a live environment, a V79 ICT Specialist would reach out to <strong>{clientEmail}</strong> within 4 business hours to coordinate dates.
                        </p>
                      </div>
                      <button 
                        onClick={() => { setAssessmentStatus("idle"); setClientName(""); setClientEmail(""); setClientCompany(""); }}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold rounded-lg transition"
                      >
                        Reset Booking Form
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleBookAssessmentSubmit} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-app-text-sec block">Your Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full bg-app-input border border-app-input-border text-app-text rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500/40"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-app-text-sec block">Business Email</label>
                        <input 
                          type="email" 
                          required
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="e.g. john@company.com"
                          className="w-full bg-app-input border border-app-input-border text-app-text rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500/40"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-app-text-sec block">Company / Organization Name</label>
                        <input 
                          type="text" 
                          required
                          value={clientCompany}
                          onChange={(e) => setClientCompany(e.target.value)}
                          placeholder="e.g. Saint Lucia Retailers Ltd"
                          className="w-full bg-app-input border border-app-input-border text-app-text rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500/40"
                        />
                      </div>
                      <div className="pt-2">
                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white rounded-lg transition shadow cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Simulate Assessment Booking</span>
                        </button>
                      </div>
                      <p className="text-[9px] text-app-text-muted leading-normal font-mono text-center">
                        Total Mock Quote: <strong className="text-indigo-400">{getDisplayPrice(1500)} XCD</strong> (No real-world invoice will be generated)
                      </p>
                    </form>
                  )}

                  {/* Call Direct Box */}
                  <div className="pt-4 border-t border-app-border/40 space-y-2 text-xs">
                    <p className="font-bold text-app-text">Direct Contact details:</p>
                    <div className="space-y-1 text-app-text-sec font-mono text-[11px]">
                      <p>📞 Phone: <a href="tel:+17587260035" className="hover:underline text-indigo-400 font-bold">1 758 726 0035</a></p>
                      <p>✉️ Email: <a href="mailto:vision79slu@gmail.com" className="hover:underline text-indigo-400 font-bold">vision79slu@gmail.com</a></p>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 4: SALES EMAIL TOOLKIT */}
          {activeTab === "email" && (
            <motion.div
              key="email-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest block">Outreach Catalyst</span>
                <h2 className="text-2xl font-bold font-display tracking-tight text-app-text">Cold Sales Email Copy & outreach template</h2>
                <p className="text-xs text-app-text-muted max-w-3xl leading-relaxed">
                  Customize and export the official V79 sales pitch script designed to interest regional decision-makers and secure business meetings.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Customizers */}
                <div className="lg:col-span-4 bg-app-aside-bg/30 border border-app-border rounded-2xl p-5 space-y-4 shadow-md">
                  <span className="text-[9px] font-mono uppercase text-indigo-400 font-bold tracking-wider block">Template Customizers:</span>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-app-text-sec block">Recipient Name</label>
                      <input 
                        type="text" 
                        value={emailRecipient}
                        onChange={(e) => setEmailRecipient(e.target.value)}
                        placeholder="Business Owner"
                        className="w-full bg-app-input border border-app-input-border text-app-text rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-app-text-sec block">Recipient Company</label>
                      <input 
                        type="text" 
                        value={emailCompany}
                        onChange={(e) => setEmailCompany(e.target.value)}
                        placeholder="Caribbean Enterprise"
                        className="w-full bg-app-input border border-app-input-border text-app-text rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-app-text-sec block">Your Name / Sign-off</label>
                      <input 
                        type="text" 
                        value={emailSender}
                        onChange={(e) => setEmailSender(e.target.value)}
                        placeholder="VISION79 ICT Specialist"
                        className="w-full bg-app-input border border-app-input-border text-app-text rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500/40"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-app-border/40 text-[10px] text-app-text-muted leading-relaxed font-mono space-y-1">
                    <p className="font-bold text-app-text text-[11px] uppercase mb-1">How to Use This Template:</p>
                    <p>1. Tailor the input fields to your target prospect.</p>
                    <p>2. Click the "Copy Template Copy" button.</p>
                    <p>3. Paste into your local email platform (Outlook, Gmail) and send!</p>
                  </div>
                </div>

                {/* Right Side: Rendered Email Mockup */}
                <div className="lg:col-span-8 border border-app-border rounded-2xl overflow-hidden shadow-2xl bg-app-aside-bg/15">
                  {/* Email Header */}
                  <div className="bg-zinc-950 p-4 border-b border-app-border space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/80" />
                        <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                        <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      </div>
                      <button 
                        onClick={handleCopyToClipboard}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-mono font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedState ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Template Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-xs text-zinc-400 font-mono space-y-1 pt-1.5">
                      <p><span className="text-zinc-600">To:</span> prospect@example.com</p>
                      <p><span className="text-zinc-600">Subject:</span> <strong className="text-zinc-200">{emailSubject}</strong></p>
                    </div>
                  </div>

                  {/* Email Body Previewer */}
                  <div className="p-6 sm:p-8 bg-app-bg text-app-text text-sm leading-relaxed font-sans max-h-[480px] overflow-y-auto whitespace-pre-wrap select-text">
                    {emailBodyText}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>

    </div>
  );
}
