import { z } from "zod"
import { CURRENCIES, QUANTITY_UNITS } from "@/lib/constants"
import { PREFERRED_QUALITY_OPTIONS } from "@/lib/matching/constants"

export const requirementFormSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
    description: z.string().trim().max(5000).optional(),
    categoryId: z.string().uuid("Select a waste category"),
    materialName: z.string().trim().min(2, "Material name is required").max(200),
    desiredGrade: z.string().trim().max(100).optional(),
    quantityNeeded: z
      .union([z.string(), z.number()])
      .transform((val) => Number(val))
      .pipe(z.number().positive("Quantity must be greater than zero")),
    quantityUnit: z.enum(QUANTITY_UNITS, { message: "Select a quantity unit" }),
    minimumAcceptableQuantity: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === undefined || val === null || val === "") return undefined
        const num = Number(val)
        return Number.isFinite(num) ? num : undefined
      })
      .pipe(z.number().positive("Minimum quantity must be greater than zero").optional()),
    maxPrice: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === undefined || val === null || val === "") return undefined
        const num = Number(val)
        return Number.isFinite(num) ? num : undefined
      })
      .pipe(z.number().nonnegative("Maximum price cannot be negative").optional()),
    currency: z.enum(CURRENCIES, { message: "Select a currency" }),
    preferredQuality: z
      .union([z.enum(PREFERRED_QUALITY_OPTIONS), z.literal("")])
      .optional()
      .transform((value) => (value === "" ? undefined : value)),
    maxDistanceKm: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === undefined || val === null || val === "") return undefined
        const num = Number(val)
        return Number.isFinite(num) ? num : undefined
      })
      .pipe(z.number().positive("Maximum distance must be greater than zero").optional()),
    city: z.string().trim().min(2, "City is required").max(100),
    state: z.string().trim().min(2, "State is required").max(100),
    country: z.string().trim().min(2, "Country is required").max(100),
    recurring: z
      .union([z.boolean(), z.string()])
      .transform((v) => v === true || v === "true" || v === "on"),
    requiredBy: z.string().trim().optional(),
    publishNow: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((v) => v === true || v === "true" || v === "on"),
  })
  .superRefine((data, ctx) => {
    if (
      data.minimumAcceptableQuantity != null &&
      data.minimumAcceptableQuantity > data.quantityNeeded
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Minimum acceptable quantity cannot exceed required quantity",
        path: ["minimumAcceptableQuantity"],
      })
    }
  })

export type RequirementFormInput = z.infer<typeof requirementFormSchema>
