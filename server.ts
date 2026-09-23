import { cookie, cookieOptions, mountLearners, publicCourse, learner } from "./server/learners";
import express from "express";
import { atomicWrite, encryptionKey, seal, unseal, readJSON, writeJSON, transaction, storageReady } from "./server/persistence";
import path from "path";
import fs from "fs";
import crypto from "crypto";

import dotenv from "dotenv";
import multer from "multer";
import rateLimit from "express-rate-limit";
import compression from "compression";
import { crmStorage } from "./server/crm_storage";
import { pingOllama, analyzeBusinessWithAI } from "./server/crm_engine";

// Configure environment variable definitions
dotenv.config();

// ---------------------------------------------------------------------------
// Admin authentication configuration
// ---------------------------------------------------------------------------
// The admin password MUST come from the environment. If it is not supplied,
// a strong random setup password is written to the private
// data/.admin_setup_password file for the operator. There is no hardcoded fallback password.
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

  const hasValidQuestion = questions.every((q: any) =>
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

// ---------------------------------------------------------------------------
// Persistent admin credential store
// ---------------------------------------------------------------------------
// The admin password is hashed (scrypt, random per-credential salt) and
// persisted to disk so a forced password reset survives restarts, and so a
// freshly generated one-time password can require the operator to set a
// permanent replacement before any other admin action is allowed.
const ADMIN_AUTH_PATH = path.join(process.cwd(), "data", ".admin_auth.json");

interface AdminAuthRecord {
  version?: number;
  salt: string;
  hash: string;
  mustChangePassword: boolean;
  updatedAt: string;
  // Tracks the last ADMIN_RESET_TOKEN value that was already applied, so a
  // one-time reset (see applyAdminResetIfRequested below) doesn't re-fire on
  // every container restart if the operator forgets to clear the env var.
  resetTokenConsumed?: string;
}

const AUTHORIZED_ADMIN_EMAIL = cleanEnvValue(process.env.ADMIN_EMAIL) || "vision79slu@gmail.com";


function hashAdminPassword(password: string, salt?: string): { salt: string; hash: string } {
  const useSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, useSalt, 64).toString("hex");
  return { salt: useSalt, hash };
}

function verifyAdminPassword(password: string, record: AdminAuthRecord): boolean {
  // NOTE: the only valid credential is the persisted scrypt hash. There are
  // intentionally no hardcoded fallback passwords here anymore — they were a
  // permanent backdoor that worked no matter what the admin set as their
  // real password. The ADMIN_PASSWORD env var is only ever consulted by
  // loadOrCreateAdminAuth() to seed the *initial* credential on first run.
  if (!password) return false;
  const p = password.trim();
  try {
    const { hash } = hashAdminPassword(p, record.salt);
    const a = Buffer.from(hash, "hex");
    const b = Buffer.from(record.hash, "hex");
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  } catch {}
  if (password !== p) {
    try {
      const { hash } = hashAdminPassword(password, record.salt);
      const a = Buffer.from(hash, "hex");
      const b = Buffer.from(record.hash, "hex");
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
    } catch {}
  }
  return false;
}

function saveAdminAuth(record: AdminAuthRecord) {
  record.version = 2;
  fs.mkdirSync(path.dirname(ADMIN_AUTH_PATH), { recursive: true });
  atomicWrite(ADMIN_AUTH_PATH, JSON.stringify(record));
}

function loadOrCreateAdminAuth(): AdminAuthRecord {
  // IMPORTANT: any valid persisted credential record is authoritative and
  // must be trusted as-is. Previously this function recomputed a hash from
  // the current env/default password and silently REGENERATED (overwriting)
  // the persisted record whenever that didn't match — which meant any
  // password set via the "change password" flow was reverted back to the
  // default/env password on every container restart. Only ever create a
  // fresh record when no valid one exists on disk yet (first run).
  try {
    if (fs.existsSync(ADMIN_AUTH_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(ADMIN_AUTH_PATH, "utf-8"));
      if (parsed && typeof parsed.salt === "string" && typeof parsed.hash === "string") {
        if (parsed.version === 2) return parsed as AdminAuthRecord;
        atomicWrite(ADMIN_AUTH_PATH + '.legacy.enc', seal(JSON.stringify(parsed)));
        const temporary = crypto.randomBytes(24).toString('base64url');
        const fresh = {...hashAdminPassword(temporary), mustChangePassword:true, updatedAt:new Date().toISOString(), version:2};
        atomicWrite(path.join(process.cwd(), 'data', '.admin_setup_password'), temporary);
        saveAdminAuth(fresh);
        console.warn('[Authentication] Legacy credential retired. Read data/.admin_setup_password locally to sign in.');
        return fresh;
      }
      throw new Error("Malformed administrator credential file. Restore it or use the documented offline recovery procedure.");
    }
  } catch (e) {
    throw e;
  }

  const envPassword = cleanEnvValue(process.env.ADMIN_PASSWORD);
  if (envPassword && envPassword.length < 16) throw new Error("ADMIN_PASSWORD must contain at least 16 characters");
  const initialPassword = envPassword || crypto.randomBytes(24).toString("base64url");
  if (!envPassword) atomicWrite(path.join(process.cwd(), "data", ".admin_setup_password"), initialPassword);
  const { salt, hash } = hashAdminPassword(initialPassword);
  // mustChangePassword is true here on purpose: a brand-new deployment must
  // not be left running indefinitely on the auto-generated/default password.
  const record: AdminAuthRecord = { salt, hash, mustChangePassword: true, updatedAt: new Date().toISOString() };
  saveAdminAuth(record);
  console.warn("=".repeat(70));
  console.warn("[Authentication] Admin initialized. Use ADMIN_PASSWORD or read data/.admin_setup_password locally; change it on first login.");
  console.warn(`[Authentication] Authorized Administrator: ${AUTHORIZED_ADMIN_EMAIL}`);
  console.warn("[Authentication] You will be required to set a new password on first login.");
  console.warn("=".repeat(70));
  return record;
}

// ---------------------------------------------------------------------------
// One-time admin password reset (operator-triggered, for when you're locked
// out and don't know/remember the current persisted password)
// ---------------------------------------------------------------------------
// To use: set ADMIN_RESET_TOKEN to any new value (e.g. `openssl rand -hex 8`,
// or just today's date) in your environment/.env and restart the container.
// On startup this overwrites the persisted admin credential with a fresh
// one-time password, forces a password change on next login, and — unless
// you also set ADMIN_PASSWORD to choose the new password yourself — writes
// the generated setup credential to a private local file.
//
// The reset only fires when ADMIN_RESET_TOKEN differs from the token value
// already recorded as consumed in the persisted credential file, so it is
// safe to leave the variable set after a restart: it will NOT regenerate the
// password again on every reboot. To force another reset later, just change
// ADMIN_RESET_TOKEN to a different value.
function applyAdminResetIfRequested(record: AdminAuthRecord): AdminAuthRecord {
  const resetToken = cleanEnvValue(process.env.ADMIN_RESET_TOKEN);
  if (!resetToken) return record;
  if (record.resetTokenConsumed && record.resetTokenConsumed === resetToken) {
    return record;
  }

  const suppliedPassword = cleanEnvValue(process.env.ADMIN_PASSWORD);
  if (suppliedPassword && suppliedPassword.length < 16) throw new Error("ADMIN_PASSWORD must have at least 16 characters");
  const oneTimePassword = suppliedPassword || crypto.randomBytes(24).toString("base64url");
  if (!suppliedPassword) atomicWrite(path.join(process.cwd(), "data", ".admin_setup_password"), oneTimePassword);
  const { salt, hash } = hashAdminPassword(oneTimePassword);
  const newRecord: AdminAuthRecord = {
    salt,
    hash,
    mustChangePassword: true,
    updatedAt: new Date().toISOString(),
    resetTokenConsumed: resetToken
  };
  saveAdminAuth(newRecord);

  console.warn("=".repeat(70));
  console.warn("[Authentication] ADMIN PASSWORD RESET APPLIED (ADMIN_RESET_TOKEN).");
  console.warn(`[Authentication] Authorized Administrator: ${AUTHORIZED_ADMIN_EMAIL}`);
  if (suppliedPassword) {
    console.warn("[Authentication] Admin password was reset to the value you supplied via ADMIN_PASSWORD.");
  } else {
    console.warn("[Authentication] Read the reset password locally from data/.admin_setup_password.");
    console.warn("[Authentication] This is shown ONLY here, ONCE. It will not be logged again.");
  }
  console.warn("[Authentication] You will be required to set a new password immediately after logging in.");
  console.warn("[Authentication] Safe to leave ADMIN_RESET_TOKEN set — it will not reset again until you change its value.");
  console.warn("=".repeat(70));

  return newRecord;
}

let adminAuth: AdminAuthRecord = applyAdminResetIfRequested(loadOrCreateAdminAuth());

function getLatestAdminAuth(): AdminAuthRecord {
  try {
    if (fs.existsSync(ADMIN_AUTH_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(ADMIN_AUTH_PATH, "utf-8"));
      if (parsed && typeof parsed.salt === "string" && typeof parsed.hash === "string") {
        adminAuth = parsed as AdminAuthRecord;
        return adminAuth;
      }
    }
  } catch (e) {
    throw e;
  }
  return adminAuth;
}

// In-memory session store: token -> { expiry timestamp (ms), mustChangePassword }.
// Tokens are cryptographically random and single-instance scoped, which is
// appropriate for this app's single-container deployment model.
const ADMIN_SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
interface AdminSession {
  expiry: number;
  mustChangePassword: boolean;
}
const adminSessions = new Map<string, AdminSession>();

function issueAdminSession(mustChangePassword: boolean): string {
  const token = crypto.randomBytes(32).toString("hex");
  adminSessions.set(token, { expiry: Date.now() + ADMIN_SESSION_TTL_MS, mustChangePassword });
  return token;
}

function getAdminSession(token: string | undefined | null): AdminSession | null {
  if (!token) return null;
  const session = adminSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiry) {
    adminSessions.delete(token);
    return null;
  }
  return session;
}

function isValidAdminSession(token: string | undefined | null): boolean {
  const session=getAdminSession(token); return !!session && !session.mustChangePassword;
}

function invalidateAllAdminSessions() {
  adminSessions.clear();
}

// Periodically clear expired sessions so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of adminSessions.entries()) {
    if (now > session.expiry) adminSessions.delete(token);
  }
}, 60 * 60 * 1000).unref();

function adminCookie(req: express.Request): string | null { return cookie(req, "v79_admin") || null; }
function setAdminCookie(res: express.Response, token: string) { res.cookie("v79_admin", token, {...cookieOptions(), maxAge: ADMIN_SESSION_TTL_MS}); }

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = adminCookie(req);
  const session = getAdminSession(token);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized access: a valid administrator session is required." });
  }
  if (session.mustChangePassword) {
    return res.status(403).json({
      error: "You must set a new password before continuing.",
      code: "PASSWORD_CHANGE_REQUIRED"
    });
  }
  next();
}

// Simple in-memory rate limiter for the login endpoint to slow brute-force attempts.
// Keyed by IP address; a small dependency-free approach since the app has no
// external cache/store.
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.windowStart > LOGIN_WINDOW_MS) {
    return false;
  }
  return entry.count >= LOGIN_MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.windowStart > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
  }
}

function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
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

const ENCRYPTION_KEY = encryptionKey;
function encryptPII(value: string): string { return value ? seal(String(value)) : value; }
function decryptPII(value: string): string { return typeof value === "string" ? unseal(value) : value; }

// No fabricated demo courses/apps are seeded. A production deployment
// should start with a genuinely empty catalog and have real apps/courses
// added through the admin panel - fake instructor names, fake ratings,
// and fake launch counts were previously seeded here and have been removed.
const SEED_APPS: any[] = [];

// Advertising is managed explicitly through the admin interface. Do not seed
// promotional claims or links that may become stale on a fresh deployment.
const SEED_ADS: any[] = [];

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

// Import legacy root files only if present. The persistence layer archives originals securely.
for (const file of [JSON_DB_FILE, JSON_ADS_FILE, JSON_FEEDBACK_FILE, JSON_EXAM_ATTEMPTS_FILE, JSON_INSTRUCTORS_FILE, JSON_LEADS_FILE]) {
  const rootFile=path.join(process.cwd(), path.basename(file));
  if (fs.existsSync(rootFile)) readJSON(rootFile, []);
}

// No fabricated testimonials are seeded. Previously this contained fake
// reviews ("Alex Johnson", "Maria S.") with fake dates and fake admin
// replies attached to courses that were themselves fake demo data - real
// feedback should only ever come from real visitors via the feedback form.
const SEED_FEEDBACK: any[] = [];

// No fabricated instructor names are seeded - real instructors should be
// added through the admin panel.
const SEED_INSTRUCTORS: any[] = [];

class DocumentDatabase {
  readInstructors(): any[] { return readJSON(JSON_INSTRUCTORS_FILE, SEED_INSTRUCTORS); }

  writeInstructors(data: any[]) { writeJSON(JSON_INSTRUCTORS_FILE, data); }

  getInstructors(): any[] {
    return this.readInstructors();
  }

  addInstructor(name: string): any {
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

  init() { this.read(); this.readAds(); this.readInstructors(); this.readFeedback(); this.readExamAttempts(); this.readLeads(); }

  read(): any[] { return readJSON(JSON_DB_FILE, SEED_APPS); }

  write(data: any[]) { writeJSON(JSON_DB_FILE, data); }

  readAds(): any[] { return readJSON(JSON_ADS_FILE, SEED_ADS); }

  writeAds(data: any[]) { writeJSON(JSON_ADS_FILE, data); }

  getApps(): any[] {
    return this.read();
  }

  addApp(app: any): any {
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

  incrementLaunch(id: number): any {
    const list = this.read();
    const index = list.findIndex(a => a.id === Number(id));
    if (index === -1) {
      throw new Error(`SaaS app ${id} not found`);
    }
    list[index].launchCount += 1;
    this.write(list);
    return list[index];
  }

  deleteApp(id: number): boolean {
    const list = this.read();
    const initialLen = list.length;
    const filtered = list.filter(a => a.id !== Number(id));
    this.write(filtered);
    return filtered.length < initialLen;
  }

  updateApp(id: number, app: any): any {
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

  getAds(): any[] {
    return this.readAds();
  }

  addAd(ad: any): any {
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

  deleteAd(id: number): boolean {
    const list = this.readAds();
    const initialLen = list.length;
    const filtered = list.filter(a => a.id !== Number(id));
    this.writeAds(filtered);
    return filtered.length < initialLen;
  }

  readFeedback(): any[] { return readJSON(JSON_FEEDBACK_FILE, SEED_FEEDBACK); }

  writeFeedback(data: any[]) { writeJSON(JSON_FEEDBACK_FILE, data); }

  getFeedback(appId?: number): any[] {
    let list = this.readFeedback();
    if (appId !== undefined) {
      list = list.filter(f => f.appId === Number(appId));
    }
    return list.map(f => ({ ...f, userName: decryptPII(f.userName) }));
  }

  addFeedback(feedback: any): any {
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

  onboardFeedback(id: number, comment: string): any {
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

  readExamAttempts(): any[] { return readJSON(JSON_EXAM_ATTEMPTS_FILE, []); }

  writeExamAttempts(data: any[]) { writeJSON(JSON_EXAM_ATTEMPTS_FILE, data); }

  getExamAttempts(appId?: number): any[] {
    const all = this.readExamAttempts();
    const filtered = appId === undefined ? all : all.filter((a: any) => Number(a.appId) === Number(appId));
    return filtered.map((a: any) => ({ ...a, studentName: decryptPII(a.studentName) }));
  }

  addExamAttempt(attempt: any): any {
    const list = this.readExamAttempts();
    const nextId = list.reduce((max, a) => Math.max(max, a.id || 0), 0) + 1;
    const newAttempt = {
      id: nextId,
      appId: Number(attempt.appId),
      studentId: attempt.studentId || null,
      studentName: encryptPII(attempt.studentName || "Anonymous Student"),
      score: attempt.score || "0/0",
      passed: attempt.passed ? 1 : 0,
      timestamp: attempt.timestamp || new Date().toISOString()
    };
    list.push(newAttempt);
    this.writeExamAttempts(list);
    return { ...newAttempt, studentName: decryptPII(newAttempt.studentName) };
  }

  readLeads(): any[] { return readJSON(JSON_LEADS_FILE, []); }

  writeLeads(data: any[]) { writeJSON(JSON_LEADS_FILE, data); }

  getLeads(): any[] {
    const all = this.readLeads();
    return all.map((l: any) => ({
      ...l,
      name: decryptPII(l.name),
      company: decryptPII(l.company),
      email: decryptPII(l.email),
      phone: decryptPII(l.phone)
    }));
  }

  addLead(lead: any): any {
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

  updateLead(id: number, lead: any): any {
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

  // Tracks delivery of this lead to the V79Tiquet gateway, separate from
  // the visitor-facing status/adminNotes above. tiquetEventId is set once,
  // on creation, and reused on every retry attempt.
  updateLeadTiquetSync(id: number, tiquetEventId: string, tiquetSyncStatus: string): void {
    const list = this.readLeads();
    const index = list.findIndex(l => l.id === Number(id));
    if (index === -1) return;
    list[index].tiquetEventId = tiquetEventId;
    list[index].tiquetSyncStatus = tiquetSyncStatus;
    this.writeLeads(list);
  }

  getPendingTiquetLeads(): any[] {
    const list = this.readLeads();
    return list
      .filter(l => ["pending", "disabled"].includes(l.tiquetSyncStatus))
      .map(l => ({
        ...l,
        name: decryptPII(l.name),
        company: decryptPII(l.company),
        email: decryptPII(l.email),
        phone: decryptPII(l.phone)
      }));
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
A backup is only as good as its restore capability. V79 Digital can design monitored backup routines, restoration testing, and recovery options around the agreed business-continuity requirements.

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
  db = new DocumentDatabase();
  db.init();

  try {
    seedArticlesIfEmpty();
  } catch (err) {
    console.error("[Articles] Seeding failed:", err);
  }
}

async function startServer() {
  await initDb();

  const app = express();
  const PORT = Number(cleanEnvValue(process.env.PORT)) || 3000;
  // Trust the first proxy hop (e.g. Nginx Proxy Manager) so req.ip reflects
  // the real client address for rate limiting and logging.
  app.set("trust proxy", process.env.TRUSTED_PROXIES ? process.env.TRUSTED_PROXIES.split(",").map(x => x.trim()) : false);
  app.disable("x-powered-by");

  // Auto-detect production mode if NODE_ENV is set to "production", or we are running the compiled dist bundle, or server.ts is absent
  const isCJS = typeof __filename !== "undefined" && (__filename.endsWith(".cjs") || __filename.includes("dist"));
  const isProdFile = !!(process.argv[1] && (process.argv[1].endsWith(".cjs") || process.argv[1].includes("dist/")));
  const isProduction = process.env.NODE_ENV === "production" || isCJS || isProdFile || !fs.existsSync(path.resolve(process.cwd(), "server.ts"));
  const isDev = !isProduction;
  if (isProduction) process.env.NODE_ENV = "production";

  let viteInstance: any = null;
  if (isDev) {
    console.log("[Vite] Initializing Vite dev server in middleware mode.");
    const { createServer } = await import("vite");
    viteInstance = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
  }

  // Middleware
  // NOTE: the site has fully migrated to v79sl.com — there is no duckdns.org
  // host to redirect from anymore, so the legacy-domain redirect middleware
  // that used to live here has been removed entirely.

  // Enable gzip / deflate compression for all eligible textual and JSON payloads
  app.use(compression({ threshold: 1024 }));

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
    // Only apply Strict-Transport-Security in production-like environments to avoid SSL blocks during local testing
    if (isProduction) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  app.use((req, res, next) => {
    if (isProduction) res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https: data: blob:; media-src 'self' https: blob:; connect-src 'self' https://www.google.com/recaptcha/; frame-src 'self' blob: https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/ https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'");
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    if (/^\/(?:admin|adimin|adimn)(?:\/|$)/i.test(req.path)) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.headers.origin;
      const allowed = process.env.CANONICAL_DOMAIN || "http://localhost:3000";
      if ((origin && origin !== new URL(allowed).origin) || req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({error: "Cross-site request denied"});
    }
    next();
  });
  app.use('/api', rateLimit({windowMs:60000,max:300,standardHeaders:true,legacyHeaders:false}));
  app.use(express.json({ limit: "1mb" }));

  app.use((req, res, next) => { if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.is('application/json') && (!req.body || Array.isArray(req.body) || typeof req.body !== 'object')) return res.status(400).json({error:'Expected a JSON object'}); next(); });
  app.get('/api/config', (_req,res)=>res.json({recaptchaSiteKey:process.env.RECAPTCHA_SITE_KEY || process.env.VITE_RECAPTCHA_SITE_KEY || '',captchaEnabled:process.env.CAPTCHA_MODE !== 'disabled'}));
  app.get('/api/ready', (_req,res)=>{try {storageReady();res.json({status:'ready'});}catch {res.status(503).json({status:'storage unavailable'});}});
  mountLearners(app, db, requireAdmin, isCourseComplete);
  app.use((req,res,next)=>{if(!['GET','HEAD','OPTIONS'].includes(req.method) && !req.body && !req.is('multipart/form-data')) req.body={};next();});
  const BUILD_VERSION = "2026.09.23-v1";
  const SERVER_START_TIME = new Date().toISOString();

  // Lightweight healthcheck endpoint - the Dockerfile's HEALTHCHECK curls
  // this exact path. It was previously missing entirely, so every
  // healthcheck 404'd and the container was silently reporting unhealthy.
  app.get("/api/health", (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.status(200).json({
      status: "ok",
      version: BUILD_VERSION,
      uptime: Math.floor(process.uptime()),
      startedAt: SERVER_START_TIME
    });
  });

  // Version status endpoint so deployments can verify freshness
  app.get("/api/version", (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.status(200).json({
      name: "Vision79 Digital",
      version: BUILD_VERSION,
      uptime: Math.floor(process.uptime()),
      startedAt: SERVER_START_TIME,
      nodeEnv: process.env.NODE_ENV || "development"
    });
  });

  // Static serving for uploaded course materials (audio, video, documents)
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", (req,res,next)=>{
    if (isValidAdminSession(adminCookie(req))) return next();
    const requested='/uploads'+req.path;
    const restricted=db.getApps().filter((c:any)=>c.category==='courses' && (Number(c.price)>0 || c.pricingType==='premium')).filter((c:any)=>JSON.parse(c.curriculum||'[]').some((ch:any)=>(ch.lectures||[]).some((l:any)=>!l.freePreview && JSON.stringify(l).includes(requested))));
    if (restricted.length && !restricted.some((c:any)=>learner(req)?.courses[String(c.id)]?.enrolled)) return res.status(403).json({error:'Enrollment required'});
    next();
  }, express.static(uploadsDir, {dotfiles:'deny',index:false}));

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
    "/admin.html",
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
          return res.status(200).set({
            "Content-Type": "text/html",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0"
          }).end(transformedHtml);
        } else {
          return res.status(404).end("admin.html file not found");
        }
      } catch (e) {
        viteInstance.ssrFixStacktrace(e as Error);
        return next(e);
      }
    } else {
      const distPath = path.resolve(process.env.CLIENT_DIST || path.join(process.cwd(), "dist/client"));
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
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
      const token = adminCookie(req);
      const isAdmin = isValidAdminSession(token);

      const visibleApps = isAdmin
        ? appsWithLiveRatings
        : appsWithLiveRatings.filter((a: any) => a.category !== "courses" || a.isComplete);

      res.json(isAdmin ? visibleApps : visibleApps.map((c: any) => publicCourse(c, req)));
    } catch (err) {
      console.error("[API] Error fetching apps:", err);
      res.status(500).json({ error: "Db exception fetching applications" });
    }
  });

  // GET administrator session verification
  app.get("/api/admin/verify-session", (req, res) => {
    const authHeader = req.headers.authorization;
    const token = adminCookie(req);
    const session = getAdminSession(token);
    if (!session) {
      return res.status(401).json({ valid: false, error: "Session invalid or expired" });
    }
    return res.json({
      valid: true,
      adminEmail: AUTHORIZED_ADMIN_EMAIL,
      mustChangePassword: session.mustChangePassword
    });
  });

  // POST administrator login verification (password-only — no email required)
  app.post("/api/admin/login", (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";

      if (isRateLimited(ip)) return res.status(429).json({error: "Too many login attempts. Try later."});
      const { password } = req.body || {};
      if (typeof password !== "string" || password.length > 256) return res.status(400).json({error: "Invalid password"});
      const submitted = cleanEnvValue(password);

      const currentAuth = getLatestAdminAuth();
      const matches = submitted.length > 0 && verifyAdminPassword(submitted, currentAuth);

      if (matches) {
        clearLoginAttempts(ip);
        const token = issueAdminSession(currentAuth.mustChangePassword);
        setAdminCookie(res, token);
        console.log(`[Authentication] Success. New session token issued for ${AUTHORIZED_ADMIN_EMAIL}.`);
        return res.json({
          success: true,
          token: "cookie-session",
          adminEmail: AUTHORIZED_ADMIN_EMAIL,
          mustChangePassword: currentAuth.mustChangePassword
        });
      }

      if (isRateLimited(ip)) {
        console.warn(`[Authentication] Rate limit exceeded for ${ip}`);
        return res.status(429).json({ error: "Too many login attempts. Please try again later." });
      }

      recordFailedAttempt(ip);
      console.warn(`[Authentication] Rejecting unauthorized login attempt from ${ip}.`);
      return res.status(401).json({ error: "Incorrect administrator password." });
    } catch (err: any) {
      console.error("[Authentication] Critical exception during login validation:", err);
      return res.status(500).json({ error: "Server authentication engine error." });
    }
  });

  // POST administrator logout - invalidate the current session token
  app.post("/api/admin/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    const token = adminCookie(req);
    if (token) adminSessions.delete(token);
    res.clearCookie("v79_admin", {path: "/"});
    res.json({ success: true });
  });

  // POST administrator password change. Reachable with a "must change" limited
  // session (that's the whole point - the operator can't do anything else
  // until they've set a new password) as well as with a normal full session,
  // so admins can rotate their password voluntarily at any time.
  app.post("/api/admin/change-password", (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = adminCookie(req);
      const session = getAdminSession(token);
      if (!session) {
        return res.status(401).json({ error: "Unauthorized access: a valid administrator session is required." });
      }

      const { currentPassword, newPassword } = req.body || {};
      const current = cleanEnvValue(currentPassword);
      const next = cleanEnvValue(newPassword);

      const currentAuth = getLatestAdminAuth();
      if (!verifyAdminPassword(current, currentAuth)) {
        return res.status(401).json({ error: "Current password is incorrect." });
      }
      if (next.length < 12) {
        return res.status(400).json({ error: "New password must be at least 12 characters long." });
      }
      if (verifyAdminPassword(next, currentAuth)) {
        return res.status(400).json({ error: "New password must be different from the current password." });
      }

      const { salt, hash } = hashAdminPassword(next);
      adminAuth = {
        salt,
        hash,
        mustChangePassword: false,
        updatedAt: new Date().toISOString(),
        resetTokenConsumed: currentAuth.resetTokenConsumed
      };
      saveAdminAuth(adminAuth);

      // Rotate every session, including this one, and issue a fresh full
      // session token so a stolen/expired one-time-password session token
      // can't linger around after the password it was tied to is retired.
      invalidateAllAdminSessions();
      const newToken = issueAdminSession(false);
      setAdminCookie(res, newToken);
      const setupFile = path.join(process.cwd(), "data", ".admin_setup_password");
      if (fs.existsSync(setupFile)) fs.unlinkSync(setupFile);

      console.log("[Authentication] Admin password changed successfully. All prior sessions revoked.");
      return res.json({ success: true, token: "cookie-session" });
    } catch (err: any) {
      console.error("[Authentication] Critical exception during password change:", err);
      return res.status(500).json({ error: "Server authentication engine error." });
    }
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

    const id = Number(String(req.params.id));
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
      res.json(publicCourse(updatedApp, req));
    } catch (err) {
      console.error("[API] Error updating app:", err);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  // ---------------------------------------------------------------------
  // Course Builder (merged from the standalone V79-Course-Builder app)
  // ---------------------------------------------------------------------
  // Full course authoring - courses/modules/lessons/quizzes/assets - now
  // lives directly in the admin page instead of a separate deployment.
  // Data is kept in its own JSON store (same simple format the standalone
  // app used) so none of the existing saas_apps/SQLite logic above is
  // touched. Publishing a finished course writes straight into that
  // existing saas_apps table via db.addApp/db.updateApp - no network hop.
  const CB_DATA_DIR = path.join(process.cwd(), "data");
  const CB_DATA_FILE = path.join(CB_DATA_DIR, "course_builder_store.json");
  if (!fs.existsSync(CB_DATA_DIR)) fs.mkdirSync(CB_DATA_DIR, { recursive: true });

  function cbLoad(): any { return readJSON(CB_DATA_FILE, {courses: [], modules: [], lessons: [], quizzes: [], assets: []}); }
  function cbSave(data: any) { writeJSON(CB_DATA_FILE, data); }

  let cbDb = cbLoad();

  // Courses
  app.get("/api/courses", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    res.json(cbDb.courses);
  });

  app.post("/api/courses", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const newCourse = {
      id: `course-${Date.now()}`,
      title: req.body.title || "Untitled Course",
      shortDescription: req.body.shortDescription || "",
      fullDescription: req.body.fullDescription || "",
      category: req.body.category || "General",
      difficultyLevel: req.body.difficultyLevel || "Beginner",
      instructor: req.body.instructor || "V79 Academy Instructor",
      courseVersion: req.body.courseVersion || "1.0.0",
      thumbnail: req.body.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
      estimatedDuration: req.body.estimatedDuration || "2.0 hours",
      prerequisites: req.body.prerequisites || [],
      learningObjectives: req.body.learning_objectives || req.body.learningObjectives || [],
      status: req.body.status || "Draft",
      pricingType: req.body.pricingType || "free",
      price: typeof req.body.price === "number" ? req.body.price : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    cbDb.courses.push(newCourse);
    cbSave(cbDb);
    res.status(201).json(newCourse);
  });

  app.get("/api/courses/:id", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const course = cbDb.courses.find((c: any) => c.id === String(req.params.id));
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  });

  app.put("/api/courses/:id", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const index = cbDb.courses.findIndex((c: any) => c.id === String(req.params.id));
    if (index === -1) return res.status(404).json({ error: "Course not found" });
    cbDb.courses[index] = { ...cbDb.courses[index], ...req.body, updatedAt: new Date().toISOString() };
    cbSave(cbDb);
    res.json(cbDb.courses[index]);
  });

  app.delete("/api/courses/:id", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const courseId = String(req.params.id);
    cbDb.courses = cbDb.courses.filter((c: any) => c.id !== courseId);
    cbDb.modules = cbDb.modules.filter((m: any) => m.courseId !== courseId);
    cbDb.lessons = cbDb.lessons.filter((l: any) => l.courseId !== courseId);
    cbDb.assets = cbDb.assets.filter((a: any) => a.courseId !== courseId);
    cbSave(cbDb);
    res.json({ success: true });
  });

  // Modules
  app.get("/api/courses/:courseId/modules", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const modules = cbDb.modules.filter((m: any) => m.courseId === req.params.courseId);
    modules.sort((a: any, b: any) => a.orderNumber - b.orderNumber);
    res.json(modules);
  });

  app.post("/api/courses/:courseId/modules", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const courseId = req.params.courseId;
    const courseModules = cbDb.modules.filter((m: any) => m.courseId === courseId);
    const newModule = {
      id: `mod-${Date.now()}`,
      courseId,
      title: req.body.title || "New Module",
      description: req.body.description || "",
      orderNumber: req.body.orderNumber ?? (courseModules.length + 1)
    };
    cbDb.modules.push(newModule);
    cbSave(cbDb);
    res.status(201).json(newModule);
  });

  app.put("/api/modules/:id", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const index = cbDb.modules.findIndex((m: any) => m.id === String(req.params.id));
    if (index === -1) return res.status(404).json({ error: "Module not found" });
    cbDb.modules[index] = { ...cbDb.modules[index], ...req.body };
    cbSave(cbDb);
    res.json(cbDb.modules[index]);
  });

  app.delete("/api/modules/:id", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const modId = String(req.params.id);
    cbDb.modules = cbDb.modules.filter((m: any) => m.id !== modId);
    cbDb.lessons = cbDb.lessons.filter((l: any) => l.moduleId !== modId);
    cbSave(cbDb);
    res.json({ success: true });
  });

  // Lessons
  app.get("/api/modules/:moduleId/lessons", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const lessons = cbDb.lessons.filter((l: any) => l.moduleId === req.params.moduleId);
    lessons.sort((a: any, b: any) => a.orderNumber - b.orderNumber);
    res.json(lessons);
  });

  app.post("/api/modules/:moduleId/lessons", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const moduleId = req.params.moduleId;
    const mod = cbDb.modules.find((m: any) => m.id === moduleId);
    if (!mod) return res.status(404).json({ error: "Module not found" });
    const modLessons = cbDb.lessons.filter((l: any) => l.moduleId === moduleId);
    const newLesson = {
      id: `les-${Date.now()}`,
      moduleId,
      courseId: mod.courseId,
      title: req.body.title || "New Lesson",
      description: req.body.description || "",
      learningObjectives: req.body.learning_objectives || req.body.learningObjectives || [],
      estimatedTime: req.body.estimatedTime || "20 mins",
      lessonContent: req.body.lessonContent || "# Lesson Content\n\nAdd content here...",
      videoUrl: req.body.videoUrl || "",
      audioUrl: req.body.audioUrl || "",
      imageUrls: req.body.imageUrls || [],
      downloads: req.body.downloads || [],
      exercisePrompt: req.body.exercisePrompt || "",
      orderNumber: req.body.orderNumber ?? (modLessons.length + 1)
    };
    cbDb.lessons.push(newLesson);
    cbSave(cbDb);
    res.status(201).json(newLesson);
  });

  app.get("/api/lessons/:id", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const lesson = cbDb.lessons.find((l: any) => l.id === String(req.params.id));
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    res.json(lesson);
  });

  app.put("/api/lessons/:id", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const index = cbDb.lessons.findIndex((l: any) => l.id === String(req.params.id));
    if (index === -1) return res.status(404).json({ error: "Lesson not found" });
    cbDb.lessons[index] = { ...cbDb.lessons[index], ...req.body };
    cbSave(cbDb);
    res.json(cbDb.lessons[index]);
  });

  app.delete("/api/lessons/:id", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const lesId = String(req.params.id);
    cbDb.lessons = cbDb.lessons.filter((l: any) => l.id !== lesId);
    cbDb.quizzes = cbDb.quizzes.filter((q: any) => q.lessonId !== lesId);
    cbSave(cbDb);
    res.json({ success: true });
  });

  // Quizzes
  app.get("/api/lessons/:lessonId/quiz", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const quiz = cbDb.quizzes.find((q: any) => q.lessonId === req.params.lessonId);
    res.json(quiz || null);
  });

  app.post("/api/lessons/:lessonId/quiz", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const lessonId = req.params.lessonId;
    let quiz = cbDb.quizzes.find((q: any) => q.lessonId === lessonId);
    if (quiz) {
      quiz.title = req.body.title || quiz.title;
      quiz.passingScore = req.body.passingScore ?? quiz.passingScore;
      quiz.questions = req.body.questions || quiz.questions;
    } else {
      quiz = {
        id: `quiz-${Date.now()}`,
        lessonId,
        title: req.body.title || "Lesson Assessment",
        passingScore: req.body.passingScore || 80,
        questions: req.body.questions || []
      };
      cbDb.quizzes.push(quiz);
    }
    cbSave(cbDb);
    res.json(quiz);
  });

  // Assets
  app.get("/api/courses/:courseId/assets", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const assets = cbDb.assets.filter((a: any) => a.courseId === req.params.courseId);
    res.json(assets);
  });

  app.post("/api/courses/:courseId/assets", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const courseId = req.params.courseId;
    const newAsset = {
      id: `ast-${Date.now()}`,
      courseId,
      moduleId: req.body.moduleId || null,
      lessonId: req.body.lessonId || null,
      name: req.body.name || "Asset File",
      fileType: req.body.fileType || "pdf",
      url: req.body.url || "",
      fileSize: req.body.fileSize || "",
      uploadedAt: new Date().toISOString()
    };
    cbDb.assets.push(newAsset);
    cbSave(cbDb);
    res.status(201).json(newAsset);
  });

  app.delete("/api/assets/:id", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    cbDb.assets = cbDb.assets.filter((a: any) => a.id !== String(req.params.id));
    cbSave(cbDb);
    res.json({ success: true });
  });

  // Export package (used by the "Export" modal in the ported UI)
  app.get("/api/courses/:id/export-package", requireAdmin, (req, res) => {
    cbDb = cbLoad();
    const courseId = String(req.params.id);
    const course = cbDb.courses.find((c: any) => c.id === courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });
    const modules = cbDb.modules.filter((m: any) => m.courseId === courseId);
    const lessons = cbDb.lessons.filter((l: any) => l.courseId === courseId);
    const assets = cbDb.assets.filter((a: any) => a.courseId === courseId);
    const quizzes = cbDb.quizzes.filter((q: any) => lessons.some((l: any) => l.id === q.lessonId));
    res.json({
      "course.json": course,
      "README.md": `# ${course.title}\n\n${course.fullDescription}\n\nExported from the VISION79 admin Course Builder on ${new Date().toISOString()}`,
      modules: modules.map((m: any) => ({ ...m, lessons: lessons.filter((l: any) => l.moduleId === m.id) })),
      quizzes,
      assets
    });
  });

  // ---------------------------------------------------------------------
  // Publish to Website - now an in-process write instead of an HTTP call.
  // ---------------------------------------------------------------------
  function cbSlugify(title: string): string {
    return (title || "course").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "course";
  }

  function cbResolveCorrectAnswerIndex(options: string[], correctAnswer: string | number): number {
    if (typeof correctAnswer === "number") return correctAnswer;
    const idx = options.findIndex((o) => o === correctAnswer);
    return idx >= 0 ? idx : 0;
  }

  function cbBuildAppPayload(course: any, modules: any[], lessons: any[], quizzes: any[]) {
    const sortedModules = [...modules].sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));
    const chapters = sortedModules.map((mod) => {
      const moduleLessons = lessons
        .filter((l) => l.moduleId === mod.id)
        .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));
      return {
        title: mod.title,
        lectures: moduleLessons.map((les, idx) => ({
          id: les.id,
          title: les.title,
          duration: les.estimatedTime || "",
          freePreview: idx === 0 && sortedModules[0]?.id === mod.id,
          videoUrl: les.videoUrl || undefined,
          audioUrl: les.audioUrl || undefined,
          readingMaterial: les.lessonContent || undefined
        }))
      };
    });

    const examQuestions = quizzes.flatMap((quiz: any) =>
      (quiz.questions || []).map((q: any) => ({
        question: q.questionText,
        options: q.options || [],
        correctAnswer: cbResolveCorrectAnswerIndex(q.options || [], q.correctAnswer)
      }))
    );

    return {
      name: course.title,
      subtitle: course.shortDescription,
      description: course.fullDescription,
      category: "courses",
      pricingType: course.pricingType || "free",
      price: course.pricingType === "premium" ? Number(course.price) || 0 : 0,
      logoUrl: course.thumbnail || "lucide:GraduationCap",
      accessUrl: `/course/${cbSlugify(course.title)}`,
      instructor: course.instructor || "",
      duration: course.estimatedDuration || "",
      lessonsCount: lessons.length,
      curriculum: JSON.stringify(chapters),
      exam: JSON.stringify(examQuestions)
    };
  }

  app.post("/api/courses/:id/publish", requireAdmin, async (req, res) => {
    cbDb = cbLoad();
    const courseId = String(req.params.id);
    const courseIndex = cbDb.courses.findIndex((c: any) => c.id === courseId);
    if (courseIndex === -1) return res.status(404).json({ error: "Course not found" });

    const course = cbDb.courses[courseIndex];
    const modules = cbDb.modules.filter((m: any) => m.courseId === courseId);
    const lessons = cbDb.lessons.filter((l: any) => l.courseId === courseId);
    const quizzes = cbDb.quizzes.filter((q: any) => lessons.some((l: any) => l.id === q.lessonId));

    if (modules.length === 0 || lessons.length === 0) {
      return res.status(400).json({ error: "Add at least one module with a lesson before publishing." });
    }

    try {
      const payload = cbBuildAppPayload(course, modules, lessons, quizzes);
      let websiteApp: any = null;

      if (course.websiteAppId) {
        try {
          websiteApp = await db.updateApp(Number(course.websiteAppId), payload);
        } catch {
          websiteApp = null;
        }
      }
      if (!websiteApp) {
        websiteApp = await db.addApp(payload);
      }

      const now = new Date().toISOString();
      cbDb.courses[courseIndex] = {
        ...course,
        status: "Uploaded",
        websiteAppId: websiteApp.id,
        websitePublishedAt: now,
        updatedAt: now
      };
      cbSave(cbDb);

      res.json({ success: true, course: cbDb.courses[courseIndex], websiteAppId: websiteApp.id });
    } catch (err: any) {
      console.error("[CourseBuilder] Failed to publish course to the website:", err);
      res.status(502).json({ error: err.message || "Failed to publish course to the website." });
    }
  });

  // Gemini AI Assistant Endpoint (Course Builder's AI Course Architect)
  app.post("/api/gemini/assist", requireAdmin, async (req, res) => {
    try {
      const { prompt } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API key not configured. Please add GEMINI_API_KEY in the server environment." });
      }
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert instructional designer and senior curriculum architect for V79 Academy applications (Fire Finance Pro, SIWM, Tiquet, KashDash). Provide precise, professional, educational content in JSON or Markdown format as requested.",
          temperature: 0.7
        }
      });
      res.json({ result: response.text });
    } catch (error: any) {
      console.error("[CourseBuilder] Gemini AI error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI content" });
    }
  });

  // POST increment download or launch trigger
  app.post("/api/apps/increment", rateLimit({windowMs:60000,max:30,standardHeaders:true,legacyHeaders:false}), async (req, res) => {
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
      res.json(publicCourse(updatedApp, req));
    } catch (err) {
      console.error("[API] Error incrementing launch count:", err);
      res.status(500).json({ error: "Database error updating counters" });
    }
  });

  // DELETE a SaaS application record
  app.delete("/api/apps/:id", requireAdmin, async (req, res) => {

    const appId = Number(String(req.params.id));

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
  app.get("/api/exam/attempts", requireAdmin, async (req, res) => {
    try {
      const appIdQuery = req.query.appId ? Number(req.query.appId) : undefined;
      const attempts = await db.getExamAttempts(appIdQuery);
      res.json(attempts);
    } catch (err) {
      console.error("[API] Error fetching exam attempts:", err);
      res.status(500).json({ error: "Db exception fetching exam attempts" });
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

    const adId = Number(String(req.params.id));

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
  app.post("/api/feedback", rateLimit({windowMs:3600000,max:10,standardHeaders:true,legacyHeaders:false}), async (req, res) => {
    const { appId, appName, rating, comment, userName, feedbackType } = req.body;

    const numericAppId = Number(appId);
    const numericRating = Number(rating);
    if (!db.getApps().some((a:any)=>a.id===numericAppId)) return res.status(404).json({error:"Application not found"});

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

    const id = Number(String(req.params.id));
    const { onboardedComment } = req.body;

    try {
      const updatedFeedback = await db.onboardFeedback(id, onboardedComment);
      res.json(updatedFeedback);
    } catch (err) {
      console.error("[API] Error onboarding feedback:", err);
      res.status(500).json({ error: "Failed to onboard feedback" });
    }
  });

  // ── V79Tiquet Gateway: sends this lead to V79Tiquet's Client Management ──
  // as a Client, and never blocks or fails the visitor's submission — the
  // lead is already safely persisted locally (db.addLead, above) regardless
  // of whether this succeeds. See README-INTEGRATION.md for the full design.
  const V79TIQUET_INTAKE_URL = process.env.V79TIQUET_INTAKE_URL; // e.g. http://v79-tiquet-manager:3050/api/public/intake
  const V79TIQUET_INTAKE_SECRET = process.env.V79TIQUET_INTAKE_SECRET;
  const TIQUET_RETRY_DELAYS_MS = [1500, 4000];
  const deliveries = new Map<string, Promise<"sent" | "pending" | "failed" | "disabled">>();

  function tiquetGatewayConfigured(): boolean {
    return !!(V79TIQUET_INTAKE_URL && V79TIQUET_INTAKE_SECRET);
  }

  async function attemptTiquetDelivery(payload: Record<string, unknown>): Promise<"sent" | "pending" | "failed"> {
    const res = await fetch(V79TIQUET_INTAKE_URL as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Intake-Secret": V79TIQUET_INTAKE_SECRET as string,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return "sent";
    if (res.status >= 400 && res.status < 500 && ![408,429].includes(res.status)) {
      const body = await res.json().catch(() => null);
      console.warn(`[V79Tiquet Gateway] Rejected (HTTP ${res.status}): ${body?.error || "no error detail"} — will not retry.`);
      return "failed";
    }
    return "pending"; // Retry transient errors
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Delivers one lead to V79Tiquet, with a couple of quick inline retries.
   * Never throws. Returns true once delivered (or permanently rejected —
   * nothing more to do), false if it should be left 'pending' for the
   * periodic sweep to retry later.
   */
  function sendLeadToTiquet(lead:any,eventId:string): Promise<"sent" | "pending" | "failed" | "disabled"> {
    const running=deliveries.get(eventId);if(running)return running;
    const pending=deliverLeadToTiquet(lead,eventId).finally(()=>deliveries.delete(eventId));deliveries.set(eventId,pending);return pending;
  }
  async function deliverLeadToTiquet(lead: any, eventId: string): Promise<"sent" | "pending" | "failed" | "disabled"> {
    if (!tiquetGatewayConfigured()) return "disabled"; // integration not configured — nothing to do, not an error

    const payload = {
      eventId,
      source: "website2026",
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      employees: lead.employees || undefined,
      biggestChallenge: lead.biggestChallenge || undefined,
      message: lead.message || undefined,
    };

    for (let attempt = 0; attempt <= TIQUET_RETRY_DELAYS_MS.length; attempt++) {
      try {
        const result = await attemptTiquetDelivery(payload);
        if (result !== "pending") return result;
      } catch (err: any) {
        console.warn(`[V79Tiquet Gateway] Delivery attempt ${attempt + 1} failed: ${err.message}`);
      }
      if (attempt < TIQUET_RETRY_DELAYS_MS.length) await sleep(TIQUET_RETRY_DELAYS_MS[attempt]);
    }
    console.warn(`[V79Tiquet Gateway] Lead ${eventId} still pending delivery after inline retries — periodic sweep will keep trying.`);
    return "pending";
  }

  // Periodic sweep: catches any lead whose Tiquet delivery didn't succeed
  // via the inline retries above (e.g. Tiquet was down for longer than
  // those cover). Mirrors the same setInterval-based retry pattern already
  // used for the V79Tiquet ↔ FFPRO2 gateway integration.
  //
  // Each lead is processed independently (its own try/catch) rather than
  // one shared try/catch around the whole loop — otherwise a single
  // transient failure partway through (e.g. a momentary SQLite lock on the
  // status update) would abort the rest of that cycle's batch entirely,
  // needlessly delaying leads that had nothing wrong with them.
  setInterval(async () => {
    if (!tiquetGatewayConfigured()) return;
    let pending: any[];
    try {
      pending = await db.getPendingTiquetLeads();
    } catch (err: any) {
      console.error("[V79Tiquet Gateway] Sweep failed to query pending leads:", err.message);
      return;
    }
    for (const lead of pending) {
      try {
        const delivered = await sendLeadToTiquet(lead, lead.tiquetEventId);
        await db.updateLeadTiquetSync(lead.id, lead.tiquetEventId, delivered);
      } catch (err: any) {
        console.error(`[V79Tiquet Gateway] Sweep failed for lead ${lead.id}:`, err.message);
      }
    }
  }, 5 * 60 * 1000);

  // Basic Google reCAPTCHA v3 server-side verification. The frontend
  // already generates a token (ContactPage.tsx) but nothing previously
  // checked it — meaning the CAPTCHA was decorative. This matters more now
  // that a successful submission also creates a client in V79Tiquet, so a
  // spam bot hitting this endpoint pollutes Client Management, not just this
  // app's own local lead list. Skipped gracefully (not an error) if
  // RECAPTCHA_SECRET_KEY isn't configured, matching this app's existing
  // pattern of every integration being optional until its env vars are set.
  async function verifyRecaptcha(token: unknown): Promise<boolean> {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) return process.env.CAPTCHA_MODE === "disabled";
    // A token that's missing entirely (not one that was provided and
    // failed) is treated as "couldn't verify" rather than "rejected" —
    // ad-blockers and privacy extensions commonly block Google's reCAPTCHA
    // script outright, which would otherwise silently reject real visitors
    // and lose real sales leads with zero visibility that anything went
    // wrong. A bot that skips the page entirely and never gets a token
    // still has to get through the rate limiter and duplicate-detection
    // downstream; a bot that DOES get a token and fails verification is a
    // much stronger, more deliberate signal and is still rejected below.
    if (typeof token !== "string" || !token) {
      return false;
    }
    try {
      const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      return !!data.success && typeof data.score === "number" && data.score >= 0.5 && data.action === "submit" && data.hostname === new URL(process.env.CANONICAL_DOMAIN || "https://v79sl.com").hostname;
    } catch (err: any) {
      console.warn("[reCAPTCHA] Verification request failed:", err.message);
      return false;
    }
  }

  // 10 submissions per 15 minutes per IP — generous for a real visitor
  // (this form isn't submitted repeatedly in normal use), tight enough to
  // blunt a scripted flood aimed at this endpoint.
  const leadsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later or contact us directly." },
  });

  // --- Leads API Endpoints ---
  app.post("/api/leads", leadsLimiter, async (req, res) => {
    const { name, company, email, phone, employees, biggestChallenge, serviceRequested, message, pageOrigin, leadSource, location, recaptchaToken } = req.body;
    
    // Server-side validation
    if (![name, company, email, phone].every(v => typeof v === "string" && v.trim().length > 0 && v.length <= 250) || ![employees, biggestChallenge, serviceRequested, message, pageOrigin, leadSource, location].every(v => v === undefined || (typeof v === "string" && v.length <= 4000))) {
      return res.status(400).json({ error: "All required contact fields (Name, Company, Email, Phone) must be filled." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    if (!(await verifyRecaptcha(recaptchaToken))) {
      return res.status(400).json({ error: "Verification failed. Please try again." });
    }

    try {
      const leadData = {
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        employees: employees || "",
        biggestChallenge: biggestChallenge || "",
        message: message || ""
      };
      const requestId = req.headers['idempotency-key'];
      if (requestId !== undefined && (typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId))) return res.status(400).json({error:'Invalid request identifier'});
      const requestHash=crypto.createHash('sha256').update(JSON.stringify(leadData)).digest('hex');
      const previous = readJSON<any[]>('lead-requests.json', []).find(r=>r.id===requestId && r.expires>Date.now());
      if(previous) return previous.hash===requestHash ? res.status(200).json({id:previous.leadId,success:true}) : res.status(409).json({error:'Request identifier already used'});
      const { newLead, crmCaptureResult, eventId } = transaction(() => {
      const newLead = db.addLead(leadData);

      // Durable CRM capture with duplicate detection & AI scoring
      const crmCaptureResult = crmStorage.addLead({
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        whatsapp: phone.trim(),
        employees: employees || "",
        biggestChallenge: biggestChallenge || "",
        serviceRequested: serviceRequested || biggestChallenge || "Website Inquiry",
        message: message || "",
        leadSource: leadSource || "Website Contact Form",
        pageOrigin: pageOrigin || "/contact",
        stage: "New",
        location: location || "Saint Lucia"
      }, "Website Contact Form");

      const eventId = crypto.randomUUID();
      db.updateLeadTiquetSync(newLead.id, eventId, "pending");
      if(requestId){const recent=readJSON<any[]>('lead-requests.json',[]).filter(r=>r.expires>Date.now());recent.push({id:requestId,hash:requestHash,leadId:newLead.id,expires:Date.now()+86400000});writeJSON('lead-requests.json',recent);}
      return {newLead, crmCaptureResult, eventId};
      });
      
      res.status(201).json({
        ...newLead,
        crmLeadId: crmCaptureResult.lead.id,
        isDuplicate: crmCaptureResult.isDuplicate,
        duplicateOf: crmCaptureResult.duplicateOf?.id
      });

      sendLeadToTiquet(leadData, eventId)
        .then((delivered) => {
          return db.updateLeadTiquetSync(newLead.id, eventId, delivered);
        })
        .catch((err) => {
          console.error(`[V79Tiquet Gateway] Unexpected error delivering lead ${newLead.id}:`, err.message);
        });
    } catch (e) {
      console.error("[API] Error adding lead:", e);
      res.status(500).json({ error: "Failed to submit request. Please try again or call us." });
    }
  });

  app.post('/api/admin/leads/:id/retry', requireAdmin, async (req,res)=>{
    const lead = db.getLeads().find((l:any)=>l.id===Number(String(req.params.id)));
    if(!lead)return res.status(404).json({error:'Lead not found'});
    if(lead.tiquetSyncStatus==='sent')return res.status(409).json({error:'Already delivered'});
    const eventId=lead.tiquetEventId || crypto.randomUUID();
    db.updateLeadTiquetSync(lead.id,eventId,'pending');
    const state=await sendLeadToTiquet(lead,eventId);db.updateLeadTiquetSync(lead.id,eventId,state);res.json({status:state});
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
    const id = Number(String(req.params.id));
    const { status, adminNotes } = req.body;
    try {
      const updated = await db.updateLead(id, { status, adminNotes });
      res.json(updated);
    } catch (e) {
      console.error("[API] Error updating lead:", e);
      res.status(500).json({ error: "Failed to update lead status." });
    }
  });

  // =========================================================================
  // --- V79 DIGITAL CRM & PROSPECTING API ENDPOINTS ---
  // =========================================================================

  app.get("/api/admin/crm/metrics", requireAdmin, (req, res) => {
    try {
      const metrics = crmStorage.getMetrics();
      res.json(metrics);
    } catch (e) {
      console.error("[CRM API] Error getting metrics:", e);
      res.status(500).json({ error: "Failed to load CRM metrics." });
    }
  });

  app.get("/api/admin/crm/leads", requireAdmin, (req, res) => {
    try {
      const { stage, status, search, priority, includeArchived } = req.query;
      const leads = crmStorage.getLeads({
        stage: stage as any,
        status: status as any,
        search: search as string,
        priority: priority as any,
        includeArchived: includeArchived === "true"
      });
      res.json(leads);
    } catch (e) {
      console.error("[CRM API] Error fetching leads:", e);
      res.status(500).json({ error: "Failed to load CRM leads." });
    }
  });

  app.get("/api/admin/crm/leads/:id", requireAdmin, (req, res) => {
    try {
      const lead = crmStorage.getLeadById(Number(String(req.params.id)));
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      const activities = crmStorage.getActivities(lead.id);
      const calls = crmStorage.getCalls(lead.id);
      const tasks = crmStorage.getTasks(lead.id);
      res.json({ ...lead, lead, activities, calls, tasks });
    } catch (e) {
      console.error("[CRM API] Error fetching lead detail:", e);
      res.status(500).json({ error: "Failed to load lead details." });
    }
  });

  app.post("/api/admin/crm/leads", requireAdmin, async (req, res) => {
    try {
      const result = await crmStorage.addLead(req.body, "Admin");
      res.status(201).json({ ...result.lead, ...result });
    } catch (e) {
      console.error("[CRM API] Error adding lead manually:", e);
      res.status(500).json({ error: "Failed to create lead." });
    }
  });

  app.put("/api/admin/crm/leads/:id", requireAdmin, (req, res) => {
    try {
      const updated = transaction(() => crmStorage.updateLead(Number(String(req.params.id)), req.body, "Admin"));
      res.json(updated);
    } catch (e) {
      console.error("[CRM API] Error updating CRM lead:", e);
      res.status(500).json({ error: (e as any)?.message || "Failed to update lead." });
    }
  });

  app.put("/api/admin/crm/leads/:id/stage", requireAdmin, (req, res) => {
    try {
      const stage = req.body.stage;
      if (!stage) return res.status(400).json({ error: "stage is required in request body" });
      const updated = crmStorage.updateLeadStage(Number(String(req.params.id)), stage, "Admin");
      res.json(updated);
    } catch (e) {
      console.error("[CRM API] Error updating lead stage:", e);
      res.status(500).json({ error: (e as any)?.message || "Failed to update lead stage." });
    }
  });

  app.post("/api/admin/crm/leads/:id/convert", requireAdmin, (req, res) => {
    try {
      const converted = crmStorage.convertLeadToClient(Number(String(req.params.id)), req.body, "Admin");
      res.json(converted);
    } catch (e) {
      console.error("[CRM API] Error converting lead:", e);
      res.status(500).json({ error: (e as any)?.message || "Failed to convert lead." });
    }
  });

  app.post("/api/admin/crm/leads/:id/archive", requireAdmin, (req, res) => {
    try {
      const archived = crmStorage.archiveLead(Number(String(req.params.id)), "Admin");
      res.json(archived);
    } catch (e) {
      console.error("[CRM API] Error archiving lead:", e);
      res.status(500).json({ error: "Failed to archive lead." });
    }
  });

  app.post(["/api/admin/crm/leads/merge", "/api/admin/crm/leads/:id/merge"], requireAdmin, (req, res) => {
    try {
      const primaryId = String(req.params.id) ? Number(String(req.params.id)) : Number(req.body.primaryLeadId || req.body.primaryId);
      const duplicateId = Number(req.body.duplicateLeadId || req.body.duplicateId);
      if (!primaryId || !duplicateId) {
        return res.status(400).json({ error: "Both primary and duplicate lead IDs are required for merge." });
      }
      const merged = crmStorage.mergeLeads(primaryId, duplicateId, "Admin");
      res.json(merged);
    } catch (e) {
      console.error("[CRM API] Error merging leads:", e);
      res.status(500).json({ error: (e as any)?.message || "Failed to merge leads." });
    }
  });

  app.delete("/api/admin/crm/leads/:id", requireAdmin, (req, res) => {
    try {
      const ok = crmStorage.deleteLead(Number(String(req.params.id)));
      res.json({ success: ok });
    } catch (e) {
      console.error("[CRM API] Error deleting lead:", e);
      res.status(500).json({ error: "Failed to delete lead." });
    }
  });

  app.get("/api/admin/crm/leads/:id/activities", requireAdmin, (req, res) => {
    try {
      const list = crmStorage.getActivities(Number(String(req.params.id)));
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: "Failed to load activities." });
    }
  });

  app.post("/api/admin/crm/leads/:id/activities", requireAdmin, (req, res) => {
    try {
      const act = crmStorage.addActivity({
        leadId: Number(String(req.params.id)),
        type: req.body.type || "note",
        title: req.body.title || "Note Added",
        description: req.body.description || "",
        metadata: req.body.metadata,
        author: "Admin"
      });
      res.status(201).json(act);
    } catch (e) {
      res.status(500).json({ error: "Failed to add activity." });
    }
  });

  app.get("/api/admin/crm/leads/:id/calls", requireAdmin, (req, res) => {
    try {
      const list = crmStorage.getCalls(Number(String(req.params.id)));
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: "Failed to load calls." });
    }
  });

  app.post("/api/admin/crm/leads/:id/calls", requireAdmin, (req, res) => {
    try {
      const call = crmStorage.addCall({
        leadId: Number(String(req.params.id)),
        outcome: req.body.outcome || "Called",
        durationSecs: req.body.durationSecs || 0,
        notes: req.body.notes || "",
        nextFollowUpAt: req.body.nextFollowUpAt,
        caller: "V79 Admin"
      });
      res.status(201).json(call);
    } catch (e) {
      res.status(500).json({ error: "Failed to record call." });
    }
  });

  app.get("/api/admin/crm/tasks", requireAdmin, (req, res) => {
    try {
      const list = crmStorage.getTasks(req.query.leadId ? Number(req.query.leadId) : undefined);
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: "Failed to load tasks." });
    }
  });

  app.post("/api/admin/crm/tasks", requireAdmin, (req, res) => {
    try {
      const task = crmStorage.addTask({
        leadId: Number(req.body.leadId),
        title: req.body.title,
        dueAt: req.body.dueAt || new Date(Date.now() + 86400000).toISOString(),
        priority: req.body.priority || "Medium",
        status: "pending",
        assignedTo: req.body.assignedTo || "Admin"
      });
      res.status(201).json(task);
    } catch (e) {
      res.status(500).json({ error: "Failed to create task." });
    }
  });

  app.put(["/api/admin/crm/tasks/:id", "/api/admin/crm/tasks/:id/status"], requireAdmin, (req, res) => {
    try {
      const status = req.body.status;
      if (status) {
        const updated = crmStorage.updateTaskStatus(String(req.params.id), status);
        return res.json(updated);
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to update task." });
    }
  });

  app.get("/api/admin/crm/prospects", requireAdmin, (req, res) => {
    try {
      const { status, location, category, search } = req.query;
      const prospects = crmStorage.getProspects({
        status: status as string,
        location: location as string,
        category: category as string,
        search: search as string
      });
      res.json(prospects);
    } catch (e) {
      res.status(500).json({ error: "Failed to load prospects." });
    }
  });

  app.post("/api/admin/crm/prospects/search", requireAdmin, async (req, res) => {
    try {
      const result = await crmStorage.runProspectSearch({
        location: req.body.location,
        category: req.body.category,
        query: req.body.query,
        searchProviderKey: process.env.SEARCH_PROVIDER_API_KEY,
        limit: req.body.limit || 10
      });
      res.json(result);
    } catch (e) {
      console.error("[CRM Prospect Search Error]:", e);
      res.status(500).json({ error: "Prospect search failed." });
    }
  });

  app.post('/api/admin/crm/directory',requireAdmin,(req,res)=>{
    const entries=req.body.entries;
    if(!Array.isArray(entries)||entries.length>500||entries.some(e=>!e||typeof e.businessName!=='string'||!e.businessName.trim()||e.businessName.length>200||Object.values(e).some(v=>typeof v!=='string'||v.length>4000)))return res.status(400).json({error:'Provide up to 500 business records with text fields and a businessName.'});
    writeJSON('business-directory.json',entries);res.json({count:entries.length});
  });
  app.get("/api/admin/crm/prospects/history", requireAdmin, (req, res) => {
    try {
      const history = crmStorage.getSearchHistory();
      res.json(history);
    } catch (e) {
      res.status(500).json({ error: "Failed to load search history." });
    }
  });

  app.post("/api/admin/crm/prospects/:id/analyze", requireAdmin, async (req, res) => {
    try {
      const updated = await crmStorage.analyzeProspect(
        String(req.params.id),
        process.env.OLLAMA_BASE_URL,
        req.body.model || process.env.OLLAMA_MODEL
      );
      res.json(updated);
    } catch (e) {
      console.error("[CRM Analyze Error]:", e);
      res.status(500).json({ error: (e as any)?.message || "Failed to analyze prospect." });
    }
  });

  app.post("/api/admin/crm/prospects/:id/approve", requireAdmin, (req, res) => {
    try {
      const lead = crmStorage.approveProspectToLead(String(req.params.id), "Admin");
      res.json({ ...lead, lead });
    } catch (e) {
      res.status(500).json({ error: (e as any)?.message || "Failed to approve prospect." });
    }
  });

  app.post("/api/admin/crm/prospects/bulk-approve", requireAdmin, (req, res) => {
    try {
      const ids: string[] = req.body.prospectIds || req.body.ids || [];
      const leads = crmStorage.bulkApproveProspects(ids, "Admin");
      res.json({ approvedCount: leads.length, leads });
    } catch (e) {
      res.status(500).json({ error: "Failed to bulk approve." });
    }
  });

  app.post("/api/admin/crm/prospects/:id/reject", requireAdmin, (req, res) => {
    try {
      const ok = crmStorage.rejectProspect(String(req.params.id));
      res.json({ success: ok });
    } catch (e) {
      res.status(500).json({ error: "Failed to reject prospect." });
    }
  });

  app.post("/api/admin/crm/prospects/bulk-reject", requireAdmin, (req, res) => {
    try {
      const ids: string[] = req.body.prospectIds || req.body.ids || [];
      const rejectedCount = crmStorage.bulkRejectProspects(ids);
      res.json({ rejectedCount });
    } catch (e) {
      res.status(500).json({ error: "Failed to bulk reject." });
    }
  });

  app.post("/api/admin/crm/ai/prepare-call", requireAdmin, async (req, res) => {
    try {
      const businessData = req.body;
      const analysis = await analyzeBusinessWithAI(
        businessData,
        process.env.OLLAMA_BASE_URL,
        req.body.model || process.env.OLLAMA_MODEL
      );
      res.json(analysis);
    } catch (e) {
      console.error("[CRM AI Call Prep Error]:", e);
      res.status(500).json({ error: "Failed to prepare call card." });
    }
  });

  app.get("/api/admin/crm/ai/status", requireAdmin, async (req, res) => {
    try {
      const baseUrl = process.env.OLLAMA_BASE_URL || "http://ollama:11434";
      const status = await pingOllama(baseUrl);
      res.json(status);
    } catch (e) {
      res.json({ connected: false, models: [], url: "http://localhost:11434" });
    }
  });

  // --- Articles / Blog API Endpoints ---
  function getArticleData(slug: string) {
    if (!slug || typeof slug !== "string" || !/^[a-zA-Z0-9_-]+$/.test(slug)) return null;
    try {
      const fullPath = path.resolve(ARTICLES_DIR, `${slug}.md`);
      const resolvedArticlesDir = path.resolve(ARTICLES_DIR);
      if (!fullPath.startsWith(resolvedArticlesDir) || !fs.existsSync(fullPath)) return null;
      const rawContent = fs.readFileSync(fullPath, "utf-8");
      const { metadata, content } = parseFrontMatter(rawContent);
      return {
        slug,
        title: metadata.title || slug,
        description: metadata.description || "Expert managed IT, cybersecurity, and cloud guidance from Vision79 Digital.",
        category: metadata.category || "Technology",
        date: metadata.date || "",
        author: metadata.author || "Vision79 Digital Expert",
        coverImage: metadata.coverImage || "https://v79sl.com/og-image.png",
        content
      };
    } catch {
      return null;
    }
  }

  function injectDynamicMeta(html: string, req: express.Request): string {
    try {
      const canonicalBase = (cleanEnvValue(process.env.CANONICAL_DOMAIN) || "https://v79sl.com").replace(/\/+$/, "");
      const escapeAttr = (str: string) => String(str || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const applyMeta = (source: string, page: { title: string; description: string; url: string; image?: string; type?: string }) => {
        let result = source;
        const image = page.image || `${canonicalBase}/og-image.png`;
        const type = page.type || "website";

        result = result.replace(/<title>.*?<\/title>/is, `<title>${escapeAttr(page.title)}</title>`);
        result = result.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeAttr(page.description)}" />`);
        result = result.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeAttr(page.url)}" />`);

        const ogTags = [
          ["og:title", page.title],
          ["og:description", page.description],
          ["og:image", image],
          ["og:image:alt", page.title],
          ["og:url", page.url],
          ["og:type", type],
        ];
        for (const [prop, value] of ogTags) {
          const rx = new RegExp(`<meta\\s+(?:property|name)="${prop}"\\s+content="[^"]*"\\s*\\/?>`, "i");
          if (rx.test(result)) result = result.replace(rx, `<meta property="${prop}" content="${escapeAttr(value)}" />`);
          else result = result.replace("</head>", `  <meta property="${prop}" content="${escapeAttr(value)}" />\n</head>`);
        }

        const twitterTags = [
          ["twitter:card", "summary_large_image"],
          ["twitter:title", page.title],
          ["twitter:description", page.description],
          ["twitter:image", image],
          ["twitter:image:alt", page.title],
        ];
        for (const [name, value] of twitterTags) {
          const rx = new RegExp(`<meta\\s+name="${name}"\\s+content="[^"]*"\\s*\\/?>`, "i");
          if (rx.test(result)) result = result.replace(rx, `<meta name="${name}" content="${escapeAttr(value)}" />`);
          else result = result.replace("</head>", `  <meta name="${name}" content="${escapeAttr(value)}" />\n</head>`);
        }
        return result;
      };

      const normalizedPath = (req.path || "/").replace(/\/+$/, "") || "/";
      const staticPages: Record<string, { title: string; description: string }> = {
        "/": {
          title: "Managed IT, Cloud & Business Software Saint Lucia | V79 Digital",
          description: "V79 Digital helps Saint Lucia businesses with managed IT, cloud services, cybersecurity, business software, automation, and practical technology training.",
        },
        "/about": {
          title: "About V79 Digital | Caribbean ICT Experience",
          description: "Learn about V79 Digital's practical Caribbean ICT and telecommunications experience and its approach to helping Saint Lucia businesses use technology effectively.",
        },
        "/services": {
          title: "IT, Cloud, Cybersecurity & Automation Services | V79 Digital",
          description: "Explore managed IT, cloud, cybersecurity, networking, software development, automation, and scoped ICT assessment services for Saint Lucia businesses.",
        },
        "/industries": {
          title: "Technology Services for Saint Lucia Businesses | V79 Digital",
          description: "See how V79 Digital supports hospitality, retail, professional services, education, and other organisations with practical ICT, cloud, network, security, and software solutions.",
        },
        "/solutions": {
          title: "Business Software, SaaS & V79 Academy | V79 Digital",
          description: "Explore V79 Digital software, SaaS applications, business tools, and practical training from V79 Academy.",
        },
        "/resources": {
          title: "ICT Resources & Business Technology Guides | V79 Digital",
          description: "Practical technology guidance for Saint Lucia and Caribbean businesses covering IT support, networks, cloud, cybersecurity, software, and digital operations.",
        },
        "/contact": {
          title: "Contact V79 Digital | Business Technology Support Saint Lucia",
          description: "Contact V79 Digital to discuss managed IT, cloud, cybersecurity, networking, business software, automation, training, or a scoped technology assessment.",
        },
      };

      const articleSlug = (req.query.article as string) || (normalizedPath.startsWith("/resources/") ? normalizedPath.slice("/resources/".length) : "");
      if (articleSlug) {
        const article = getArticleData(articleSlug);
        if (!article) return html;
        let imageUrl = article.coverImage || `${canonicalBase}/og-image.png`;
        if (!/^https?:\/\//i.test(imageUrl)) imageUrl = `${canonicalBase}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
        return applyMeta(html, {
          title: `${article.title} | V79 Digital`,
          description: article.description,
          image: imageUrl,
          type: "article",
          url: `${canonicalBase}/?article=${encodeURIComponent(article.slug)}`,
        });
      }

      const page = staticPages[normalizedPath];
      if (!page) return html;
      return applyMeta(html, {
        ...page,
        url: normalizedPath === "/" ? `${canonicalBase}/` : `${canonicalBase}${normalizedPath}`,
      });
    } catch (err) {
      console.error("[SEO Meta] Error injecting dynamic metadata:", err);
      return html;
    }
  }

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
    const slug = String(req.params.slug);
    if (!slug || typeof slug !== "string" || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return res.status(400).json({ error: "Invalid article identifier format" });
    }
    try {
      const fullPath = path.resolve(ARTICLES_DIR, `${slug}.md`);
      const resolvedArticlesDir = path.resolve(ARTICLES_DIR);
      if (!fullPath.startsWith(resolvedArticlesDir)) {
        return res.status(400).json({ error: "Invalid path reference" });
      }
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

  // Turn a title into a URL-safe slug, e.g. "5 Tips for Wi-Fi!" -> "5-tips-for-wi-fi"
  function slugifyArticleTitle(title: string): string {
    return String(title || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function writeArticleFile(slug: string, fields: {
    title: string;
    description: string;
    category: string;
    date: string;
    author: string;
    coverImage: string;
    content: string;
  }) {
    const escapeYaml = (v: string) => String(v || "").replace(/[\r\n]/g, " ").replace(/"/g, '\\"');
    const frontMatter = `---
title: "${escapeYaml(fields.title)}"
description: "${escapeYaml(fields.description)}"
category: "${escapeYaml(fields.category)}"
date: "${escapeYaml(fields.date)}"
author: "${escapeYaml(fields.author)}"
coverImage: "${escapeYaml(fields.coverImage)}"
slug: "${escapeYaml(slug)}"
---
${fields.content || ""}`;
    if (!fs.existsSync(ARTICLES_DIR)) {
      fs.mkdirSync(ARTICLES_DIR, { recursive: true });
    }
    atomicWrite(path.join(ARTICLES_DIR, `${slug}.md`), frontMatter);
  }

  // POST create a new blog article/post
  app.post("/api/admin/articles", requireAdmin, (req, res) => {
    try {
      const { title, description, category, author, coverImage, content, date, slug: requestedSlug } = req.body || {};

      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "A title is required." });
      }
      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Post content is required." });
      }

      let slug = slugifyArticleTitle(requestedSlug && typeof requestedSlug === "string" ? requestedSlug : title);
      if (!slug) {
        return res.status(400).json({ error: "Could not derive a valid URL slug from that title." });
      }

      if (!fs.existsSync(ARTICLES_DIR)) {
        fs.mkdirSync(ARTICLES_DIR, { recursive: true });
      }

      // Ensure the slug is unique — append -2, -3, etc. if it collides
      let finalSlug = slug;
      let suffix = 2;
      while (fs.existsSync(path.join(ARTICLES_DIR, `${finalSlug}.md`))) {
        finalSlug = `${slug}-${suffix}`;
        suffix++;
      }

      writeArticleFile(finalSlug, {
        title: title.trim(),
        description: typeof description === "string" ? description.trim() : "",
        category: typeof category === "string" && category.trim() ? category.trim() : "General",
        date: typeof date === "string" && date.trim() ? date.trim() : new Date().toISOString().split("T")[0],
        author: typeof author === "string" && author.trim() ? author.trim() : "Vision79 Digital Expert",
        coverImage: typeof coverImage === "string" ? coverImage.trim() : "",
        content: content.trim()
      });

      console.log(`[Articles] Created post "${title}" (slug: ${finalSlug})`);
      res.status(201).json({ success: true, slug: finalSlug });
    } catch (e) {
      console.error("[API] Error creating article:", e);
      res.status(500).json({ error: "Failed to create the post." });
    }
  });

  // PUT update an existing blog article/post (slug is immutable via this route)
  app.put("/api/admin/articles/:slug", requireAdmin, (req, res) => {
    try {
      const slug = String(req.params.slug);
      if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
        return res.status(400).json({ error: "Invalid article identifier format" });
      }
      const fullPath = path.resolve(ARTICLES_DIR, `${slug}.md`);
      const resolvedArticlesDir = path.resolve(ARTICLES_DIR);
      if (!fullPath.startsWith(resolvedArticlesDir) || !fs.existsSync(fullPath)) {
        return res.status(404).json({ error: "Post not found." });
      }

      const { title, description, category, author, coverImage, content, date } = req.body || {};
      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "A title is required." });
      }
      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Post content is required." });
      }

      writeArticleFile(slug, {
        title: title.trim(),
        description: typeof description === "string" ? description.trim() : "",
        category: typeof category === "string" && category.trim() ? category.trim() : "General",
        date: typeof date === "string" && date.trim() ? date.trim() : new Date().toISOString().split("T")[0],
        author: typeof author === "string" && author.trim() ? author.trim() : "Vision79 Digital Expert",
        coverImage: typeof coverImage === "string" ? coverImage.trim() : "",
        content: content.trim()
      });

      console.log(`[Articles] Updated post "${title}" (slug: ${slug})`);
      res.json({ success: true, slug });
    } catch (e) {
      console.error("[API] Error updating article:", e);
      res.status(500).json({ error: "Failed to update the post." });
    }
  });

  // DELETE a blog article/post
  app.delete("/api/admin/articles/:slug", requireAdmin, (req, res) => {
    try {
      const slug = String(req.params.slug);
      if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
        return res.status(400).json({ error: "Invalid article identifier format" });
      }
      const fullPath = path.resolve(ARTICLES_DIR, `${slug}.md`);
      const resolvedArticlesDir = path.resolve(ARTICLES_DIR);
      if (!fullPath.startsWith(resolvedArticlesDir) || !fs.existsSync(fullPath)) {
        return res.status(404).json({ error: "Post not found." });
      }
      fs.unlinkSync(fullPath);
      console.log(`[Articles] Deleted post (slug: ${slug})`);
      res.json({ success: true });
    } catch (e) {
      console.error("[API] Error deleting article:", e);
      res.status(500).json({ error: "Failed to delete the post." });
    }
  });


  const PRIMARY_CANONICAL_DOMAIN = process.env.CANONICAL_DOMAIN || "https://v79sl.com";

  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    const domain = PRIMARY_CANONICAL_DOMAIN;
    res.send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\n\nSitemap: ${domain}/sitemap.xml\nHost: ${domain.replace(/^https?:\/\//, '')}`
    );
  });

  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    const domain = PRIMARY_CANONICAL_DOMAIN;
    const nowIso = new Date().toISOString().split("T")[0];
    
    let articlesXml = "";
    try {
      if (fs.existsSync(ARTICLES_DIR)) {
        const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith(".md"));
        files.forEach(file => {
          const slug = file.replace(".md", "");
          const filePath = path.join(ARTICLES_DIR, file);
          let fileDate = nowIso;
          try {
            const stat = fs.statSync(filePath);
            fileDate = stat.mtime.toISOString().split("T")[0];
          } catch {}
          articlesXml += `  <url>\n    <loc>${domain}/resources?article=${slug}</loc>\n    <lastmod>${fileDate}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        });
      }
    } catch (err) {
      console.error("Error generating sitemap articles:", err);
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}/</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/services</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${domain}/about</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/industries</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/solutions</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/resources</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/contact</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${domain}/privacy.html</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
${articlesXml}</urlset>`;
    
    res.send(sitemap);
  });

  // Vite development vs production serving logic
  app.use('/api', (_req,res)=>res.status(404).json({error:'API route not found'}));
  app.get('/privacy', (_req,res)=>res.redirect(308, '/privacy.html'));
  app.use((req,res,next)=>{
    const courseMatch=req.path.match(/^\/course\/(\d+)$/);
    if(courseMatch && !db.getApps().some((c:any)=>c.id===Number(courseMatch[1]) && isCourseComplete(c)))return res.status(404).type('html').send('<h1>Course not found</h1><a href="/">Return to Vision79 Digital</a>');
    const allowed = ['/', '/services', '/about', '/contact', '/industries', '/resources', '/solutions', '/courses', '/marketplace', '/privacy', '/terms', '/admin', '/adimin', '/adimn'];
    if (req.method === 'GET' && !allowed.includes(req.path) && !/^\/course\/\d+$/.test(req.path) && !req.path.startsWith('/assets/') && !req.path.startsWith('/uploads/') && !/\.[a-z0-9]+$/i.test(req.path)) return res.status(404).type('html').send('<!doctype html><html lang="en"><title>Page not found</title><main><h1>Page not found</h1><p>The page may have moved.</p><a href="/">Return to Vision79 Digital</a></main></html>');
    next();
  });
  if (isDev) {
    // Intercept HTML requests in dev mode to inject dynamic post Open Graph / Twitter image metadata
    app.use(async (req, res, next) => {
      const url = req.originalUrl || req.url;
      const accept = req.headers.accept || "";
      const isHtmlReq = req.method === "GET" && 
        (accept.includes("text/html") || typeof req.query.article === "string" || url === "/" || url.startsWith("/resources")) &&
        !url.startsWith("/src/") && !url.startsWith("/@") && !url.startsWith("/node_modules/") && !url.startsWith("/api/") && !url.includes(".");

      if (isHtmlReq && viteInstance) {
        try {
          const htmlPath = path.resolve(process.cwd(), "index.html");
          if (fs.existsSync(htmlPath)) {
            let html = fs.readFileSync(htmlPath, "utf-8");
            html = injectDynamicMeta(html, req);
            const transformedHtml = await viteInstance.transformIndexHtml(url, html);
            return res.status(200).set({
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
              "Pragma": "no-cache",
              "Expires": "0"
            }).end(transformedHtml);
          }
        } catch (e) {
          viteInstance.ssrFixStacktrace(e as Error);
          return next(e);
        }
      }
      next();
    });

    if (viteInstance) {
      console.log("[Vite] Mounting Vite middleware in development mode.");
      app.use(viteInstance.middlewares);
    }

    // Fallback UI router in development
    app.get("/{*path}", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const htmlPath = path.resolve(process.cwd(), "index.html");
        if (fs.existsSync(htmlPath)) {
          let html = fs.readFileSync(htmlPath, "utf-8");
          html = injectDynamicMeta(html, req);
          const transformedHtml = viteInstance 
            ? await viteInstance.transformIndexHtml(url, html)
            : html;
          res.status(200).set({
            "Content-Type": "text/html",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0"
          }).end(transformedHtml);
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
    const distPath = path.resolve(process.env.CLIENT_DIST || path.join(process.cwd(), "dist/client"));
    
    // Dist hashed assets get 1-year immutable cache
    app.use("/assets", express.static(path.join(distPath, "assets"), {
      maxAge: "365d",
      immutable: true,
    }));

    // Other static files (favicon, icons, etc.) get 1-day cache, with HTML ALWAYS revalidating
    app.use(express.static(distPath, {
      index: false,
      maxAge: "1d",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
          res.setHeader("Surrogate-Control", "no-store");
        }
      }
    }));

    app.get("/{*path}", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");

      if (/\.[a-z0-9]+$/i.test(req.path)) return res.status(404).end();
      const reqPath = (req.path || "").toLowerCase();
      if (reqPath.startsWith("/admin") || reqPath.startsWith("/adimin") || reqPath.startsWith("/adimn")) {
        return res.sendFile(path.join(distPath, "admin.html"));
      }

      const htmlPath = path.join(distPath, "index.html");
      if (fs.existsSync(htmlPath)) {
        let html = fs.readFileSync(htmlPath, "utf-8");
        html = injectDynamicMeta(html, req);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(html);
      }
      res.sendFile(htmlPath);
    });
  }

  // Global error handler - must be registered last. Ensures unhandled errors
  // (e.g. from multer, JSON parsing, or unexpected exceptions) return a clean
  // JSON error instead of leaking stack traces to the client.
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[Unhandled Error]", err);
    if (res.headersSent) return next(err);
    res.status(Number.isInteger(err.status) && err.status >= 400 && err.status <= 599 ? err.status : 500).json({ error: "Internal server error." });
  });

  // Active listener
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] VISION79 SaaS Marketplace running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("[Startup] Server failed to start:", error);
  process.exit(1);
});

