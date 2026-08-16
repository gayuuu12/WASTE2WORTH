import { redirect } from "next/navigation"
import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { getSessionUser } from "@/lib/auth"

export default async function ResetPasswordPage() {
  const user = await getSessionUser()

  if (!user) {
    redirect("/forgot-password")
  }

  return (
    <AuthShell>
      <ResetPasswordForm />
    </AuthShell>
  )
}
