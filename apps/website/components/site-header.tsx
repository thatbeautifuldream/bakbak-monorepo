import Link from "next/link"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-8 place-items-center rounded-[10px] bg-[#e95f45] text-sm font-bold tracking-[-0.08em] text-[#fffaf2] ${className ?? ""}`}
    >
      b
    </span>
  )
}

export async function SiteHeader() {
  const cookieStore = await cookies()
  const isSignedIn = cookieStore.has("better-auth.session_token")

  return (
    <header className="relative z-10 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="BakBak home"
          className="group flex items-center gap-2.5"
        >
          <BrandMark className="transition-transform duration-300 group-hover:-rotate-6" />
          <span className="text-base font-bold tracking-[-0.05em]">bakbak</span>
        </Link>

        <div className="flex items-center gap-3">
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-4 sm:flex"
          >
            <Link
              href="/analytics"
              className="text-sm font-semibold text-[#5d5853] transition-colors hover:text-[#171616] dark:text-[#c9c0b6] dark:hover:text-[#f8f1e8]"
            >
              Signal desk
            </Link>
            {!isSignedIn ? (
              <Link
                href="/login"
                className="text-sm font-semibold text-[#5d5853] transition-colors hover:text-[#171616] dark:text-[#c9c0b6] dark:hover:text-[#f8f1e8]"
              >
                Sign in
              </Link>
            ) : null}
          </nav>
          <Button
            asChild
            size="lg"
            className="h-10 rounded-full border-[#e95f45] bg-[#e95f45] px-4 text-sm text-[#fffaf2] shadow-[0_8px_20px_-14px_#bf4633] hover:bg-[#bf4633]"
          >
            <Link href={isSignedIn ? "/dashboard" : "/login"}>
              {isSignedIn ? "Dashboard" : "Try BakBak"}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
