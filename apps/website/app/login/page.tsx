"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState, useTransition } from "react"
import { signIn, signUp } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { RiArrowRightLine, RiGoogleFill } from "@remixicon/react"

type Mode = "signin" | "signup"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const nextParam = searchParams.get("next")
  const destination = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard"

  const switchMode = (newMode: Mode) => {
    setError(null)
    setMode(newMode)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result =
        mode === "signup"
          ? await signUp.email({ email, password, name, callbackURL: `${window.location.origin}${destination}` })
          : await signIn.email({ email, password })

      if (result.error) {
        setError(result.error.message ?? "Authentication failed.")
        return
      }

      router.replace(destination)
    })
  }

  const handleGoogle = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}${destination}`,
      errorCallbackURL: `${window.location.origin}/login`,
    })
  }

  return (
    <div className="min-h-dvh">
      <nav className="fixed top-0 z-50 w-full border-b bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Forge
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="hidden sm:inline">
              {mode === "signin" ? "New here?" : "Already have an account?"}
            </span>
            <button
              type="button"
              className="font-medium text-foreground underline-offset-4 hover:underline"
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </div>
        </div>
      </nav>

      <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 pt-12 sm:px-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative mx-auto w-full max-w-sm">
          <div className="rounded-xl border bg-card p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight">
                {mode === "signin" ? "Welcome back" : "Create account"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sign in to access the template dashboard.
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive dark:bg-destructive/15">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="mt-1 w-full" disabled={isPending}>
                {isPending && <Spinner data-icon="inline-start" />}
                {mode === "signin" ? "Sign in" : "Create account"}
                <RiArrowRightLine className="size-4" />
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" size="lg" className="w-full" onClick={handleGoogle} type="button">
              <RiGoogleFill data-icon="inline-start" />
              Continue with Google
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-4 hover:underline"
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </section>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
