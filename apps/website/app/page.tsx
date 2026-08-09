import type { Metadata } from "next"
import Link from "next/link"
import {
  RiArrowRightLine,
  RiCornerDownRightLine,
  RiMicLine,
  RiStopFill,
} from "@remixicon/react"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Bakbak · Talk to the web",
  description:
    "A voice companion that helps you understand any page without leaving it.",
}

const moments = [
  {
    label: "It already knows the page",
    detail:
      "Bakbak reads what you are reading, so you never have to describe the context before you ask.",
  },
  {
    label: "Ask in your own words",
    detail:
      "Talk through a dense paragraph, a detail you selected, or whatever question you have right now.",
  },
  {
    label: "It can act, and it says so",
    detail:
      "Bakbak can scroll, follow a link, or fill a field. Every action it takes is written down as it happens.",
  },
]

/** Mirrors the shipped extension panel, so the page shows the real product rather than an impression of it. */
function PanelPreview() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl shadow-black/5 dark:shadow-black/40">
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <span className="size-1.5 rounded-full bg-success" />
        <p className="flex-1 text-sm font-medium">Listening</p>
        <p className="font-mono text-xs tabular-nums text-muted-foreground">
          0:42
        </p>
      </div>

      <div className="flex items-baseline gap-2.5 border-y border-border px-3.5 py-2">
        <p className="min-w-0 flex-1 truncate text-sm">
          The hidden life of a forest
        </p>
        <p className="font-mono text-[0.6875rem] text-muted-foreground">
          example.com
        </p>
      </div>

      <ol role="list" className="flex flex-col gap-3 px-3.5 py-3.5">
        <li>
          <p className="font-mono text-[0.6875rem] text-muted-foreground">
            You
          </p>
          <p className="text-sm text-muted-foreground">
            What does it say about root networks?
          </p>
        </li>
        <li>
          <p className="font-mono text-[0.6875rem] text-muted-foreground">
            Bakbak
          </p>
          <p className="text-sm">
            Trees trade sugar and warning signals through fungal threads. The
            section on that starts just below you.
          </p>
        </li>
        <li className="flex items-center gap-1.5 border-l-2 border-border pl-2 text-muted-foreground">
          <RiCornerDownRightLine className="size-3 shrink-0" />
          <p className="text-xs">Scrolled down</p>
        </li>
      </ol>

      <div className="flex items-center gap-3 border-t border-border px-3.5 py-2.5">
        <div className="flex flex-1 items-center gap-[3px]">
          {["h-1.5", "h-3", "h-4.5", "h-2", "h-1"].map((height) => (
            <span
              key={height}
              className={`w-[3px] rounded-full bg-success ${height}`}
            />
          ))}
        </div>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-secondary px-3 text-sm font-medium">
          <RiStopFill className="size-4" />
          Stop
        </span>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <SiteHeader />

      <section className="px-5 pt-16 pb-20 sm:px-8 sm:pt-24 lg:pb-28">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:gap-16">
          <div>
            <h1 className="max-w-[14ch] text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              The web has a lot to say.{" "}
              <span className="text-muted-foreground">Talk back.</span>
            </h1>
            <p className="mt-6 max-w-[60ch] text-base/7 text-pretty text-muted-foreground sm:text-lg/8">
              Bakbak is a voice companion that understands the page in front of
              you, so a question, a thought, or a useful detail is always within
              reach.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Start a conversation
                  <RiArrowRightLine />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Your mic only starts when you choose to speak.
              </p>
            </div>
          </div>

          <div className="justify-self-center lg:justify-self-end">
            <PanelPreview />
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-8 px-5 pb-20 sm:px-8 lg:pb-28"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-[20ch] text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            A conversation, not a detour.
          </h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 border-t border-border pt-8 md:grid-cols-3">
            {moments.map((moment) => (
              <div key={moment.label}>
                <h3 className="text-base font-medium">{moment.label}</h3>
                <p className="mt-2 max-w-[38ch] text-sm/6 text-pretty text-muted-foreground">
                  {moment.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:pb-28">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 rounded-2xl bg-foreground px-6 py-12 text-background sm:px-10 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div>
            <h2 className="max-w-[18ch] text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Stay with the thought, not the tab.
            </h2>
            <p className="mt-4 max-w-[56ch] text-base/7 text-pretty opacity-70">
              Sign in to start using Bakbak with the browser extension.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="w-fit shrink-0"
          >
            <Link href="/login">
              Try Bakbak
              <RiMicLine />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="w-fit font-medium text-foreground">
            Bakbak
          </Link>
          <p>Talk to the web, without leaving it.</p>
        </div>
      </footer>
    </main>
  )
}
