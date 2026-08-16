import type { SupabaseClient } from "@supabase/supabase-js"
import type { Company, CompanyRole, Profile } from "@/lib/types"
import type { BusinessProfileInput } from "@/lib/validations/auth"

export function isBusinessProfileComplete(
  profile: Profile | null | undefined,
  company: Company | null | undefined,
): boolean {
  if (!profile || !company) return false

  return Boolean(
    profile.full_name?.trim() &&
      profile.phone?.trim() &&
      company.name?.trim() &&
      company.business_type?.trim() &&
      company.industry?.trim() &&
      company.role &&
      company.city?.trim() &&
      company.state?.trim() &&
      company.country?.trim() &&
      company.phone?.trim(),
  )
}

function metadataToBusinessInput(
  metadata: Record<string, unknown>,
): Partial<BusinessProfileInput> | null {
  const fullName = metadata.full_name
  const companyName = metadata.company_name

  if (typeof fullName !== "string" || typeof companyName !== "string") {
    return null
  }

  return {
    fullName,
    phone: typeof metadata.phone === "string" ? metadata.phone : "",
    companyName,
    businessType:
      typeof metadata.business_type === "string" ? metadata.business_type : "",
    industry: typeof metadata.industry === "string" ? metadata.industry : "",
    role:
      metadata.role === "supplier" ||
      metadata.role === "buyer" ||
      metadata.role === "both"
        ? metadata.role
        : "both",
    city: typeof metadata.city === "string" ? metadata.city : "",
    state: typeof metadata.state === "string" ? metadata.state : "",
    country: typeof metadata.country === "string" ? metadata.country : "",
  }
}

function isCompleteBusinessInput(
  input: Partial<BusinessProfileInput>,
): input is BusinessProfileInput {
  return Boolean(
    input.fullName?.trim() &&
      input.phone?.trim() &&
      input.companyName?.trim() &&
      input.businessType?.trim() &&
      input.industry?.trim() &&
      input.role &&
      input.city?.trim() &&
      input.state?.trim() &&
      input.country?.trim(),
  )
}

/**
 * Creates or updates the authenticated user's profile and company.
 * Idempotent — skips work when profile already has a linked company.
 */
export async function ensureUserBusinessProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string | undefined,
  input?: BusinessProfileInput,
): Promise<{ profile: Profile; company: Company }> {
  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (profileLookupError) {
    throw new Error(profileLookupError.message)
  }

  if (existingProfile?.company_id) {
    const { data: existingCompany, error: companyLookupError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", existingProfile.company_id)
      .single()

    if (companyLookupError) {
      throw new Error(companyLookupError.message)
    }

    return {
      profile: existingProfile as Profile,
      company: existingCompany as Company,
    }
  }

  let businessInput = input

  if (!businessInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      throw new Error("Unauthorized")
    }

    const fromMetadata = metadataToBusinessInput(user.user_metadata ?? {})
    if (fromMetadata && isCompleteBusinessInput(fromMetadata)) {
      businessInput = fromMetadata
    }
  }

  if (!businessInput) {
    throw new Error("Business profile data is required")
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser || authUser.id !== userId) {
    throw new Error("Unauthorized")
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: businessInput.companyName.trim(),
      business_type: businessInput.businessType,
      industry: businessInput.industry,
      role: businessInput.role as CompanyRole,
      phone: businessInput.phone.trim(),
      email: email ?? null,
      city: businessInput.city.trim(),
      state: businessInput.state.trim(),
      country: businessInput.country.trim(),
      description: businessInput.description?.trim() || null,
      website: businessInput.website?.trim() || null,
      address: businessInput.address?.trim() || null,
      postal_code: businessInput.postalCode?.trim() || null,
      created_by: authUser.id,
      verification_status: "unverified",
    })
    .select("*")
    .single()

  if (companyError) {
    throw new Error(companyError.message)
  }

  const profilePayload = {
    full_name: businessInput.fullName.trim(),
    email: email ?? null,
    phone: businessInput.phone.trim(),
    company_id: company.id,
  }

  if (existingProfile) {
    const { data: profile, error: profileUpdateError } = await supabase
      .from("profiles")
      .update(profilePayload)
      .eq("id", userId)
      .select("*")
      .single()

    if (profileUpdateError) {
      throw new Error(profileUpdateError.message)
    }

    return { profile: profile as Profile, company: company as Company }
  }

  const { data: profile, error: profileInsertError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      ...profilePayload,
      is_admin: false,
    })
    .select("*")
    .single()

  if (profileInsertError) {
    throw new Error(profileInsertError.message)
  }

  return { profile: profile as Profile, company: company as Company }
}

/**
 * Updates profile and company for onboarding completion.
 * Only the authenticated user can update their own records (enforced by RLS + user id match).
 */
export async function updateUserBusinessProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string | undefined,
  input: BusinessProfileInput,
): Promise<{ profile: Profile; company: Company }> {
  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (profileLookupError) {
    throw new Error(profileLookupError.message)
  }

  let companyId = existingProfile?.company_id ?? null

  const companyPayload = {
    name: input.companyName.trim(),
    business_type: input.businessType,
    industry: input.industry,
    role: input.role as CompanyRole,
    phone: input.phone.trim(),
    email: email ?? null,
    city: input.city.trim(),
    state: input.state.trim(),
    country: input.country.trim(),
    description: input.description?.trim() || null,
    website: input.website?.trim() || null,
    address: input.address?.trim() || null,
    postal_code: input.postalCode?.trim() || null,
  }

  if (companyId) {
    const { data: company, error: companyUpdateError } = await supabase
      .from("companies")
      .update(companyPayload)
      .eq("id", companyId)
      .select("*")
      .single()

    if (companyUpdateError) {
      throw new Error(companyUpdateError.message)
    }

    const profilePayload = {
      full_name: input.fullName.trim(),
      email: email ?? null,
      phone: input.phone.trim(),
      company_id: company.id,
    }

    if (existingProfile) {
      const { data: profile, error: profileUpdateError } = await supabase
        .from("profiles")
        .update(profilePayload)
        .eq("id", userId)
        .select("*")
        .single()

      if (profileUpdateError) {
        throw new Error(profileUpdateError.message)
      }

      return { profile: profile as Profile, company: company as Company }
    }

    const { data: profile, error: profileInsertError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        ...profilePayload,
        is_admin: false,
      })
      .select("*")
      .single()

    if (profileInsertError) {
      throw new Error(profileInsertError.message)
    }

    return { profile: profile as Profile, company: company as Company }
  }

  return ensureUserBusinessProfile(supabase, userId, email, input)
}
