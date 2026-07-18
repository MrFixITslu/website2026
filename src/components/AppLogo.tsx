import { useState } from "react";
import { 
  ShieldCheck, 
  Compass, 
  Activity, 
  Terminal, 
  Eye, 
  Code, 
  Cpu, 
  Database, 
  Cloud, 
  Globe,
  Server
} from "lucide-react";

export const PRESET_ICONS = [
  { id: "lucide:ShieldCheck", label: "Security (Shield)", icon: ShieldCheck, color: "text-emerald-400" },
  { id: "lucide:Compass", label: "Canvas (Compass)", icon: Compass, color: "text-sky-400" },
  { id: "lucide:Activity", label: "Telemetry (Activity)", icon: Activity, color: "text-rose-400" },
  { id: "lucide:Terminal", label: "Developer (Terminal)", icon: Terminal, color: "text-zinc-100" },
  { id: "lucide:Eye", label: "Intelligence (Spector)", icon: Eye, color: "text-violet-400" },
  { id: "lucide:Code", label: "Automation (Code)", icon: Code, color: "text-amber-400" },
  { id: "lucide:Cpu", label: "Core Processing (CPU)", icon: Cpu, color: "text-cyan-400" },
  { id: "lucide:Database", label: "Persistence (Database)", icon: Database, color: "text-teal-400" },
  { id: "lucide:Cloud", label: "Serverless (Cloud)", icon: Cloud, color: "text-indigo-400" },
  { id: "lucide:Globe", label: "Universal Web (Globe)", icon: Globe, color: "text-blue-400" }
];

export function AppLogo({ logoUrl }: { logoUrl?: string }) {
  const [hasError, setHasError] = useState(false);
  const safeLogoUrl = logoUrl || "";

  if (safeLogoUrl.startsWith("lucide:")) {
    const iconName = safeLogoUrl.replace("lucide:", "");
    const baseClass = "w-5 h-5 stroke-[1.8]";
    switch (iconName) {
      case "ShieldCheck": return <ShieldCheck className={`${baseClass} text-emerald-400`} />;
      case "Compass": return <Compass className={`${baseClass} text-sky-400`} />;
      case "Activity": return <Activity className={`${baseClass} text-rose-400`} />;
      case "Terminal": return <Terminal className={`${baseClass} text-zinc-100`} />;
      case "Eye": return <Eye className={`${baseClass} text-violet-400`} />;
      case "Code": return <Code className={`${baseClass} text-amber-400`} />;
      case "Cpu": return <Cpu className={`${baseClass} text-cyan-400`} />;
      case "Database": return <Database className={`${baseClass} text-teal-400`} />;
      case "Cloud": return <Cloud className={`${baseClass} text-indigo-400`} />;
      case "Globe": return <Globe className={`${baseClass} text-blue-400`} />;
      default: return <Server className={`${baseClass} text-zinc-400`} />;
    }
  }

  if (hasError || !safeLogoUrl) {
    return (
      <div className="w-10 h-10 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center">
        <span className="text-[10px] font-bold text-zinc-500 font-mono">APP</span>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center">
      <img 
        src={safeLogoUrl} 
        alt="SaaS Logo" 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
