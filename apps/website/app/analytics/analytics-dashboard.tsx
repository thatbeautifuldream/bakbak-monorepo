type Range = "1d"

export type AnalyticsData = {
  range: Range
  metrics: Array<{
    label: string
    value: string
    detail: string
    change: string
  }>
  chart: {
    change: string
    points: string
    labels: string[]
  }
  categories: Array<{
    label: string
    value: number
    tone: keyof typeof tones
  }>
  sites: Array<{
    domain: string
    language: string
    visits: string
    time: string
    share: number
    trend: string
    tone: keyof typeof tones
  }>
  locations: Array<{
    label: string
    value: string
  }>
  browsers: Array<{
    label: string
    value: string
  }>
}

const tones = {
  coral: "bg-[#dc5f3e]",
  red: "bg-[#d74d4d]",
  violet: "bg-[#7564d7]",
  blue: "bg-[#3576a8]",
  amber: "bg-[#ce8b39]",
  graphite: "bg-muted-foreground/50",
}

function ShareBar({ label, value, tone }: AnalyticsData["categories"][number]) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${tones[tone]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function CompactList({ items }: { items: AnalyticsData["locations"] }) {
  return (
    <ul className="divide-y divide-border/75">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
        >
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-medium tabular-nums">{item.value}</span>
        </li>
      ))}
    </ul>
  )
}

export default function AnalyticsDashboard({
  initialData,
}: {
  initialData: AnalyticsData
}) {
  const data = initialData
  const lastPoint = data.chart.points.split(" ").at(-1)?.split(",") ?? [
    "720",
    "33",
  ]

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="border-b border-border/80">
        <header className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-xs font-bold tracking-tight text-background">
              b
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                bakbak
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Signal desk
              </p>
            </div>
          </div>
        </header>
      </div>

      <section className="border-b border-border/80 bg-muted/25">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Audience intelligence
            </p>
            <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl">
              Aggregate web activity
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              A clear view of where the network spends time, how visits change,
              and which pages are ready for conversation.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <section
          aria-label="Key metrics"
          className="grid divide-y divide-border border-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"
        >
          {data.metrics.map((metric) => (
            <article
              key={metric.label}
              className="py-6 sm:px-5 sm:py-6 sm:first:pl-0 sm:last:pr-0"
            >
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] tabular-nums">
                {metric.value}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  ↑ {metric.change}
                </span>
                <span className="text-muted-foreground">{metric.detail}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
          <article className="overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="flex flex-col gap-2 border-b px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
              <div>
                <h2 className="font-semibold tracking-tight">
                  Visits gained momentum
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Observed visits across all recognized websites
                </p>
              </div>
              <span className="w-fit rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {data.chart.change}
              </span>
            </div>
            <div className="relative px-3 pt-6 pb-4 sm:px-6">
              <div
                className="pointer-events-none absolute inset-x-6 top-6 bottom-10 flex flex-col justify-between"
                aria-hidden="true"
              >
                <span className="border-t border-dashed border-border/70" />
                <span className="border-t border-dashed border-border/70" />
                <span className="border-t border-dashed border-border/70" />
                <span className="border-t border-dashed border-border/70" />
              </div>
              <svg
                viewBox="0 0 720 180"
                className="relative h-52 w-full overflow-visible"
                role="img"
                aria-label="Visits trend over the last 24 hours"
              >
                <polyline
                  points={`${data.chart.points} 720,180 0,180`}
                  fill="currentColor"
                  className="text-[#dc5f3e]/10 dark:text-[#dc8969]/15"
                />
                <polyline
                  points={data.chart.points}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#dc5f3e]"
                />
                <circle
                  cx={lastPoint[0]}
                  cy={lastPoint[1]}
                  r="5"
                  fill="currentColor"
                  className="text-[#dc5f3e]"
                />
              </svg>
              <div className="flex justify-between px-1 text-[11px] font-medium text-muted-foreground">
                {data.chart.labels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold tracking-tight">
                  Where attention gathers
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Share of all observed visits. Publisher activity is included
                  in News &amp; media.
                </p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {data.range.toUpperCase()}
              </span>
            </div>
            <div className="mt-7 space-y-5">
              {data.categories.map((category) => (
                <ShareBar key={category.label} {...category} />
              ))}
            </div>
          </article>
        </section>

        <section className="mt-8">
          <article className="overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="flex flex-col gap-2 border-b px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
              <div>
                <h2 className="font-semibold tracking-tight">
                  Indian language publishers
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Top publisher sites by observed visits. Shares use the total
                  above and are rounded; trends compare with the prior
                  equivalent period.
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                Aggregate only
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-muted/45 text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium sm:px-6">Website</th>
                    <th className="px-4 py-3 font-medium">Language</th>
                    <th className="px-4 py-3 text-right font-medium">Visits</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Active time
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      All visits
                    </th>
                    <th className="px-5 py-3 text-right font-medium sm:px-6">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/80">
                  {data.sites.map((site, index) => (
                    <tr
                      key={site.domain}
                      className="transition-colors hover:bg-muted/35"
                    >
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="grid size-7 place-items-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{site.domain}</p>
                            <span className="mt-1 block h-1 w-20 overflow-hidden rounded-full bg-muted">
                              <span
                                className={`block h-full rounded-full ${tones[site.tone]}`}
                                style={{ width: `${site.share * 2.8}%` }}
                              />
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {site.language}
                      </td>
                      <td className="px-4 py-4 text-right font-medium tabular-nums">
                        {site.visits}
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground tabular-nums">
                        {site.time}
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground tabular-nums">
                        {site.share}%
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-emerald-700 tabular-nums sm:px-6 dark:text-emerald-400">
                        ↑ {site.trend.replace("+", "")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="mt-8 grid gap-8 md:grid-cols-2">
          <article className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold tracking-tight">
                  India-first reach
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Share of active extensions by location
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                4 states + outside India
              </span>
            </div>
            <CompactList items={data.locations} />
          </article>

          <article className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold tracking-tight">
                  Browser landscape
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Share of active extensions by browser
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Desktop
              </span>
            </div>
            <CompactList items={data.browsers} />
          </article>
        </section>

        <footer className="mt-10 border-t pt-5 text-xs leading-5 text-muted-foreground">
          Aggregate metrics only · No individual visitor records displayed
        </footer>
      </div>
    </main>
  )
}
