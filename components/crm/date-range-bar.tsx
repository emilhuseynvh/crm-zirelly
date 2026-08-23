"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface RangeValue {
  from: string;
  to: string;
  preset: string;
}

export const EMPTY_RANGE: RangeValue = { from: "", to: "", preset: "30d" };

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function presetRange(preset: string): RangeValue {
  const today = new Date();
  const to = toDateString(today);

  if (preset === "today") return { from: to, to, preset };

  if (preset === "week") {
    const day = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - day);
    return { from: toDateString(monday), to, preset };
  }

  if (preset === "month") {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toDateString(first), to, preset };
  }

  const start = new Date(today);
  start.setDate(today.getDate() - 29);
  return { from: toDateString(start), to, preset: "30d" };
}

const PRESETS = [
  { key: "today", label: "Bu gün" },
  { key: "week", label: "Bu həftə" },
  { key: "month", label: "Bu ay" },
  { key: "30d", label: "Son 30 gün" }
];

export function DateRangeBar({
  value,
  onChange
}: {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <Button
          key={preset.key}
          size="sm"
          variant={value.preset === preset.key ? "default" : "outline"}
          onClick={() => onChange(presetRange(preset.key))}>
          {preset.label}
        </Button>
      ))}

      <div className="flex items-center gap-2">
        <Input
          type="date"
          className="h-8 w-36"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value, preset: "custom" })}
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="date"
          className="h-8 w-36"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value, preset: "custom" })}
        />
      </div>
    </div>
  );
}
