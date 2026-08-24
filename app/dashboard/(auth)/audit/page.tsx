"use client";

import { useMemo, useState } from "react";
import { FilterXIcon } from "lucide-react";

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
import { useGetAuditLogsQuery, type AuditFilter } from "@/lib/api/crm";
import { formatDateTime } from "@/lib/crm";

const ACTION_LABELS: Record<string, string> = {
  login: "Giriş",
  logout: "Çıxış",
  order_created: "Sifariş yaradıldı",
  order_updated: "Sifariş dəyişdirildi",
  order_status_changed: "Status dəyişdirildi",
  order_deleted: "Sifariş silindi",
  order_restored: "Sifariş bərpa olundu",
  order_force_deleted: "Sifariş tam silindi",
  contact_created: "Müştəri yaradıldı",
  contact_updated: "Müştəri dəyişdirildi",
  contact_deleted: "Müştəri silindi",
  contact_restored: "Müştəri bərpa olundu",
  contact_force_deleted: "Müştəri tam silindi",
  contact_note_added: "Qeyd əlavə olundu",
  contact_note_updated: "Qeyd dəyişdirildi",
  contact_note_deleted: "Qeyd silindi",
  crm_user_created: "İstifadəçi yaradıldı",
  crm_user_updated: "İstifadəçi dəyişdirildi",
  crm_user_deleted: "İstifadəçi silindi"
};

export default function AuditPage() {
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const filter: AuditFilter = useMemo(
    () => ({ page, per_page: 30, action, from, to }),
    [page, action, from, to]
  );

  const { data, isLoading, isFetching } = useGetAuditLogsQuery(filter);

  return (
    <>
      <PageHeader title="Audit log" description="Kim, nəyi, nə vaxt dəyişib" />

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 pb-4">
            <Select
              value={action || "all"}
              onValueChange={(v) => {
                setAction(v === "all" ? "" : v);
                setPage(1);
              }}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Əməliyyat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Bütün əməliyyatlar</SelectItem>
                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
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

            {(action || from || to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAction("");
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
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Tarix</TableHead>
                <TableHead>İstifadəçi</TableHead>
                <TableHead>Əməliyyat</TableHead>
                <TableHead>Obyekt</TableHead>
                <TableHead>Dəyişikliklər</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching ? "opacity-60" : undefined}>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                    Yüklənir...
                  </TableCell>
                </TableRow>
              )}
              {data?.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell>{log.user ?? "Sistem"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.entity_type ? `${log.entity_type} #${log.entity_id}` : "—"}
                  </TableCell>
                  <TableCell className="max-w-72">
                    {log.changes ? (
                      <code className="text-muted-foreground block truncate text-xs">
                        {JSON.stringify(log.changes)}
                      </code>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{log.ip}</TableCell>
                </TableRow>
              ))}
              {data && data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                    Qeyd tapılmadı.
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
