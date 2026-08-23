"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { ContactFormDialog } from "@/components/crm/contact-form-dialog";
import { API_BASE, getToken } from "@/lib/api/base";
import { buildParams, useGetContactsQuery, type ContactsFilter } from "@/lib/api/crm";
import type { Channel } from "@/lib/api/types";
import { CHANNEL_LABELS, formatDate, formatMoney } from "@/lib/crm";

export default function ContactsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<Channel | "">("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<NonNullable<ContactsFilter["sort"]>>("id");
  const [exporting, setExporting] = useState(false);

  const filter: ContactsFilter = useMemo(
    () => ({ page, per_page: 20, search, channel, sort, dir: "desc" }),
    [page, search, channel, sort]
  );

  const { data, isLoading, isFetching } = useGetContactsQuery(filter);

  const handleExport = async () => {
    setExporting(true);

    try {
      const params = buildParams({ search, channel });
      const token = getToken();
      const response = await fetch(`${API_BASE}/crm/contacts/export?${params.toString()}`, {
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
      link.download = `musteriler-${new Date().toISOString().slice(0, 10)}.csv`;
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
        <PageHeader title="Müştərilər" description="Bütün kanallar üzrə müştəri bazası" />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <DownloadIcon />
            {exporting ? "Hazırlanır..." : "CSV export"}
          </Button>
          <ContactFormDialog
            trigger={
              <Button>
                <PlusIcon />
                Yeni müştəri
              </Button>
            }
          />
        </div>
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
              placeholder="Ad, telefon, e-poçt..."
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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Kanal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Bütün mənbələr</SelectItem>
                {(Object.keys(CHANNEL_LABELS) as Channel[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CHANNEL_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v as NonNullable<ContactsFilter["sort"]>);
                setPage(1);
              }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">Ən yeni</SelectItem>
                <SelectItem value="orders_total">Ən çox alış</SelectItem>
                <SelectItem value="orders_count">Ən çox sifariş</SelectItem>
                <SelectItem value="last_order_at">Son sifarişə görə</SelectItem>
              </SelectContent>
            </Select>

            {(search || channel) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setChannel("");
                  setPage(1);
                }}>
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
                <TableHead className="w-16">#</TableHead>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>E-poçt</TableHead>
                <TableHead>Mənbə</TableHead>
                <TableHead className="text-right">Sifariş</TableHead>
                <TableHead className="text-right">Ümumi alış</TableHead>
                <TableHead>Son sifariş</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching ? "opacity-60" : undefined}>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-muted-foreground py-8 text-center">
                    Yüklənir...
                  </TableCell>
                </TableRow>
              )}
              {data?.data.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">#{contact.id}</TableCell>
                  <TableCell>
                    {contact.name} {contact.surname}
                  </TableCell>
                  <TableCell>{contact.phone ?? "—"}</TableCell>
                  <TableCell>{contact.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{CHANNEL_LABELS[contact.channel]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{contact.orders_count}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(contact.orders_total)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(contact.last_order_at)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/contacts/${contact.id}`}>
                        <EyeIcon />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data && data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-muted-foreground py-8 text-center">
                    Müştəri tapılmadı.
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
