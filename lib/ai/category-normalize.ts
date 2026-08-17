import { WASTE_CATEGORY_SEEDS } from "@/lib/listings/constants"
import { CANONICAL_WASTE_CATEGORY_SLUGS } from "@/lib/listings/constants"

const DISPLAY_NAME_TO_SLUG = Object.fromEntries(
  WASTE_CATEGORY_SEEDS.flatMap((category) => [
    [category.name.toLowerCase(), category.slug],
    [category.slug.toLowerCase(), category.slug],
  ]),
)

const LOOSE_ALIASES: Record<string, string> = {
  textile: "textiles",
  textiles: "textiles",
  plastic: "plastics",
  plastics: "plastics",
  metal: "metals",
  metals: "metals",
  "e-waste": "e-waste",
  ewaste: "e-waste",
  electronic: "e-waste",
  organic: "organic-agricultural",
  agricultural: "organic-agricultural",
  wood: "wood-timber",
  timber: "wood-timber",
  paper: "paper-cardboard",
  cardboard: "paper-cardboard",
  construction: "construction-demolition",
  demolition: "construction-demolition",
  chemical: "chemical-solvents",
  solvents: "chemical-solvents",
  rubber: "rubber",
  glass: "glass",
  other: "other",
}

export function normalizeWasteCategorySlug(value: string): string | null {
  const normalized = value.trim().toLowerCase()
  if ((CANONICAL_WASTE_CATEGORY_SLUGS as readonly string[]).includes(normalized)) {
    return normalized
  }

  if (DISPLAY_NAME_TO_SLUG[normalized]) {
    return DISPLAY_NAME_TO_SLUG[normalized]
  }

  if (LOOSE_ALIASES[normalized]) {
    return LOOSE_ALIASES[normalized]
  }

  for (const [label, slug] of Object.entries(DISPLAY_NAME_TO_SLUG)) {
    if (normalized.includes(label) || label.includes(normalized)) {
      return slug
    }
  }

  return null
}
