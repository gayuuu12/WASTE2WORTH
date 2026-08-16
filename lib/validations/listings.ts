import { z } from "zod"
import {
  AVAILABILITY_FREQUENCIES,
  CONDITIONS,
  CONTAMINATION_LEVELS,
  CURRENCIES,
  MOISTURE_LEVELS,
  PRICE_UNITS,
  QUANTITY_UNITS,
} from "@/lib/constants"

const optionalNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null || val === "") return undefined
    const num = typeof val === "number" ? val : Number(val)
    return Number.isFinite(num) ? num : undefined
  })

const requiredNumber = z.union([z.string(), z.number()]).transform((val) => {
  const num = typeof val === "number" ? val : Number(val)
  return num
})

export const listingFormSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
    description: z.string().trim().max(5000).optional(),
    categoryId: z.string().uuid("Select a waste category"),
    materialName: z.string().trim().min(2, "Material name is required").max(200),
    materialGrade: z.string().trim().max(100).optional(),
    quantity: requiredNumber.pipe(z.number().positive("Quantity must be greater than zero")),
    quantityUnit: z.enum(QUANTITY_UNITS, { message: "Select a quantity unit" }),
    minimumOrderQuantity: optionalNumber.pipe(
      z.number().positive("Minimum order must be greater than zero").optional(),
    ),
    condition: z.enum(CONDITIONS).optional(),
    contaminationLevel: z.enum(CONTAMINATION_LEVELS).optional(),
    moistureLevel: z.enum(MOISTURE_LEVELS).optional(),
    qualityNotes: z.string().trim().max(2000).optional(),
    askingPrice: optionalNumber.pipe(
      z.number().nonnegative("Price cannot be negative").optional(),
    ),
    currency: z.enum(CURRENCIES, { message: "Select a currency" }),
    priceUnit: z.enum(PRICE_UNITS).optional(),
    negotiable: z
      .union([z.boolean(), z.string()])
      .transform((v) => v === true || v === "true" || v === "on"),
    recurring: z
      .union([z.boolean(), z.string()])
      .transform((v) => v === true || v === "true" || v === "on"),
    availabilityFrequency: z.enum(AVAILABILITY_FREQUENCIES).optional(),
    availableFrom: z.string().trim().optional(),
    city: z.string().trim().min(2, "City is required").max(100),
    state: z.string().trim().min(2, "State is required").max(100),
    country: z.string().trim().min(2, "Country is required").max(100),
    publishNow: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((v) => v === true || v === "true" || v === "on"),
  })
  .superRefine((data, ctx) => {
    if (data.recurring && !data.availabilityFrequency) {
      ctx.addIssue({
        code: "custom",
        message: "Select an availability frequency for recurring listings",
        path: ["availabilityFrequency"],
      })
    }
  })

export type ListingFormInput = z.infer<typeof listingFormSchema>

export const marketplaceFiltersSchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().optional(),
  material: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  minQuantity: z.string().trim().optional(),
  maxPrice: z.string().trim().optional(),
  recurring: z.enum(["true", "false"]).optional(),
  verified: z.enum(["true", "false"]).optional(),
})

export type MarketplaceFilters = z.infer<typeof marketplaceFiltersSchema>
