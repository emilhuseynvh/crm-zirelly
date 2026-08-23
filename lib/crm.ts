import type { Channel, CrmSection, OrderStatus, User } from "@/lib/api/types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Gözləyir",
  paid: "Yeni sifariş",
  preparing: "Çatdırılmaya hazırlanır",
  shipped: "Çatdırılmaya verildi",
  delivered: "Çatdırıldı",
  returned: "Qaytarıldı",
  cancelled: "Ləğv edilib"
};

export const STATUS_DOT: Record<OrderStatus, string> = {
  pending: "bg-amber-500",
  paid: "bg-sky-500",
  preparing: "bg-blue-500",
  shipped: "bg-indigo-500",
  delivered: "bg-green-500",
  returned: "bg-orange-500",
  cancelled: "bg-red-500"
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  website: "Sayt",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  phone: "Telefon",
  other: "Digər"
};

export const SECTION_LABELS: Record<CrmSection, string> = {
  dashboard: "Dashboard",
  orders: "Sifarişlər",
  contacts: "Müştərilər",
  reports: "Hesabatlar",
  audit: "Audit log"
};

export const SECTION_ROUTES: Record<CrmSection, string> = {
  dashboard: "/dashboard",
  orders: "/dashboard/orders",
  contacts: "/dashboard/contacts",
  reports: "/dashboard/reports",
  audit: "/dashboard/audit"
};

export function canAccess(user: User | null, section: CrmSection): boolean {
  if (!user) return false;
  if (user.role === "superadmin") return true;
  return user.permissions?.includes(section) ?? false;
}

export function homeRouteFor(user: User): string {
  if (user.role === "superadmin" || canAccess(user, "dashboard")) return "/dashboard";

  const first = (Object.keys(SECTION_ROUTES) as CrmSection[]).find((s) => canAccess(user, s));

  return first ? SECTION_ROUTES[first] : "/dashboard";
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("user");

  if (!stored) return null;

  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export const formatMoney = (value: number) => `${Number(value ?? 0).toFixed(2)} ₼`;

export const formatDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("az-AZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "—";

export const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("az-AZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    : "—";
