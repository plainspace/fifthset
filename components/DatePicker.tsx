"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function DatePicker({
  name,
  id,
  required,
  value,
  onChange,
  className = "",
}: DatePickerProps) {
  const today = new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(value || "");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleSelect(day: number) {
    const val = toDateString(viewYear, viewMonth, day);
    setSelected(val);
    onChange?.(val);
    setIsOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={selected} />
      <button
        type="button"
        id={id}
        onClick={() => {
          if (!isOpen && selected) {
            const [y, m] = selected.split("-").map(Number);
            setViewYear(y);
            setViewMonth(m - 1);
          }
          setIsOpen(!isOpen);
        }}
        className="w-full rounded-lg bg-bg border border-border px-4 py-2.5 text-sm text-left focus:outline-none focus:border-accent transition-colors flex items-center justify-between"
      >
        <span className={selected ? "text-text" : "text-text-muted/50"}>
          {selected ? formatDisplay(selected) : "Select a date"}
        </span>
        <Calendar className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full min-w-[280px] rounded-xl bg-surface border border-border shadow-lg p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-surface-hover transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 text-text-muted" />
            </button>
            <span className="text-sm font-medium text-text">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-surface-hover transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs text-text-muted py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} />;
              }
              const dateStr = toDateString(viewYear, viewMonth, day);
              const isSelected = dateStr === selected;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={`py-1.5 text-sm rounded-lg transition-colors ${
                    isSelected
                      ? "bg-accent text-bg font-medium"
                      : isToday
                        ? "bg-accent/10 text-accent hover:bg-accent/20"
                        : "text-text hover:bg-surface-hover"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setViewYear(today.getFullYear());
                setViewMonth(today.getMonth());
                handleSelect(today.getDate());
              }}
              className="text-xs text-accent hover:underline"
            >
              Today
            </button>
          </div>
        </div>
      )}

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
