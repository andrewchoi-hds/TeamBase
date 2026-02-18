"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useNotificationStore } from "@/stores/notification-store";
import {
  LayoutDashboard,
  ClipboardCheck,
  MessageSquare,
  Target,
  Calendar,
  Users,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Role } from "@/types";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: Role[];
  badge?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const role = session?.user?.role;

  const navItems: NavItem[] = [
    {
      title: "대시보드",
      href: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "평가",
      href: "/reviews",
      icon: <ClipboardCheck className="h-5 w-5" />,
    },
    {
      title: "피드백",
      href: "/feedback",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "목표(OKR)",
      href: "/objectives",
      icon: <Target className="h-5 w-5" />,
    },
    {
      title: "1:1 미팅",
      href: "/meetings",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "팀 관리",
      href: "/team",
      icon: <Users className="h-5 w-5" />,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      title: "알림",
      href: "/notifications",
      icon: <Bell className="h-5 w-5" />,
      badge: unreadCount,
    },
    {
      title: "관리자",
      href: "/admin",
      icon: <Settings className="h-5 w-5" />,
      roles: ["ADMIN"],
    },
  ];

  const filteredItems = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300",
          sidebarCollapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              TB
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg">TeamBase</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
              >
                {item.icon}
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[11px] text-destructive-foreground px-1">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : null}
                  </>
                )}
                {sidebarCollapsed && item.badge ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground px-0.5">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </Link>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <div className="relative">{linkContent}</div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
