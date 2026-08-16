"use server"

import { createClient } from "@/lib/supabase/server"
import { getPostAuthRedirect } from "@/lib/auth"
import {
  ensureUserBusinessProfile,
  updateUserBusinessProfile,
} from "@/lib/profile"
import {
  forgotPasswordSchema,
  loginSchema,
  onboardingSchema,
  registerSchema,
  resetPasswordSchema,
  type BusinessProfileInput,
} from "@/lib/validations/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export type ActionResult = {
  error?: string
  success?: boolean
  needsEmailVerification?: boolean
  redirectTo?: string
}

async function getOrigin() {
  const headerStore = await headers()
  const origin = headerStore.get("origin")
  if (origin) return origin

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host")
  const protocol = headerStore.get("x-forwarded-proto") ?? "http"
  if (host) return `${protocol}://${host}`

  return "http://localhost:3000"
}

function toBusinessInput(data: {
  fullName: string
  phone: string
  companyName: string
  businessType: string
  industry: string
  role: "supplier" | "buyer" | "both"
  city: string
  state: string
  country: string
  description?: string
  website?: string
  address?: string
  postalCode?: string
}): BusinessProfileInput {
  return {
    fullName: data.fullName,
    phone: data.phone,
    companyName: data.companyName,
    businessType: data.businessType,
    industry: data.industry,
    role: data.role,
    city: data.city,
    state: data.state,
    country: data.country,
    description: data.description,
    website: data.website,
    address: data.address,
    postalCode: data.postalCode,
  }
}

export async function loginAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unable to establish session. Please try again." }
  }

  try {
    await ensureUserBusinessProfile(supabase, user.id, user.email)
  } catch {
    // Profile may still need onboarding — handled by redirect below.
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  let company = null
  if (profile?.company_id) {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("id", profile.company_id)
      .maybeSingle()
    company = data
  }

  const redirectParam = formData.get("redirect")
  const requestedRedirect =
    typeof redirectParam === "string" && redirectParam.startsWith("/")
      ? redirectParam
      : null

  redirect(requestedRedirect ?? getPostAuthRedirect(profile, company))
}

export async function registerAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    companyName: formData.get("companyName"),
    businessType: formData.get("businessType"),
    industry: formData.get("industry"),
    role: formData.get("role"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await createClient()
  const origin = await getOrigin()
  const businessInput = toBusinessInput(parsed.data)

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
        company_name: parsed.data.companyName,
        business_type: parsed.data.businessType,
        industry: parsed.data.industry,
        role: parsed.data.role,
        city: parsed.data.city,
        state: parsed.data.state,
        country: parsed.data.country,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.user) {
    return { error: "Registration failed. Please try again." }
  }

  if (data.session) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

    if (sessionError) {
      return { error: sessionError.message }
    }

    try {
      const { profile, company } = await ensureUserBusinessProfile(
        supabase,
        data.user.id,
        data.user.email,
        businessInput,
      )
      redirect(getPostAuthRedirect(profile, company))
    } catch (setupError) {
      return {
        error:
          setupError instanceof Error
            ? setupError.message
            : "Could not create your business profile.",
      }
    }
  }

  return {
    success: true,
    needsEmailVerification: true,
  }
}

export async function forgotPasswordAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await createClient()
  const origin = await getOrigin()

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?type=recovery&next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function resetPasswordAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Your reset link has expired. Please request a new one." }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/login?message=password_updated")
}

export async function completeOnboardingAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    companyName: formData.get("companyName"),
    businessType: formData.get("businessType"),
    industry: formData.get("industry"),
    role: formData.get("role"),
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country"),
    description: formData.get("description") || undefined,
    website: formData.get("website") || undefined,
    address: formData.get("address") || undefined,
    postalCode: formData.get("postalCode") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be signed in to complete onboarding." }
  }

  try {
    await updateUserBusinessProfile(
      supabase,
      user.id,
      user.email,
      toBusinessInput(parsed.data),
    )
  } catch (setupError) {
    return {
      error:
        setupError instanceof Error
          ? setupError.message
          : "Could not save your profile.",
    }
  }

  redirect("/dashboard")
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
