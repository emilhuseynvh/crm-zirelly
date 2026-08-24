"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DownloadIcon, EyeIcon, FilterXIcon, PencilIcon, PlusIcon, SearchIcon } from "lucide-react";
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
import { ContactFormDialog } from "@/components/crm/contact-form-dialog";
import { API_BASE, getToken } from "@/lib/api/base";
import {
  buildParams,
  useDeleteContactMutation,
  useGetContactsQuery,
  type ContactsFilter
} from "@/lib/api/crm";
import type { Channel, Contact } from "@/lib/api/types";
import { CHANNEL_LABELS, formatDate, formatMoney, getStoredUser } from "@/lib/crm";

export default function ContactsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<Channel | "">("");
  const [createdVia, setCreatedVia] = useState<"site" | "crm" | "">("");
  const [hasOrders, setHasOrders] = useState<"yes" | "no" | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [sortChoice, setSortChoice] = useState("id");
  const [exporting, setExporting] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  const [deleteContact] = useDeleteContactMutation();

  useEffect(() => {
    setIsSuperadmin(getStoredUser()?.role === "superadmin");
  }, []);

  const filter: ContactsFilter = useMemo(
    () => ({
      page,
      per_page: 20,
      search,
      channel,
      created_via: createdVia,
      has_orders: hasOrders,
      from,
      to,
      sort: (sortChoice === "id_asc" ? "id" : sortChoice) as ContactsFilter["sort"],
      dir: sortChoice === "id_asc" ? "asc" : "desc"
    }),
    [page, search, channel, createdVia, hasOrders, from, to, sortChoice]
  );

  const { data, isLoading, isFetching } = useGetContactsQuery(filter);

  const handleDelete = async (contact: Contact) => {
    try {
      await deleteContact(contact.id).unwrap();
      toast.success(`#${contact.id} arxivləşdirildi.`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Silinmə alınmadı.");
    }
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      const params = buildParams({
        search,
        channel,
        created_via: createdVia,
        has_orders: hasOrders,
        from,
        to
      });
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
              value={createdVia || "all"}
              onValueChange={(v) => {
                setCreatedVia(v === "all" ? "" : (v as "site" | "crm"));
                setPage(1);
              }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Bütün tiplər</SelectItem>
                <SelectItem value="site">Saytdan</SelectItem>
                <SelectItem value="crm">CRM-dən</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={hasOrders || "all"}
              onValueChange={(v) => {
                setHasOrders(v === "all" ? "" : (v as "yes" | "no"));
                setPage(1);
              }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sifariş" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hamısı</SelectItem>
                <SelectItem value="yes">Sifarişi olanlar</SelectItem>
                <SelectItem value="no">Sifarişi olmayanlar</SelectItem>
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

            <Select
              value={sortChoice}
              onValueChange={(v) => {
                setSortChoice(v);
                setPage(1);
              }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">Ən yeni</SelectItem>
                <SelectItem value="id_asc">Ən köhnə</SelectItem>
                <SelectItem value="orders_total">Ən çox alış</SelectItem>
                <SelectItem value="orders_count">Ən çox sifariş</SelectItem>
                <SelectItem value="last_order_at">Son sifarişə görə</SelectItem>
              </SelectContent>
            </Select>

            {(search || channel || createdVia || hasOrders || from || to) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setChannel("");
                  setCreatedVia("");
                  setHasOrders("");
                  setFrom("");
                  setTo("");
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
                <TableHead>Tip</TableHead>
                <TableHead className="text-right">Sifariş</TableHead>
                <TableHead className="text-right">Ümumi alış</TableHead>
                <TableHead>Son sifariş</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching ? "opacity-60" : undefined}>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={10} className="text-muted-foreground py-8 text-center">
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
                  <TableCell>
                    <Badge variant={contact.created_via === "site" ? "default" : "outline"}>
                      {contact.created_via === "site" ? "Saytdan" : "CRM-dən"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{contact.orders_count}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(contact.orders_total)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(contact.last_order_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/contacts/${contact.id}`}>
                          <EyeIcon />
                        </Link>
                      </Button>
                      <ContactFormDialog
                        contact={contact}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <PencilIcon />
                          </Button>
                        }
                      />
                      {isSuperadmin && (
                        <ConfirmDelete
                          onConfirm={() => handleDelete(contact)}
                          title={`#${contact.id} — ${contact.name} arxivləşdirilsin?`}
                          description="Müştəri siyahıdan çıxarılacaq (soft delete), sifarişləri bazada qalır."
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data && data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-muted-foreground py-8 text-center">
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
