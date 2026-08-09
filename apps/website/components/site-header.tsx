import Link from "next/link"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"

export async function SiteHeader() {
  const cookieStore = await cookies()
  const isSignedIn = cookieStore.has("better-auth.session_token")

  return (
    <header className="relative z-10 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="Bakbak home"
          className="text-base font-semibold tracking-tight"
        >
          Bakbak
        </Link>

        <div className="flex items-center gap-4">
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-4 sm:flex"
          >
            <Link
              href="/analytics"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Signal desk
            </Link>
            {!isSignedIn ? (
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
            ) : null}
          </nav>
          <Button asChild>
            <Link href={isSignedIn ? "/dashboard" : "/login"}>
              {isSignedIn ? "Dashboard" : "Try Bakbak"}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
