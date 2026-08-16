-- Waste2Worth AI — reference waste category seed
-- Run after 20260816_000000_initial_waste2worth_schema.sql on a fresh project.
-- Reference data only — no listings, requirements, or other operational records.

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
ON CONFLICT (slug) DO NOTHING;
