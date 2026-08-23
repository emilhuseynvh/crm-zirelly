"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import {
  useDeleteOrderMutation,
  useGetOrderQuery,
  useUpdateOrderMutation,
  useUpdateOrderStatusMutation
} from "@/lib/api/crm";
import type { Channel, OrderStatus } from "@/lib/api/types";
import {
  CHANNEL_LABELS,
  STATUS_DOT,
  STATUS_LABELS,
  formatDateTime,
  formatMoney,
  getStoredUser
} from "@/lib/crm";
import { useRouter } from "next/navigation";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const orderId = Number(id);
  const router = useRouter();

  const { data, isLoading } = useGetOrderQuery(orderId, { skip: Number.isNaN(orderId) });
  const [updateOrder, { isLoading: saving }] = useUpdateOrderMutation();
  const [updateStatus] = useUpdateOrderStatusMutation();
  const [deleteOrder] = useDeleteOrderMutation();

  const order = data?.data;

  const [channel, setChannel] = useState<Channel>("website");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [discount, setDiscount] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    setIsSuperadmin(getStoredUser()?.role === "superadmin");
  }, []);

  useEffect(() => {
    if (!order) return;
    setChannel(order.channel);
    setDeliveryFee(String(order.delivery_fee ?? 0));
    setDiscount(String(order.discount_amount ?? 0));
    setAddress(order.address ?? "");
    setNote(order.note ?? "");
  }, [order]);

  if (isLoading) return <p className="text-muted-foreground">Yüklənir...</p>;
  if (!order) return <p className="text-muted-foreground">Sifariş tapılmadı.</p>;

  const handleSave = async () => {
    try {
      await updateOrder({
        id: order.id,
        channel,
        delivery_fee: Number(deliveryFee) || 0,
        discount_amount: Number(discount) || 0,
        address: address || null,
        note: note || null
      }).unwrap();
      toast.success("Sifariş yeniləndi.");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Yeniləmə alınmadı.");
    }
  };

  const handleStatus = async (next: OrderStatus) => {
    try {
      await updateStatus({ id: order.id, status: next }).unwrap();
      toast.success(`Status: ${STATUS_LABELS[next]}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Status dəyişdirilə bilmədi.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrder(order.id).unwrap();
      toast.success("Sifariş arxivləşdirildi.");
      router.push("/dashboard/orders");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Silinmə alınmadı.");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title={`Sifariş #${order.id}`}
          description={`${CHANNEL_LABELS[order.channel]} · ${formatDateTime(order.created_at)}`}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeftIcon />
              Geri
            </Link>
          </Button>
          {isSuperadmin && (
            <ConfirmDelete
              onConfirm={handleDelete}
              title="Sifarişi arxivləşdirmək istəyirsiniz?"
              description="Sifariş siyahıdan çıxarılacaq (soft delete). Bu əməliyyat audit log-da qeyd olunur."
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Məhsullar</CardTitle>
            <Select value={order.status} onValueChange={(v) => handleStatus(v as OrderStatus)}>
              <SelectTrigger size="sm" className="w-56">
                <span className="flex items-center gap-2">
                  <span className={`size-2 shrink-0 rounded-full ${STATUS_DOT[order.status]}`} />
                  {STATUS_LABELS[order.status]}
                </span>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className={`mr-1 inline-block size-2 rounded-full ${STATUS_DOT[s]}`} />
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 border-b pb-2 text-sm last:border-0">
                  <span className="min-w-0 truncate">
                    {item.title}
                    <span className="text-muted-foreground"> × {item.quantity}</span>
                  </span>
                  <span className="shrink-0 font-medium">{formatMoney(item.line_total)}</span>
                </div>
              ))}
            </div>

            <div className="text-muted-foreground mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Ara cəm</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span>
                    Endirim{order.promocode_code ? ` (${order.promocode_code})` : ""}
                  </span>
                  <span>−{formatMoney(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Çatdırılma</span>
                <span>{formatMoney(order.delivery_fee)}</span>
              </div>
              <div className="text-foreground flex justify-between border-t pt-2 text-base font-semibold">
                <span>Yekun</span>
                <span>{formatMoney(order.grand_total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Müştəri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="font-medium">{order.customer ?? "—"}</div>
            <div className="text-muted-foreground">{order.phone ?? "—"}</div>
            <div className="text-muted-foreground">{order.email ?? "—"}</div>
            {order.contact_id && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/contacts/${order.contact_id}`}>Müştəri kartı</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sifariş məlumatları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Satış kanalı</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CHANNEL_LABELS) as Channel[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {CHANNEL_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Endirim (₼)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Çatdırılma (₼)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Ünvan</Label>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Qeyd</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>

            <Button onClick={handleSave} disabled={saving}>
              <SaveIcon />
              {saving ? "Yadda saxlanır..." : "Yadda saxla"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status tarixçəsi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.status_history?.map((entry) => (
              <div key={entry.id} className="border-b pb-2 text-sm last:border-0">
                <div className="flex items-center gap-2">
                  {entry.from_status && (
                    <>
                      <Badge variant="outline">{STATUS_LABELS[entry.from_status]}</Badge>
                      <span className="text-muted-foreground">→</span>
                    </>
                  )}
                  <Badge>{STATUS_LABELS[entry.to_status]}</Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatDateTime(entry.created_at)} ·{" "}
                  {entry.changed_by ?? (entry.source === "system" ? "Sistem" : entry.source)}
                </p>
              </div>
            ))}
            {(order.status_history?.length ?? 0) === 0 && (
              <p className="text-muted-foreground text-sm">Tarixçə boşdur.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
