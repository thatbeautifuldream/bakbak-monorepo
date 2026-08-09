"use client"

import { useRouter } from "next/navigation"
import { RiCompassLine } from "@remixicon/react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const router = useRouter()

  return (
    <AppShell>
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <RiCompassLine size={24} className="text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-balance">
          Page not found
        </h2>
        <p className="max-w-[48ch] text-base/7 text-pretty text-muted-foreground sm:text-sm/6">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard")}
        >
          Go to dashboard
        </Button>
      </div>
    </AppShell>
  )
}
