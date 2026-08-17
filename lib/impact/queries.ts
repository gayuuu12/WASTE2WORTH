import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"
import type { ImpactPeriod } from "@/lib/impact/constants"
import { getImpactPeriodStart } from "@/lib/impact/period"
import type { MaterialOutcome, Transaction } from "@/lib/types"

/**
 * FK from material_outcomes.transaction_id → transactions.id
 * (inline REFERENCES in 20260817_000010_material_outcomes.sql)
 */
export const MATERIAL_OUTCOMES_TRANSACTION_FK = "material_outcomes_transaction_id_fkey"

const IMPACT_TRANSACTION_SELECT = `
  *,
  listing:waste_listings!listing_id(
    id,
    title,
    material_name,
    category_id,
    category:waste_categories(id, slug, name)
  ),
  buyer:companies!transactions_buyer_company_id_fkey(id, name, city, state, country),
  supplier:companies!transactions_supplier_company_id_fkey(id, name, city, state, country),
  outcome:material_outcomes!${MATERIAL_OUTCOMES_TRANSACTION_FK}(*)
`

export type ImpactTransaction = Transaction & {
  outcome?: MaterialOutcome | MaterialOutcome[] | null
}

function normalizeOutcome(
  outcome: MaterialOutcome | MaterialOutcome[] | null | undefined,
): MaterialOutcome | null {
  if (!outcome) return null
  if (Array.isArray(outcome)) return outcome[0] ?? null
  return outcome
}

export function mapImpactTransaction(row: ImpactTransaction): ImpactTransaction {
  return {
    ...row,
    outcome: normalizeOutcome(row.outcome),
  }
}

function throwImpactQueryError(context: string, error: PostgrestError): never {
  const details = [
    `Impact query failed (${context})`,
    error.message,
    error.code ? `PostgREST code: ${error.code}` : null,
    error.details ? `details: ${error.details}` : null,
    error.hint ? `hint: ${error.hint}` : null,
  ].filter(Boolean)

  if (error.message.includes("relationship") || error.code === "PGRST200") {
    details.push(
      "Expected relationship: transactions.id ← material_outcomes.transaction_id",
      `Expected FK constraint: ${MATERIAL_OUTCOMES_TRANSACTION_FK}`,
      "Ensure supabase/migrations/20260817_000010_material_outcomes.sql has been applied.",
      "If the migration was just applied, reload the PostgREST schema cache in Supabase (Settings → API → Reload schema).",
    )
  }

  throw new Error(details.join(" | "))
}

export async function getImpactTransactionsForCompany(
  supabase: SupabaseClient,
  companyId: string,
  period: ImpactPeriod,
) {
  let query = supabase
    .from("transactions")
    .select(IMPACT_TRANSACTION_SELECT)
    .or(`buyer_company_id.eq.${companyId},supplier_company_id.eq.${companyId}`)
    .eq("status", "completed")
    .order("updated_at", { ascending: false })

  const periodStart = getImpactPeriodStart(period)
  if (periodStart) {
    query = query.gte("updated_at", periodStart.toISOString())
  }

  const { data, error } = await query
  if (error) throwImpactQueryError("getImpactTransactionsForCompany", error)

  return (data ?? []).map((row) => mapImpactTransaction(row as ImpactTransaction))
}

export async function getImpactTransactionDetail(
  supabase: SupabaseClient,
  transactionId: string,
  companyId: string,
) {
  const { data, error } = await supabase
    .from("transactions")
    .select(IMPACT_TRANSACTION_SELECT)
    .eq("id", transactionId)
    .or(`buyer_company_id.eq.${companyId},supplier_company_id.eq.${companyId}`)
    .maybeSingle()

  if (error) throwImpactQueryError("getImpactTransactionDetail", error)
  if (!data) return null
  return mapImpactTransaction(data as ImpactTransaction)
}

export async function getMaterialOutcomeForTransaction(
  supabase: SupabaseClient,
  transactionId: string,
) {
  const { data, error } = await supabase
    .from("material_outcomes")
    .select("*")
    .eq("transaction_id", transactionId)
    .maybeSingle()

  if (error) throwImpactQueryError("getMaterialOutcomeForTransaction", error)
  return data as MaterialOutcome | null
}
