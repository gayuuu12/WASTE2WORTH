import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import { cn } from "@/lib/utils"

export function AuthShell({
  children,
  wide = false,
}: {
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <Link href="/" className="w-fit">
          <BrandLogo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className={cn("w-full", wide ? "max-w-lg" : "max-w-sm")}>{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 opacity-[0.07]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, var(--primary-foreground) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="max-w-md">
            <p className="font-display text-4xl font-bold leading-tight text-balance">
              One factory&apos;s waste is another&apos;s raw material.
            </p>
            <p className="mt-4 text-primary-foreground/80 leading-relaxed">
              Waste2Worth is the B2B exchange where industrial byproducts find
              new life. List surplus material, discover feedstock, negotiate
              directly, and measure the carbon you keep out of landfill.
            </p>
          </div>
          <p className="border-t border-primary-foreground/20 pt-8 text-sm text-primary-foreground/70">
            Join verified industrial suppliers and buyers building a circular economy.
          </p>
        </div>
      </div>
    </div>
  )
}
