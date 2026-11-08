import { type Booking, operatorBySlug, packageOf, addMinutes } from "./data";

/** Builds a calendar file for a booking and hands it to the browser to save. */
export function downloadIcs(b: Booking) {
  const op = operatorBySlug(b.operatorSlug);
  const pkg = packageOf(b);
  const d = b.date.replaceAll("-", "");
  const start = b.time.replace(":", "") + "00";
  const end = addMinutes(b.time, pkg?.durationMin ?? 90).replace(":", "") + "00";
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hafilu//HE",
    "BEGIN:VEVENT",
    `UID:booking-${b.id}@hafilu`,
    `DTSTART;TZID=Asia/Jerusalem:${d}T${start}`,
    `DTEND;TZID=Asia/Jerusalem:${d}T${end}`,
    `SUMMARY:${op?.name ?? "הפעלה"} · ${b.eventType}`,
    `LOCATION:${b.address || b.city}`,
    `DESCRIPTION:הזמנה #${b.id} · ${b.kids} ילדים`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `hafilu-${b.id}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
