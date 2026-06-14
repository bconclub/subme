/**
 * Regenerates supabase/migrations/0002_seed_catalog.sql from src/lib/catalog.ts
 * so the local catalog and the (future) catalog_services table never drift.
 * Run: npm run gen:seed
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { CATALOG } from '../src/lib/catalog';

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

const rows = CATALOG.map((s) => {
  const plans = q(JSON.stringify(s.plans));
  const patterns = q(JSON.stringify(s.detection_patterns));
  const rank = s.popular_rank === null ? 'null' : String(s.popular_rank);
  return `  (${q(s.id)}, ${q(s.name)}, ${q(s.slug)}, ${q(s.category)}, ${plans}::jsonb, ${patterns}::jsonb, ${q(s.logo_color)}, ${q(s.website)}, ${rank})`;
}).join(',\n');

const sql = `-- GENERATED FILE - do not edit. Source: src/lib/catalog.ts (npm run gen:seed)
insert into public.catalog_services
  (id, name, slug, category, plans, detection_patterns, logo_color, website, popular_rank)
values
${rows}
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  category = excluded.category,
  plans = excluded.plans,
  detection_patterns = excluded.detection_patterns,
  logo_color = excluded.logo_color,
  website = excluded.website,
  popular_rank = excluded.popular_rank;
`;

const out = join(__dirname, '..', 'supabase', 'migrations', '0002_seed_catalog.sql');
writeFileSync(out, sql);
console.log(`Wrote ${out} (${CATALOG.length} services)`);
