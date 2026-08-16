-- Waste2Worth AI — deduplicate waste_categories
-- Run manually after 20260816_000002_seed_waste_categories.sql
--
-- Root cause: legacy app auto-seed (lib/listings/constants.ts) inserted old slugs
-- before/alongside the canonical migration seed. Different slugs => duplicate rows.
--
-- Safe behavior:
-- 1. Ensure canonical 12 categories exist
-- 2. Re-point waste_listings / buyer_requirements FKs from legacy -> canonical
-- 3. Delete legacy rows only when no references remain

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Ensure canonical categories exist with correct labels
-- ---------------------------------------------------------------------------
INSERT INTO public.waste_categories (slug, name, description)
VALUES
  (
    'chemical-solvents',
    'Chemical & Solvents',
    'Industrial chemicals, solvents, and related process waste streams'
  ),
  (
    'construction-demolition',
    'Construction & Demolition',
    'Concrete, brick, demolition debris, and construction byproducts'
  ),
  (
    'e-waste',
    'E-Waste',
    'Electronic waste, components, and electrical scrap'
  ),
  (
    'glass',
    'Glass',
    'Glass cullet, broken glass, and glass manufacturing waste'
  ),
  (
    'metals',
    'Metals',
    'Ferrous and non-ferrous metal scrap and industrial metal waste'
  ),
  (
    'organic-agricultural',
    'Organic & Agricultural',
    'Organic matter, crop residue, and agricultural byproducts'
  ),
  (
    'other',
    'Other',
    'Other industrial and commercial waste materials'
  ),
  (
    'paper-cardboard',
    'Paper & Cardboard',
    'Paper, cardboard, pulp, and fiber packaging waste'
  ),
  (
    'plastics',
    'Plastics',
    'Plastic scrap, pellets, packaging, and polymer waste'
  ),
  (
    'rubber',
    'Rubber',
    'Rubber tyres, seals, elastomers, and rubber processing waste'
  ),
  (
    'textiles',
    'Textiles',
    'Fabric scraps, yarn, garments, and textile manufacturing waste'
  ),
  (
    'wood-timber',
    'Wood & Timber',
    'Timber offcuts, pallets, wood chips, and wood processing waste'
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ---------------------------------------------------------------------------
-- 2. Migrate FK references: legacy slug -> canonical slug
-- ---------------------------------------------------------------------------
WITH slug_map (legacy_slug, canonical_slug) AS (
  VALUES
    ('textile', 'textiles'),
    ('plastic', 'plastics'),
    ('paper', 'paper-cardboard'),
    ('metal', 'metals'),
    ('wood', 'wood-timber'),
    ('organic', 'organic-agricultural'),
    ('agricultural', 'organic-agricultural'),
    ('construction', 'construction-demolition'),
    ('electronic', 'e-waste')
),
legacy_to_canonical AS (
  SELECT
    legacy.id AS legacy_id,
    canonical.id AS canonical_id
  FROM slug_map sm
  INNER JOIN public.waste_categories legacy ON legacy.slug = sm.legacy_slug
  INNER JOIN public.waste_categories canonical ON canonical.slug = sm.canonical_slug
  WHERE legacy.id IS DISTINCT FROM canonical.id
)
UPDATE public.waste_listings wl
SET category_id = m.canonical_id
FROM legacy_to_canonical m
WHERE wl.category_id = m.legacy_id;

WITH slug_map (legacy_slug, canonical_slug) AS (
  VALUES
    ('textile', 'textiles'),
    ('plastic', 'plastics'),
    ('paper', 'paper-cardboard'),
    ('metal', 'metals'),
    ('wood', 'wood-timber'),
    ('organic', 'organic-agricultural'),
    ('agricultural', 'organic-agricultural'),
    ('construction', 'construction-demolition'),
    ('electronic', 'e-waste')
),
legacy_to_canonical AS (
  SELECT
    legacy.id AS legacy_id,
    canonical.id AS canonical_id
  FROM slug_map sm
  INNER JOIN public.waste_categories legacy ON legacy.slug = sm.legacy_slug
  INNER JOIN public.waste_categories canonical ON canonical.slug = sm.canonical_slug
  WHERE legacy.id IS DISTINCT FROM canonical.id
)
UPDATE public.buyer_requirements br
SET category_id = m.canonical_id
FROM legacy_to_canonical m
WHERE br.category_id = m.legacy_id;

-- ---------------------------------------------------------------------------
-- 3. Remove legacy duplicate rows (only when unreferenced)
-- ---------------------------------------------------------------------------
DELETE FROM public.waste_categories wc
WHERE wc.slug IN (
  'textile',
  'plastic',
  'paper',
  'metal',
  'wood',
  'organic',
  'agricultural',
  'construction',
  'electronic'
)
AND NOT EXISTS (
  SELECT 1
  FROM public.waste_listings wl
  WHERE wl.category_id = wc.id
)
AND NOT EXISTS (
  SELECT 1
  FROM public.buyer_requirements br
  WHERE br.category_id = wc.id
);

COMMIT;
