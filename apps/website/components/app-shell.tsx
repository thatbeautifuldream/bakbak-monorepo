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
      <div className="flex min-h-dvh items-center justify-center bg-[#f7f3ed] dark:bg-[#1f1c1a]">
        <div className="grid size-11 place-items-center rounded-2xl bg-[#e95f45] text-[#fffaf2] shadow-[0_14px_30px_-18px_#bf4633]">
          <Spinner />
        </div>
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
      <SidebarInset className="bg-[#f7f3ed] dark:bg-[#1f1c1a]">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
