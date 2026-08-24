import { api } from "./base";
import type {
  AuditLogEntry,
  Channel,
  Contact,
  ContactNote,
  CrmOrder,
  CrmSection,
  OrderStatus,
  Paginated,
  ReportSummary,
  User
} from "./types";

export interface DateRange {
  from?: string;
  to?: string;
}

export interface ContactsFilter extends DateRange {
  page?: number;
  per_page?: number;
  search?: string;
  channel?: Channel | "";
  created_via?: "site" | "crm" | "";
  has_orders?: "yes" | "no" | "";
  sort?: "id" | "name" | "orders_count" | "orders_total" | "last_order_at" | "created_at";
  dir?: "asc" | "desc";
}

export interface OrdersFilter extends DateRange {
  page?: number;
  per_page?: number;
  search?: string;
  status?: OrderStatus | "";
  channel?: Channel | "";
  sort?: "id" | "total" | "created_at";
  dir?: "asc" | "desc";
}

export interface AuditFilter extends DateRange {
  page?: number;
  per_page?: number;
  action?: string;
  entity_type?: string;
}

export interface OrderPayload {
  contact_id: number;
  channel: Channel;
  status: OrderStatus;
  items: {
    product_id?: number | null;
    title?: string;
    unit_price: number;
    quantity: number;
  }[];
  discount_amount?: number;
  delivery_fee?: number;
  address?: string | null;
  note?: string | null;
}

export interface ContactPayload {
  name: string;
  surname?: string | null;
  phone?: string | null;
  email?: string | null;
  birth_date?: string | null;
  channel: Channel;
}

export interface CrmUserPayload {
  name: string;
  email: string;
  password?: string;
  permissions: CrmSection[];
  is_active?: boolean;
}

export function buildParams(filter: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  return params;
}

export const crmApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReport: build.query<{ data: ReportSummary }, DateRange>({
      query: (range) => `crm/dashboard?${buildParams({ ...range }).toString()}`,
      providesTags: ["Report"]
    }),
    checkContactPhone: build.query<
      { data: { id: number; name: string; phone: string; email: string | null } | null },
      { phone: string; except?: number }
    >({
      query: (args) => `crm/contacts/check-phone?${buildParams({ ...args }).toString()}`
    }),
    getContacts: build.query<Paginated<Contact>, ContactsFilter>({
      query: (filter) => `crm/contacts?${buildParams({ ...filter }).toString()}`,
      providesTags: ["Contacts"]
    }),
    getContact: build.query<{ data: Contact }, number>({
      query: (id) => `crm/contacts/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Contact", id }]
    }),
    createContact: build.mutation<{ data: Contact }, ContactPayload>({
      query: (body) => ({ url: "crm/contacts", method: "POST", body }),
      invalidatesTags: ["Contacts"]
    }),
    updateContact: build.mutation<{ data: Contact }, { id: number } & ContactPayload>({
      query: ({ id, ...body }) => ({ url: `crm/contacts/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => ["Contacts", { type: "Contact", id }]
    }),
    deleteContact: build.mutation<{ message: string }, number>({
      query: (id) => ({ url: `crm/contacts/${id}`, method: "DELETE" }),
      invalidatesTags: ["Contacts"]
    }),
    addContactNote: build.mutation<{ data: ContactNote }, { id: number; body: string }>({
      query: ({ id, body }) => ({
        url: `crm/contacts/${id}/notes`,
        method: "POST",
        body: { body }
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Contact", id }]
    }),
    updateContactNote: build.mutation<
      { data: ContactNote },
      { id: number; noteId: number; body: string }
    >({
      query: ({ id, noteId, body }) => ({
        url: `crm/contacts/${id}/notes/${noteId}`,
        method: "PUT",
        body: { body }
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Contact", id }]
    }),
    deleteContactNote: build.mutation<{ message: string }, { id: number; noteId: number }>({
      query: ({ id, noteId }) => ({
        url: `crm/contacts/${id}/notes/${noteId}`,
        method: "DELETE"
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Contact", id }]
    }),
    getOrders: build.query<Paginated<CrmOrder>, OrdersFilter>({
      query: (filter) => `crm/orders?${buildParams({ ...filter }).toString()}`,
      providesTags: ["Orders"]
    }),
    getOrder: build.query<{ data: CrmOrder }, number>({
      query: (id) => `crm/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Order", id }]
    }),
    createOrder: build.mutation<{ data: CrmOrder }, OrderPayload>({
      query: (body) => ({ url: "crm/orders", method: "POST", body }),
      invalidatesTags: ["Orders", "Report", "Contacts"]
    }),
    updateOrder: build.mutation<{ data: CrmOrder }, { id: number } & Partial<OrderPayload>>({
      query: ({ id, ...body }) => ({ url: `crm/orders/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => ["Orders", "Report", { type: "Order", id }]
    }),
    updateOrderStatus: build.mutation<{ data: CrmOrder }, { id: number; status: OrderStatus }>({
      query: ({ id, status }) => ({
        url: `crm/orders/${id}/status`,
        method: "PUT",
        body: { status }
      }),
      invalidatesTags: (_r, _e, { id }) => ["Orders", "Report", { type: "Order", id }]
    }),
    deleteOrder: build.mutation<{ message: string }, number>({
      query: (id) => ({ url: `crm/orders/${id}`, method: "DELETE" }),
      invalidatesTags: ["Orders", "Report"]
    }),
    getCrmUsers: build.query<{ data: User[] }, void>({
      query: () => "crm/users",
      providesTags: ["Users"]
    }),
    createCrmUser: build.mutation<{ data: User }, CrmUserPayload>({
      query: (body) => ({ url: "crm/users", method: "POST", body }),
      invalidatesTags: ["Users"]
    }),
    updateCrmUser: build.mutation<{ data: User }, { id: number } & Partial<CrmUserPayload>>({
      query: ({ id, ...body }) => ({ url: `crm/users/${id}`, method: "PUT", body }),
      invalidatesTags: ["Users"]
    }),
    deleteCrmUser: build.mutation<{ message: string }, number>({
      query: (id) => ({ url: `crm/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["Users"]
    }),
    getTrashedContacts: build.query<Paginated<Contact>, { page?: number }>({
      query: (f) => `crm/trash/contacts?${buildParams({ ...f }).toString()}`,
      providesTags: ["Contacts"]
    }),
    getTrashedOrders: build.query<Paginated<CrmOrder>, { page?: number }>({
      query: (f) => `crm/trash/orders?${buildParams({ ...f }).toString()}`,
      providesTags: ["Orders"]
    }),
    restoreContact: build.mutation<{ data: Contact }, number>({
      query: (id) => ({ url: `crm/trash/contacts/${id}/restore`, method: "POST" }),
      invalidatesTags: ["Contacts", "Report"]
    }),
    restoreOrder: build.mutation<{ data: CrmOrder }, number>({
      query: (id) => ({ url: `crm/trash/orders/${id}/restore`, method: "POST" }),
      invalidatesTags: ["Orders", "Report"]
    }),
    getAuditLogs: build.query<Paginated<AuditLogEntry>, AuditFilter>({
      query: (filter) => `crm/audit-logs?${buildParams({ ...filter }).toString()}`,
      providesTags: ["Audit"]
    }),
    getProducts: build.query<
      Paginated<{ id: number; title: string | null; final_price: number }>,
      void
    >({
      query: () => "products?active=1&per_page=100"
    })
  })
});

export const {
  useGetReportQuery,
  useGetContactsQuery,
  useLazyCheckContactPhoneQuery,
  useGetContactQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useAddContactNoteMutation,
  useUpdateContactNoteMutation,
  useDeleteContactNoteMutation,
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
  useGetCrmUsersQuery,
  useCreateCrmUserMutation,
  useUpdateCrmUserMutation,
  useDeleteCrmUserMutation,
  useGetTrashedContactsQuery,
  useGetTrashedOrdersQuery,
  useRestoreContactMutation,
  useRestoreOrderMutation,
  useGetAuditLogsQuery,
  useGetProductsQuery
} = crmApi;
