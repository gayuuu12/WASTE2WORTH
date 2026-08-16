import { createClient } from "@/lib/supabase/server"
import { getPostAuthRedirect } from "@/lib/auth"
import { ensureUserBusinessProfile } from "@/lib/profile"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const type = searchParams.get("type")
  const nextParam = searchParams.get("next")

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  try {
    await ensureUserBusinessProfile(supabase, user.id, user.email)
  } catch {
    // User may need to finish onboarding manually.
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

  const defaultDestination = getPostAuthRedirect(profile, company)
  const next =
    nextParam && nextParam.startsWith("/") ? nextParam : defaultDestination

  const destination =
    next === "/dashboard" || next === "/onboarding" ? defaultDestination : next

  return NextResponse.redirect(`${origin}${destination}`)
}
