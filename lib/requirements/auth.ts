import { requireCompleteProfile } from "@/lib/auth"
import type { Company, BuyerRequirement } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export function canManageRequirements(company: Company): boolean {
  return company.role === "buyer" || company.role === "both"
}

export async function requireBuyerContext() {
  const ctx = await requireCompleteProfile()

  if (!canManageRequirements(ctx.company)) {
    redirect("/dashboard?error=buyer_only")
  }

  return ctx
}

export async function getOwnedRequirement(requirementId: string, companyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("buyer_requirements")
    .select(`*, category:waste_categories(*)`)
    .eq("id", requirementId)
    .eq("buyer_company_id", companyId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as BuyerRequirement | null
}

export async function requireOwnedRequirement(requirementId: string, companyId: string) {
  const requirement = await getOwnedRequirement(requirementId, companyId)

  if (!requirement) {
    redirect("/dashboard/requirements?error=not_found")
  }

  return requirement
}

export async function getCompanyRequirements(companyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("buyer_requirements")
    .select(`*, category:waste_categories(*)`)
    .eq("buyer_company_id", companyId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as BuyerRequirement[]
}
