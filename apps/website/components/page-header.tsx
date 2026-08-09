"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export type PageHeaderProps = {
  title: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-[calc(var(--header-height)+env(safe-area-inset-top))] shrink-0 items-center gap-3 border-b border-[#d8cfc4] bg-[#f7f3ed]/92 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-lg lg:px-6 dark:border-[#4c433e] dark:bg-[#1f1c1a]/92",
        className
      )}
    >
      <SidebarTrigger className="-ml-1" />
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
          {title}
        </h1>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  )
}
