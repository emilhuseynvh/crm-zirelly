export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "returned"
  | "cancelled";

export type Channel = "website" | "instagram" | "whatsapp" | "phone" | "other";

export type CrmSection = "dashboard" | "contacts" | "orders" | "reports" | "audit";

export interface User {
  id: number;
  name: string;
  surname?: string | null;
  email: string;
  role: "superadmin" | "admin";
  permissions: CrmSection[];
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface ContactNote {
  id: number;
  body: string;
  author: string | null;
  author_id: number | null;
  created_at: string;
}

export interface Contact {
  id: number;
  user_id: number | null;
  name: string;
  surname: string | null;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  channel: Channel;
  created_via: "site" | "crm";
  orders_count: number;
  orders_total: number;
  first_order_at: string | null;
  last_order_at: string | null;
  created_at: string;
  notes?: ContactNote[];
  orders?: CrmOrder[];
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  title: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface StatusHistoryEntry {
  id: number;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  source: string;
  changed_by: string | null;
  created_at: string;
}

export interface CrmOrder {
  id: number;
  status: OrderStatus;
  channel: Channel;
  contact_id: number | null;
  customer: string | null;
  phone: string | null;
  email: string | null;
  items_count: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  delivery_fee: number;
  grand_total: number;
  promocode_code: string | null;
  address: string | null;
  note: string | null;
  paid_at: string | null;
  created_at: string;
  items?: OrderItem[];
  status_history?: StatusHistoryEntry[];
}

export interface AuditLogEntry {
  id: number;
  user: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  changes: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}

export interface ReportSummary {
  from: string;
  to: string;
  totals: {
    revenue: number;
    goods_revenue: number;
    delivery_total: number;
    discount_total: number;
    paid_orders: number;
    orders_count: number;
    average_order: number;
    delivered_count: number;
    cancelled_count: number;
    returned_count: number;
    new_customers: number;
    repeat_customers: number;
  };
  by_product: { title: string; quantity: number; revenue: number }[];
  by_channel: { channel: Channel; orders: number; revenue: number }[];
  by_status: { status: OrderStatus; count: number }[];
  by_day: { date: string; orders: number; revenue: number }[];
}

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
