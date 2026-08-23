"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeftIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

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
import {
  useCreateOrderMutation,
  useGetContactsQuery,
  useGetProductsQuery
} from "@/lib/api/crm";
import type { Channel, OrderStatus } from "@/lib/api/types";
import { CHANNEL_LABELS, STATUS_LABELS, formatMoney } from "@/lib/crm";

interface ItemRow {
  product_id: number | null;
  title: string;
  unit_price: string;
  quantity: string;
}

const EMPTY_ITEM: ItemRow = { product_id: null, title: "", unit_price: "", quantity: "1" };

export default function NewOrderPage() {
  const router = useRouter();

  const [contactSearch, setContactSearch] = useState("");
  const [contactId, setContactId] = useState<number | null>(null);
  const [channel, setChannel] = useState<Channel>("instagram");
  const [status, setStatus] = useState<OrderStatus>("paid");
  const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM }]);
  const [discount, setDiscount] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  const { data: contactsData } = useGetContactsQuery({
    search: contactSearch,
    per_page: 10
  });
  const { data: productsData } = useGetProductsQuery();
  const [createOrder, { isLoading: saving }] = useCreateOrderMutation();

  const products = productsData?.data ?? [];
  const contacts = contactsData?.data ?? [];
  const selectedContact = contacts.find((c) => c.id === contactId);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 0),
        0
      ),
    [items]
  );

  const grandTotal =
    subtotal - (Number(discount) || 0) + (Number(deliveryFee) || 0);

  const updateItem = (index: number, patch: Partial<ItemRow>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const pickProduct = (index: number, productId: string) => {
    if (productId === "free") {
      updateItem(index, { product_id: null });
      return;
    }

    const product = products.find((p) => p.id === Number(productId));

    if (product) {
      updateItem(index, {
        product_id: product.id,
        title: product.title ?? "",
        unit_price: String(product.final_price)
      });
    }
  };

  const handleSubmit = async () => {
    if (!contactId) {
      toast.error("Müştəri seçin.");
      return;
    }

    const validItems = items.filter(
      (item) => (item.title || item.product_id) && Number(item.unit_price) >= 0 && Number(item.quantity) > 0
    );

    if (validItems.length === 0) {
      toast.error("Ən azı bir məhsul əlavə edin.");
      return;
    }

    try {
      const result = await createOrder({
        contact_id: contactId,
        channel,
        status,
        items: validItems.map((item) => ({
          product_id: item.product_id,
          title: item.title || undefined,
          unit_price: Number(item.unit_price) || 0,
          quantity: Number(item.quantity) || 1
        })),
        discount_amount: Number(discount) || 0,
        delivery_fee: Number(deliveryFee) || 0,
        address: address || null,
        note: note || null
      }).unwrap();

      toast.success(`Sifariş #${result.data.id} yaradıldı.`);
      router.push(`/dashboard/orders/${result.data.id}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Sifariş yaradıla bilmədi.");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Yeni sifariş" description="Instagram, telefon və digər kanallardan manual sifariş" />
        <Button variant="outline" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeftIcon />
            Sifarişlərə qayıt
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Məhsullar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_100px_110px_40px]">
                <Select
                  value={item.product_id ? String(item.product_id) : "free"}
                  onValueChange={(v) => pickProduct(index, v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Sərbəst məhsul</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.title ?? `#${p.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={item.title}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  placeholder="Məhsulun adı"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, { unit_price: e.target.value })}
                  placeholder="Qiymət"
                />
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                  placeholder="Say"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={items.length === 1}
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}>
                  <Trash2Icon />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}>
              <PlusIcon />
              Məhsul əlavə et
            </Button>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
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
                <Label className="text-muted-foreground text-xs">Çatdırılma məbləği (₼)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                />
              </div>
            </div>

            <div className="text-muted-foreground flex justify-between border-t pt-3 text-sm">
              <span>
                Ara cəm: <b className="text-foreground">{formatMoney(subtotal)}</b>
              </span>
              <span>
                Yekun: <b className="text-foreground">{formatMoney(Math.max(0, grandTotal))}</b>
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Müştəri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Ad və ya telefonla axtar..."
              />
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setContactId(contact.id)}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      contactId === contact.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}>
                    <div className="font-medium">
                      {contact.name} {contact.surname}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {contact.phone ?? contact.email ?? "—"}
                    </div>
                  </button>
                ))}
                {contacts.length === 0 && (
                  <p className="text-muted-foreground py-2 text-sm">
                    Tapılmadı.{" "}
                    <Link href="/dashboard/contacts" className="text-primary underline">
                      Yeni müştəri yaradın
                    </Link>
                  </p>
                )}
              </div>
              {selectedContact && (
                <p className="text-muted-foreground text-xs">
                  Seçildi: <b>{selectedContact.name} {selectedContact.surname}</b>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detallar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                <Label className="text-muted-foreground text-xs">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Ünvan</Label>
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Qeyd</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={saving}>
                {saving ? "Yaradılır..." : "Sifarişi yarat"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
