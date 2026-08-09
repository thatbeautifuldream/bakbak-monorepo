import type { Metadata } from "next"
import Link from "next/link"
import {
  RiArrowDownLine,
  RiArrowRightLine,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiLock2Line,
  RiMicLine,
  RiPlayCircleLine,
  RiSparkling2Line,
  RiVolumeUpLine,
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
    label: "Notice what matters",
    detail:
      "Bakbak takes in the page you are already reading, so you do not have to explain the context first.",
    number: "01",
  },
  {
    label: "Ask in your own words",
    detail:
      "Talk through a tricky paragraph, a detail you selected, or the question you have right now.",
    number: "02",
  },
  {
    label: "Keep moving",
    detail:
      "Get an answer in a natural voice, then return to the page with your train of thought intact.",
    number: "03",
  },
]

function VoicePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[31rem] px-4 sm:px-0">
      <div className="absolute -top-9 left-0 flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-[#9c493a] uppercase dark:text-[#f39b87]">
        <span className="size-2 rounded-full bg-[#e95f45] shadow-[0_0_0_5px_rgba(233,95,69,0.12)]" />
        A quieter way to browse
      </div>
      <div className="absolute top-14 -right-5 z-10 hidden rounded-full border border-[#d8cfc4] bg-[#fffaf2] px-3 py-1.5 text-xs font-medium text-[#756e68] shadow-[0_12px_30px_-18px_rgba(23,22,22,0.45)] lg:block dark:border-[#4c433e] dark:bg-[#302b28] dark:text-[#c9c0b6]">
        Page-aware
      </div>
      <div className="absolute -bottom-8 -left-11 hidden rotate-[-5deg] border border-[#d8cfc4] bg-[#fffaf2] px-3 py-2 text-xs font-medium text-[#756e68] shadow-[0_16px_35px_-22px_rgba(23,22,22,0.5)] md:block dark:border-[#4c433e] dark:bg-[#302b28] dark:text-[#c9c0b6]">
        Your voice. Your pace.
      </div>

      <section className="relative overflow-hidden rounded-[2rem] border border-[#d8cfc4] bg-[#f7f3ed] shadow-[0_30px_70px_-35px_rgba(23,22,22,0.5),0_12px_30px_-20px_rgba(23,22,22,0.24)] dark:border-[#4c433e] dark:bg-[#24211f]">
        <div className="flex items-start justify-between border-b border-[#d8cfc4] px-6 pt-6 pb-5 dark:border-[#4c433e]">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#b34d3b] uppercase dark:text-[#f39b87]">
              <span className="size-1.5 rounded-full bg-[#e95f45]" />
              Page companion
            </p>
            <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.065em] text-[#171616] dark:text-[#f8f1e8]">
              Talk it through.
            </h2>
          </div>
          <span className="grid size-9 place-items-center rounded-full text-[#756e68] transition-colors hover:bg-[#eee8df] dark:text-[#c9c0b6] dark:hover:bg-[#302b28]">
            <RiCloseLine className="size-5" />
          </span>
        </div>

        <div className="px-6 pt-4 pb-5">
          <div className="flex items-center gap-3 border-y border-[#d8cfc4] py-3 dark:border-[#4c433e]">
            <span className="grid size-7 place-items-center rounded-lg bg-[#e95f45]/12 text-[#b34d3b] dark:text-[#f39b87]">
              <RiCheckboxCircleFill className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-[#756e68] dark:text-[#c9c0b6]">
                You are on
              </p>
              <p className="truncate text-[13px] font-semibold tracking-[-0.02em] text-[#24201e] dark:text-[#f8f1e8]">
                The hidden life of a forest
              </p>
            </div>
            <span className="font-mono text-[10px] text-[#8b837c] dark:text-[#aaa097]">
              example.com
            </span>
          </div>

          <div className="flex min-h-[18rem] flex-col items-center justify-center px-3 py-6 text-center">
            <div className="relative grid size-32 place-items-center">
              <span className="absolute inset-0 rounded-full border border-[#e95f45]/35" />
              <span className="absolute inset-3 rounded-full border border-dashed border-[#e95f45]/50" />
              <span className="grid size-[5.15rem] place-items-center rounded-full bg-[#e95f45] text-[#fffaf2] shadow-[0_0_0_11px_rgba(233,95,69,0.1),0_14px_28px_-12px_rgba(191,70,51,0.85)]">
                <RiMicLine className="size-7" />
              </span>
            </div>
            <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.035em] text-[#171616] dark:text-[#f8f1e8]">
              Ready when you are
            </p>
            <p className="mt-2 max-w-[28ch] text-[13px] leading-5 text-[#756e68] dark:text-[#c9c0b6]">
              Ask about the page, find a detail, or get a quick explanation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t border-[#d8cfc4] px-6 py-4 dark:border-[#4c433e]">
          <p className="flex-1 text-[11px] leading-4 text-[#756e68] dark:text-[#c9c0b6]">
            Mic starts only after you ask.
          </p>
          <span className="inline-flex items-center gap-2 rounded-xl bg-[#e95f45] px-3.5 py-2.5 text-[13px] font-bold text-[#fffaf2] shadow-[0_6px_16px_-10px_#bf4633]">
            <RiMicLine className="size-4" />
            Start talking
          </span>
        </div>
      </section>
    </div>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#f7f3ed] text-[#171616] selection:bg-[#e95f45]/30 dark:bg-[#1f1c1a] dark:text-[#f8f1e8]">
      <SiteHeader />

      <section className="relative px-5 pt-20 pb-24 sm:px-8 sm:pt-28 lg:pt-32 lg:pb-32">
        <div className="pointer-events-none absolute top-8 left-1/2 h-[32rem] w-[47rem] -translate-x-1/2 rounded-full bg-[#e95f45]/[0.08] blur-3xl dark:bg-[#e95f45]/[0.12]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(25rem,0.85fr)] lg:gap-10">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.17em] text-[#b34d3b] uppercase dark:text-[#f39b87]">
              <span className="size-2 rounded-full bg-[#e95f45] shadow-[0_0_0_5px_rgba(233,95,69,0.12)]" />
              Voice companion for the web
            </p>
            <h1 className="mt-6 text-[clamp(3.15rem,8vw,6.4rem)] leading-[0.91] font-semibold tracking-[-0.085em] text-balance">
              The web has a lot to say.
              <span className="block text-[#9a766d] dark:text-[#d3aca1]">
                Talk back.
              </span>
            </h1>
            <p className="mt-7 max-w-[32rem] text-base leading-7 text-[#5d5853] sm:text-lg dark:text-[#c9c0b6]">
              Bakbak is a voice companion that understands the page in front of
              you — so a question, a thought, or a useful detail is always
              within reach.
            </p>
            <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="xl"
                className="h-12 rounded-full border-[#e95f45] bg-[#e95f45] px-5 text-[#fffaf2] shadow-[0_14px_26px_-18px_#bf4633] hover:bg-[#bf4633]"
              >
                <Link href="/login">
                  Start a conversation
                  <RiArrowRightLine className="size-4" />
                </Link>
              </Button>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center gap-2 px-3 text-sm font-semibold text-[#5d5853] transition-colors hover:text-[#171616] dark:text-[#c9c0b6] dark:hover:text-[#f8f1e8]"
              >
                See how it works
                <RiArrowDownLine className="size-4" />
              </a>
            </div>
            <div className="mt-10 flex items-center gap-2 text-xs text-[#756e68] dark:text-[#c9c0b6]">
              <RiLock2Line className="size-3.5 text-[#b34d3b] dark:text-[#f39b87]" />
              Your mic only starts when you choose to speak.
            </div>
          </div>

          <VoicePreview />
        </div>
      </section>

      <section className="border-y border-[#d8cfc4] bg-[#eee8df]/55 px-5 py-7 sm:px-8 dark:border-[#4c433e] dark:bg-[#24211f]/60">
        <div className="mx-auto grid max-w-6xl gap-7 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[#d8cfc4] dark:sm:divide-[#4c433e]">
          <div className="flex items-center gap-3 sm:pr-8">
            <span className="grid size-9 place-items-center rounded-full bg-[#e95f45]/12 text-[#b34d3b] dark:text-[#f39b87]">
              <RiSparkling2Line className="size-[18px]" />
            </span>
            <p className="text-sm font-semibold tracking-[-0.02em]">
              Built for the page you are on
            </p>
          </div>
          <div className="flex items-center gap-3 sm:px-8">
            <span className="grid size-9 place-items-center rounded-full bg-[#e95f45]/12 text-[#b34d3b] dark:text-[#f39b87]">
              <RiVolumeUpLine className="size-[18px]" />
            </span>
            <p className="text-sm font-semibold tracking-[-0.02em]">
              Natural conversation, in voice
            </p>
          </div>
          <div className="flex items-center gap-3 sm:pl-8">
            <span className="grid size-9 place-items-center rounded-full bg-[#e95f45]/12 text-[#b34d3b] dark:text-[#f39b87]">
              <RiLock2Line className="size-[18px]" />
            </span>
            <p className="text-sm font-semibold tracking-[-0.02em]">
              You are always in control
            </p>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-8 px-5 py-24 sm:px-8 sm:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 border-b border-[#d8cfc4] pb-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end dark:border-[#4c433e]">
            <p className="text-[11px] font-bold tracking-[0.17em] text-[#b34d3b] uppercase dark:text-[#f39b87]">
              A conversation, not a detour
            </p>
            <h2 className="max-w-[18ch] text-[clamp(2.45rem,5vw,4.25rem)] leading-[0.95] font-semibold tracking-[-0.07em]">
              Let curiosity lead the way.
            </h2>
          </div>
          <div className="grid gap-12 pt-12 md:grid-cols-3 md:gap-10">
            {moments.map((moment) => (
              <article key={moment.number} className="group">
                <p className="font-mono text-xs text-[#b34d3b] dark:text-[#f39b87]">
                  {moment.number}
                </p>
                <h3 className="mt-7 text-xl font-semibold tracking-[-0.04em]">
                  {moment.label}
                </h3>
                <p className="mt-3 max-w-[28ch] text-sm leading-6 text-[#5d5853] dark:text-[#c9c0b6]">
                  {moment.detail}
                </p>
                <div className="mt-7 h-px w-12 bg-[#d8cfc4] transition-all duration-300 group-hover:w-20 group-hover:bg-[#e95f45] dark:bg-[#4c433e]" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.25rem] bg-[#24201e] px-6 py-14 text-[#f8f1e8] sm:px-12 sm:py-16 lg:flex lg:items-end lg:justify-between lg:gap-12">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold tracking-[0.17em] text-[#f39b87] uppercase">
              Make the page yours
            </p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,4.4rem)] leading-[0.94] font-semibold tracking-[-0.075em]">
              Stay with the thought, not the tab.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#c9c0b6]">
              Sign in to begin using Bakbak with the browser extension — your
              small voice companion for the pages that make you pause.
            </p>
          </div>
          <Button
            asChild
            size="xl"
            className="mt-9 h-12 shrink-0 rounded-full border-[#e95f45] bg-[#e95f45] px-5 text-[#fffaf2] shadow-[0_14px_28px_-18px_#000] hover:bg-[#bf4633] lg:mt-0"
          >
            <Link href="/login">
              Try Bakbak
              <RiPlayCircleLine className="size-[18px]" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-[#d8cfc4] px-5 py-8 sm:px-8 dark:border-[#4c433e]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-xs text-[#756e68] sm:flex-row sm:items-center sm:justify-between dark:text-[#c9c0b6]">
          <Link
            href="/"
            className="w-fit text-sm font-bold tracking-[-0.04em] text-[#24201e] dark:text-[#f8f1e8]"
          >
            Bakbak
          </Link>
          <p>Talk to the web, without leaving it.</p>
        </div>
      </footer>
    </main>
  )
}
