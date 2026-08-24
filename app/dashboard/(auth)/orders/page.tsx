"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DownloadIcon, EyeIcon, FilterXIcon, PlusIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { API_BASE, getToken } from "@/lib/api/base";
import {
  buildParams,
  useDeleteOrderMutation,
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
  type OrdersFilter
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

export default function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [channel, setChannel] = useState<Channel | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  const [updateStatus] = useUpdateOrderStatusMutation();
  const [deleteOrder] = useDeleteOrderMutation();

  useEffect(() => {
    setIsSuperadmin(getStoredUser()?.role === "superadmin");
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await deleteOrder(id).unwrap();
      toast.success(`Sifariş #${id} zibil qutusuna atıldı.`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Silinmə alınmadı.");
    }
  };

  const filter: OrdersFilter = useMemo(
    () => ({ page, per_page: 20, status, channel, search, from, to }),
    [page, status, channel, search, from, to]
  );

  const { data, isLoading, isFetching } = useGetOrdersQuery(filter);

  const hasFilters = Boolean(status || channel || search || from || to);

  const resetFilters = () => {
    setStatus("");
    setChannel("");
    setSearch("");
    setSearchInput("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const handleStatusChange = async (id: number, next: OrderStatus) => {
    try {
      await updateStatus({ id, status: next }).unwrap();
      toast.success(`#${id} → ${STATUS_LABELS[next]}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Status dəyişdirilə bilmədi.");
    }
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      const params = buildParams({ status, channel, search, from, to });
      const token = getToken();
      const response = await fetch(`${API_BASE}/crm/orders/export?${params.toString()}`, {
        headers: {
          Accept: "text/csv",
          ...(token ? { Authorization: `Bearer ${decodeURIComponent(token)}` } : {})
        }
      });

      if (!response.ok) throw new Error(String(response.status));

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `crm-sifarisler-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export alınmadı.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Sifarişlər" description="Bütün kanallar üzrə sifariş axını" />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <DownloadIcon />
            {exporting ? "Hazırlanır..." : "CSV export"}
          </Button>
          <Button asChild>
            <Link href="/dashboard/orders/new">
              <PlusIcon />
              Yeni sifariş
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={status === "" ? "default" : "outline"}
          onClick={() => {
            setStatus("");
            setPage(1);
          }}>
          Hamısı
        </Button>
        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={status === s ? "default" : "outline"}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}>
            <span className={`size-2 rounded-full ${STATUS_DOT[s]}`} />
            {STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
            className="flex flex-wrap items-center gap-2 pb-4">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Sifariş #, müştəri, telefon..."
              className="max-w-60"
            />
            <Button type="submit" variant="outline" size="icon">
              <SearchIcon />
            </Button>

            <Select
              value={channel || "all"}
              onValueChange={(v) => {
                setChannel(v === "all" ? "" : (v as Channel));
                setPage(1);
              }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Kanal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Bütün kanallar</SelectItem>
                {(Object.keys(CHANNEL_LABELS) as Channel[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CHANNEL_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              className="w-36"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="date"
              className="w-36"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />

            {hasFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
                <FilterXIcon />
                Sıfırla
              </Button>
            )}

            {data && (
              <span className="text-muted-foreground ml-auto text-sm">
                Cəmi: <b>{data.meta.total}</b>
              </span>
            )}
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">#</TableHead>
                <TableHead>Müştəri</TableHead>
                <TableHead>Kanal</TableHead>
                <TableHead className="w-56">Status</TableHead>
                <TableHead className="text-right">Məhsul</TableHead>
                <TableHead className="text-right">Yekun</TableHead>
                <TableHead>Tarix</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching ? "opacity-60" : undefined}>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                    Yüklənir...
                  </TableCell>
                </TableRow>
              )}
              {data?.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>
                    <div className="leading-tight">
                      <div>{order.customer ?? "—"}</div>
                      <div className="text-muted-foreground text-xs">{order.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{CHANNEL_LABELS[order.channel]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(v) => handleStatusChange(order.id, v as OrderStatus)}>
                      <SelectTrigger size="sm" className="w-full">
                        <span className="flex items-center gap-2">
                          <span
                            className={`size-2 shrink-0 rounded-full ${STATUS_DOT[order.status]}`}
                          />
                          {STATUS_LABELS[order.status]}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            <span
                              className={`mr-1 inline-block size-2 rounded-full ${STATUS_DOT[s]}`}
                            />
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">{order.items_count}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(order.grand_total)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(order.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <EyeIcon />
                        </Link>
                      </Button>
                      {isSuperadmin && (
                        <ConfirmDelete
                          onConfirm={() => handleDelete(order.id)}
                          title={`Sifariş #${order.id} silinsin?`}
                          description="Sifariş zibil qutusuna atılacaq — oradan bərpa etmək mümkündür."
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data && data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                    Sifariş tapılmadı.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data && data.meta.last_page > 1 && (
            <div className="flex items-center justify-end gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}>
                Əvvəlki
              </Button>
              <span className="text-muted-foreground text-sm">
                {data.meta.current_page} / {data.meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.last_page}
                onClick={() => setPage(page + 1)}>
                Növbəti
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
