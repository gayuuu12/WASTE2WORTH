import { createClient } from "@/lib/supabase/server"
import { isBusinessProfileComplete } from "@/lib/profile"
import type { Company, Profile } from "@/lib/types"
import { redirect } from "next/navigation"

export async function getSessionUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export interface SessionContext {
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>
  profile: Profile | null
  company: Company | null
}

/**
 * Loads the authenticated user's profile and company.
 * Returns null when there is no session.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  let company: Company | null = null
  if (profile?.company_id) {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("id", profile.company_id)
      .maybeSingle()
    company = data as Company | null
  }

  return {
    user,
    profile: profile as Profile | null,
    company,
  }
}

export async function requireSession(): Promise<SessionContext> {
  const ctx = await getSessionContext()
  if (!ctx) {
    redirect("/login")
  }
  return ctx
}

export async function requireCompleteProfile(): Promise<
  SessionContext & { profile: Profile; company: Company }
> {
  const ctx = await requireSession()

  if (!isBusinessProfileComplete(ctx.profile, ctx.company)) {
    redirect("/onboarding")
  }

  return ctx as SessionContext & { profile: Profile; company: Company }
}

export function getPostAuthRedirect(
  profile: Profile | null,
  company: Company | null,
): "/dashboard" | "/onboarding" {
  return isBusinessProfileComplete(profile, company) ? "/dashboard" : "/onboarding"
}
