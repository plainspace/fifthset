import { TimeOfDay, Event } from "./types";

export function getTimeOfDay(time: string): TimeOfDay {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "late-night";
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function getDateLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + "T00:00:00");

  const diffDays = Math.round(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Tonight";
  if (diffDays === 1) return "Tomorrow";

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return dayNames[date.getDay()];
}

export function isLiveNow(event: Event, timezone = "America/New_York"): boolean {
  const nowStr = new Date().toLocaleString("en-US", { timeZone: timezone });
  const now = new Date(nowStr);

  const [startH, startM] = event.start_time.split(":").map(Number);
  const eventDate = new Date(event.date + "T00:00:00");
  const start = new Date(eventDate);
  start.setHours(startH, startM, 0, 0);

  let endDate: Date;
  if (!event.end_time) {
    endDate = new Date(start);
    endDate.setHours(endDate.getHours() + 2);
  } else {
    const [endH, endM] = event.end_time.split(":").map(Number);
    endDate = new Date(eventDate);
    endDate.setHours(endH, endM, 0, 0);
    if (endDate <= start) endDate.setDate(endDate.getDate() + 1);
  }

  return now >= start && now <= endDate;
}

export function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const days = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday",
  ];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function getLocalDate(timezone: string, offsetDays = 0): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  if (offsetDays === 0) return formatter.format(now);
  const adjusted = new Date(now);
  adjusted.setDate(adjusted.getDate() + offsetDays);
  return formatter.format(adjusted);
}

export function getLocalDay(timezone: string, offsetDays = 0): number {
  const dateStr = getLocalDate(timezone, offsetDays);
  return new Date(dateStr + "T12:00:00").getDay();
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
