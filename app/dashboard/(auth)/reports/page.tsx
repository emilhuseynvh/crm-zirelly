"use client";

import { useState } from "react";
import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { DateRangeBar, EMPTY_RANGE, type RangeValue } from "@/components/crm/date-range-bar";
import { API_BASE, getToken } from "@/lib/api/base";
import { buildParams, useGetReportQuery } from "@/lib/api/crm";
import { CHANNEL_LABELS, STATUS_DOT, STATUS_LABELS, formatMoney } from "@/lib/crm";

export default function ReportsPage() {
  const [range, setRange] = useState<RangeValue>(EMPTY_RANGE);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useGetReportQuery({ from: range.from, to: range.to });
  const report = data?.data;
  const totals = report?.totals;

  const handleExport = async () => {
    setExporting(true);

    try {
      const params = buildParams({ from: range.from, to: range.to });
      const token = getToken();
      const response = await fetch(`${API_BASE}/crm/reports/export?${params.toString()}`, {
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
      link.download = `hesabat-${new Date().toISOString().slice(0, 10)}.csv`;
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
        <PageHeader title="Hesabatlar" description="Tarix aralığı üzrə satış analitikası" />
        <Button onClick={handleExport} disabled={exporting}>
          <DownloadIcon />
          {exporting ? "Hazırlanır..." : "CSV export"}
        </Button>
      </div>

      <div className="mb-4">
        <DateRangeBar value={range} onChange={setRange} />
      </div>

      {isLoading && <p className="text-muted-foreground">Yüklənir...</p>}

      {totals && report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric title="Ümumi dövriyyə" value={formatMoney(totals.revenue)} />
            <Metric title="Məhsul satışı" value={formatMoney(totals.goods_revenue)} />
            <Metric title="Çatdırılmadan yığılan" value={formatMoney(totals.delivery_total)} />
            <Metric title="Endirim məbləği" value={formatMoney(totals.discount_total)} />
            <Metric title="Sifariş sayı" value={String(totals.paid_orders)} />
            <Metric title="Orta sifariş" value={formatMoney(totals.average_order)} />
            <Metric title="Yeni müştəri" value={String(totals.new_customers)} />
            <Metric title="Təkrar müştəri" value={String(totals.repeat_customers)} />
            <Metric title="Çatdırılmış" value={String(totals.delivered_count)} />
            <Metric title="Ləğv edilmiş" value={String(totals.cancelled_count)} />
            <Metric title="Qaytarılmış" value={String(totals.returned_count)} />
            <Metric title="Ümumi sifariş (ləğvsiz)" value={String(totals.orders_count)} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Məhsul üzrə satış</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Məhsul</TableHead>
                      <TableHead className="text-right">Say</TableHead>
                      <TableHead className="text-right">Məbləğ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.by_product.map((row) => (
                      <TableRow key={row.title}>
                        <TableCell className="max-w-60 truncate">{row.title}</TableCell>
                        <TableCell className="text-right">{row.quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(row.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {report.by_product.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground py-4 text-center">
                          Məlumat yoxdur.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Satış kanalı üzrə</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {report.by_channel.map((row) => (
                    <div key={row.channel} className="flex items-center justify-between text-sm">
                      <Badge variant="secondary">{CHANNEL_LABELS[row.channel]}</Badge>
                      <span>
                        {row.orders} sifariş ·{" "}
                        <b>{formatMoney(row.revenue)}</b>
                      </span>
                    </div>
                  ))}
                  {report.by_channel.length === 0 && (
                    <p className="text-muted-foreground text-sm">Məlumat yoxdur.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statuslar üzrə</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {report.by_status.map((row) => (
                    <div key={row.status} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${STATUS_DOT[row.status]}`} />
                        {STATUS_LABELS[row.status]}
                      </span>
                      <b>{row.count}</b>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-sm">{title}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
