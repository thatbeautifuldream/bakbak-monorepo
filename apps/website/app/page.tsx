import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RiArrowRightLine } from "@remixicon/react"

export const metadata = {
  title: "Forge",
  description: "A production-ready full-stack monorepo template with auth, API, and dashboard.",
}

const features = [
  {
    title: "Auth out of the box",
    description: "Email/password + Google OAuth via Better Auth. Sign up, login, password reset — all wired up.",
  },
  {
    title: "Type-safe API",
    description: "Express + express-zod-api with auto-generated OpenAPI spec and type-safe SDK client.",
  },
  {
    title: "Domain-driven API",
    description: "Clean domain layer separated from REST adapters. Drop your entities into src/domain and your endpoints into src/endpoints.",
  },
  {
    title: "Dashboard shell",
    description: "A protected dashboard wired to React Query and the typed SDK — ready to customize.",
  },
  {
    title: "shadcn/ui + Tailwind v4",
    description: "Beautiful UI components with radix-nova style, dark mode, and responsive design.",
  },
  {
    title: "Monorepo tooling",
    description: "Turborepo, Bun workspaces, Drizzle ORM, shared packages, and generated API client.",
  },
]

const steps = [
  {
    step: "01",
    label: "Clone & configure",
    detail: "Copy the template, set your env vars, and run bun install. Database migrations handled by Drizzle.",
  },
  {
    step: "02",
    label: "Define your domain",
    detail: "Replace the Todo domain with your own. Schema, domain logic, endpoints — follow the pattern.",
  },
  {
    step: "03",
    label: "Ship it",
    detail: "Customize the landing page, dashboard, and sidebar. Deploy API + website. Done.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh isolate">
      <nav className="fixed top-0 z-50 w-full border-b bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-6">
          <Link href="/" aria-label="Homepage" className="text-sm font-semibold tracking-tight">
            Forge
          </Link>
          <Button asChild size="sm" variant="outline">
            <Link href="/login">
              Sign in
              <RiArrowRightLine className="size-3.5" />
            </Link>
          </Button>
        </div>
      </nav>

      <section className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 pt-12">
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:40px_40px]" />
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            Production-ready
          </div>
          <h1
            className="animate-fade-in-up mx-auto max-w-[35ch] text-4xl font-semibold tracking-tight text-balance sm:max-w-[30ch] sm:text-5xl lg:max-w-[24ch] lg:text-6xl"
            style={{ animationDelay: "0.05s" }}
          >
            Ship your SaaS,
            <br />
            <span className="text-muted-foreground">not your boilerplate.</span>
          </h1>
          <p
            className="animate-fade-in-up mx-auto mt-6 max-w-[56ch] text-base leading-relaxed text-muted-foreground text-pretty sm:max-w-[48ch] sm:text-lg"
            style={{ animationDelay: "0.1s" }}
          >
            Auth, API, dashboard, and domain modeling — all wired up.
            Clone, define your domain, customize, deploy.
          </p>
          <div
            className="animate-fade-in-up mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            style={{ animationDelay: "0.15s" }}
          >
            <Button asChild size="lg" className="h-11 px-6 text-sm font-medium">
              <Link href="/login">
                Get started
                <RiArrowRightLine className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-6 text-sm font-medium">
              <Link href="#how-it-works">See what's included</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16">
            <h2 className="max-w-[40ch] text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Everything you need.
              <br />
              Nothing you don't.
            </h2>
            <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-muted-foreground text-pretty">
              A monorepo template with the patterns that scale — auth, type-safe API,
              generated client, and a polished dashboard shell.
            </p>
          </div>
          <dl className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="animate-fade-in-up group"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="mb-2 flex size-8 items-center justify-center rounded-md border text-xs font-medium tabular-nums text-muted-foreground transition-colors group-hover:border-foreground group-hover:text-foreground">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <dt className="text-sm font-semibold tracking-tight">{feature.title}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-16 max-w-[40ch] text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            How it works
          </h2>
          <div className="grid gap-12 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.step} className="relative">
                <span className="text-5xl font-semibold tracking-tighter tabular-nums text-muted-foreground/20">
                  {step.step}
                </span>
                <h3 className="mt-3 text-base font-semibold tracking-tight">{step.label}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mx-auto max-w-[35ch] text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Stop building boilerplate.
            <br />
            Start building your product.
          </h2>
          <p className="mx-auto mt-3 max-w-[48ch] text-sm leading-relaxed text-muted-foreground text-pretty">
            Auth, API, dashboard, domain modeling — all production-ready.
            Just add your idea.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="h-11 px-8 text-sm font-medium">
              <Link href="/login">
                Get started
                <RiArrowRightLine className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-xs text-muted-foreground">Forge</span>
          <span className="text-xs text-muted-foreground">Full-stack monorepo template</span>
        </div>
      </footer>
    </div>
  )
}
