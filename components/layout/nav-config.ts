import { LayoutDashboard, FolderKanban, Bot, NotebookPen, History, Bell, type LucideIcon } from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

/**
 * Satu sumber kebenaran untuk navigasi utama User.
 * Digunakan oleh UserSidebar dan MobileSidebar.
 */
export const USER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",      href: "/dashboard",      icon: LayoutDashboard },
  { label: "Workspaces",     href: "/workspaces",     icon: FolderKanban    },
  { label: "Assistant",      href: "/assistant",      icon: Bot             },
  { label: "Notes",          href: "/notes",          icon: NotebookPen     },
  { label: "History",        href: "/history",        icon: History         },
  { label: "Notifications",  href: "/notifications",  icon: Bell            },
]

