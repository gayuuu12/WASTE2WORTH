import { redirect } from "next/navigation"
import { OnboardingForm } from "@/components/onboarding/onboarding-form"
import { BrandLogo } from "@/components/brand-logo"
import { getSessionContext } from "@/lib/auth"
import { isBusinessProfileComplete } from "@/lib/profile"

export default async function OnboardingPage() {
  const ctx = await getSessionContext()

  if (!ctx) {
    redirect("/login")
  }

  if (isBusinessProfileComplete(ctx.profile, ctx.company)) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <BrandLogo />
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Complete your business profile
          </h1>
          <p className="text-muted-foreground">
            Tell us about your company so you can start using Waste2Worth.
          </p>
        </div>

        <div className="mt-8">
          <OnboardingForm profile={ctx.profile} company={ctx.company} />
        </div>
      </main>
    </div>
  )
}
