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
import { RiDashboardLine } from "@remixicon/react"

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
    items: [
      { title: "Dashboard", url: "/dashboard", icon: RiDashboardLine },
    ],
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
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <div className="px-2 py-1.5">
          <Link
            href="/dashboard"
            aria-label="Homepage"
            className="flex items-center rounded-md px-2 py-1 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <span className="text-sm font-semibold tracking-tight">Forge</span>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
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

      </SidebarContent>

      <SidebarFooter>
        {user && <NavUser user={user} onSignOut={handleSignOut} />}
      </SidebarFooter>
    </Sidebar>
  )
}
