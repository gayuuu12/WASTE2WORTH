import type { SupabaseClient } from "@supabase/supabase-js"
import {
  CANONICAL_WASTE_CATEGORY_SLUGS,
  WASTE_CATEGORY_SEEDS,
} from "@/lib/listings/constants"
import type { WasteCategory } from "@/lib/types"

export async function getWasteCategories(
  supabase: SupabaseClient,
): Promise<WasteCategory[]> {
  const { data, error } = await supabase
    .from("waste_categories")
    .select("*")
    .in("slug", CANONICAL_WASTE_CATEGORY_SLUGS)
    .order("name")

  if (error) {
    throw new Error(error.message)
  }

  const categories = (data ?? []) as WasteCategory[]

  if (categories.length >= WASTE_CATEGORY_SEEDS.length) {
    return categories
  }

  const { data: seeded, error: seedError } = await supabase
    .from("waste_categories")
    .upsert(WASTE_CATEGORY_SEEDS, { onConflict: "slug" })
    .select("*")
    .in("slug", CANONICAL_WASTE_CATEGORY_SLUGS)
    .order("name")

  if (seedError) {
    // RLS may block seeding — return canonical rows already present.
    return categories
  }

  return (seeded ?? categories) as WasteCategory[]
}
