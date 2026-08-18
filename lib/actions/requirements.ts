"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { generateMatchesForRequirement } from "@/lib/matching/engine"
import {
  requireBuyerContext,
  requireOwnedRequirement,
} from "@/lib/requirements/auth"
import { requirementFormSchema } from "@/lib/validations/requirements"
import { createClient } from "@/lib/supabase/server"
import type { BuyerRequirementInsert } from "@/lib/database.types"
import type { RequirementStatus } from "@/lib/types"

export type RequirementActionResult = {
  error?: string
  success?: boolean
}

function parseRequirementForm(formData: FormData) {
  return requirementFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId"),
    materialName: formData.get("materialName"),
    desiredGrade: formData.get("desiredGrade") || undefined,
    quantityNeeded: formData.get("quantityNeeded"),
    quantityUnit: formData.get("quantityUnit"),
    minimumAcceptableQuantity: formData.get("minimumAcceptableQuantity") || undefined,
    maxPrice: formData.get("maxPrice") || undefined,
    currency: formData.get("currency"),
    preferredQuality: formData.get("preferredQuality") || undefined,
    maxDistanceKm: formData.get("maxDistanceKm") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country"),
    recurring: formData.get("recurring"),
    requiredBy: formData.get("requiredBy") || undefined,
    publishNow: formData.get("publishNow"),
  })
}

function requirementPayload(
  data: ReturnType<typeof requirementFormSchema.parse>,
  companyId: string,
  userId: string,
  status: RequirementStatus,
  coords: { latitude: number | null; longitude: number | null },
  notes: string | null = null,
): BuyerRequirementInsert {
  return {
    buyer_company_id: companyId,
    created_by: userId,
    title: data.title,
    description: data.description?.trim() || null,
    category_id: data.categoryId,
    material_name: data.materialName,
    desired_grade: data.desiredGrade?.trim() || null,
    quantity_needed: data.quantityNeeded,
    minimum_acceptable_quantity: data.minimumAcceptableQuantity ?? null,
    quantity_unit: data.quantityUnit,
    max_price: data.maxPrice ?? null,
    currency: data.currency,
    preferred_quality: data.preferredQuality ?? null,
    max_distance_km: data.maxDistanceKm ?? null,
    preferred_city: data.city,
    preferred_state: data.state,
    preferred_country: data.country,
    latitude: coords.latitude,
    longitude: coords.longitude,
    recurring: data.recurring,
    required_by: data.requiredBy || null,
    notes,
    status,
  }
}

function formatRequirementDbError(message: string) {
  if (/Could not find the '([^']+)' column/.test(message) || /column buyer_requirements\.(\w+) does not exist/.test(message)) {
    return `${message} Apply the additive migration in supabase/migrations/20260816_buyer_requirements_phase3_columns.sql via the Supabase SQL editor, then retry.`
  }
  return message
}

async function regenerateMatches(requirementId: string, status: RequirementStatus) {
  const supabase = await createClient()
  if (status === "active") {
    await generateMatchesForRequirement(supabase, requirementId)
  } else {
    await supabase.from("matches").delete().eq("requirement_id", requirementId)
  }
}

export async function createRequirementAction(
  _prev: RequirementActionResult,
  formData: FormData,
): Promise<RequirementActionResult> {
  const ctx = await requireBuyerContext()
  const parsed = parseRequirementForm(formData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid requirement data" }
  }

  const supabase = await createClient()
  const status: RequirementStatus = parsed.data.publishNow ? "active" : "paused"

  const { data, error } = await supabase
    .from("buyer_requirements")
    .insert(
      requirementPayload(parsed.data, ctx.company.id, ctx.user.id, status, {
        latitude: ctx.company.latitude,
        longitude: ctx.company.longitude,
      }),
    )
    .select("id, status")
    .single()

  if (error) {
    return { error: formatRequirementDbError(error.message) }
  }

  await regenerateMatches(data.id, data.status as RequirementStatus)

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/requirements")
  revalidatePath("/dashboard/matches")
  redirect(`/dashboard/requirements/${data.id}`)
}

export async function updateRequirementAction(
  _prev: RequirementActionResult,
  formData: FormData,
): Promise<RequirementActionResult> {
  const ctx = await requireBuyerContext()
  const requirementId = String(formData.get("requirementId") ?? "")

  if (!requirementId) {
    return { error: "Requirement ID is required" }
  }

  await requireOwnedRequirement(requirementId, ctx.company.id)

  const parsed = parseRequirementForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid requirement data" }
  }

  const existing = await requireOwnedRequirement(requirementId, ctx.company.id)
  const keepStatus =
    existing.status === "active" || existing.status === "paused"
      ? existing.status
      : parsed.data.publishNow
        ? "active"
        : "paused"

  const supabase = await createClient()
  const fullPayload = requirementPayload(
    parsed.data,
    ctx.company.id,
    ctx.user.id,
    keepStatus,
    {
      latitude: ctx.company.latitude,
      longitude: ctx.company.longitude,
    },
    existing.notes,
  )

  const { buyer_company_id: _b, created_by: _c, ...updates } = fullPayload

  const { error } = await supabase
    .from("buyer_requirements")
    .update(updates)
    .eq("id", requirementId)
    .eq("buyer_company_id", ctx.company.id)

  if (error) {
    return { error: formatRequirementDbError(error.message) }
  }

  await regenerateMatches(requirementId, keepStatus)

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/requirements")
  revalidatePath(`/dashboard/requirements/${requirementId}`)
  revalidatePath("/dashboard/matches")
  redirect(`/dashboard/requirements/${requirementId}`)
}

export async function toggleRequirementStatusAction(requirementId: string) {
  const ctx = await requireBuyerContext()
  const requirement = await requireOwnedRequirement(requirementId, ctx.company.id)

  const nextStatus: RequirementStatus =
    requirement.status === "active" ? "paused" : "active"

  if (!["active", "paused"].includes(requirement.status)) {
    return { error: "This requirement status cannot be toggled" }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("buyer_requirements")
    .update({ status: nextStatus })
    .eq("id", requirementId)
    .eq("buyer_company_id", ctx.company.id)

  if (error) {
    return { error: formatRequirementDbError(error.message) }
  }

  await regenerateMatches(requirementId, nextStatus)

  revalidatePath("/dashboard/requirements")
  revalidatePath(`/dashboard/requirements/${requirementId}`)
  revalidatePath("/dashboard/matches")
  revalidatePath("/dashboard")

  return { success: true, status: nextStatus }
}

export async function deleteRequirementAction(requirementId: string) {
  const ctx = await requireBuyerContext()
  await requireOwnedRequirement(requirementId, ctx.company.id)

  const supabase = await createClient()
  await supabase.from("matches").delete().eq("requirement_id", requirementId)

  const { error } = await supabase
    .from("buyer_requirements")
    .delete()
    .eq("id", requirementId)
    .eq("buyer_company_id", ctx.company.id)

  if (error) {
    return { error: formatRequirementDbError(error.message) }
  }

  revalidatePath("/dashboard/requirements")
  revalidatePath("/dashboard/matches")
  revalidatePath("/dashboard")
  redirect("/dashboard/requirements")
}
