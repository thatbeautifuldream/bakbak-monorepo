"use client"

import { useQuery } from "@tanstack/react-query"
import { RiCornerDownRightLine, RiMicLine } from "@remixicon/react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { QO } from "@/lib/react-query/query-options"

const terms = [
  {
    label: "Page-aware by design",
    detail: "You never have to retell Bakbak what you were reading.",
  },
  {
    label: "Your voice starts it",
    detail: "The microphone only opens after you choose to speak.",
  },
  {
    label: "Actions are written down",
    detail:
      "When Bakbak scrolls, clicks, or fills a field, it records that in the transcript.",
  },
]

export default function DashboardPage() {
  const { data: user } = useQuery({ ...QO.User() })

  return (
    <AppShell>
      <PageHeader title="Your space" />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-4 max-w-[64ch] text-base/7 text-pretty text-muted-foreground">
            Bakbak is ready for the next page that makes you pause. Open the
            extension on any page, ask what is on your mind, and carry on.
          </p>

          <div className="mt-8 flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <RiMicLine className="size-4 shrink-0 text-muted-foreground" />
            <p className="flex-1 text-sm">
              Start from the Bakbak button in your browser toolbar.
            </p>
          </div>

          <h2 className="mt-14 text-lg font-medium">Always on your terms</h2>
          <dl className="mt-4 grid gap-x-10 gap-y-6 border-t border-border pt-6 sm:grid-cols-3">
            {terms.map((term) => (
              <div key={term.label}>
                <dt className="flex items-start gap-2 text-sm font-medium">
                  <RiCornerDownRightLine className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  {term.label}
                </dt>
                <dd className="mt-1.5 max-w-[40ch] text-sm/6 text-pretty text-muted-foreground">
                  {term.detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </AppShell>
  )
}
