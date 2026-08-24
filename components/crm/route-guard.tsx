"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMeQuery } from "@/lib/api/auth";
import type { CrmSection } from "@/lib/api/types";
import { canAccess, homeRouteFor } from "@/lib/crm";

type GuardSection = CrmSection | "users" | "trash";

function sectionFor(pathname: string): GuardSection | null {
  if (pathname.startsWith("/dashboard/orders")) return "orders";
  if (pathname.startsWith("/dashboard/contacts")) return "contacts";
  if (pathname.startsWith("/dashboard/reports")) return "reports";
  if (pathname.startsWith("/dashboard/audit")) return "audit";
  if (pathname.startsWith("/dashboard/users")) return "users";
  if (pathname.startsWith("/dashboard/trash")) return "trash";
  if (pathname === "/dashboard") return "dashboard";
  return null;
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data, isLoading } = useMeQuery();
  const user = data?.data ?? null;

  useEffect(() => {
    if (data?.data) {
      localStorage.setItem("user", JSON.stringify(data.data));
    }
  }, [data]);

  if (isLoading || !user) {
    return <>{children}</>;
  }

  const section = sectionFor(pathname);

  const allowed =
    section === null
      ? true
      : section === "users" || section === "trash"
        ? user.role === "superadmin"
        : canAccess(user, section);

  if (!allowed) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldAlertIcon className="text-destructive size-14" />
        <h1 className="text-2xl font-bold">403 — İcazə yoxdur</h1>
        <p className="text-muted-foreground max-w-md">
          Bu bölməyə giriş icazəniz yoxdur. İcazə lazımdırsa, superadmin ilə əlaqə
          saxlayın.
        </p>
        <Button asChild>
          <Link href={homeRouteFor(user)}>Əsas səhifəyə qayıt</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
