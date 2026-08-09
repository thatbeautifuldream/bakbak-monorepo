"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const session = useSession()

  useEffect(() => {
    if (!session.isPending && !session.data) {
      router.replace("/login")
    }
  }, [router, session.data, session.isPending])

  if (!session.data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner className="text-muted-foreground" />
      </div>
    )
  }

  return (
    <SidebarProvider
      className="h-svh"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-background">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
