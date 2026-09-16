import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

export const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
process.umask(0o077);
export function atomicWrite(file: string, content: string) {
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  const fd = fs.openSync(temporary, 'wx', 0o600);
  try { fs.writeFileSync(fd, content); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(temporary, file);
  const dir = fs.openSync(path.dirname(file), 'r');
  try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
}
const keyFile = path.join(dataDir, '.encryption_key');
const configured = (process.env.ENCRYPTION_KEY || '').trim().replace(/^['"]|['"]$/g, '');
let key: Buffer;
if (configured) key = /^[a-f\d]{64}$/i.test(configured) ? Buffer.from(configured, 'hex') : crypto.createHash('sha256').update(configured).digest();
else if (fs.existsSync(keyFile)) {
  const saved = fs.readFileSync(keyFile, 'utf8').trim();
  if (!/^[a-f\d]{64}$/i.test(saved)) throw Error('Invalid encryption key. Restore the original key before starting.');
  key = Buffer.from(saved, 'hex');
} else {
  const existing = fs.readdirSync(dataDir).some(f => f.endsWith('.db') || (f.endsWith('.json') && fs.readFileSync(path.join(dataDir, f), 'utf8').includes('enc:v1:')));
  if (existing) throw Error('Existing encrypted data requires its original ENCRYPTION_KEY or data/.encryption_key.');
  key = crypto.randomBytes(32);
  atomicWrite(keyFile, key.toString('hex'));
  console.warn('[Storage] Created data/.encryption_key. Back up this file separately from the database.');
}
export const encryptionKey = key;
export function seal(value: string): string {
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const bytes = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return 'enc:v1:' + Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString('base64');
}
export function unseal(value: string): string {
  if (!value.startsWith('enc:v1:')) return value;
  const bytes = Buffer.from(value.slice(7), 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8');
}
// Retire the previously optional SQLite backend explicitly rather than silently ignoring it.
if (fs.existsSync(path.join(dataDir, 'vision79_saas.db'))) throw Error('Legacy vision79_saas.db detected. Export it to the documented JSON files before migration; do not delete it.');
const database = new DatabaseSync(path.join(dataDir, 'website.db'), { timeout: 5000 });
database.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS documents (name TEXT PRIMARY KEY, value TEXT NOT NULL);');
const get = database.prepare('SELECT value FROM documents WHERE name=?');
const put = database.prepare('INSERT INTO documents(name,value) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET value=excluded.value');
let depth = 0;
let afterCommit: (()=>void)[] = [];
export function transaction<T>(fn: () => T): T {
  if (depth) return fn();
  database.exec('BEGIN IMMEDIATE'); depth++;
  try {
    const result = fn();
    if (result && typeof (result as any).then === 'function') throw Error('Transactions must be synchronous');
    database.exec('COMMIT');
    const actions=afterCommit;afterCommit=[];for(const action of actions) action();
    return result;
  } catch (e) { afterCommit=[]; if(database.isTransaction) database.exec('ROLLBACK'); throw e; } finally { depth--; }
}
export function readJSON<T>(file: string, initial: T): T {
  const name = path.basename(file);
  const row = get.get(name) as {value: string} | undefined;
  if (row) return JSON.parse(unseal(row.value));
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw.trim()) throw Error(`Empty data file: ${name}. Restore a valid backup.`);
    const parsed = JSON.parse(raw);
    writeJSON(file, parsed);
    // Retain the original bytes as an encrypted migration backup. Never discard a conflicting backup.
    const firstBackup = file + '.migrated.enc';
    const backup = fs.existsSync(firstBackup) ? file + '.' + crypto.createHash('sha256').update(raw).digest('hex').slice(0,16) + '.migrated.enc' : firstBackup;
    const archive=()=>{ if (!fs.existsSync(backup)) atomicWrite(backup, seal(raw)); fs.unlinkSync(file); };
    if(depth) afterCommit.push(archive); else archive();
    return parsed;
  }
  writeJSON(file, initial); return structuredClone(initial);
}
export function writeJSON(file: string, value: unknown) {
  put.run(path.basename(file), seal(JSON.stringify(value)));
}
// A key-verification record catches wrong keys before accepting traffic.
if (readJSON('key-check', {check: 'website2026'}).check !== 'website2026') throw Error('Storage key verification failed');
export function storageReady() {
  transaction(() => writeJSON('readiness', {at: Date.now()}));
  return true;
}
