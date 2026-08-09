import type { Metadata } from "next"
import AnalyticsDashboard, { type AnalyticsData } from "./analytics-dashboard"
import initialData from "../../public/analytics-data/1d.json"

export const metadata: Metadata = {
  title: "Analytics · Bakbak",
  description: "Aggregate web activity analytics presentation dashboard.",
}

export default function AnalyticsPage() {
  return <AnalyticsDashboard initialData={initialData as AnalyticsData} />
}
