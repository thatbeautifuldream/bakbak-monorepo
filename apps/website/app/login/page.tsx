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
      className="w-fit text-lg font-bold tracking-[-0.05em]"
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
    <main className="min-h-dvh bg-[#f7f3ed] text-[#171616] dark:bg-[#1f1c1a] dark:text-[#f8f1e8]">
      <nav className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Brand />
          <p className="text-sm text-[#756e68] dark:text-[#c9c0b6]">
            {isSignUp ? "Already a member?" : "New to Bakbak?"}{" "}
            <button
              type="button"
              className="font-semibold text-[#b34d3b] underline-offset-4 hover:underline dark:text-[#f39b87]"
              onClick={() => switchMode(isSignUp ? "signin" : "signup")}
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,0.7fr)] lg:gap-20">
        <div className="hidden max-w-xl lg:block">
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.17em] text-[#b34d3b] uppercase dark:text-[#f39b87]">
            <span className="size-2 rounded-full bg-[#e95f45] shadow-[0_0_0_5px_rgba(233,95,69,0.12)]" />
            Your voice companion
          </p>
          <h1 className="mt-6 text-[clamp(3.5rem,6vw,5.75rem)] leading-[0.9] font-semibold tracking-[-0.08em]">
            Take the web at your own pace.
          </h1>
          <p className="mt-7 max-w-md text-lg leading-7 text-[#5d5853] dark:text-[#c9c0b6]">
            Bakbak meets you on the page you are already reading. You decide
            when the conversation begins.
          </p>
          <div className="mt-10 flex items-center gap-3 text-sm text-[#756e68] dark:text-[#c9c0b6]">
            <span className="grid size-10 place-items-center rounded-full bg-[#e95f45]/12 text-[#b34d3b] dark:text-[#f39b87]">
              <RiMicLine className="size-5" />
            </span>
            Mic starts only after you ask.
          </div>
        </div>

        <div className="w-full max-w-md justify-self-center">
          <div className="rounded-[1.75rem] border border-[#d8cfc4] bg-[#fffaf2] p-6 shadow-[0_28px_64px_-38px_rgba(23,22,22,0.5)] sm:p-8 dark:border-[#4c433e] dark:bg-[#302b28]">
            <div className="lg:hidden">
              <Brand />
            </div>
            <div className="mt-7 lg:mt-0">
              <p className="text-[11px] font-bold tracking-[0.17em] text-[#b34d3b] uppercase dark:text-[#f39b87]">
                {isSignUp ? "Join Bakbak" : "Welcome back"}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
                {isSignUp
                  ? "A little more room to think."
                  : "Pick up where you left off."}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#5d5853] dark:text-[#c9c0b6]">
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
                <p className="rounded-xl bg-[#e95f45]/10 px-3 py-2 text-sm text-[#b34d3b] dark:text-[#f39b87]">
                  {error}
                </p>
              ) : null}
              <Button
                type="submit"
                size="xl"
                className="mt-1 h-11 w-full rounded-xl border-[#e95f45] bg-[#e95f45] text-[#fffaf2] hover:bg-[#bf4633]"
                disabled={isPending}
              >
                {isPending ? <Spinner data-icon="inline-start" /> : null}
                {isSignUp ? "Create account" : "Sign in"}
                <RiArrowRightLine className="size-4" />
              </Button>
            </form>
          </div>
          <p className="mt-6 text-center text-sm text-[#756e68] dark:text-[#c9c0b6]">
            {isSignUp ? "Already have an account?" : "New to Bakbak?"}{" "}
            <button
              type="button"
              className="font-semibold text-[#b34d3b] underline-offset-4 hover:underline dark:text-[#f39b87]"
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
