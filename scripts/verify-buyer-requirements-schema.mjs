/**
 * Verify buyer_requirements columns exist in live Supabase (read-only).
 * Run: node --env-file=.env.local scripts/verify-buyer-requirements-schema.mjs
 */

const WRITE_COLUMNS = [
  "buyer_company_id",
  "created_by",
  "title",
  "description",
  "category_id",
  "material_name",
  "desired_grade",
  "quantity_needed",
  "minimum_acceptable_quantity",
  "quantity_unit",
  "max_price",
  "currency",
  "preferred_quality",
  "max_distance_km",
  "preferred_city",
  "preferred_state",
  "preferred_country",
  "latitude",
  "longitude",
  "recurring",
  "required_by",
  "notes",
  "status",
]

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  process.exit(1)
}

async function columnExists(column) {
  const response = await fetch(`${url}/rest/v1/buyer_requirements?select=${column}&limit=0`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  return response.ok
}

const present = []
const missing = []

for (const column of WRITE_COLUMNS) {
  if (await columnExists(column)) present.push(column)
  else missing.push(column)
}

console.log(
  `buyer_requirements schema check (${present.length}/${WRITE_COLUMNS.length} write columns present)`,
)

if (missing.length === 0) {
  console.log("OK — all application write columns exist.")
  process.exit(0)
}

console.log("\nMissing columns (apply supabase/migrations/20260816_buyer_requirements_phase3_columns.sql):")
for (const column of missing) console.log(`  - ${column}`)
process.exit(1)
