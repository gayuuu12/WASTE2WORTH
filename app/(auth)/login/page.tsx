import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; message?: string; error?: string }>
}) {
  const params = await searchParams

  const errorMessages: Record<string, string> = {
    auth_callback_failed: "Authentication failed. Please try signing in again.",
    missing_code: "Invalid authentication link. Please try again.",
  }

  return (
    <AuthShell>
      {params.message === "password_updated" ? (
        <p className="mb-4 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Your password has been updated. Sign in with your new password.
        </p>
      ) : null}
      {params.error && errorMessages[params.error] ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errorMessages[params.error]}
        </p>
      ) : null}
      <LoginForm redirectTo={params.redirect} />
    </AuthShell>
  )
}
