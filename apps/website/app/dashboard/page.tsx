"use client"

import { useQuery } from "@tanstack/react-query"
import {
  RiArrowRightLine,
  RiCheckboxCircleFill,
  RiLock2Line,
  RiMicLine,
  RiSparkling2Line,
} from "@remixicon/react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { QO } from "@/lib/react-query/query-options"

export default function DashboardPage() {
  const { data: user } = useQuery({ ...QO.User() })

  return (
    <AppShell>
      <PageHeader title="Your space" />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <section className="grid gap-10 border-b border-[#d8cfc4] pb-11 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.62fr)] lg:items-end dark:border-[#4c433e]">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.17em] text-[#b34d3b] uppercase dark:text-[#f39b87]">
                <span className="size-2 rounded-full bg-[#e95f45] shadow-[0_0_0_5px_rgba(233,95,69,0.12)]" />
                Your Bakbak space
              </p>
              <h1 className="mt-5 text-[clamp(2.6rem,5vw,4.35rem)] leading-[0.94] font-semibold tracking-[-0.075em]">
                Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#5d5853] dark:text-[#c9c0b6]">
                Your companion is ready for the next page that makes you pause.
                Open it, ask what is on your mind, and carry on.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-[#d8cfc4] bg-[#fffaf2] p-5 dark:border-[#4c433e] dark:bg-[#302b28]">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-[#e95f45] text-[#fffaf2] shadow-[0_8px_20px_-12px_#bf4633]">
                  <RiMicLine className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold tracking-[-0.02em]">
                    Ready when you are
                  </p>
                  <p className="mt-0.5 text-xs text-[#756e68] dark:text-[#c9c0b6]">
                    Start from any page in your browser.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
            <div className="rounded-[1.75rem] bg-[#24201e] p-6 text-[#f8f1e8] sm:p-8">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#e95f45] text-[#fffaf2]">
                <RiSparkling2Line className="size-5" />
              </div>
              <h2 className="mt-8 max-w-[17ch] text-3xl leading-[0.98] font-semibold tracking-[-0.065em]">
                Keep your curiosity in the same tab.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[#c9c0b6]">
                Bakbak understands the page already in front of you. Ask for
                clarity, a fact, or a different way to think about it — in your
                own words.
              </p>
              <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-[#f39b87]">
                Open a page and start talking
                <RiArrowRightLine className="size-4" />
              </div>
            </div>

            <aside className="border-l-0 border-[#d8cfc4] pt-1 lg:border-l lg:pl-8 dark:border-[#4c433e]">
              <p className="text-[11px] font-bold tracking-[0.17em] text-[#b34d3b] uppercase dark:text-[#f39b87]">
                Always on your terms
              </p>
              <div className="mt-6 space-y-5">
                <div className="flex gap-3">
                  <RiCheckboxCircleFill className="mt-0.5 size-4 shrink-0 text-[#e95f45]" />
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.02em]">
                      Page-aware by design
                    </p>
                    <p className="mt-1 text-sm leading-5 text-[#5d5853] dark:text-[#c9c0b6]">
                      No need to retell what you were reading.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <RiLock2Line className="mt-0.5 size-4 shrink-0 text-[#e95f45]" />
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.02em]">
                      Your voice starts it
                    </p>
                    <p className="mt-1 text-sm leading-5 text-[#5d5853] dark:text-[#c9c0b6]">
                      The microphone only starts after you choose to speak.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
