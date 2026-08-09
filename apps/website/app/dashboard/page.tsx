"use client"

import { useQuery } from "@tanstack/react-query"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { QO } from "@/lib/react-query/query-options"

export default function DashboardPage() {
  const { data: user } = useQuery({ ...QO.User() })

  return (
    <AppShell>
      <PageHeader title="Dashboard" />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 lg:p-8">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Welcome{user?.name ? `, ${user.name}` : ""}</EmptyTitle>
              <EmptyDescription>
                Build your dashboard here. Wire endpoints through
                <code className="mx-1 rounded bg-muted px-1 text-xs">@repo/api-client</code>
                and add query options to
                <code className="mx-1 rounded bg-muted px-1 text-xs">lib/react-query/query-options.ts</code>.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </div>
    </AppShell>
  )
}
