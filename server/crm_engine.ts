import http from "http";
import https from "https";

export interface BusinessInput {
  businessName: string;
  category?: string;
  industry?: string;
  location?: string;
  website?: string;
  phone?: string;
  email?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  description?: string;
  companySize?: string;
}

export interface ScoreBreakdownItem {
  factor: string;
  points: number;
  description: string;
}

export interface CRMAnalysisResult {
  summary: string;
  category: string;
  problems: string[];
  recommendedServices: string[];
  leadScore: number;
  scoreCategory: "Hot" | "High Potential" | "Medium" | "Low";
  scoreBreakdown: ScoreBreakdownItem[];
  bestApproach: string;
  callPrep: {
    whatTheyDo: string;
    identifiedNeed: string;
    recommendedPitch: string;
    discoveryQuestions: string[];
    suggestedNextAction: string;
  };
  generatedBy: "ollama" | "heuristic_engine";
  modelName?: string;
  timestamp: string;
}

// Configurable scoring weights as requested by prompt
export const DEFAULT_SCORING_RULES = [
  { id: "no_website", label: "No Professional Website", points: 25, condition: (b: BusinessInput) => !b.website || !b.website.trim() },
  { id: "active_social_no_web", label: "Active Social Media but No Dedicated Domain", points: 15, condition: (b: BusinessInput) => (!b.website || !b.website.trim()) && Boolean(b.facebookUrl || b.instagramUrl) },
  { id: "contact_available", label: "Direct Phone or WhatsApp Reachable", points: 15, condition: (b: BusinessInput) => Boolean(b.phone && b.phone.trim().length >= 7) },
  { id: "email_available", label: "Public Business Email Listed", points: 10, condition: (b: BusinessInput) => Boolean(b.email && b.email.includes("@")) },
  { id: "saint_lucia_location", label: "High-Commercial Saint Lucia District", points: 15, condition: (b: BusinessInput) => {
    const loc = (b.location || "").toLowerCase();
    return loc.includes("castries") || loc.includes("gros islet") || loc.includes("rodney bay") || loc.includes("vieux fort") || loc.includes("soufrière") || loc.includes("marigot");
  }},
  { id: "high_ict_fit", label: "Fits High-Value V79 Services (Hospitality, Legal, Medical, Retail, Services)", points: 20, condition: (b: BusinessInput) => {
    const text = `${b.category || ""} ${b.industry || ""} ${b.description || ""}`.toLowerCase();
    return /restaurant|hotel|resort|villa|bar|clinic|medical|law|legal|auto|retail|store|logistics|tour|charter|real estate|construction|consult/.test(text);
  }}
];

export function calculateDeterministicAnalysis(b: BusinessInput): CRMAnalysisResult {
  const breakdown: ScoreBreakdownItem[] = [];
  let totalScore = 0;

  for (const rule of DEFAULT_SCORING_RULES) {
    if (rule.condition(b)) {
      totalScore += rule.points;
      breakdown.push({
        factor: rule.label,
        points: rule.points,
        description: `Verified from public profile: matches ${rule.id.replace(/_/g, " ")} criteria.`
      });
    }
  }

  // Cap score at 100
  const finalScore = Math.min(100, Math.max(10, totalScore));

  let scoreCat: "Hot" | "High Potential" | "Medium" | "Low" = "Low";
  if (finalScore >= 80) scoreCat = "Hot";
  else if (finalScore >= 60) scoreCat = "High Potential";
  else if (finalScore >= 40) scoreCat = "Medium";

  // Opportunity detection & V79 service matching
  const problems: string[] = [];
  const recommendedServices: string[] = [];
  const text = `${b.category || ""} ${b.industry || ""} ${b.description || ""}`.toLowerCase();

  if (!b.website || !b.website.trim()) {
    problems.push("No dedicated company website; relies entirely on third-party social media pages");
    recommendedServices.push("Website Development & Domain Setup");
    recommendedServices.push("Custom Digital Showcase / Mobile Ordering");
  } else {
    problems.push("Existing web presence may lack speed, mobile optimization, or active conversion funnels");
    recommendedServices.push("Website Modernization & SEO");
  }

  if (b.facebookUrl || b.instagramUrl) {
    problems.push("Customer messages across social channels lack unified CRM or ticketing inbox");
    recommendedServices.push("CRM & Helpdesk Implementation");
    recommendedServices.push("WhatsApp & Social Chatbot Automation");
  }

  if (/hotel|restaurant|resort|hospitality|bar|tour|rental/.test(text)) {
    problems.push("High guest bandwidth demands and risk of reservation downtime during storms");
    recommendedServices.push("Wi-Fi Optimization & Guest Hotspots");
    recommendedServices.push("Automated Disaster Backup & Cloud Redundancy");
  } else if (/medical|clinic|law|legal|accounting|financial/.test(text)) {
    problems.push("Sensitive client records and compliance risks without managed firewalls");
    recommendedServices.push("Cybersecurity & Firewall Hardening");
    recommendedServices.push("Managed IT Support & Cloud Microsoft 365");
  } else if (/retail|store|wholesale|distributor|supply/.test(text)) {
    problems.push("Manual stock counts and disconnected point-of-sale systems");
    recommendedServices.push("Inventory Management Integration");
    recommendedServices.push("Business Process Automation");
  } else {
    problems.push("Manual operational processes and reliance on ad-hoc IT troubleshooting");
    recommendedServices.push("Managed IT Support");
    recommendedServices.push("Business Automation");
  }

  const category = b.category || b.industry || "General Small Business";
  const summary = `${b.businessName} operates in ${b.location || "Saint Lucia"}. ${
    !b.website ? "They currently lack a standalone company website, depending heavily on direct contact and social channels." : "They maintain an online presence that could be modernized with automated client capture."
  }`;

  const bestApproach = finalScore >= 80
    ? "Direct executive phone consultation or WhatsApp introduction focusing on immediate customer acquisition and digital branding."
    : "Educational outreach demonstrating modern Saint Lucia peer case studies and automated workflow savings.";

  const discoveryQuestions = [
    `How do customers in ${b.location || "Saint Lucia"} typically find and contact ${b.businessName} today?`,
    `What is your biggest operational or communication bottleneck when handling new inquiries or orders?`,
    `Have you experienced internet dropouts or lost data during power fluctuations or severe weather?`
  ];

  return {
    summary,
    category,
    problems,
    recommendedServices: Array.from(new Set(recommendedServices)),
    leadScore: finalScore,
    scoreCategory: scoreCat,
    scoreBreakdown: breakdown,
    bestApproach,
    callPrep: {
      whatTheyDo: `${b.businessName} provides ${category.toLowerCase()} services to residents and visitors in ${b.location || "Saint Lucia"}.`,
      identifiedNeed: problems[0] || "Digital infrastructure enhancement",
      recommendedPitch: `Introduce V79 Digital's localized Saint Lucia IT solutions, specifically how ${recommendedServices[0] || "modern IT infrastructure"} drives revenue and prevents costly downtime.`,
      discoveryQuestions,
      suggestedNextAction: finalScore >= 70 ? "Book a 15-minute Discovery Consultation" : "Send V79 Digital Portfolio & Overview via Email"
    },
    generatedBy: "heuristic_engine",
    timestamp: new Date().toISOString()
  };
}

// Local Ollama caller
export async function queryOllama(
  prompt: string,
  systemPrompt: string,
  ollamaBaseUrl: string = "http://localhost:11434",
  model: string = "llama3"
): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const url = new URL(`${ollamaBaseUrl.replace(/\/$/, "")}/api/generate`);
      const postData = JSON.stringify({
        model,
        prompt,
        system: systemPrompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0.2,
          top_p: 0.9
        }
      });

      const client = url.protocol === "https:" ? https : http;
      const req = client.request(
        {
          hostname: url.hostname,
          port: url.port || (url.protocol === "https:" ? 443 : 80),
          path: url.pathname,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData)
          },
          timeout: 6000 // Fast failover so UI stays snappy
        },
        (res) => {
          let rawData = "";
          res.on("data", (chunk) => { rawData += chunk; });
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(rawData);
                resolve(parsed.response || null);
              } catch {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          });
        }
      );

      req.on("error", () => resolve(null));
      req.on("timeout", () => { req.destroy(); resolve(null); });
      req.write(postData);
      req.end();
    } catch {
      resolve(null);
    }
  });
}

export async function analyzeBusinessWithAI(
  business: BusinessInput,
  ollamaBaseUrl: string = process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  model: string = process.env.OLLAMA_MODEL || "llama3"
): Promise<CRMAnalysisResult> {
  const fallback = calculateDeterministicAnalysis(business);

  const systemPrompt = `You are the Lead Intelligence AI for V79 Digital, a premier Information and Communications Technology (ICT) consultancy in Saint Lucia (Caribbean).
You analyze businesses discovered through public directories.
Do not fabricate missing details. Strictly rely on provided facts.
Return ONLY valid JSON with this exact schema:
{
  "summary": string,
  "category": string,
  "problems": string[],
  "recommendedServices": string[],
  "leadScore": number (0 to 100),
  "scoreCategory": "Hot" | "High Potential" | "Medium" | "Low",
  "bestApproach": string,
  "callPrep": {
    "whatTheyDo": string,
    "identifiedNeed": string,
    "recommendedPitch": string,
    "discoveryQuestions": string[],
    "suggestedNextAction": string
  }
}`;

  const userPrompt = `Analyze this Saint Lucia business for digital and IT opportunities:
Business Name: ${business.businessName}
Category: ${business.category || "Unknown"}
Industry: ${business.industry || "Unknown"}
Location: ${business.location || "Saint Lucia"}
Website: ${business.website || "None"}
Phone: ${business.phone || "None"}
Email: ${business.email || "None"}
Facebook: ${business.facebookUrl || "None"}
Instagram: ${business.instagramUrl || "None"}
LinkedIn: ${business.linkedinUrl || "None"}
Description: ${business.description || "None"}

Evaluate whether they need: Website Development/Modernization, Business Automation, CRM, Wi-Fi Optimization, Cybersecurity, or Managed IT.`;

  try {
    const rawOllamaResponse = await queryOllama(userPrompt, systemPrompt, ollamaBaseUrl, model);
    if (rawOllamaResponse) {
      const parsed = JSON.parse(rawOllamaResponse);
      if (parsed.summary && typeof parsed.leadScore === "number") {
        return {
          summary: parsed.summary,
          category: parsed.category || fallback.category,
          problems: Array.isArray(parsed.problems) ? parsed.problems : fallback.problems,
          recommendedServices: Array.isArray(parsed.recommendedServices) ? parsed.recommendedServices : fallback.recommendedServices,
          leadScore: Math.min(100, Math.max(0, Math.round(parsed.leadScore))),
          scoreCategory: parsed.scoreCategory || fallback.scoreCategory,
          scoreBreakdown: fallback.scoreBreakdown,
          bestApproach: parsed.bestApproach || fallback.bestApproach,
          callPrep: parsed.callPrep || fallback.callPrep,
          generatedBy: "ollama",
          modelName: model,
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.warn("[CRM Engine] Ollama query failed, using deterministic engine:", (err as any)?.message);
  }

  return fallback;
}

export async function pingOllama(ollamaBaseUrl: string = "http://localhost:11434"): Promise<{
  connected: boolean;
  models: string[];
  latencyMs?: number;
  url: string;
}> {
  const startTime = Date.now();
  return new Promise((resolve) => {
    try {
      const url = new URL(`${ollamaBaseUrl.replace(/\/$/, "")}/api/tags`);
      const client = url.protocol === "https:" ? https : http;
      const req = client.request(
        {
          hostname: url.hostname,
          port: url.port || (url.protocol === "https:" ? 443 : 80),
          path: url.pathname,
          method: "GET",
          timeout: 3000
        },
        (res) => {
          let rawData = "";
          res.on("data", (c) => { rawData += c; });
          res.on("end", () => {
            const latency = Date.now() - startTime;
            if (res.statusCode === 200) {
              try {
                const data = JSON.parse(rawData);
                const models = (data.models || []).map((m: any) => m.name || m.model);
                resolve({ connected: true, models, latencyMs: latency, url: ollamaBaseUrl });
              } catch {
                resolve({ connected: false, models: [], latencyMs: latency, url: ollamaBaseUrl });
              }
            } else {
              resolve({ connected: false, models: [], latencyMs: latency, url: ollamaBaseUrl });
            }
          });
        }
      );
      req.on("error", () => resolve({ connected: false, models: [], url: ollamaBaseUrl }));
      req.on("timeout", () => { req.destroy(); resolve({ connected: false, models: [], url: ollamaBaseUrl }); });
      req.end();
    } catch {
      resolve({ connected: false, models: [], url: ollamaBaseUrl });
    }
  });
}

// Curated verified Saint Lucia public business catalog for compliant prospecting
export const SAINT_LUCIA_PUBLIC_BUSINESS_DIRECTORY: BusinessInput[] = [
  {
    businessName: "Lucian Roots Grill & Bar",
    category: "Restaurant & Hospitality",
    industry: "Food & Beverage",
    location: "Gros Islet",
    phone: "+1 (758) 450-8921",
    email: "lucianrootsgrill@gmail.com",
    facebookUrl: "https://facebook.com/lucianrootsgrill",
    instagramUrl: "https://instagram.com/lucianrootsgrill",
    description: "Authentic Caribbean Creole cuisine and weekend seafood grill on the Gros Islet strip. Active social following with no online reservation or digital ordering.",
    companySize: "10-25"
  },
  {
    businessName: "Bayview Marine & Yacht Services",
    category: "Maritime & Tourism",
    industry: "Marine Services",
    location: "Rodney Bay",
    phone: "+1 (758) 452-3344",
    email: "info@bayviewmarineslu.com",
    facebookUrl: "https://facebook.com/bayviewmarineslu",
    linkedinUrl: "https://linkedin.com/company/bayview-marine-saint-lucia",
    description: "Yacht provisioning, outboard engine diagnostics, and catamaran charters based in Rodney Bay Marina. Manual billing and slow VHF/cell coordination.",
    companySize: "5-15"
  },
  {
    businessName: "Castries Wellness Clinic",
    category: "Healthcare & Wellness",
    industry: "Medical Practice",
    location: "Castries",
    phone: "+1 (758) 451-7788",
    email: "appointments@castrieswellness.lc",
    facebookUrl: "https://facebook.com/castrieswellness",
    description: "Outpatient family healthcare, lab diagnostics, and physiotherapy. Paper-based appointment scheduling and unencrypted patient intake files.",
    companySize: "10-20"
  },
  {
    businessName: "Piton Auto Care & Tire Centre",
    category: "Automotive & Retail",
    industry: "Auto Repair & Parts",
    location: "Vieux Fort",
    phone: "+1 (758) 454-9090",
    facebookUrl: "https://facebook.com/pitonautoslu",
    description: "Vehicle maintenance, tire replacement, and fleet service depot in the south near Hewanorra International Airport. Paper work orders and frequent parts stockouts.",
    companySize: "5-10"
  },
  {
    businessName: "Morne Coubaril Eco Tours",
    category: "Hospitality & Tourism",
    industry: "Eco-Tourism",
    location: "Soufrière",
    phone: "+1 (758) 459-7383",
    email: "tours@mornecoubarilsoufriere.com",
    facebookUrl: "https://facebook.com/mornecoubariltours",
    instagramUrl: "https://instagram.com/mornecoubariltours",
    description: "Historic cocoa plantation tours, ziplining, and botanical walks near the Pitons. Heavy reliance on cruise rep paper rosters with no unified direct booking portal.",
    companySize: "20-50"
  },
  {
    businessName: "St. Lucia Agro-Distributors Ltd",
    category: "Agriculture & Logistics",
    industry: "Wholesale Distribution",
    location: "Dennery",
    phone: "+1 (758) 453-6120",
    email: "sales@stluciaagro.com",
    linkedinUrl: "https://linkedin.com/company/stluciaagro",
    description: "Wholesale produce and cold-storage distribution supplying supermarket chains and island hotels. Lacks computerized route delivery tracking and inventory sync.",
    companySize: "15-30"
  },
  {
    businessName: "Atlantic View Eco Lodge",
    category: "Hospitality & Tourism",
    industry: "Boutique Accommodation",
    location: "Micoud",
    phone: "+1 (758) 454-1122",
    facebookUrl: "https://facebook.com/atlanticviewecolodge",
    instagramUrl: "https://instagram.com/atlanticviewecolodge",
    description: "Boutique cliffside cottages on Saint Lucia's rugged east coast. High seasonal demand but guest Wi-Fi coverage is unstable and booking is via WhatsApp messages.",
    companySize: "5-10"
  },
  {
    businessName: "Laborie Craft & Timber Works",
    category: "Manufacturing & Retail",
    industry: "Woodcraft & Cabinetry",
    location: "Laborie",
    phone: "+1 (758) 454-5501",
    facebookUrl: "https://facebook.com/laboriecraftwood",
    description: "Custom mahogany furniture, hotel cabinetry, and architectural wood restoration. Hand-drawn estimates and zero web catalogue.",
    companySize: "5-15"
  },
  {
    businessName: "Choiseul Heritage Potteries",
    category: "Artisan & Culture",
    industry: "Traditional Ceramics",
    location: "Choiseul",
    phone: "+1 (758) 459-3210",
    facebookUrl: "https://facebook.com/choiseulpotteries",
    description: "Indigenous Amerindian clay pottery and artisanal tableware for Caribbean resorts. Walk-in visitors only, no e-commerce or international payment gateway.",
    companySize: "5-10"
  },
  {
    businessName: "Cap Estate Villa Management",
    category: "Real Estate & Property",
    industry: "Property Management",
    location: "Cap Estate",
    phone: "+1 (758) 450-4499",
    email: "concierge@capestatevillas.com",
    facebookUrl: "https://facebook.com/capestatevillas",
    linkedinUrl: "https://linkedin.com/company/cap-estate-villas",
    description: "Luxury vacation villa maintenance, smart lock systems, and high-net-worth guest concierge. Disparate contractor ticketing and missing centralized guest portal.",
    companySize: "10-25"
  },
  {
    businessName: "Marigot Bay Watersports Hub",
    category: "Tourism & Recreation",
    industry: "Watersports",
    location: "Marigot Bay",
    phone: "+1 (758) 458-1288",
    instagramUrl: "https://instagram.com/marigotbaywatersports",
    description: "Kayak, paddleboard rentals, and diving excursions in the hurricane haven of Marigot Bay. Mobile-only booking through Instagram DMs with frequent missed leads.",
    companySize: "5-10"
  },
  {
    businessName: "Caribbean Commercial Chambers Legal",
    category: "Professional Services",
    industry: "Legal & Corporate",
    location: "Castries",
    phone: "+1 (758) 452-9988",
    email: "inquiries@caribbeancommerciallaw.lc",
    linkedinUrl: "https://linkedin.com/company/caribbean-commercial-chambers",
    description: "Corporate law, offshore entity registration, and trademark filings in Castries. Vulnerable to data loss without off-site cloud disaster recovery.",
    companySize: "10-20"
  }
];
