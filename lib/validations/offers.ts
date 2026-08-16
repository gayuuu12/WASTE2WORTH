import { z } from "zod"
import { CURRENCIES, QUANTITY_UNITS } from "@/lib/constants"

const requiredNumber = z.union([z.string(), z.number()]).transform((val) => {
  const num = typeof val === "number" ? val : Number(val)
  return num
})

export const offerFormSchema = z.object({
  listingId: z.string().uuid("Invalid listing"),
  quantity: requiredNumber.pipe(z.number().positive("Quantity must be greater than zero")),
  quantityUnit: z.enum(QUANTITY_UNITS, { message: "Select a quantity unit" }),
  offeredPrice: requiredNumber.pipe(
    z.number().nonnegative("Offered price cannot be negative"),
  ),
  currency: z.enum(CURRENCIES, { message: "Select a currency" }),
  message: z.string().trim().max(2000).optional(),
})

export type OfferFormInput = z.infer<typeof offerFormSchema>

export const counterOfferSchema = z.object({
  offerId: z.string().uuid("Invalid offer"),
  quantity: requiredNumber.pipe(z.number().positive("Quantity must be greater than zero")),
  offeredPrice: requiredNumber.pipe(
    z.number().nonnegative("Counter price cannot be negative"),
  ),
  message: z.string().trim().max(2000).optional(),
})

export type CounterOfferInput = z.infer<typeof counterOfferSchema>

export const offerActionSchema = z.object({
  offerId: z.string().uuid("Invalid offer"),
})
