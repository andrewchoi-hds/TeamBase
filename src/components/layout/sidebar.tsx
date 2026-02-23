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
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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

function useNavItems() {
  const { data: session } = useSession();
  const { unreadCount } = useNotificationStore();
  const role = session?.user?.role;

  const navItems: NavItem[] = [
    { title: "대시보드", href: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
    { title: "평가", href: "/reviews", icon: <ClipboardCheck className="h-5 w-5" /> },
    { title: "피드백", href: "/feedback", icon: <MessageSquare className="h-5 w-5" /> },
    { title: "알림", href: "/notifications", icon: <Bell className="h-5 w-5" />, badge: unreadCount },
    { title: "관리", href: "/admin", icon: <Settings className="h-5 w-5" />, roles: ["ADMIN"] },
  ];

  return navItems.filter((item) => !item.roles || (role && item.roles.includes(role)));
}

function SidebarNav({ collapsed, onNavigate, variant = "desktop" }: { collapsed: boolean; onNavigate?: () => void; variant?: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const filteredItems = useNavItems();

  const isDark = variant === "desktop";

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {filteredItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        const linkContent = (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isDark
                ? isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
                : isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              collapsed && "justify-center px-2"
            )}
          >
            {item.icon}
            {!collapsed && (
              <>
                <span className="flex-1">{item.title}</span>
                {item.badge ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 text-[11px] text-white font-semibold px-1" aria-label={`${item.badge}개의 알림`}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </>
            )}
            {collapsed && item.badge ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white font-semibold px-0.5" aria-label={`${item.badge}개의 알림`}>
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </Link>
        );

        if (collapsed) {
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
  );
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop Sidebar - Dark slate background */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
          sidebarCollapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-sm shadow-sm">
              TB
            </div>
            {!sidebarCollapsed && <span className="font-bold text-lg text-white tracking-tight">TeamBase</span>}
          </Link>
        </div>

        <SidebarNav collapsed={sidebarCollapsed} variant="desktop" />

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-slate-400 hover:text-white hover:bg-white/10"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="flex h-16 items-center border-b px-4">
            <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileSidebarOpen(false)}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                TB
              </div>
              <span className="font-bold text-lg tracking-tight">TeamBase</span>
            </Link>
          </div>
          <SidebarNav collapsed={false} onNavigate={() => setMobileSidebarOpen(false)} variant="mobile" />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
