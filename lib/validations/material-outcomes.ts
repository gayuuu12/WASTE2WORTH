import { z } from "zod"
import { MATERIAL_OUTCOME_TYPES } from "@/lib/impact/constants"

export const materialOutcomeFormSchema = z
  .object({
    transactionId: z.string().uuid(),
    outcomeType: z.enum(MATERIAL_OUTCOME_TYPES),
    inputQuantity: z.coerce.number().positive("Input quantity must be greater than zero"),
    inputQuantityUnit: z.string().min(1),
    recoveredQuantity: z.coerce.number().min(0, "Recovered quantity cannot be negative"),
    recoveredQuantityUnit: z.string().min(1),
    resultingProduct: z.string().trim().max(200).optional(),
    resultingProductCategory: z.string().trim().max(100).optional(),
    processingMethod: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.inputQuantityUnit !== data.recoveredQuantityUnit) {
      ctx.addIssue({
        code: "custom",
        message: "Recovered quantity must use the same unit as the transaction",
        path: ["recoveredQuantityUnit"],
      })
    }
    if (data.recoveredQuantity > data.inputQuantity) {
      ctx.addIssue({
        code: "custom",
        message: "Recovered quantity cannot exceed transferred quantity",
        path: ["recoveredQuantity"],
      })
    }
  })

export type MaterialOutcomeFormInput = z.infer<typeof materialOutcomeFormSchema>

export const supplierConfirmOutcomeSchema = z.object({
  outcomeId: z.string().uuid(),
  transactionId: z.string().uuid(),
})
