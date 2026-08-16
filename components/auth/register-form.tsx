"use client"

import { useActionState, useEffect } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { registerAction, type ActionResult } from "@/lib/actions/auth"
import { BUSINESS_TYPES, COMPANY_ROLES, INDUSTRIES } from "@/lib/constants"
import { buttonVariants, Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormSelect } from "@/components/ui/form-select"

const initialState: ActionResult = {}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState)

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  if (state.needsEmailVerification) {
    return (
      <div className="space-y-4 text-center sm:text-left">
        <h1 className="font-display text-2xl font-bold tracking-tight">Check your email</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We sent a confirmation link to your email address. After verifying,
          sign in to complete your account setup.
        </p>
        <Link href="/login" className={cn(buttonVariants(), "w-full")}>
          Go to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="font-display text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Register your company on Waste2Worth
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              placeholder="Jane Doe"
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              name="companyName"
              autoComplete="organization"
              placeholder="Acme Industries Pvt Ltd"
              required
              disabled={pending}
            />
          </div>

          <FormSelect
            id="businessType"
            name="businessType"
            label="Business type"
            placeholder="Select type"
            options={BUSINESS_TYPES}
            disabled={pending}
            required
          />

          <FormSelect
            id="industry"
            name="industry"
            label="Industry"
            placeholder="Select industry"
            options={INDUSTRIES}
            disabled={pending}
            required
          />

          <FormSelect
            id="role"
            name="role"
            label="Your role"
            placeholder="Supplier, buyer, or both"
            options={COMPANY_ROLES}
            disabled={pending}
            required
          />

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" autoComplete="address-level2" required disabled={pending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" autoComplete="address-level1" required disabled={pending} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" autoComplete="country-name" required disabled={pending} />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
