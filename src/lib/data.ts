export type CategoryId =
  | "sport"
  | "magic"
  | "science"
  | "art"
  | "inflatables"
  | "water"
  | "animals"
  | "characters"
  | "equipment"
  | "mobile";

export type Category = {
  id: CategoryId;
  name: string;
  desc: string;
  /** Pale surface tint (light mode) */
  tint: string;
  /** Saturated hue used for icons and the dark-mode wash */
  hue: string;
};

export const categories: Category[] = [
  { id: "sport", name: "ספורט ואתגר", desc: "אתגרים, ODT ומשחקי קבוצה", tint: "#F6ECDF", hue: "#C46A1B" },
  { id: "magic", name: "קסמים", desc: "מופעי קסמים ואשליות", tint: "#EDE9F8", hue: "#6E4BC4" },
  { id: "science", name: "מדע", desc: "ניסויים והפעלות חקר", tint: "#E5F2EA", hue: "#2D8A57" },
  { id: "art", name: "יצירה", desc: "סדנאות יצירה ואומנות", tint: "#F8E7ED", hue: "#C2416E" },
  { id: "inflatables", name: "מתנפחים", desc: "מתקנים מתנפחים לכל גיל", tint: "#F6F0DA", hue: "#A87F0B" },
  { id: "water", name: "משחקי מים", desc: "קרבות מים ומגלשות", tint: "#E2EDF8", hue: "#2F74B5" },
  { id: "animals", name: "בעלי חיים", desc: "פינות חי ומפגשים", tint: "#ECEFDF", hue: "#6B7F1E" },
  { id: "characters", name: "דמויות", desc: "דמויות אהובות ותחפושות", tint: "#F3E8F4", hue: "#9B3FA6" },
  { id: "equipment", name: "ציוד לאירועים", desc: "הגברה, שולחנות וקישוט", tint: "#E9ECF1", hue: "#4B5A73" },
  { id: "mobile", name: "אטרקציות ניידות", desc: "עמדות שמגיעות אליכם", tint: "#E3F0EF", hue: "#1F7F7A" },
];

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<CategoryId, Category>;

export const regions = ["מרכז", "שרון", "שפלה", "ירושלים", "חיפה והקריות", "צפון", "דרום"] as const;
export type Region = (typeof regions)[number];

export const eventTypes = ["יום הולדת", "בית ספר", "גן ילדים", "קייטנה", "יום משפחות", "אירוע קהילתי"] as const;

export const ageRanges = [
  { id: "3-5", label: "3–5", min: 3, max: 5 },
  { id: "6-8", label: "6–8", min: 6, max: 8 },
  { id: "9-12", label: "9–12", min: 9, max: 12 },
  { id: "13+", label: "13 ומעלה", min: 13, max: 18 },
] as const;

export type LocationType = "home" | "park" | "hall";
export const locationTypes: { id: LocationType; label: string; short: string }[] = [
  { id: "home", label: "בבית או בחצר", short: "חצר או גינה" },
  { id: "park", label: "בפארק או בשטח פתוח", short: "פארק" },
  { id: "hall", label: "באולם או במוסד", short: "בית ספר או אולם" },
];

export type Package = {
  id: string;
  name: string;
  durationMin: number;
  maxKids: number | null;
  ageMin: number;
  ageMax: number;
  price: number;
  includes: string;
  popular?: boolean;
  active: boolean;
  extraKidPrice?: number;
};

export type Review = {
  id: string;
  author: string;
  context: string;
  when: string;
  score: number;
  text: string;
  reply?: string;
  verified: boolean;
};

export type CancellationPolicy = "flexible" | "regular" | "strict";

export const cancellationPolicies: Record<CancellationPolicy, { name: string; short: string; rules: string[] }> = {
  flexible: {
    name: "גמישה",
    short: "ביטול חינם עד 7 ימים לפני",
    rules: ["ביטול חינם עד 7 ימים לפני האירוע", "פחות מ־7 ימים לפני: המקדמה לא מוחזרת", "גשם או מזג אוויר קיצוני: מועד חלופי בלי עלות"],
  },
  regular: {
    name: "רגילה",
    short: "חינם עד 14 יום, 50% עד 7 ימים",
    rules: [
      "ביטול חינם עד 14 ימים לפני האירוע",
      "בין 14 ל־7 ימים לפני: מוחזרת 50% מהמקדמה",
      "פחות מ־7 ימים לפני: המקדמה לא מוחזרת",
      "גשם או מזג אוויר קיצוני: מועד חלופי בלי עלות",
    ],
  },
  strict: {
    name: "מחמירה",
    short: "חינם עד 30 יום, אחר כך המקדמה לא מוחזרת",
    rules: ["ביטול חינם עד 30 ימים לפני האירוע", "פחות מ־30 ימים לפני: המקדמה לא מוחזרת", "גשם או מזג אוויר קיצוני: מועד חלופי בלי עלות"],
  },
};


export type Operator = {
  id: string;
  slug: string;
  ownerId: string | null;
  name: string;
  category: CategoryId;
  categories: string[];
  tagline: string;
  rating: number;
  reviewsCount: number;
  ageMin: number;
  ageMax: number;
  regions: string[];
  regionLabel: string;
  durationLabel: string;
  includes: string;
  locations: LocationType[];
  sponsored?: boolean;
  verified: boolean;
  insured: boolean;
  responseHours: number;
  packages: Package[];
  extras: { id: string; name: string; price: number }[];
  about: string;
  facts: { label: string; value: string }[];
  prepare: string[];
  sub: { punctuality: number; communication: number; asPromised: number; kidsFun: number; ageFit: number; value: number };
  reviews: Review[];
  cancellation: CancellationPolicy;
  slots: string[];
  plan: "basic" | "pro";
  status: "active" | "pending" | "suspended" | "rejected";
  reviewNote?: string | null;
  insuranceUntil: string;
  bookingsCount: number;
  blockedDates: string[];
};

export const priceFrom = (o: Pick<Operator, "packages">) => {
  const prices = o.packages.filter((p) => p.active).map((p) => p.price);
  return prices.length ? Math.min(...prices) : 0;
};

/* ---------------------------------------------------------------- Bookings */

export type BookingStatus = "pending" | "awaiting_payment" | "confirmed" | "completed" | "cancelled" | "declined";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

export const statusMeta: Record<BookingStatus, { label: string; tone: Tone; step: number }> = {
  pending: { label: "ממתינה לאישור", tone: "warning", step: 1 },
  awaiting_payment: { label: "ממתינה לתשלום", tone: "accent", step: 3 },
  confirmed: { label: "אושרה", tone: "accent", step: 4 },
  completed: { label: "הושלמה", tone: "success", step: 5 },
  cancelled: { label: "בוטלה", tone: "neutral", step: -1 },
  declined: { label: "נדחתה", tone: "neutral", step: -1 },
};

export const statusSteps = ["בקשה נשלחה", "ממתינה לאישור", "אושרה", "ממתינה לתשלום", "הושלמה"];

export type BookingOperator = {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  cancellation: CancellationPolicy;
  extras: { id: string; name: string; price: number }[];
  responseHours: number;
  slots: string[];
};

export type Booking = {
  id: number;
  operatorId: string;
  packageId: string;
  customerId: string | null;
  customerName: string;
  customerKind: "parent" | "institution";
  phone: string;
  email: string;
  eventType: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  city: string;
  address: string;
  distanceKm: number;
  kids: number;
  ageRange: string;
  locationType: LocationType;
  notes: string;
  extras: string[];
  price: number;
  travelFee: number;
  total: number;
  status: BookingStatus;
  createdAt: string;
  paid: number;
  rated: boolean;
  proposal?: { date: string; time: string };
  operator: BookingOperator;
  pkg: { name: string; durationMin: number };
};

export type Settings = { commission: number; deposit: number; replyHours: number; payHours: number; payoutDay: number; proPrice: number; blockOverlaps: boolean };
export const defaultSettings: Settings = { commission: 0.1, deposit: 0.3, replyHours: 24, payHours: 48, payoutDay: 10, proPrice: 99, blockOverlaps: true };

export type Notice = { id: string; audience: "customer" | "operator"; text: string; href?: string | null; read: boolean; at: string };

export type Profile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  prefs: { whatsapp: boolean; sms: boolean; email: boolean; reminder: boolean };
};

/* ----------------------------------------------------------- Formatting */

/** Attaches a Hebrew prefix letter (ל, מ, ו, ב) to a name, adding a maqaf before Latin text: ל־Water Battle. */
export const pre = (prefix: string, name: string) => `${prefix}${/^[A-Za-z0-9"']/.test(name) ? "־" : ""}${name}`;

const nis = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 });
export const money = (n: number) => `${nis.format(n)} ₪`;

const weekdays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
export const parseDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const weekday = (iso: string) => weekdays[parseDate(iso).getDay()];
export const shortDate = (iso: string) => {
  const d = parseDate(iso);
  return `${d.getDate()}.${d.getMonth() + 1}`;
};
export const fullDate = (iso: string) => {
  const d = parseDate(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
};
export const dayLabel = (iso: string) => `${weekday(iso)}, ${fullDate(iso)}`;

export const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

export const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export const durationText = (min: number) => {
  if (min < 60) return `${min} דקות`;
  if (min === 60) return "שעה";
  if (min === 90) return "90 דקות";
  if (min === 120) return "שעתיים";
  if (min % 60 === 0) return `${min / 60} שעות`;
  return `${min} דקות`;
};

export const bookingTotal = (b: Pick<Booking, "total">) => b.total;
export const depositOf = (b: Pick<Booking, "total">, rate = defaultSettings.deposit) => Math.round(b.total * rate);

/** Two bookings overlap when the same operator is booked for intersecting windows (+ travel buffer). */
export const overlaps = (a: Booking, b: Booking, bufferMin = 60) => {
  if (a.id === b.id || a.operatorId !== b.operatorId || a.date !== b.date) return false;
  const sa = toMinutes(a.time);
  const sb = toMinutes(b.time);
  return sa < sb + b.pkg.durationMin + bufferMin && sb < sa + a.pkg.durationMin + bufferMin;
};

export const isLive = (s: BookingStatus) => s === "pending" || s === "awaiting_payment" || s === "confirmed";

/* ----------------------------------------------------------- Availability */

/** Demo rule for the search filter until operators manage per-day availability. */
export const availableOn = (op: Pick<Operator, "slug" | "blockedDates">, iso: string) => {
  if (op.blockedDates.includes(iso)) return false;
  const d = parseDate(iso);
  return (d.getDate() + d.getMonth() * 31 + op.slug.length) % 6 !== 0;
};

export const availabilityWindow = (op: Pick<Operator, "slots">) => `${op.slots[0]}–${op.slots[op.slots.length - 1]}`;

/** Slots that collide with busy windows returned by the busy_slots RPC (+30 min travel). */
export const takenSlots = (op: Pick<Operator, "slots">, busy: { time: string; durationMin: number }[], durationMin: number) => {
  const taken = new Set<string>();
  for (const slot of op.slots) {
    const s = toMinutes(slot);
    if (busy.some((b) => s < toMinutes(b.time) + b.durationMin + 30 && toMinutes(b.time) < s + durationMin + 30)) taken.add(slot);
  }
  return taken;
};

export const plusDays = (iso: string, n: number) => {
  const d = parseDate(iso);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
