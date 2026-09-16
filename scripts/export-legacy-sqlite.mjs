// Offline, non-destructive export for installations that used the old optional sqlite3 driver.
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
const [source,output]=process.argv.slice(2);
if(!source||!output){console.error('Usage: node scripts/export-legacy-sqlite.mjs OLD_DB NEW_EMPTY_OUTPUT_DIRECTORY');process.exit(1);}
if(fs.existsSync(output))throw Error('Output directory must not already exist. Export will not overwrite files.');
fs.mkdirSync(output,{recursive:true,mode:0o700});process.umask(0o077);
const db=new DatabaseSync(source,{readOnly:true});
try{
 const tables=new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(x=>x.name));
 const mappings={saas_apps:'vision79_saas.json',saas_ads:'vision79_ads.json',saas_instructors:'vision79_instructors.json',saas_feedback:'vision79_feedback.json',saas_exam_attempts:'vision79_exam_attempts.json',saas_leads:'vision79_leads.json'};
 for(const [table,file]of Object.entries(mappings)){if(!tables.has(table))continue;const rows=db.prepare(`SELECT * FROM ${table}`).all();fs.writeFileSync(path.join(output,file),JSON.stringify(rows,null,2),{flag:'wx',mode:0o600});console.log(`${file}: ${rows.length} records`);}
 console.log('Export complete. Original database is unchanged. Keep the original encryption key with your backup.');
}finally{db.close();}
