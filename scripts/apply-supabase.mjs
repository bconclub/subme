// Applies the Subme schema + seed to the Supabase project in .env.local, then
// reconciles (drops any public table not in our schema). Connects directly via
// node-postgres using SUPABASE_DB_PASSWORD — no CLI / psql needed.
//
//   node scripts/apply-supabase.mjs
//
// Safety: operates ONLY on the project in SUPABASE_PROJECT_REF. It refuses to
// run against the known other-brand projects.
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const txt = readFileSync(join(root, '.env.local'), 'utf8');
  const env = {};
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/\s+#.*$/, '').trim();
  }
  return env;
}

const env = loadEnv();
const ref = env.SUPABASE_PROJECT_REF;
const pw = env.SUPABASE_DB_PASSWORD;

const BLOCKED = new Set(['yvkauaiyranysldubnqv', 'ihtbfuwnwucvnhxaxrja']); // BCON PROXe, Alpha
if (!ref) throw new Error('SUPABASE_PROJECT_REF missing in .env.local');
if (BLOCKED.has(ref)) throw new Error('Refusing to touch a non-Subme project.');
if (!pw) throw new Error('SUPABASE_DB_PASSWORD missing in .env.local — paste it and rerun.');

const ALLOWED = ['profiles', 'subscriptions', 'price_history', 'renewal_log', 'consent_records', 'catalog_services'];

const client = new pg.Client({
  host: `db.${ref}.supabase.co`,
  port: 5432,
  user: 'postgres',
  password: pw,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

const sql = (f) => readFileSync(join(root, 'supabase', 'migrations', f), 'utf8');

async function main() {
  await client.connect();
  console.log(`connected to ${ref}`);

  console.log('applying 0001_schema.sql …');
  await client.query(sql('0001_schema.sql'));
  console.log('applying 0002_seed_catalog.sql …');
  await client.query(sql('0002_seed_catalog.sql'));

  // Reconcile: drop public tables not in our schema (this project only).
  const { rows } = await client.query(
    `select tablename from pg_tables where schemaname = 'public'`,
  );
  const extra = rows.map((r) => r.tablename).filter((t) => !ALLOWED.includes(t));
  for (const t of extra) {
    console.log(`dropping extra table: ${t}`);
    await client.query(`drop table if exists public."${t}" cascade`);
  }
  if (!extra.length) console.log('no extra tables to drop');

  const { rows: final } = await client.query(
    `select tablename from pg_tables where schemaname = 'public' order by tablename`,
  );
  console.log('final tables:', final.map((r) => r.tablename).join(', '));
  await client.end();
  console.log('done ✅');
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
