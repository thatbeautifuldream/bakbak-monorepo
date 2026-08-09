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
      {...props}
    >
      <SidebarHeader>
        <div className="px-2 py-1.5">
          <Link
            href="/dashboard"
            aria-label="Bakbak home"
            className="rounded-lg px-2 py-1.5 text-base font-semibold tracking-tight text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            Bakbak
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
        <div className="mx-3 mt-5 rounded-lg border border-border bg-card p-3.5">
          <RiSparkling2Line className="size-4 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Ready to listen</p>
          <p className="mt-1 text-xs/5 text-muted-foreground">
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
