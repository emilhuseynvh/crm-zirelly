"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { PageHeader } from "@/components/admin/page-header";
import { DateRangeBar, EMPTY_RANGE, type RangeValue } from "@/components/crm/date-range-bar";
import { useGetReportQuery } from "@/lib/api/crm";
import { CHANNEL_LABELS, STATUS_DOT, STATUS_LABELS, formatMoney } from "@/lib/crm";

const revenueChartConfig = {
  revenue: { label: "Satış (₼)", color: "var(--chart-1)" }
} satisfies ChartConfig;

const channelChartConfig = {
  revenue: { label: "Satış (₼)", color: "var(--chart-2)" }
} satisfies ChartConfig;

const shortDate = (date: string) =>
  new Date(date).toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit" });

export default function DashboardPage() {
  const [range, setRange] = useState<RangeValue>(EMPTY_RANGE);

  const { data, isLoading } = useGetReportQuery({ from: range.from, to: range.to });
  const report = data?.data;
  const totals = report?.totals;

  const channelData =
    report?.by_channel.map((row) => ({
      ...row,
      label: CHANNEL_LABELS[row.channel] ?? row.channel
    })) ?? [];

  return (
    <>
      <PageHeader title="Dashboard" description="Satış göstəricilərinə ümumi baxış" />

      <div className="mb-4">
        <DateRangeBar value={range} onChange={setRange} />
      </div>

      {isLoading && <p className="text-muted-foreground">Yüklənir...</p>}

      {totals && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Satış məbləği" value={formatMoney(totals.revenue)} />
            <StatCard title="Sifariş sayı" value={String(totals.paid_orders)} />
            <StatCard title="Orta sifariş" value={formatMoney(totals.average_order)} />
            <StatCard title="Çatdırılma yığımı" value={formatMoney(totals.delivery_total)} />
            <StatCard title="Yeni müştəri" value={String(totals.new_customers)} />
            <StatCard title="Təkrar müştəri" value={String(totals.repeat_customers)} />
            <StatCard title="Ləğv edilmiş" value={String(totals.cancelled_count)} />
            <StatCard title="Qaytarılmış" value={String(totals.returned_count)} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Satış (günlük)</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={revenueChartConfig} className="h-56 w-full">
                  <AreaChart data={report.by_day}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={shortDate}
                    />
                    <YAxis tickLine={false} axisLine={false} width={48} />
                    <ChartTooltip content={<ChartTooltipContent />} labelFormatter={shortDate} />
                    <Area
                      dataKey="revenue"
                      type="monotone"
                      fill="var(--color-revenue)"
                      fillOpacity={0.2}
                      stroke="var(--color-revenue)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satış kanalları üzrə</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={channelChartConfig} className="h-56 w-full">
                  <BarChart data={channelData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={48} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Statuslar üzrə sifariş</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.by_status.map((row) => (
                  <div key={row.status} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <span className={`size-2 rounded-full ${STATUS_DOT[row.status]}`} />
                      {STATUS_LABELS[row.status]}
                    </span>
                    <span className="font-medium">{row.count}</span>
                  </div>
                ))}
                {report.by_status.length === 0 && (
                  <p className="text-muted-foreground text-sm">Məlumat yoxdur.</p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Məhsullar üzrə satış</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.by_product.map((row) => (
                  <div key={row.title} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{row.title}</span>
                    <span className="text-muted-foreground shrink-0">
                      <Badge variant="secondary" className="mr-2">
                        {row.quantity} əd
                      </Badge>
                      {formatMoney(row.revenue)}
                    </span>
                  </div>
                ))}
                {report.by_product.length === 0 && (
                  <p className="text-muted-foreground text-sm">Məlumat yoxdur.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-sm">{title}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
