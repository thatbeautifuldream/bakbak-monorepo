import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import AnalyticsDashboard from "./analytics-dashboard"

export const metadata: Metadata = {
  title: "Analytics · Bakbak",
  description: "Aggregate Bakbak extension activity analytics.",
}

export default function AnalyticsPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <AnalyticsDashboard />
    </main>
  )
}
