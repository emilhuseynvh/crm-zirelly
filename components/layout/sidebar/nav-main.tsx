"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import {
  ClipboardListIcon,
  LayoutDashboardIcon,
  ScrollTextIcon,
  ShieldIcon,
  TrendingUpIcon,
  UsersIcon,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, canAccess } from "@/lib/crm";
import type { CrmSection, User } from "@/lib/api/types";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  section: CrmSection | "users";
};

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon, section: "dashboard" },
  { title: "Sifarişlər", href: "/dashboard/orders", icon: ClipboardListIcon, section: "orders" },
  { title: "Müştərilər", href: "/dashboard/contacts", icon: UsersIcon, section: "contacts" },
  { title: "Hesabatlar", href: "/dashboard/reports", icon: TrendingUpIcon, section: "reports" },
  { title: "İstifadəçilər", href: "/dashboard/users", icon: ShieldIcon, section: "users" },
  { title: "Audit log", href: "/dashboard/audit", icon: ScrollTextIcon, section: "audit" }
];

export function NavMain() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.section === "users"
      ? user?.role === "superadmin"
      : canAccess(user, item.section),
  );

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>CRM</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                className="hover:text-foreground active:text-foreground hover:bg-[var(--primary)]/10 active:bg-[var(--primary)]/10"
                isActive={isActive(item.href)}
                tooltip={item.title}
                asChild>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
