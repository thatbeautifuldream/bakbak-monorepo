import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const PROTECTED_PREFIXES = [
  "/dashboard",
]

const ANON_ONLY_PATHS = ["/", "/login", "/signup"]

export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl
  const sessionCookie = getSessionCookie(request)

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
  const isAnonOnly = ANON_ONLY_PATHS.includes(pathname)

  if (isProtected && !sessionCookie) {
    const url = new URL("/login", request.url)
    url.searchParams.set("next", pathname + search)
    return NextResponse.redirect(url)
  }

  if (isAnonOnly && sessionCookie) {
    const next = searchParams.get("next")
    const target = next && next.startsWith("/") ? next : "/dashboard"
    return NextResponse.redirect(new URL(target, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/", "/login", "/signup",
    "/dashboard/:path*",
  ],
}
