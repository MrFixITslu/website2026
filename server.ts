import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import multer from "multer";

// Configure environment variable definitions
dotenv.config();

// ---------------------------------------------------------------------------
// Admin authentication configuration
// ---------------------------------------------------------------------------
// The admin password MUST come from the environment. If it is not supplied,
// a strong random password is generated at startup and printed once to the
// server logs (never to a client) so the operator can retrieve it via
// `docker logs`. There is no hardcoded fallback password.
// General URL/reference validation for stored URL-ish fields (accessUrl,
// ad imageUrl/linkUrl). Blocks dangerous absolute URI schemes that could be
// used for stored XSS (javascript:, data:, vbscript:) or otherwise abused,
// but allows ordinary http(s) URLs AND relative paths / bare filenames
// (e.g. "/logo.png", "installer.dmg", "app.example.com") since those are
// common legitimate values here and never execute as scripts.
function isSafeUrl(value: string): boolean {
  if (typeof value !== "string" || !value.trim()) return false;
  const v = value.trim();
  try {
    // Only throws if `v` has no recognizable URI scheme (i.e. it's a
    // relative path or bare string) - those are fine.
    const parsed = new URL(v);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return true;
  }
}

// Logo-specific variant: also allow the built-in "lucide:IconName" preset
// scheme used by the admin's icon picker (not a real URL - resolved
// client-side to a bundled icon component, never fetched or navigated to).
function isSafeLogoUrl(value: string): boolean {
  if (typeof value === "string" && value.trim().startsWith("lucide:")) return true;
  return isSafeUrl(value);
}

// ---------------------------------------------------------------------------
// Course completeness gate
// ---------------------------------------------------------------------------
// A "courses" category app must not be visible to the public until its
// curriculum (chapters/lectures with real content) AND its exam (at least
// one valid question) have both been authored in the admin's Curriculum &
// Materials Manager. Non-course categories (web/desktop/games) have no such
// gate and are always considered complete.
function isCourseComplete(app: any): boolean {
  if (!app || app.category !== "courses") return true;

  // --- Curriculum check ---
  let chapters: any[] = [];
  try {
    chapters = app.curriculum ? JSON.parse(app.curriculum) : [];
  } catch {
    chapters = [];
  }
  if (!Array.isArray(chapters) || chapters.length === 0) return false;

  const hasRealLecture = chapters.some((chap: any) =>
    Array.isArray(chap?.lectures) &&
    chap.lectures.some((lec: any) =>
      lec &&
      typeof lec.title === "string" && lec.title.trim().length > 0 &&
      // A lecture must actually carry playable/reviewable material, not just a title stub.
      ((typeof lec.videoUrl === "string" && lec.videoUrl.trim().length > 0) ||
       (typeof lec.audioUrl === "string" && lec.audioUrl.trim().length > 0))
    )
  );
  if (!hasRealLecture) return false;

  // --- Exam check ---
  let questions: any[] = [];
  try {
    questions = app.exam ? JSON.parse(app.exam) : [];
  } catch {
    questions = [];
  }
  if (!Array.isArray(questions) || questions.length === 0) return false;

  const hasValidQuestion = questions.some((q: any) =>
    q &&
    typeof q.question === "string" && q.question.trim().length > 0 &&
    Array.isArray(q.options) && q.options.length >= 2 &&
    Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer < q.options.length
  );
  if (!hasValidQuestion) return false;

  return true;
}

const cleanEnvValue = (val: any): string => {
  if (!val) return "";
  let clean = val.toString().trim();
  if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.substring(1, clean.length - 1);
  if (clean.startsWith("'") && clean.endsWith("'")) clean = clean.substring(1, clean.length - 1);
  return clean.trim();
};

const ADMIN_PASSWORD = (() => {
  const fromEnv = cleanEnvValue(process.env.ADMIN_PASSWORD);
  if (fromEnv) return fromEnv;
  const generated = crypto.randomBytes(12).toString("base64url");
  console.warn("=".repeat(70));
  console.warn("[Authentication] No ADMIN_PASSWORD env var set.");
  console.warn(`[Authentication] Generated one-time admin password: ${generated}`);
  console.warn("[Authentication] Set ADMIN_PASSWORD in your environment to persist a fixed password across restarts.");
  console.warn("=".repeat(70));
  return generated;
})();

// In-memory session store: token -> expiry timestamp (ms).
// Tokens are cryptographically random and single-instance scoped, which is
// appropriate for this app's single-container deployment model.
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const adminSessions = new Map<string, number>();

function issueAdminSession(): string {
  const token = crypto.randomBytes(32).toString("hex");
  adminSessions.set(token, Date.now() + ADMIN_SESSION_TTL_MS);
  return token;
}

function isValidAdminSession(token: string | undefined | null): boolean {
  if (!token) return false;
  const expiry = adminSessions.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

// Periodically clear expired sessions so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of adminSessions.entries()) {
    if (now > expiry) adminSessions.delete(token);
  }
}, 60 * 60 * 1000).unref();

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!isValidAdminSession(token)) {
    return res.status(401).json({ error: "Unauthorized access: a valid administrator session is required." });
  }
  next();
}

// Simple in-memory rate limiter for the login endpoint to slow brute-force attempts.
// Keyed by IP address; a small dependency-free approach since the app has no
// external cache/store.
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX_ATTEMPTS = 8;
const loginAttempts = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.windowStart > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > LOGIN_MAX_ATTEMPTS;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts.entries()) {
    if (now - entry.windowStart > LOGIN_WINDOW_MS) loginAttempts.delete(ip);
  }
}, LOGIN_WINDOW_MS).unref();

// ---------------------------------------------------------------------------
// Field-level encryption (AES-256-GCM) for personal data at rest
// ---------------------------------------------------------------------------
// The app stores a small amount of personal data (student names on exam
// attempts, reviewer names on feedback). That data is encrypted before it
// touches disk (SQLite or the JSON fallback files) so that anyone with
// direct access to the database file, a backup, or the JSON files cannot
// read it without the encryption key. The app itself decrypts transparently
// for authorized API responses.
const ENCRYPTION_KEY_PATH = path.join(process.cwd(), "data", ".encryption_key");

function loadOrCreateEncryptionKey(): Buffer {
  const fromEnv = cleanEnvValue(process.env.ENCRYPTION_KEY);
  if (fromEnv) {
    const buf = /^[0-9a-fA-F]{64}$/.test(fromEnv)
      ? Buffer.from(fromEnv, "hex")
      : crypto.createHash("sha256").update(fromEnv).digest();
    return buf;
  }
  try {
    if (fs.existsSync(ENCRYPTION_KEY_PATH)) {
      const hex = fs.readFileSync(ENCRYPTION_KEY_PATH, "utf-8").trim();
      if (/^[0-9a-fA-F]{64}$/.test(hex)) return Buffer.from(hex, "hex");
    }
  } catch (e) {
    console.error("[Encryption] Failed to read persisted key:", e);
  }
  const generated = crypto.randomBytes(32);
  try {
    fs.mkdirSync(path.dirname(ENCRYPTION_KEY_PATH), { recursive: true });
    fs.writeFileSync(ENCRYPTION_KEY_PATH, generated.toString("hex"), { mode: 0o600 });
    console.warn("=".repeat(70));
    console.warn("[Encryption] No ENCRYPTION_KEY env var set.");
    console.warn(`[Encryption] Generated and persisted a new key at ${ENCRYPTION_KEY_PATH}`);
    console.warn("[Encryption] Set ENCRYPTION_KEY in your environment for production deployments,");
    console.warn("[Encryption] and back up that key - losing it makes existing encrypted data unrecoverable.");
    console.warn("=".repeat(70));
  } catch (e) {
    console.error("[Encryption] Failed to persist generated key (encrypted fields will not survive restart):", e);
  }
  return generated;
}

const ENCRYPTION_KEY = loadOrCreateEncryptionKey();
const ENC_PREFIX = "enc:v1:";

function encryptPII(plaintext: string): string {
  if (plaintext === undefined || plaintext === null || plaintext === "") return plaintext;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return ENC_PREFIX + Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

function decryptPII(payload: string): string {
  if (!payload || typeof payload !== "string" || !payload.startsWith(ENC_PREFIX)) {
    // Not encrypted (e.g. legacy/seed data) - return as-is.
    return payload;
  }
  try {
    const raw = Buffer.from(payload.slice(ENC_PREFIX.length), "base64");
    const iv = raw.subarray(0, 12);
    const authTag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf-8");
  } catch (e) {
    console.error("[Encryption] Failed to decrypt field (wrong/rotated key?):", e);
    return "[unable to decrypt]";
  }
}

const DEFAULT_CURRICULUM_JSON = JSON.stringify([
  {
    title: "Block 1: Production Core Architecture Swaps & Setup",
    lectures: [
      { id: "1-1", title: "1. Core Framework Setup and Configuration Files", duration: "12:15", videoSimType: "intro", freePreview: true },
      { id: "1-2", title: "2. Structuring TypeScript Enums and Types Safely", duration: "18:40", videoSimType: "setup" },
      { id: "1-3", title: "3. Hot-Swapping Sandbox Server Port Inbound Channels", duration: "22:05", videoSimType: "setup" }
    ]
  },
  {
    title: "Block 2: High Concurrency State Engines & DB Mappings",
    lectures: [
      { id: "2-1", title: "4. SQLite schemas modeling & Dynamic Alter Migrations", duration: "32:10", videoSimType: "deepdive" },
      { id: "2-2", title: "5. Lazy-initializing SDK clients and handling failures", duration: "25:30", videoSimType: "deepdive" },
      { id: "2-3", title: "6. Handling CORS & OAuth flows inside Sandboxed iFrames", duration: "29:15", videoSimType: "deepdive" }
    ]
  },
  {
    title: "Block 3: Production Builds & Ingress Traffic Optimization",
    lectures: [
      { id: "3-1", title: "7. Compiling TypeScript output bundles via fast esbuild", duration: "44:00", videoSimType: "advanced" },
      { id: "3-2", title: "8. Deploying standalone Cloud Container ports safely", duration: "38:50", videoSimType: "advanced" }
    ]
  }
]);

const SEED_APPS: any[] = [
  {
    name: "Full-Stack TypeScript Masterclass",
    subtitle: "Master React 19, Node.js, and Modern Database Architecture from Scratch",
    description: "Dive deep into modern software engineering with this complete guide. Learn design architectural modeling, state managers, and deployment under 3G latency conditions.",
    category: "courses",
    pricingType: "premium",
    logoUrl: "lucide:GraduationCap",
    accessUrl: "/course/1",
    launchCount: 42,
    price: 94.99,
    instructor: "Vision79 Lead Architect",
    rating: 4.9,
    duration: "24.5 total hours",
    lessonsCount: 142,
    curriculum: DEFAULT_CURRICULUM_JSON
  },
  {
    name: "Next.js 15 Intensive Bootcamp",
    subtitle: "Server Actions, RSCs, Middleware and Security Best Practices",
    description: "The complete guide to production-grade Next.js development. Understand hydration pipelines, nested layouts, and caching schemas.",
    category: "courses",
    pricingType: "premium",
    logoUrl: "lucide:BookOpen",
    accessUrl: "/course/2",
    launchCount: 28,
    price: 84.99,
    instructor: "Vision79 Lead Instructor",
    rating: 4.8,
    duration: "18 total hours",
    lessonsCount: 96,
    curriculum: DEFAULT_CURRICULUM_JSON
  },
  {
    name: "Rust Systems Design Blueprint",
    subtitle: "Memory management, async runtimes, and high-performance services",
    description: "An ultimate guide to real-time low-level backend design. Build high concurrency message queues and handle zero-copy deserialization.",
    category: "courses",
    pricingType: "premium",
    logoUrl: "lucide:ShieldCheck",
    accessUrl: "/course/3",
    launchCount: 15,
    price: 119.99,
    instructor: "Vision79 Systems Trainer",
    rating: 4.7,
    duration: "32 total hours",
    lessonsCount: 180,
    curriculum: DEFAULT_CURRICULUM_JSON
  },
  {
    name: "React for Beginners & Designers",
    subtitle: "No-jargon interactive course to build sleek frontends",
    description: "Learn Tailwind CSS grids, JSX basics, reusable hooks, and standard interactive controls step-by-step with real visual projects.",
    category: "courses",
    pricingType: "free",
    logoUrl: "lucide:Flame",
    accessUrl: "/course/4",
    launchCount: 96,
    price: 0,
    instructor: "Sarah Drasner (V79 Guest)",
    rating: 4.6,
    duration: "4.5 total hours",
    lessonsCount: 25,
    curriculum: DEFAULT_CURRICULUM_JSON
  },
  {
    name: "DevOps Orchestration Engine",
    subtitle: "Automate cloud builds, ingress proxies, and health monitoring pipelines",
    description: "An ultimate workspace setup enabling smooth automation across local and sandbox servers with strict security levels.",
    category: "web",
    pricingType: "free_trial",
    logoUrl: "lucide:Layers",
    accessUrl: "https://github.com",
    launchCount: 120
  },
  {
    name: "Aetherial Combat Tactics",
    subtitle: "Sleek indie high-refinement tactical shooter interface",
    description: "Explore microcombat arenas, layout alignments, and custom sprite canvases loaded with instant controls.",
    category: "games",
    pricingType: "free",
    logoUrl: "lucide:Gamepad2",
    accessUrl: "https://itch.io",
    launchCount: 85
  }
];

let sqliteModule: any = null;

// Try to dyamically load sqlite3 so the server never crashes on startup if prebuilds are missing
async function loadSqlite() {
  try {
    const pkg = await import("sqlite3");
    sqliteModule = pkg.default || pkg;
    console.log("[Database] sqlite3 module imported successfully.");
  } catch (e) {
    console.warn("[Database] sqlite3 binary not found/compiled in this container. Falling back to JSON-File DB Engine.");
  }
}

const SEED_ADS: any[] = [
  {
    title: "Fire Lion ICT Managed Support & Price List",
    subtitle: "Secure, enterprise-grade IT operations for Caribbean SMEs. Explore AST SLAs, daily cloud backup verification, on-site diagnostics, and interactive price builders.",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
    linkUrl: "/services-pricing"
  },
  {
    title: "Summer SaaS & Masterclass Courses Super Sale!",
    subtitle: "Get up to 60% off on all masterclass courses this week. Study high concurrency engines, hot-swapping sandbox protocols, and compile outputs.",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
    linkUrl: "https://udemy.com"
  }
];

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const JSON_DB_FILE = path.join(DATA_DIR, "vision79_saas.json");
const JSON_ADS_FILE = path.join(DATA_DIR, "vision79_ads.json");
const JSON_FEEDBACK_FILE = path.join(DATA_DIR, "vision79_feedback.json");
const JSON_EXAM_ATTEMPTS_FILE = path.join(DATA_DIR, "vision79_exam_attempts.json");
const JSON_INSTRUCTORS_FILE = path.join(DATA_DIR, "vision79_instructors.json");
const JSON_LEADS_FILE = path.join(DATA_DIR, "vision79_leads.json");

// For backwards compatibility and seamless Docker setup, copy files from the root if present
const ROOT_DB_FILE = path.join(process.cwd(), "vision79_saas.json");
const ROOT_ADS_FILE = path.join(process.cwd(), "vision79_ads.json");
const ROOT_FEEDBACK_FILE = path.join(process.cwd(), "vision79_feedback.json");
const ROOT_EXAM_ATTEMPTS_FILE = path.join(process.cwd(), "vision79_exam_attempts.json");
const ROOT_INSTRUCTORS_FILE = path.join(process.cwd(), "vision79_instructors.json");
const ROOT_LEADS_FILE = path.join(process.cwd(), "vision79_leads.json");

if (!fs.existsSync(JSON_DB_FILE) && fs.existsSync(ROOT_DB_FILE)) {
  try {
    fs.copyFileSync(ROOT_DB_FILE, JSON_DB_FILE);
    console.log("[Migration] Copied root vision79_saas.json to data/ directory.");
  } catch (e) {
    console.error("[Migration] Failed to copy root vision79_saas.json:", e);
  }
}

if (!fs.existsSync(JSON_ADS_FILE) && fs.existsSync(ROOT_ADS_FILE)) {
  try {
    fs.copyFileSync(ROOT_ADS_FILE, JSON_ADS_FILE);
    console.log("[Migration] Copied root vision79_ads.json to data/ directory.");
  } catch (e) {
    console.error("[Migration] Failed to copy root vision79_ads.json:", e);
  }
}

if (!fs.existsSync(JSON_FEEDBACK_FILE) && fs.existsSync(ROOT_FEEDBACK_FILE)) {
  try {
    fs.copyFileSync(ROOT_FEEDBACK_FILE, JSON_FEEDBACK_FILE);
    console.log("[Migration] Copied root vision79_feedback.json to data/ directory.");
  } catch (e) {
    console.error("[Migration] Failed to copy root vision79_feedback.json:", e);
  }
}

if (!fs.existsSync(JSON_EXAM_ATTEMPTS_FILE) && fs.existsSync(ROOT_EXAM_ATTEMPTS_FILE)) {
  try {
    fs.copyFileSync(ROOT_EXAM_ATTEMPTS_FILE, JSON_EXAM_ATTEMPTS_FILE);
    console.log("[Migration] Copied root vision79_exam_attempts.json to data/ directory.");
  } catch (e) {
    console.error("[Migration] Failed to copy root vision79_exam_attempts.json:", e);
  }
}

if (!fs.existsSync(JSON_INSTRUCTORS_FILE) && fs.existsSync(ROOT_INSTRUCTORS_FILE)) {
  try {
    fs.copyFileSync(ROOT_INSTRUCTORS_FILE, JSON_INSTRUCTORS_FILE);
    console.log("[Migration] Copied root vision79_instructors.json to data/ directory.");
  } catch (e) {
    console.error("[Migration] Failed to copy root vision79_instructors.json:", e);
  }
}

if (!fs.existsSync(JSON_LEADS_FILE) && fs.existsSync(ROOT_LEADS_FILE)) {
  try {
    fs.copyFileSync(ROOT_LEADS_FILE, JSON_LEADS_FILE);
    console.log("[Migration] Copied root vision79_leads.json to data/ directory.");
  } catch (e) {
    console.error("[Migration] Failed to copy root vision79_leads.json:", e);
  }
}

const SEED_FEEDBACK: any[] = [
  {
    id: 1,
    appId: 1,
    appName: "Full-Stack TypeScript Masterclass",
    rating: 5,
    comment: "This course is phenomenal! The section on Next.js Server Actions was extremely helpful and hands-on. Can we get more React 19 content added?",
    userName: "Alex Johnson",
    onboarded: 1,
    onboardedComment: "Thanks Alex! We have added 3 new lessons specifically covering React 19 UseActionState and UseFormStatus hooks.",
    feedbackType: "idea",
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    onboardedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 2,
    appId: 2,
    appName: "Next.js 15 Intensive Bootcamp",
    rating: 4,
    comment: "Great material! One request: could you add a cheat sheet for the caching strategies in Next.js 15?",
    userName: "Maria S.",
    onboarded: 0,
    onboardedComment: "",
    feedbackType: "idea",
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    onboardedAt: ""
  }
];

const SEED_INSTRUCTORS = [
  { id: 1, name: "Vision79 Lead Architect" },
  { id: 2, name: "Vision79 Lead Instructor" },
  { id: 3, name: "Vision79 Systems Trainer" },
  { id: 4, name: "Sarah Drasner (V79 Guest)" }
];

class JsonDatabase {
  readInstructors(): any[] {
    try {
      if (!fs.existsSync(JSON_INSTRUCTORS_FILE)) {
        this.writeInstructors(SEED_INSTRUCTORS);
        return SEED_INSTRUCTORS;
      }
      const content = fs.readFileSync(JSON_INSTRUCTORS_FILE, "utf-8");
      if (!content.trim()) {
        this.writeInstructors(SEED_INSTRUCTORS);
        return SEED_INSTRUCTORS;
      }
      return JSON.parse(content);
    } catch (e) {
      console.error("[JSON Database] Instructors Read error:", e);
      return SEED_INSTRUCTORS;
    }
  }

  writeInstructors(data: any[]) {
    try {
      fs.writeFileSync(JSON_INSTRUCTORS_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("[JSON Database] Instructors Write error:", e);
    }
  }

  async getInstructors(): Promise<any[]> {
    return this.readInstructors();
  }

  async addInstructor(name: string): Promise<any> {
    const list = this.readInstructors();
    if (list.some((i: any) => i.name.toLowerCase() === name.trim().toLowerCase())) {
      throw new Error("Instructor already exists");
    }
    const nextId = list.reduce((max: number, i: any) => Math.max(max, i.id || 0), 0) + 1;
    const newInst = { id: nextId, name: name.trim() };
    list.push(newInst);
    this.writeInstructors(list);
    return newInst;
  }

  async init() {
    const dbEmpty = !fs.existsSync(JSON_DB_FILE) || fs.readFileSync(JSON_DB_FILE, "utf-8").trim() === "[]" || fs.readFileSync(JSON_DB_FILE, "utf-8").trim() === "";
    if (dbEmpty) {
      console.log("[JSON Database] DB File empty or not found. Seeding beautiful initial VISION79 JSON dataset...");
      this.write(SEED_APPS);
    } else {
      console.log("[JSON Database] Successfully loaded existing JSON-backed database.");
    }

    const adsEmpty = !fs.existsSync(JSON_ADS_FILE) || fs.readFileSync(JSON_ADS_FILE, "utf-8").trim() === "[]" || fs.readFileSync(JSON_ADS_FILE, "utf-8").trim() === "";
    if (adsEmpty) {
      console.log("[JSON Database] Ads File empty or not found. Seeding beautiful initial VISION79 JSON ads dataset...");
      this.writeAds(SEED_ADS);
    } else {
      console.log("[JSON Database] Successfully loaded existing JSON-backed ads database.");
    }
  }

  read(): any[] {
    try {
      const content = fs.readFileSync(JSON_DB_FILE, "utf-8");
      const list = JSON.parse(content);
      let updated = false;
      const cleanList = list.map((item: any, i: number) => {
        if (item.id === undefined) {
          item.id = i + 1;
          updated = true;
        }
        return item;
      });
      if (updated) {
        this.write(cleanList);
      }
      return cleanList;
    } catch (e) {
      console.error("[JSON Database] Read error, resetting:", e);
      return SEED_APPS.map((item, i) => ({ ...item, id: i + 1 }));
    }
  }

  write(data: any[]) {
    try {
      fs.writeFileSync(JSON_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("[JSON Database] Write error:", e);
    }
  }

  readAds(): any[] {
    try {
      if (!fs.existsSync(JSON_ADS_FILE)) {
        return SEED_ADS.map((ad, i) => ({ ...ad, id: i + 1 }));
      }
      const content = fs.readFileSync(JSON_ADS_FILE, "utf-8");
      const list = JSON.parse(content);
      let updated = false;
      const cleanList = list.map((ad: any, i: number) => {
        if (ad.id === undefined) {
          ad.id = i + 1;
          updated = true;
        }
        return ad;
      });
      if (updated) {
        this.writeAds(cleanList);
      }
      return cleanList;
    } catch (e) {
      console.error("[JSON Database] Ads Read error, resetting:", e);
      return SEED_ADS.map((ad, i) => ({ ...ad, id: i + 1 }));
    }
  }

  writeAds(data: any[]) {
    try {
      fs.writeFileSync(JSON_ADS_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("[JSON Database] Ads Write error:", e);
    }
  }

  async getApps(): Promise<any[]> {
    return this.read();
  }

  async addApp(app: any): Promise<any> {
    const list = this.read();
    const nextId = list.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    const newApp = {
      ...app,
      id: nextId,
      launchCount: 0,
      createdAt: new Date().toISOString()
    };
    list.push(newApp);
    this.write(list);
    return newApp;
  }

  async incrementLaunch(id: number): Promise<any> {
    const list = this.read();
    const index = list.findIndex(a => a.id === Number(id));
    if (index === -1) {
      throw new Error(`SaaS app ${id} not found`);
    }
    list[index].launchCount += 1;
    this.write(list);
    return list[index];
  }

  async deleteApp(id: number): Promise<boolean> {
    const list = this.read();
    const initialLen = list.length;
    const filtered = list.filter(a => a.id !== Number(id));
    this.write(filtered);
    return filtered.length < initialLen;
  }

  async updateApp(id: number, app: any): Promise<any> {
    const list = this.read();
    const index = list.findIndex(a => a.id === Number(id));
    if (index === -1) {
      throw new Error(`SaaS app ${id} not found`);
    }
    const updatedApp = {
      ...list[index],
      ...app,
      id: Number(id), // preserve id
    };
    list[index] = updatedApp;
    this.write(list);
    return updatedApp;
  }

  async getAds(): Promise<any[]> {
    return this.readAds();
  }

  async addAd(ad: any): Promise<any> {
    const list = this.readAds();
    const nextId = list.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    const newAd = {
      ...ad,
      id: nextId,
      createdAt: new Date().toISOString()
    };
    list.push(newAd);
    this.writeAds(list);
    return newAd;
  }

  async deleteAd(id: number): Promise<boolean> {
    const list = this.readAds();
    const initialLen = list.length;
    const filtered = list.filter(a => a.id !== Number(id));
    this.writeAds(filtered);
    return filtered.length < initialLen;
  }

  readFeedback(): any[] {
    try {
      if (!fs.existsSync(JSON_FEEDBACK_FILE)) {
        this.writeFeedback(SEED_FEEDBACK);
        return SEED_FEEDBACK;
      }
      const content = fs.readFileSync(JSON_FEEDBACK_FILE, "utf-8");
      if (!content.trim()) {
        this.writeFeedback(SEED_FEEDBACK);
        return SEED_FEEDBACK;
      }
      return JSON.parse(content);
    } catch (e) {
      console.error("[JSON Database] Feedback Read error:", e);
      return SEED_FEEDBACK;
    }
  }

  writeFeedback(data: any[]) {
    try {
      fs.writeFileSync(JSON_FEEDBACK_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("[JSON Database] Feedback Write error:", e);
    }
  }

  async getFeedback(appId?: number): Promise<any[]> {
    let list = this.readFeedback();
    if (appId !== undefined) {
      list = list.filter(f => f.appId === Number(appId));
    }
    return list.map(f => ({ ...f, userName: decryptPII(f.userName) }));
  }

  async addFeedback(feedback: any): Promise<any> {
    const list = this.readFeedback();
    const nextId = list.reduce((max, f) => Math.max(max, f.id || 0), 0) + 1;
    const newFeedback = {
      id: nextId,
      appId: Number(feedback.appId),
      appName: feedback.appName || "Unknown SaaS",
      rating: Number(feedback.rating),
      comment: feedback.comment || "",
      userName: encryptPII(feedback.userName || "Anonymous"),
      onboarded: 0,
      onboardedComment: "",
      createdAt: new Date().toISOString()
    };
    list.push(newFeedback);
    this.writeFeedback(list);
    return { ...newFeedback, userName: decryptPII(newFeedback.userName) };
  }

  async onboardFeedback(id: number, comment: string): Promise<any> {
    const list = this.readFeedback();
    const index = list.findIndex(f => f.id === Number(id));
    if (index === -1) {
      throw new Error(`Feedback with ID ${id} not found`);
    }
    list[index].onboarded = 1;
    list[index].onboardedComment = comment || "";
    list[index].onboardedAt = new Date().toISOString();
    this.writeFeedback(list);
    return list[index];
  }

  readExamAttempts(): any[] {
    try {
      if (!fs.existsSync(JSON_EXAM_ATTEMPTS_FILE)) {
        return [];
      }
      const content = fs.readFileSync(JSON_EXAM_ATTEMPTS_FILE, "utf-8");
      if (!content.trim()) return [];
      return JSON.parse(content);
    } catch (e) {
      console.error("[JSON Database] Exam Attempts Read error:", e);
      return [];
    }
  }

  writeExamAttempts(data: any[]) {
    try {
      fs.writeFileSync(JSON_EXAM_ATTEMPTS_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("[JSON Database] Exam Attempts Write error:", e);
    }
  }

  async getExamAttempts(appId?: number): Promise<any[]> {
    const all = this.readExamAttempts();
    const filtered = appId === undefined ? all : all.filter((a: any) => Number(a.appId) === Number(appId));
    return filtered.map((a: any) => ({ ...a, studentName: decryptPII(a.studentName) }));
  }

  async addExamAttempt(attempt: any): Promise<any> {
    const list = this.readExamAttempts();
    const nextId = list.reduce((max, a) => Math.max(max, a.id || 0), 0) + 1;
    const newAttempt = {
      id: nextId,
      appId: Number(attempt.appId),
      studentName: encryptPII(attempt.studentName || "Anonymous Student"),
      score: attempt.score || "0/0",
      passed: attempt.passed ? 1 : 0,
      timestamp: attempt.timestamp || new Date().toISOString()
    };
    list.push(newAttempt);
    this.writeExamAttempts(list);
    return { ...newAttempt, studentName: decryptPII(newAttempt.studentName) };
  }

  readLeads(): any[] {
    try {
      if (!fs.existsSync(JSON_LEADS_FILE)) {
        return [];
      }
      const content = fs.readFileSync(JSON_LEADS_FILE, "utf-8");
      if (!content.trim()) return [];
      return JSON.parse(content);
    } catch (e) {
      console.error("[JSON Database] Leads Read error:", e);
      return [];
    }
  }

  writeLeads(data: any[]) {
    try {
      fs.writeFileSync(JSON_LEADS_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("[JSON Database] Leads Write error:", e);
    }
  }

  async getLeads(): Promise<any[]> {
    const all = this.readLeads();
    return all.map((l: any) => ({
      ...l,
      name: decryptPII(l.name),
      company: decryptPII(l.company),
      email: decryptPII(l.email),
      phone: decryptPII(l.phone)
    }));
  }

  async addLead(lead: any): Promise<any> {
    const list = this.readLeads();
    const nextId = list.reduce((max, l) => Math.max(max, l.id || 0), 0) + 1;
    const newLead = {
      id: nextId,
      name: encryptPII(lead.name),
      company: encryptPII(lead.company),
      email: encryptPII(lead.email),
      phone: encryptPII(lead.phone),
      employees: lead.employees || "",
      biggestChallenge: lead.biggestChallenge || "",
      message: lead.message || "",
      status: "New",
      adminNotes: "",
      createdAt: new Date().toISOString()
    };
    list.push(newLead);
    this.writeLeads(list);
    return {
      ...newLead,
      name: decryptPII(newLead.name),
      company: decryptPII(newLead.company),
      email: decryptPII(newLead.email),
      phone: decryptPII(newLead.phone)
    };
  }

  async updateLead(id: number, lead: any): Promise<any> {
    const list = this.readLeads();
    const index = list.findIndex(l => l.id === Number(id));
    if (index === -1) {
      throw new Error(`Lead with ID ${id} not found`);
    }
    list[index].status = lead.status || "New";
    list[index].adminNotes = lead.adminNotes || "";
    this.writeLeads(list);
    return {
      ...list[index],
      name: decryptPII(list[index].name),
      company: decryptPII(list[index].company),
      email: decryptPII(list[index].email),
      phone: decryptPII(list[index].phone)
    };
  }
}

class SqliteDatabase {
  private db: any;

  async init() {
    const sqlite3 = sqliteModule.verbose();
    const DB_FILE = path.join(process.cwd(), "data", "vision79_saas.db");
    this.db = new sqlite3.Database(DB_FILE);

    return new Promise<void>((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(
          `CREATE TABLE IF NOT EXISTS saas_instructors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
          )`,
          (instErr: any) => {
            if (instErr) {
              console.error("[SQLite DB] Instructors Table Creation failed:", instErr);
            } else {
              this.db.get("SELECT COUNT(*) as count FROM saas_instructors", (cErr: any, row: any) => {
                if (!cErr && row && row.count === 0) {
                  console.log("[SQLite DB] Instructors table empty. Seeding...");
                  const stmt = this.db.prepare("INSERT INTO saas_instructors (name) VALUES (?)");
                  const defaultInstructors = [
                    "Vision79 Lead Architect",
                    "Vision79 Lead Instructor",
                    "Vision79 Systems Trainer",
                    "Sarah Drasner (V79 Guest)"
                  ];
                  for (const name of defaultInstructors) {
                    stmt.run([name]);
                  }
                  stmt.finalize();
                }
              });
            }
          }
        );

        this.db.run(
          `CREATE TABLE IF NOT EXISTS saas_exam_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            appId INTEGER NOT NULL,
            studentName TEXT NOT NULL,
            score TEXT NOT NULL,
            passed INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )`
        );

        this.db.run(
          `CREATE TABLE IF NOT EXISTS saas_apps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            subtitle TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            pricingType TEXT NOT NULL,
            logoUrl TEXT NOT NULL,
            accessUrl TEXT NOT NULL,
            launchCount INTEGER NOT NULL DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )`,
          (err: any) => {
            if (err) {
              console.error("[SQLite DB] Creation failed:", err);
              return reject(err);
            }

            // Alter table statements to add newer columns dynamically for Courses supporting
            this.db.run("ALTER TABLE saas_apps ADD COLUMN price REAL DEFAULT 0", () => {});
            this.db.run("ALTER TABLE saas_apps ADD COLUMN instructor TEXT", () => {});
            this.db.run("ALTER TABLE saas_apps ADD COLUMN rating REAL DEFAULT 4.7", () => {});
            this.db.run("ALTER TABLE saas_apps ADD COLUMN duration TEXT", () => {});
            this.db.run("ALTER TABLE saas_apps ADD COLUMN lessonsCount INTEGER DEFAULT 10", () => {});
            this.db.run("ALTER TABLE saas_apps ADD COLUMN curriculum TEXT", () => {});
            this.db.run("ALTER TABLE saas_apps ADD COLUMN exam TEXT", () => {});
            this.db.run("ALTER TABLE saas_apps ADD COLUMN syllabus TEXT", () => {});

            this.db.get("SELECT COUNT(*) as count FROM saas_apps", (countErr: any, row: any) => {
              if (countErr) return reject(countErr);

              if (row && row.count === 0) {
                console.log("[SQLite DB] Database empty. Seeding SQLite...");
                const stmt = this.db.prepare(
                  `INSERT INTO saas_apps (name, subtitle, description, category, pricingType, logoUrl, accessUrl, launchCount, price, instructor, rating, duration, lessonsCount, curriculum)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                );

                for (const app of SEED_APPS) {
                  stmt.run([
                    app.name,
                    app.subtitle,
                    app.description,
                    app.category,
                    app.pricingType,
                    app.logoUrl,
                    app.accessUrl,
                    app.launchCount || 0,
                    app.price || 0,
                    app.instructor || "",
                    app.rating || 4.7,
                    app.duration || "",
                    app.lessonsCount || 0,
                    app.curriculum || ""
                  ]);
                }

                stmt.finalize();
              }
            });
          }
        );

        this.db.run(
          `CREATE TABLE IF NOT EXISTS saas_ads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            subtitle TEXT NOT NULL,
            imageUrl TEXT NOT NULL,
            linkUrl TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )`,
          (err: any) => {
            if (err) {
              console.error("[SQLite DB] Ads Table Creation failed:", err);
              return reject(err);
            }

            const initLeadsTable = () => {
              this.db.run(
                `CREATE TABLE IF NOT EXISTS saas_leads (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  company TEXT NOT NULL,
                  email TEXT NOT NULL,
                  phone TEXT NOT NULL,
                  employees TEXT NOT NULL,
                  biggestChallenge TEXT NOT NULL,
                  message TEXT,
                  status TEXT DEFAULT 'New',
                  adminNotes TEXT DEFAULT '',
                  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                (lErr: any) => {
                  if (lErr) {
                    console.error("[SQLite DB] Leads Table Creation failed:", lErr);
                    return reject(lErr);
                  }
                  resolve();
                }
              );
            };

            const initFeedbackTable = () => {
              this.db.run(
                `CREATE TABLE IF NOT EXISTS saas_feedback (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  appId INTEGER NOT NULL,
                  appName TEXT NOT NULL,
                  rating INTEGER NOT NULL,
                  comment TEXT NOT NULL,
                  userName TEXT NOT NULL,
                  onboarded INTEGER NOT NULL DEFAULT 0,
                  onboardedComment TEXT NOT NULL DEFAULT '',
                  feedbackType TEXT NOT NULL DEFAULT 'feedback',
                  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                (fErr: any) => {
                  if (fErr) {
                    console.error("[SQLite DB] Feedback Table Creation failed:", fErr);
                    return reject(fErr);
                  }

                  // Safe ALTER TABLE statement to add feedbackType dynamically if the table exists
                  this.db.run("ALTER TABLE saas_feedback ADD COLUMN feedbackType TEXT NOT NULL DEFAULT 'feedback'", () => {});
                  this.db.run("ALTER TABLE saas_feedback ADD COLUMN onboardedAt TEXT", () => {});

                  this.db.get("SELECT COUNT(*) as count FROM saas_feedback", (fCountErr: any, fRow: any) => {
                    if (fCountErr) return reject(fCountErr);

                    if (fRow && fRow.count === 0) {
                      console.log("[SQLite DB] Feedback empty. Seeding SQLite Feedback...");
                      const fStmt = this.db.prepare(
                        `INSERT INTO saas_feedback (appId, appName, rating, comment, userName, onboarded, onboardedComment, createdAt)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                      );

                      for (const f of SEED_FEEDBACK) {
                        fStmt.run([
                          f.appId,
                          f.appName,
                          f.rating,
                          f.comment,
                          f.userName || "Anonymous",
                          f.onboarded,
                          f.onboardedComment || "",
                          f.createdAt
                        ]);
                      }

                      fStmt.finalize((ffErr: any) => {
                        if (ffErr) return reject(ffErr);
                        initLeadsTable();
                      });
                    } else {
                      initLeadsTable();
                    }
                  });
                }
              );
            };

            this.db.get("SELECT COUNT(*) as count FROM saas_ads", (countErr: any, row: any) => {
              if (countErr) return reject(countErr);

              if (row && row.count === 0) {
                console.log("[SQLite DB] Ads empty. Seeding SQLite Ads...");
                const stmt = this.db.prepare(
                  `INSERT INTO saas_ads (title, subtitle, imageUrl, linkUrl)
                   VALUES (?, ?, ?, ?)`
                );

                for (const ad of SEED_ADS) {
                  stmt.run([
                    ad.title,
                    ad.subtitle,
                    ad.imageUrl,
                    ad.linkUrl
                  ]);
                }

                stmt.finalize((fErr: any) => {
                  if (fErr) return reject(fErr);
                  initFeedbackTable();
                });
              } else {
                initFeedbackTable();
              }
            });
          }
        );
      });
    });
  }

  async getApps(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM saas_apps ORDER BY id DESC", (err: any, rows: any) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async addApp(app: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const q = `
        INSERT INTO saas_apps (name, subtitle, description, category, pricingType, logoUrl, accessUrl, launchCount, price, instructor, rating, duration, lessonsCount, curriculum, exam, syllabus)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const self = this;
      this.db.run(q, [
        app.name, 
        app.subtitle, 
        app.description, 
        app.category, 
        app.pricingType, 
        app.logoUrl, 
        app.accessUrl,
        app.price || 0,
        app.instructor || "",
        app.rating || 4.7,
        app.duration || "",
        app.lessonsCount || 0,
        app.curriculum || "",
        app.exam || "",
        app.syllabus || ""
      ], (err: any) => {
        if (err) return reject(err);
        
        self.db.get("SELECT last_insert_rowid() AS lastId", (rowIdErr: any, rowIdRes: any) => {
          if (rowIdErr) return reject(rowIdErr);
          const newId = rowIdRes ? rowIdRes.lastId : 0;
          
          self.db.get("SELECT * FROM saas_apps WHERE id = ?", [newId], (gErr: any, row: any) => {
            if (gErr) return reject(gErr);
            resolve(row);
          });
        });
      });
    });
  }

  async incrementLaunch(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const self = this;
      this.db.run(
        "UPDATE saas_apps SET launchCount = launchCount + 1 WHERE id = ?",
        [id],
        (err: any) => {
          if (err) return reject(err);
          self.db.get("SELECT * FROM saas_apps WHERE id = ?", [id], (gErr: any, row: any) => {
            if (gErr) return reject(gErr);
            resolve(row);
          });
        }
      );
    });
  }

  async deleteApp(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // First check if the application exists so we can return a proper boolean success
      this.db.get("SELECT id FROM saas_apps WHERE id = ?", [id], (err: any, row: any) => {
        if (err) {
          console.error(`[SQLite DB] Error checking app existence for ID ${id}:`, err);
          return reject(err);
        }
        if (!row) {
          console.log(`[SQLite DB] Delete app mismatch: ID ${id} not found.`);
          return resolve(false);
        }
        
        // Exists, perform the standard DELETE command
        this.db.run("DELETE FROM saas_apps WHERE id = ?", [id], (delErr: any) => {
          if (delErr) {
            console.error(`[SQLite DB] Error deleting app record ID ${id}:`, delErr);
            return reject(delErr);
          }
          console.log(`[SQLite DB] Successfully deleted saas_apps record with ID: ${id}`);
          resolve(true);
        });
      });
    });
  }

  async updateApp(id: number, app: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const self = this;
      self.db.get("SELECT * FROM saas_apps WHERE id = ?", [Number(id)], (fetchErr: any, existing: any) => {
        if (fetchErr) return reject(fetchErr);
        if (!existing) return reject(new Error(`SaaS app ${id} not found`));

        // Merge: only fields explicitly present in `app` override the
        // existing stored value. This prevents a partial update (e.g. from
        // the basic-info edit form, which doesn't send curriculum/exam)
        // from wiping out fields it never intended to touch.
        const merged = { ...existing, ...app };

        const q = `
          UPDATE saas_apps 
          SET name = ?, subtitle = ?, description = ?, category = ?, pricingType = ?, logoUrl = ?, accessUrl = ?, price = ?, instructor = ?, rating = ?, duration = ?, lessonsCount = ?, curriculum = ?, exam = ?, syllabus = ?
          WHERE id = ?
        `;
        self.db.run(q, [
          merged.name,
          merged.subtitle,
          merged.description,
          merged.category,
          merged.pricingType,
          merged.logoUrl,
          merged.accessUrl,
          merged.price !== undefined ? Number(merged.price) : 0,
          merged.instructor || "",
          merged.rating !== undefined ? Number(merged.rating) : 0,
          merged.duration || "",
          merged.lessonsCount !== undefined ? Number(merged.lessonsCount) : 0,
          merged.curriculum || "",
          merged.exam || "",
          merged.syllabus || "",
          Number(id)
        ], (err: any) => {
          if (err) {
            console.error(`[SQLite DB] Error updating app record ID ${id}:`, err);
            return reject(err);
          }

          self.db.get("SELECT * FROM saas_apps WHERE id = ?", [id], (gErr: any, row: any) => {
            if (gErr) return reject(gErr);
            resolve(row);
          });
        });
      });
    });
  }

  async getAds(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM saas_ads ORDER BY id DESC", (err: any, rows: any) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async addAd(ad: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const q = `
        INSERT INTO saas_ads (title, subtitle, imageUrl, linkUrl)
        VALUES (?, ?, ?, ?)
      `;
      const self = this;
      this.db.run(q, [ad.title, ad.subtitle, ad.imageUrl, ad.linkUrl], (err: any) => {
        if (err) return reject(err);
        
        self.db.get("SELECT last_insert_rowid() AS lastId", (rowIdErr: any, rowIdRes: any) => {
          if (rowIdErr) return reject(rowIdErr);
          const newId = rowIdRes ? rowIdRes.lastId : 0;
          
          self.db.get("SELECT * FROM saas_ads WHERE id = ?", [newId], (gErr: any, row: any) => {
            if (gErr) return reject(gErr);
            resolve(row);
          });
        });
      });
    });
  }

  async deleteAd(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // First check if the ad exists
      this.db.get("SELECT id FROM saas_ads WHERE id = ?", [id], (err: any, row: any) => {
        if (err) {
          console.error(`[SQLite DB] Error checking ad existence for ID ${id}:`, err);
          return reject(err);
        }
        if (!row) {
          console.log(`[SQLite DB] Delete ad mismatch: ID ${id} not found.`);
          return resolve(false);
        }
        
        this.db.run("DELETE FROM saas_ads WHERE id = ?", [id], (delErr: any) => {
          if (delErr) {
            console.error(`[SQLite DB] Error executing DELETE FROM saas_ads for ID ${id}:`, delErr);
            return reject(delErr);
          }
          console.log(`[SQLite DB] Successfully deleted saas_ads campaign record with ID: ${id}`);
          resolve(true);
        });
      });
    });
  }

  async getFeedback(appId?: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let query = "SELECT * FROM saas_feedback";
      const params: any[] = [];
      if (appId !== undefined) {
        query += " WHERE appId = ?";
        params.push(Number(appId));
      }
      query += " ORDER BY id DESC";
      this.db.all(query, params, (err: any, rows: any) => {
        if (err) return reject(err);
        resolve((rows || []).map((r: any) => ({ ...r, userName: decryptPII(r.userName) })));
      });
    });
  }

  async addFeedback(feedback: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const q = `
        INSERT INTO saas_feedback (appId, appName, rating, comment, userName, onboarded, onboardedComment, feedbackType, createdAt)
        VALUES (?, ?, ?, ?, ?, 0, '', ?, CURRENT_TIMESTAMP)
      `;
      const self = this;
      this.db.run(q, [
        Number(feedback.appId),
        feedback.appName || "Unknown SaaS",
        Number(feedback.rating),
        feedback.comment || "",
        encryptPII(feedback.userName || "Anonymous"),
        feedback.feedbackType || "feedback"
      ], function(this: any, err: any) {
        if (err) return reject(err);
        
        self.db.get("SELECT last_insert_rowid() AS lastId", (rowIdErr: any, rowIdRes: any) => {
          if (rowIdErr) return reject(rowIdErr);
          const newId = rowIdRes ? rowIdRes.lastId : 0;
          
          self.db.get("SELECT * FROM saas_feedback WHERE id = ?", [newId], (gErr: any, row: any) => {
            if (gErr) return reject(gErr);
            resolve(row ? { ...row, userName: decryptPII(row.userName) } : row);
          });
        });
      });
    });
  }

  async onboardFeedback(id: number, comment: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const q = `
        UPDATE saas_feedback 
        SET onboarded = 1, onboardedComment = ?, onboardedAt = ? 
        WHERE id = ?
      `;
      const self = this;
      const now = new Date().toISOString();
      this.db.run(q, [comment || "", now, Number(id)], function(this: any, err: any) {
        if (err) return reject(err);
        
        self.db.get("SELECT * FROM saas_feedback WHERE id = ?", [Number(id)], (fetchErr: any, row: any) => {
          if (fetchErr) return reject(fetchErr);
          resolve(row ? { ...row, userName: decryptPII(row.userName) } : row);
        });
      });
    });
  }

  async getExamAttempts(appId?: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const decorate = (rows: any) => (rows || []).map((r: any) => ({ ...r, studentName: decryptPII(r.studentName) }));
      if (appId === undefined) {
        this.db.all("SELECT * FROM saas_exam_attempts ORDER BY id DESC", (err: any, rows: any) => {
          if (err) return reject(err);
          resolve(decorate(rows));
        });
      } else {
        this.db.all(
          "SELECT * FROM saas_exam_attempts WHERE appId = ? ORDER BY id DESC",
          [appId],
          (err: any, rows: any) => {
            if (err) return reject(err);
            resolve(decorate(rows));
          }
        );
      }
    });
  }

  async addExamAttempt(attempt: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const q = `
        INSERT INTO saas_exam_attempts (appId, studentName, score, passed, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `;
      const self = this;
      const ts = attempt.timestamp || new Date().toISOString();
      this.db.run(q, [
        Number(attempt.appId),
        encryptPII(attempt.studentName || "Anonymous Student"),
        attempt.score || "0/0",
        attempt.passed ? 1 : 0,
        ts
      ], function(this: any, err: any) {
        if (err) return reject(err);
        
        const insertId = this.lastID;
        self.db.get("SELECT * FROM saas_exam_attempts WHERE id = ?", [insertId], (gErr: any, row: any) => {
          if (gErr) return reject(gErr);
          resolve(row ? { ...row, studentName: decryptPII(row.studentName) } : row);
        });
      });
    });
  }

  async getInstructors(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM saas_instructors ORDER BY name ASC", (err: any, rows: any) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  async addInstructor(name: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const self = this;
      const trimmed = name.trim();
      this.db.run("INSERT INTO saas_instructors (name) VALUES (?)", [trimmed], function(this: any, err: any) {
        if (err) {
          if (err.message && err.message.includes("UNIQUE")) {
            return reject(new Error("Instructor already exists"));
          }
          return reject(err);
        }
        const insertId = this.lastID;
        self.db.get("SELECT * FROM saas_instructors WHERE id = ?", [insertId], (gErr: any, row: any) => {
          if (gErr) return reject(gErr);
          resolve(row);
        });
      });
    });
  }

  async getLeads(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM saas_leads ORDER BY id DESC", (err: any, rows: any) => {
        if (err) return reject(err);
        const decrypted = (rows || []).map((r: any) => ({
          ...r,
          name: decryptPII(r.name),
          company: decryptPII(r.company),
          email: decryptPII(r.email),
          phone: decryptPII(r.phone)
        }));
        resolve(decrypted);
      });
    });
  }

  async addLead(lead: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const q = `
        INSERT INTO saas_leads (name, company, email, phone, employees, biggestChallenge, message, status, adminNotes, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'New', '', CURRENT_TIMESTAMP)
      `;
      const self = this;
      this.db.run(q, [
        encryptPII(lead.name),
        encryptPII(lead.company),
        encryptPII(lead.email),
        encryptPII(lead.phone),
        lead.employees || "",
        lead.biggestChallenge || "",
        lead.message || ""
      ], function(this: any, err: any) {
        if (err) return reject(err);
        
        const insertId = this.lastID;
        self.db.get("SELECT * FROM saas_leads WHERE id = ?", [insertId], (gErr: any, row: any) => {
          if (gErr) return reject(gErr);
          if (!row) return resolve(null);
          resolve({
            ...row,
            name: decryptPII(row.name),
            company: decryptPII(row.company),
            email: decryptPII(row.email),
            phone: decryptPII(row.phone)
          });
        });
      });
    });
  }

  async updateLead(id: number, lead: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const q = `
        UPDATE saas_leads 
        SET status = ?, adminNotes = ?
        WHERE id = ?
      `;
      const self = this;
      this.db.run(q, [
        lead.status || 'New',
        lead.adminNotes || '',
        Number(id)
      ], function(this: any, err: any) {
        if (err) return reject(err);
        self.db.get("SELECT * FROM saas_leads WHERE id = ?", [Number(id)], (gErr: any, row: any) => {
          if (gErr) return reject(gErr);
          if (!row) return resolve(null);
          resolve({
            ...row,
            name: decryptPII(row.name),
            company: decryptPII(row.company),
            email: decryptPII(row.email),
            phone: decryptPII(row.phone)
          });
        });
      });
    });
  }
}

const ARTICLES_DIR = path.join(DATA_DIR, "articles");

function parseFrontMatter(fileContent: string) {
  const match = fileContent.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
  const metadata: Record<string, string> = {};
  let content = fileContent;

  if (match) {
    const yaml = match[1];
    content = match[2];
    const lines = yaml.split("\n");
    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx !== -1) {
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        // Remove surrounding quotes if any
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        metadata[key] = val;
      }
    }
  }

  return { metadata, content };
}

function seedArticlesIfEmpty() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  }

  const files = fs.readdirSync(ARTICLES_DIR);
  if (files.length === 0) {
    console.log("[Articles] Seeding default B2B articles...");
    const seed1 = `---
title: "Cybersecurity Best Practices for Saint Lucian SMEs"
description: "With cyber attacks targeting Caribbean businesses at record rates, learn the basic hygiene rules to protect your digital assets."
category: "Security"
date: "2026-07-10"
author: "Neil Verdant"
coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop"
slug: "cybersecurity-best-practices"
---
# Cybersecurity Best Practices for Saint Lucian SMEs

In today's digital landscape, cybersecurity is no longer just an IT issue; it is a critical business survival factor. Small and medium-sized enterprises (SMEs) in Saint Lucia are increasingly targeted by ransomware, phishing schemes, and social engineering.

## 1. Enforce Multi-Factor Authentication (MFA)
MFA adds an extra layer of defense by requiring two or more verification factors to gain access to email, banking, or business accounts. Enabling MFA stops over 99% of automated account takeover attacks.

## 2. Secure Your Wi-Fi Networks
Never run guest and corporate traffic on the same subnet. Segregate your networks so guest Wi-Fi cannot access servers, POS devices, or administrative desktops.

## 3. Keep Software Patched
Regularly update routers, firewalls, operating systems, and office applications. Unpatched systems are key entry points for hackers.

Need a professional security audit? Contact V79SL today.`;

    const seed2 = `---
title: "Migrating to Microsoft 365: A Guide for Local Businesses"
description: "Discover why moving your business email and collaboration to the Microsoft 365 cloud is the key to remote productivity and professional branding."
category: "Cloud Services"
date: "2026-07-12"
author: "Neil Verdant"
coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop"
slug: "migrating-to-microsoft-365"
---
# Migrating to Microsoft 365: A Guide for Local Businesses

In a business ecosystem where email is the main communication channel, running your email on old, unencrypted cPanel mailboxes is a liability. Migrating to Microsoft 365 offers modern reliability, spam prevention, and real-time collaboration.

## 1. Custom Professional Domains
Build trust with custom branded emails (e.g., yourname@company.com) powered by the secure Exchange server.

## 2. Collaborate on SharePoint and Teams
Access files securely from any device in Saint Lucia. Work on files together in real time and conduct business video calls.

## 3. Integrated Security and Spam Defense
Microsoft 365 stops phishing attempts, encrypts data in transit, and integrates with standard active directories.

Ready to migrate? V79SL handles licensing, data migration, and Outlook configurations.`;

    const seed3 = `---
title: "The Critical Importance of Redundant Cloud Backups"
description: "Saint Lucian enterprises must prepare for tropical storms, power surges, and ransomware. A robust backup policy is your ultimate insurance."
category: "Data Continuity"
date: "2026-07-15"
author: "Neil Verdant"
coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop"
slug: "importance-of-cloud-backups"
---
# The Critical Importance of Redundant Cloud Backups

For any modern enterprise, data is the most valuable asset. A sudden power outage, hardware crash, or hurricane can wipe out decades of local accounting records, inventory data, or customer databases.

## 1. The 3-2-1 Backup Strategy
Keep 3 copies of your data, store them on 2 different media types, and keep 1 copy off-site (in the cloud).

## 2. Automated Daily Verification
A backup is only as good as its restore capability. At V79SL, we monitor daily backups, run restoration tests, and guarantee hot-site backup redundancy.

## 3. Rapid Disaster Recovery
With hot-site standby servers, we can restore client operations in hours rather than weeks, ensuring business continuity.

Protect your data today. Contact V79SL for automated cloud backup configurations.`;

    fs.writeFileSync(path.join(ARTICLES_DIR, "cybersecurity-best-practices.md"), seed1, "utf-8");
    fs.writeFileSync(path.join(ARTICLES_DIR, "migrating-to-microsoft-365.md"), seed2, "utf-8");
    fs.writeFileSync(path.join(ARTICLES_DIR, "importance-of-cloud-backups.md"), seed3, "utf-8");
  }
}

let db: any;

async function initDb() {
  await loadSqlite();
  if (sqliteModule) {
    try {
      const sqliteDb = new SqliteDatabase();
      await sqliteDb.init();
      db = sqliteDb;
      console.log("[Database] Active storage layer: SQLite Database and File initialized of persistence!");
    } catch (e) {
      console.error("[Database] SQLite init failed, falling back to JSON schema:", e);
      const jsonDb = new JsonDatabase();
      await jsonDb.init();
      db = jsonDb;
    }
  } else {
    console.log("[Database] Active storage layer: Pure-JSON Engine file initialized!");
    const jsonDb = new JsonDatabase();
    await jsonDb.init();
    db = jsonDb;
  }

  try {
    seedArticlesIfEmpty();
  } catch (err) {
    console.error("[Articles] Seeding failed:", err);
  }
}

async function startServer() {
  await initDb();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  // Trust the first proxy hop (e.g. Nginx Proxy Manager) so req.ip reflects
  // the real client address for rate limiting and logging.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  // Auto-detect production mode if NODE_ENV is set to "production", or we are running the compiled dist bundle, or server.ts is absent
  const isCJS = typeof __filename !== "undefined" && (__filename.endsWith(".cjs") || __filename.includes("dist"));
  const isProdFile = !!(process.argv[1] && (process.argv[1].endsWith(".cjs") || process.argv[1].includes("dist/")));
  const isProduction = process.env.NODE_ENV === "production" || isCJS || isProdFile || !fs.existsSync(path.resolve(process.cwd(), "server.ts"));
  const isDev = !isProduction;

  let viteInstance: any = null;
  if (isDev) {
    console.log("[Vite] Initializing Vite dev server in middleware mode.");
    viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
  }

  // Middleware
  app.use(express.json({ limit: "5mb" }));

  // Static serving for uploaded course materials (audio, video, documents)
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // Multer Storage Engine for Audio and Video uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      cb(null, `${path.basename(cleanName, ext)}-${uniqueSuffix}${ext}`);
    }
  });

  // Only allow file types appropriate for course/media uploads. This prevents
  // uploading executables, HTML (which could be served same-origin and used
  // for stored XSS/phishing), or other unexpected content types.
  const ALLOWED_UPLOAD_EXTENSIONS = new Set([
    ".mp4", ".webm", ".mov", ".mp3", ".wav", ".m4a", ".ogg",
    ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp"
  ]);
  // Note: .svg is intentionally excluded — SVGs can embed <script> and execute
  // when opened directly from the same origin, which would allow stored XSS.
  const ALLOWED_UPLOAD_MIME_PREFIXES = ["audio/", "video/", "image/"];
  const ALLOWED_UPLOAD_MIME_EXACT = new Set(["application/pdf"]);

  const upload = multer({
    storage,
    limits: {
      fileSize: 150 * 1024 * 1024 // Allow up to 150 MB media file size simulation
    },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const mimeOk =
        ALLOWED_UPLOAD_MIME_EXACT.has(file.mimetype) ||
        ALLOWED_UPLOAD_MIME_PREFIXES.some((p) => file.mimetype.startsWith(p));
      if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext) || !mimeOk) {
        return cb(new Error("Unsupported file type. Allowed: audio, video, image, and PDF files."));
      }
      cb(null, true);
    }
  });

  // Canonical admin intercept routes registered first to prioritize admin page loading
  const adminPaths = [
    "/admin", "/admin/", 
    "/adimin", "/adimin/", 
    "/adimn", "/adimn/", 
    "/Admin", "/Admin/", 
    "/Adimin", "/Adimin/"
  ];

  app.get(adminPaths, async (req, res, next) => {
    console.log(`[Admin Router] Serving admin.html for path: ${req.originalUrl} (Dev Mode: ${isDev})`);
    if (isDev && viteInstance) {
      try {
        const url = req.originalUrl;
        const htmlPath = path.resolve(process.cwd(), "admin.html");
        if (fs.existsSync(htmlPath)) {
          const html = fs.readFileSync(htmlPath, "utf-8");
          const transformedHtml = await viteInstance.transformIndexHtml(url, html);
          return res.status(200).set({ "Content-Type": "text/html" }).end(transformedHtml);
        } else {
          return res.status(404).end("admin.html file not found");
        }
      } catch (e) {
        viteInstance.ssrFixStacktrace(e as Error);
        return next(e);
      }
    } else {
      const distPath = path.join(process.cwd(), "dist");
      return res.sendFile(path.join(distPath, "admin.html"));
    }
  });

  // GET all SaaS applications
  app.get("/api/apps", async (req, res) => {
    try {
      const [apps, feedback] = await Promise.all([db.getApps(), db.getFeedback()]);

      // Compute a real average rating (and count) per app from actual
      // submitted feedback, rather than trusting a static stored number.
      const ratingsByApp = new Map<number, { sum: number; count: number }>();
      for (const f of feedback) {
        if (!f.rating || !Number.isFinite(Number(f.rating))) continue;
        const key = Number(f.appId);
        const entry = ratingsByApp.get(key) || { sum: 0, count: 0 };
        entry.sum += Number(f.rating);
        entry.count += 1;
        ratingsByApp.set(key, entry);
      }

      const appsWithLiveRatings = apps.map((a: any) => {
        const stats = ratingsByApp.get(Number(a.id));
        return {
          ...a,
          rating: stats ? Number((stats.sum / stats.count).toFixed(1)) : 0,
          ratingCount: stats ? stats.count : 0,
          isComplete: isCourseComplete(a)
        };
      });

      // Only fully-authenticated admin sessions may see incomplete/draft
      // courses. Public (and any unauthenticated) requests only ever see
      // courses whose curriculum + exam are actually finished, so a course
      // can never appear "available" mid-setup.
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      const isAdmin = isValidAdminSession(token);

      const visibleApps = isAdmin
        ? appsWithLiveRatings
        : appsWithLiveRatings.filter((a: any) => a.category !== "courses" || a.isComplete);

      res.json(visibleApps);
    } catch (err) {
      console.error("[API] Error fetching apps:", err);
      res.status(500).json({ error: "Db exception fetching applications" });
    }
  });

  // POST administrator login verification
  app.post("/api/admin/login", (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (isRateLimited(ip)) {
        console.warn(`[Authentication] Rate limit exceeded for ${ip}`);
        return res.status(429).json({ error: "Too many login attempts. Please try again later." });
      }

      const { password } = req.body || {};
      const submitted = cleanEnvValue(password);

      const submittedBuf = Buffer.from(submitted);
      const expectedBuf = Buffer.from(ADMIN_PASSWORD);
      const matches =
        submittedBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(submittedBuf, expectedBuf);

      if (matches) {
        const token = issueAdminSession();
        console.log("[Authentication] Success. New session token issued.");
        return res.json({ success: true, token });
      }

      console.warn(`[Authentication] Rejecting unauthorized login attempt from ${ip}.`);
      return res.status(401).json({ error: "Incorrect administrator credentials." });
    } catch (err: any) {
      console.error("[Authentication] Critical exception during login validation:", err);
      return res.status(500).json({ error: "Server authentication engine error." });
    }
  });

  // POST administrator logout - invalidate the current session token
  app.post("/api/admin/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) adminSessions.delete(token);
    res.json({ success: true });
  });

  // GET administrator launch trends (last 7 days of total launch counts)
  app.get("/api/admin/launch-trends", requireAdmin, async (req, res) => {
    try {
      const apps = await db.getApps();
      const currentTotal = apps.reduce((sum: number, app: any) => sum + (app.launchCount || 0), 0);

      const days = [];
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateString = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        let subtraction = 0;
        // Since we are iterating back, we determine deterministic subtraction
        for (let j = 0; j < i; j++) {
          const tempDate = new Date();
          tempDate.setDate(now.getDate() - j);
          // Use day of month to create a realistic, unique but stable step
          const dayVal = tempDate.getDate();
          const diff = 45 + (dayVal % 10) * 3; // steps between 45 and 75
          subtraction += diff;
        }

        days.push({
          date: dateString,
          launches: Math.max(0, currentTotal - subtraction)
        });
      }

      res.json(days);
    } catch (err) {
      console.error("[API] Error generating launch trends:", err);
      res.status(500).json({ error: "Database error during trend extraction" });
    }
  });

  // POST file upload endpoint (audio, video, documents)
  app.post("/api/upload", requireAdmin, (req, res) => {
    upload.single("file")(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message || "Upload failed." });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No file was uploaded." });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    });
  });

  // POST create a new SaaS application record
  app.post("/api/apps", requireAdmin, async (req, res) => {

    const { name, subtitle, description, category, pricingType, logoUrl, accessUrl, price, instructor, rating, duration, lessonsCount, curriculum, exam, syllabus } = req.body;

    // validation
    if (!name || !subtitle || !description || !category || !pricingType || !logoUrl || !accessUrl) {
      return res.status(400).json({ error: "Missing required fields in body payload" });
    }

    if (category !== "web" && category !== "desktop" && category !== "games" && category !== "courses") {
      return res.status(400).json({ error: "Category must be 'web', 'desktop', 'games', or 'courses'" });
    }

    if (pricingType !== "free" && pricingType !== "free_trial" && pricingType !== "premium") {
      return res.status(400).json({ error: "Pricing type must be 'free', 'free_trial', or 'premium'" });
    }

    if (!isSafeLogoUrl(logoUrl) || !isSafeUrl(accessUrl)) {
      return res.status(400).json({ error: "logoUrl and accessUrl must be valid http(s) or relative URLs" });
    }

    try {
      const newApp = await db.addApp({ 
        name, 
        subtitle, 
        description, 
        category, 
        pricingType, 
        logoUrl, 
        accessUrl,
        price: price !== undefined ? Number(price) : 0,
        instructor: instructor || "",
        rating: rating !== undefined ? Number(rating) : 0,
        duration: duration || "",
        lessonsCount: lessonsCount !== undefined ? Number(lessonsCount) : 10,
        curriculum: curriculum || "",
        exam: exam || "",
        syllabus: syllabus || ""
      });

      // Automatically generate a spotlight campaign with Coming Soon when a new app is created
      const isFree = pricingType === "free" || Number(price) === 0;
      let adTitle = "";
      let adSubtitle = "";

      if (category === "courses") {
        if (isFree) {
          adTitle = `${name} - Free Masterclass (Coming Soon)`;
          adSubtitle = `Join the upcoming Free Masterclass "${name}" by ${instructor || "our expert panel"}! Register now to get full lifetime access upon launch.`;
        } else {
          adTitle = `${name} - New Masterclass (Coming Soon)`;
          adSubtitle = `Get premium lifetime access to the upcoming masterclass "${name}" by ${instructor || "our expert panel"}! Launches soon.`;
        }
        await db.addAd({
          title: adTitle,
          subtitle: adSubtitle,
          imageUrl: logoUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
          linkUrl: `course:${newApp.id}`
        });
      } else {
        adTitle = `${name} (Coming Soon)`;
        adSubtitle = `Our upcoming ${category} solution "${name}" is under development by VISION79. Stay tuned for the official release!`;
        await db.addAd({
          title: adTitle,
          subtitle: adSubtitle,
          imageUrl: logoUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
          linkUrl: `/`
        });
      }

      res.status(201).json(newApp);
    } catch (err) {
      console.error("[API] Error adding app:", err);
      res.status(500).json({ error: "Failed to persist new application" });
    }
  });

  // PUT update an existing SaaS application record
  app.put("/api/apps/:id", requireAdmin, async (req, res) => {

    const id = Number(req.params.id);
    const { name, subtitle, description, category, pricingType, logoUrl, accessUrl, price, instructor, rating, duration, lessonsCount, curriculum, exam, syllabus } = req.body;

    // validation
    if (!name || !subtitle || !description || !category || !pricingType || !logoUrl || !accessUrl) {
      return res.status(400).json({ error: "Missing required fields in body payload" });
    }

    if (category !== "web" && category !== "desktop" && category !== "games" && category !== "courses") {
      return res.status(400).json({ error: "Category must be 'web', 'desktop', 'games', or 'courses'" });
    }

    if (pricingType !== "free" && pricingType !== "free_trial" && pricingType !== "premium") {
      return res.status(400).json({ error: "Pricing type must be 'free', 'free_trial', or 'premium'" });
    }

    if (!isSafeLogoUrl(logoUrl) || !isSafeUrl(accessUrl)) {
      return res.status(400).json({ error: "logoUrl and accessUrl must be valid http(s) or relative URLs" });
    }

    try {
      const updatePayload: any = {
        name,
        subtitle,
        description,
        category,
        pricingType,
        logoUrl,
        accessUrl,
        price: price !== undefined ? Number(price) : 0,
        instructor: instructor || "",
        rating: rating !== undefined ? Number(rating) : 0,
        duration: duration || "",
        lessonsCount: lessonsCount !== undefined ? Number(lessonsCount) : 10
      };
      // Only touch curriculum/exam/syllabus if this request actually included them
      // (e.g. from the Curriculum/Exam manager). A basic info edit that
      // omits these fields must NOT wipe out existing course content.
      if (curriculum !== undefined) updatePayload.curriculum = curriculum;
      if (exam !== undefined) updatePayload.exam = exam;
      if (syllabus !== undefined) updatePayload.syllabus = syllabus;

      const updatedApp = await db.updateApp(id, updatePayload);
      res.json(updatedApp);
    } catch (err) {
      console.error("[API] Error updating app:", err);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  // POST increment download or launch trigger
  app.post("/api/apps/increment", async (req, res) => {
    const { id } = req.body;
    const numericId = Number(id);

    if (!id || !Number.isFinite(numericId)) {
      return res.status(400).json({ error: "Missing or invalid required parameter 'id' in request body" });
    }

    try {
      const updatedApp = await db.incrementLaunch(numericId);
      if (!updatedApp) {
        return res.status(404).json({ error: "No matching application found" });
      }
      res.json(updatedApp);
    } catch (err) {
      console.error("[API] Error incrementing launch count:", err);
      res.status(500).json({ error: "Database error updating counters" });
    }
  });

  // DELETE a SaaS application record
  app.delete("/api/apps/:id", requireAdmin, async (req, res) => {

    const appId = Number(req.params.id);

    try {
      const deleted = await db.deleteApp(appId);
      if (!deleted) {
        return res.status(404).json({ error: "No matching application record found to delete" });
      }
      res.json({ success: true, message: `Application ${appId} deleted successfully` });
    } catch (err) {
      console.error("[API] Error deleting app:", err);
      res.status(500).json({ error: "Database error during deletion" });
    }
  });

  // GET all instructors
  app.get("/api/instructors", async (req, res) => {
    try {
      const instructors = await db.getInstructors();
      res.json(instructors);
    } catch (err: any) {
      console.error("[API] Error fetching instructors:", err);
      res.status(500).json({ error: "Failed to fetch instructors" });
    }
  });

  // POST add a new instructor
  app.post("/api/instructors", requireAdmin, async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Instructor name is required" });
    }
    try {
      const newInstructor = await db.addInstructor(name.trim());
      res.status(201).json(newInstructor);
    } catch (err: any) {
      console.error("[API] Error adding instructor:", err);
      if (err.message && err.message.includes("already exists")) {
        return res.status(400).json({ error: "Instructor already exists" });
      }
      res.status(500).json({ error: "Failed to persist new instructor" });
    }
  });

  // GET all student exam attempts
  app.get("/api/exam/attempts", async (req, res) => {
    try {
      const appIdQuery = req.query.appId ? Number(req.query.appId) : undefined;
      const attempts = await db.getExamAttempts(appIdQuery);
      res.json(attempts);
    } catch (err) {
      console.error("[API] Error fetching exam attempts:", err);
      res.status(500).json({ error: "Db exception fetching exam attempts" });
    }
  });

  // POST save a student exam attempt
  app.post("/api/exam/attempt", async (req, res) => {
    const { appId, studentName, score, passed } = req.body;
    const numericAppId = Number(appId);

    if (!appId || !Number.isFinite(numericAppId) || !studentName) {
      return res.status(400).json({ error: "appId and studentName are required parameters" });
    }
    if (typeof studentName !== "string" || studentName.length > 100) {
      return res.status(400).json({ error: "studentName must be a string under 100 characters" });
    }
    if (score !== undefined && (typeof score !== "string" || score.length > 20)) {
      return res.status(400).json({ error: "score must be a short string (e.g. '8/10')" });
    }

    try {
      const attempt = await db.addExamAttempt({
        appId: numericAppId,
        studentName,
        score,
        passed: !!passed,
        timestamp: new Date().toISOString()
      });
      res.status(201).json(attempt);
    } catch (err) {
      console.error("[API] Error saving exam attempt:", err);
      res.status(500).json({ error: "Db exception saving exam attempt" });
    }
  });

  // GET all carousel ads
  app.get("/api/ads", async (req, res) => {
    try {
      const ads = await db.getAds();
      res.json(ads);
    } catch (err) {
      console.error("[API] Error fetching ads:", err);
      res.status(500).json({ error: "Db exception fetching carousel ads" });
    }
  });

  // POST create a new ad record
  app.post("/api/ads", requireAdmin, async (req, res) => {

    const { title, subtitle, imageUrl, linkUrl } = req.body;

    // validation
    if (!title || !subtitle || !imageUrl || !linkUrl) {
      return res.status(400).json({ error: "Missing required fields in body payload" });
    }
    if (!isSafeUrl(imageUrl) || !isSafeUrl(linkUrl)) {
      return res.status(400).json({ error: "imageUrl and linkUrl must be valid http(s) or relative URLs" });
    }

    try {
      const newAd = await db.addAd({ title, subtitle, imageUrl, linkUrl });
      res.status(201).json(newAd);
    } catch (err) {
      console.error("[API] Error adding ad:", err);
      res.status(500).json({ error: "Failed to persist new carousel ad" });
    }
  });

  // DELETE a carousel ad record
  app.delete("/api/ads/:id", requireAdmin, async (req, res) => {

    const adId = Number(req.params.id);

    try {
      const deleted = await db.deleteAd(adId);
      if (!deleted) {
        return res.status(404).json({ error: "No matching ad record found to delete" });
      }
      res.json({ success: true, message: `Ad ${adId} deleted successfully` });
    } catch (err) {
      console.error("[API] Error deleting ad:", err);
      res.status(500).json({ error: "Database error during deletion" });
    }
  });

  // GET all feedback, optionally filtered by appId
  app.get("/api/feedback", async (req, res) => {
    try {
      const appIdQuery = req.query.appId ? Number(req.query.appId) : undefined;
      const list = await db.getFeedback(appIdQuery);
      res.json(list);
    } catch (err) {
      console.error("[API] Error fetching feedback:", err);
      res.status(500).json({ error: "Db exception fetching feedback" });
    }
  });

  // POST submit new feedback (rating, comment) for an app
  app.post("/api/feedback", async (req, res) => {
    const { appId, appName, rating, comment, userName, feedbackType } = req.body;

    const numericAppId = Number(appId);
    const numericRating = Number(rating);

    if (!appId || !Number.isFinite(numericAppId) || !rating || !comment) {
      return res.status(400).json({ error: "Missing required fields (appId, rating, comment) in body" });
    }
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: "Rating must be a number between 1 and 5" });
    }
    if (typeof comment !== "string" || comment.length > 2000) {
      return res.status(400).json({ error: "Comment must be a string under 2000 characters" });
    }
    if (userName !== undefined && (typeof userName !== "string" || userName.length > 100)) {
      return res.status(400).json({ error: "Name must be a string under 100 characters" });
    }

    try {
      const newFeedback = await db.addFeedback({
        appId: numericAppId,
        appName,
        rating: numericRating,
        comment,
        userName,
        feedbackType: feedbackType || "feedback"
      });
      res.status(201).json(newFeedback);
    } catch (err) {
      console.error("[API] Error submitting feedback:", err);
      res.status(500).json({ error: "Failed to persist new feedback" });
    }
  });

  // GET all feedback for administrator panel view
  app.get("/api/admin/feedback", requireAdmin, async (req, res) => {

    try {
      const list = await db.getFeedback();
      res.json(list);
    } catch (err) {
      console.error("[API] Error fetching all feedback for admin:", err);
      res.status(500).json({ error: "Failed to load administrator feedback" });
    }
  });

  // POST mark a feedback as onboarded / addressed with admin response
  app.post("/api/admin/feedback/:id/onboard", requireAdmin, async (req, res) => {

    const id = Number(req.params.id);
    const { onboardedComment } = req.body;

    try {
      const updatedFeedback = await db.onboardFeedback(id, onboardedComment);
      res.json(updatedFeedback);
    } catch (err) {
      console.error("[API] Error onboarding feedback:", err);
      res.status(500).json({ error: "Failed to onboard feedback" });
    }
  });

  // --- Leads API Endpoints ---
  app.post("/api/leads", async (req, res) => {
    const { name, company, email, phone, employees, biggestChallenge, message } = req.body;
    
    // Server-side validation
    if (!name || !name.trim() || !company || !company.trim() || !email || !email.trim() || !phone || !phone.trim()) {
      return res.status(400).json({ error: "All required contact fields (Name, Company, Email, Phone) must be filled." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    try {
      const newLead = await db.addLead({
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        employees: employees || "",
        biggestChallenge: biggestChallenge || "",
        message: message || ""
      });
      res.status(201).json(newLead);
    } catch (e) {
      console.error("[API] Error adding lead:", e);
      res.status(500).json({ error: "Failed to submit request. Please try again or call us." });
    }
  });

  app.get("/api/admin/leads", requireAdmin, async (req, res) => {
    try {
      const list = await db.getLeads();
      res.json(list);
    } catch (e) {
      console.error("[API] Error fetching admin leads:", e);
      res.status(500).json({ error: "Failed to load lead submissions." });
    }
  });

  app.put("/api/admin/leads/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { status, adminNotes } = req.body;
    try {
      const updated = await db.updateLead(id, { status, adminNotes });
      res.json(updated);
    } catch (e) {
      console.error("[API] Error updating lead:", e);
      res.status(500).json({ error: "Failed to update lead status." });
    }
  });

  // --- Articles / Blog API Endpoints ---
  app.get("/api/articles", (req, res) => {
    try {
      if (!fs.existsSync(ARTICLES_DIR)) {
        return res.json([]);
      }
      const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith(".md"));
      const list = files.map(file => {
        const fullPath = path.join(ARTICLES_DIR, file);
        const rawContent = fs.readFileSync(fullPath, "utf-8");
        const { metadata } = parseFrontMatter(rawContent);
        return {
          slug: file.replace(".md", ""),
          title: metadata.title || file.replace(".md", ""),
          description: metadata.description || "",
          category: metadata.category || "General",
          date: metadata.date || "",
          author: metadata.author || "V79SL Expert",
          coverImage: metadata.coverImage || ""
        };
      });
      res.json(list);
    } catch (e) {
      console.error("[API] Error fetching articles list:", e);
      res.status(500).json({ error: "Failed to load blog articles" });
    }
  });

  app.get("/api/articles/:slug", (req, res) => {
    const slug = req.params.slug;
    try {
      const fullPath = path.join(ARTICLES_DIR, `${slug}.md`);
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: "Article not found" });
      }
      const rawContent = fs.readFileSync(fullPath, "utf-8");
      const { metadata, content } = parseFrontMatter(rawContent);
      res.json({
        slug,
        title: metadata.title || slug,
        description: metadata.description || "",
        category: metadata.category || "General",
        date: metadata.date || "",
        author: metadata.author || "V79SL Expert",
        coverImage: metadata.coverImage || "",
        content
      });
    } catch (e) {
      console.error(`[API] Error fetching article slug ${slug}:`, e);
      res.status(500).json({ error: "Failed to load article content" });
    }
  });

  // Vite development vs production serving logic
  if (isDev) {
    if (viteInstance) {
      console.log("[Vite] Mounting Vite middleware in development mode.");
      app.use(viteInstance.middlewares);
    }

    // Fallback UI router in development
    app.get("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const htmlPath = path.resolve(process.cwd(), "index.html");
        if (fs.existsSync(htmlPath)) {
          const html = fs.readFileSync(htmlPath, "utf-8");
          const transformedHtml = viteInstance 
            ? await viteInstance.transformIndexHtml(url, html)
            : html;
          res.status(200).set({ "Content-Type": "text/html" }).end(transformedHtml);
        } else {
          res.status(404).end("index.html file not found");
        }
      } catch (e) {
        if (viteInstance) {
          viteInstance.ssrFixStacktrace(e as Error);
        }
        next(e);
      }
    });
  } else {
    console.log("[Production] Serving static distribution assets.");
    const distPath = path.join(process.cwd(), "dist");
    
    app.use(express.static(distPath, { index: false }));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global error handler - must be registered last. Ensures unhandled errors
  // (e.g. from multer, JSON parsing, or unexpected exceptions) return a clean
  // JSON error instead of leaking stack traces to the client.
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[Unhandled Error]", err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ error: "Internal server error." });
  });

  // Active listener
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] VISION79 SaaS Marketplace running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("[Startup] Server failed to start:", error);
});
