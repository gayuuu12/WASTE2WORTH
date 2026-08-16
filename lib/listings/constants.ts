export const LISTING_IMAGES_BUCKET = "listing-images"

export const LISTING_IMAGE_MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export const LISTING_IMAGE_MAX_COUNT = 10

export const LISTING_IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

export const LISTING_IMAGE_ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"]

/** Canonical waste category reference data — must match migration seed slugs. */
export const WASTE_CATEGORY_SEEDS = [
  {
    slug: "chemical-solvents",
    name: "Chemical & Solvents",
    description: "Industrial chemicals, solvents, and related process waste streams",
  },
  {
    slug: "construction-demolition",
    name: "Construction & Demolition",
    description: "Concrete, brick, demolition debris, and construction byproducts",
  },
  {
    slug: "e-waste",
    name: "E-Waste",
    description: "Electronic waste, components, and electrical scrap",
  },
  {
    slug: "glass",
    name: "Glass",
    description: "Glass cullet, broken glass, and glass manufacturing waste",
  },
  {
    slug: "metals",
    name: "Metals",
    description: "Ferrous and non-ferrous metal scrap and industrial metal waste",
  },
  {
    slug: "organic-agricultural",
    name: "Organic & Agricultural",
    description: "Organic matter, crop residue, and agricultural byproducts",
  },
  {
    slug: "other",
    name: "Other",
    description: "Other industrial and commercial waste materials",
  },
  {
    slug: "paper-cardboard",
    name: "Paper & Cardboard",
    description: "Paper, cardboard, pulp, and fiber packaging waste",
  },
  {
    slug: "plastics",
    name: "Plastics",
    description: "Plastic scrap, pellets, packaging, and polymer waste",
  },
  {
    slug: "rubber",
    name: "Rubber",
    description: "Rubber tyres, seals, elastomers, and rubber processing waste",
  },
  {
    slug: "textiles",
    name: "Textiles",
    description: "Fabric scraps, yarn, garments, and textile manufacturing waste",
  },
  {
    slug: "wood-timber",
    name: "Wood & Timber",
    description: "Timber offcuts, pallets, wood chips, and wood processing waste",
  },
] as const

export const CANONICAL_WASTE_CATEGORY_SLUGS = WASTE_CATEGORY_SEEDS.map(
  (category) => category.slug,
)
