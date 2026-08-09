"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { signOut, useSession } from "@/lib/auth-client"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { RiHome5Line, RiSparkling2Line } from "@remixicon/react"

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Your space", url: "/dashboard", icon: RiHome5Line }],
  },
]

function isActive(currentPath: string, itemUrl: string) {
  if (itemUrl === "/") return currentPath === "/"
  return currentPath === itemUrl || currentPath.startsWith(`${itemUrl}/`)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() ?? "/"
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  const user = session
    ? {
        name: session.user.name ?? "User",
        email: session.user.email,
        initials: (session.user.name ?? session.user.email)[0].toUpperCase(),
      }
    : null

  const handleSignOut = async () => {
    await signOut()
    queryClient.clear()
    router.replace("/login")
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      className="[--sidebar-accent-foreground:#24201e] [--sidebar-accent:#eee8df] [--sidebar-border:#d8cfc4] [--sidebar-foreground:#24201e] [--sidebar:#f7f3ed] dark:[--sidebar-accent-foreground:#f8f1e8] dark:[--sidebar-accent:#302b28] dark:[--sidebar-border:#4c433e] dark:[--sidebar-foreground:#f8f1e8] dark:[--sidebar:#24211f]"
      {...props}
    >
      <SidebarHeader>
        <div className="px-2 py-1.5">
          <Link
            href="/dashboard"
            aria-label="BakBak home"
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <span className="grid size-7 place-items-center rounded-[9px] bg-[#e95f45] text-xs font-bold tracking-[-0.08em] text-[#fffaf2]">
              b
            </span>
            <span className="text-sm font-bold tracking-[-0.05em]">bakbak</span>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="pt-2">
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive(pathname, item.url)}
                    >
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        <div className="mx-3 mt-5 rounded-2xl border border-[#d8cfc4] bg-[#fffaf2] p-3.5 dark:border-[#4c433e] dark:bg-[#302b28]">
          <RiSparkling2Line className="size-4 text-[#b34d3b] dark:text-[#f39b87]" />
          <p className="mt-3 text-xs font-semibold tracking-[-0.02em]">
            Ready to listen
          </p>
          <p className="mt-1 text-[11px] leading-4 text-sidebar-foreground/65">
            Open any page, then start a conversation when you need one.
          </p>
        </div>
      </SidebarContent>

      <SidebarFooter>
        {user && <NavUser user={user} onSignOut={handleSignOut} />}
      </SidebarFooter>
    </Sidebar>
  )
}
