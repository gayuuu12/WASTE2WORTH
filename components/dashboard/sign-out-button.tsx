import { signOutAction } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  return (
    <form action={signOutAction} className="w-full">
      <Button type="submit" variant="outline" className="min-h-11 w-full">
        Sign out
      </Button>
    </form>
  )
}
