"use client"

import { useActionState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { completeOnboardingAction, type ActionResult } from "@/lib/actions/auth"
import { BUSINESS_TYPES, COMPANY_ROLES, INDUSTRIES } from "@/lib/constants"
import type { Company, Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormSelect } from "@/components/ui/form-select"

const initialState: ActionResult = {}

export function OnboardingForm({
  profile,
  company,
}: {
  profile: Profile | null
  company: Company | null
}) {
  const [state, formAction, pending] = useActionState(completeOnboardingAction, initialState)

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={profile?.full_name ?? ""}
            autoComplete="name"
            required
            disabled={pending}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={profile?.phone ?? company?.phone ?? ""}
            autoComplete="tel"
            required
            disabled={pending}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            name="companyName"
            defaultValue={company?.name ?? ""}
            autoComplete="organization"
            required
            disabled={pending}
          />
        </div>

        <FormSelect
          id="businessType"
          name="businessType"
          label="Business type"
          placeholder="Select type"
          defaultValue={company?.business_type ?? undefined}
          options={BUSINESS_TYPES}
          disabled={pending}
          required
        />

        <FormSelect
          id="industry"
          name="industry"
          label="Industry"
          placeholder="Select industry"
          defaultValue={company?.industry ?? undefined}
          options={INDUSTRIES}
          disabled={pending}
          required
        />

        <FormSelect
          id="role"
          name="role"
          label="Company role"
          placeholder="Supplier, buyer, or both"
          defaultValue={company?.role ?? undefined}
          options={COMPANY_ROLES}
          disabled={pending}
          required
        />

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            defaultValue={company?.city ?? ""}
            autoComplete="address-level2"
            required
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            defaultValue={company?.state ?? ""}
            autoComplete="address-level1"
            required
            disabled={pending}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            defaultValue={company?.country ?? ""}
            autoComplete="country-name"
            required
            disabled={pending}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Company description (optional)</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={company?.description ?? ""}
            rows={3}
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website (optional)</Label>
          <Input
            id="website"
            name="website"
            type="url"
            defaultValue={company?.website ?? ""}
            placeholder="https://"
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal code (optional)</Label>
          <Input
            id="postalCode"
            name="postalCode"
            defaultValue={company?.postal_code ?? ""}
            autoComplete="postal-code"
            disabled={pending}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address (optional)</Label>
          <Input
            id="address"
            name="address"
            defaultValue={company?.address ?? ""}
            autoComplete="street-address"
            disabled={pending}
          />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Saving profile…
          </>
        ) : (
          "Complete setup"
        )}
      </Button>
    </form>
  )
}
