"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState, useTransition } from "react"
import { RiArrowRightLine, RiMicLine } from "@remixicon/react"
import { signIn, signUp } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

type Mode = "signin" | "signup"

function Brand() {
  return (
    <Link
      href="/"
      aria-label="Bakbak home"
      className="w-fit text-base font-semibold tracking-tight"
    >
      Bakbak
    </Link>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  )
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const nextParam = searchParams.get("next")
  const destination =
    nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard"
  const isSignUp = mode === "signup"

  const switchMode = (newMode: Mode) => {
    setError(null)
    setMode(newMode)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = isSignUp
        ? await signUp.email({
            email,
            password,
            name,
            callbackURL: `${window.location.origin}${destination}`,
          })
        : await signIn.email({ email, password })

      if (result.error) {
        setError(
          result.error.message ?? "We could not sign you in. Please try again."
        )
        return
      }

      router.replace(destination)
    })
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <nav className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Brand />
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Already a member?" : "New to Bakbak?"}{" "}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-4 hover:underline"
              onClick={() => switchMode(isSignUp ? "signin" : "signup")}
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:gap-20">
        <div className="hidden max-w-xl lg:block">
          <h1 className="text-4xl font-semibold tracking-tight text-balance xl:text-5xl">
            Take the web at your own pace.
          </h1>
          <p className="mt-5 max-w-[56ch] text-base/7 text-pretty text-muted-foreground">
            Bakbak meets you on the page you are already reading. You decide
            when the conversation begins.
          </p>
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <RiMicLine className="size-4 shrink-0" />
            Your mic only starts after you ask.
          </p>
        </div>

        <div className="w-full max-w-md justify-self-center">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="lg:hidden">
              <Brand />
            </div>
            <div className="mt-7 lg:mt-0">
              <h2 className="text-2xl font-semibold tracking-tight">
                {isSignUp
                  ? "A little more room to think."
                  : "Pick up where you left off."}
              </h2>
              <p className="mt-2 text-sm/6 text-muted-foreground">
                {isSignUp
                  ? "Create your account to start talking through the web."
                  : "Sign in to return to your Bakbak space."}
              </p>
            </div>

            <form className="mt-7 flex flex-col gap-4" onSubmit={handleSubmit}>
              {isSignUp ? (
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {error ? (
                <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive-foreground">
                  {error}
                </p>
              ) : null}
              <Button
                type="submit"
                size="lg"
                className="mt-1 w-full"
                disabled={isPending}
              >
                {isPending ? <Spinner data-icon="inline-start" /> : null}
                {isSignUp ? "Create account" : "Sign in"}
                <RiArrowRightLine className="size-4" />
              </Button>
            </form>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "New to Bakbak?"}{" "}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-4 hover:underline"
              onClick={() => switchMode(isSignUp ? "signin" : "signup")}
            >
              {isSignUp ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
