"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  name: string;
  id?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

function formatDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function DatePicker({
  name,
  id,
  required,
  value,
  onChange,
  className = "",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(value || "");

  useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    const val = toDateString(date);
    setSelected(val);
    onChange?.(val);
    setOpen(false);
  }

  return (
    <div className={`relative ${className}`}>
      <input type="hidden" name={name} value={selected} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            className="w-full rounded-lg bg-bg border border-border px-4 py-2.5 text-sm text-left focus:outline-2 focus:outline-accent focus:outline-offset-[-1px] transition-colors flex items-center justify-between"
          >
            <span className={selected ? "text-text" : "text-text-muted/50"}>
              {selected ? formatDisplay(selected) : "Select a date"}
            </span>
            <CalendarIcon className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parseDate(selected)}
            onSelect={handleSelect}
            defaultMonth={parseDate(selected)}
          />
        </PopoverContent>
      </Popover>

      {required && !selected && (
        <input
          tabIndex={-1}
          required
          value=""
          onChange={() => {}}
          className="absolute opacity-0 pointer-events-none h-0 w-0"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
