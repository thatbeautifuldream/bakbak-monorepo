import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const PROTECTED_PREFIXES = [
  "/dashboard",
]

const ANON_ONLY_PATHS = ["/", "/login", "/signup"]

/**
 * Browser → API traffic is same-origin so the session cookie survives iOS Safari.
 * Resolved per request: a `next.config` rewrite would bake the destination into
 * the build, so a missing env var there silently ships a proxy to localhost.
 */
function forwardToApi(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const apiUrl = process.env.API_URL

  if (!apiUrl) {
    return NextResponse.json(
      { error: { message: "API_URL is not configured" } },
      { status: 500 }
    )
  }

  const path = pathname.startsWith("/api/proxy")
    ? pathname.slice("/api/proxy".length)
    : pathname

  return NextResponse.rewrite(new URL(`${path}${search}`, apiUrl))
}

export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl

  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/proxy/")) {
    return forwardToApi(request)
  }

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
    "/api/auth/:path*",
    "/api/proxy/:path*",
  ],
}
