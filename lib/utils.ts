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

export function isLiveNow(event: Event): boolean {
  const now = new Date();
  const [startH, startM] = event.start_time.split(":").map(Number);
  const start = new Date();
  start.setHours(startH, startM, 0, 0);

  if (!event.end_time) {
    // Assume 2 hour set
    const end = new Date(start);
    end.setHours(end.getHours() + 2);
    return now >= start && now <= end;
  }

  const [endH, endM] = event.end_time.split(":").map(Number);
  const end = new Date();
  end.setHours(endH, endM, 0, 0);

  // Handle past-midnight end times
  if (end <= start) end.setDate(end.getDate() + 1);

  return now >= start && now <= end;
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

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
