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
  slug: string;
  name: string;
  category: CategoryId;
  tagline: string;
  rating: number;
  reviewsCount: number;
  ageMin: number;
  ageMax: number;
  regions: Region[];
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
  /** Default slots offered on a typical day */
  slots: string[];
  plan: "basic" | "pro";
  status: "active" | "pending" | "suspended";
  insuranceUntil: string;
  bookingsCount: number;
};

const baseSub = { punctuality: 4.9, communication: 5.0, asPromised: 4.8, kidsFun: 4.9, ageFit: 4.8, value: 4.7 };

export const operators: Operator[] = [
  {
    slug: "water-battle",
    name: "Water Battle",
    category: "water",
    tagline: "קרב מים מאורגן עם משימות וקבוצות",
    rating: 4.9,
    reviewsCount: 64,
    ageMin: 6,
    ageMax: 14,
    regions: ["מרכז", "שרון", "שפלה"],
    regionLabel: "מרכז, שרון ושפלה",
    durationLabel: "90 דקות",
    includes: "רובי מים, עמודות מילוי, מדריך לכל 15 ילדים",
    locations: ["home", "park", "hall"],
    verified: true,
    insured: true,
    responseHours: 3,
    packages: [
      { id: "basic", name: "בסיסית", durationMin: 60, maxKids: 15, ageMin: 6, ageMax: 10, price: 1250, includes: "רובי מים, שתי עמדות מילוי, מדריך אחד", active: true, extraKidPrice: 45 },
      { id: "party", name: "מסיבת מים", durationMin: 90, maxKids: 25, ageMin: 6, ageMax: 14, price: 1650, includes: "משימות בקבוצות, ניקוד, מדריכים, פרס לחתן השמחה", popular: true, active: true, extraKidPrice: 45 },
      { id: "mega", name: "קרב ענק", durationMin: 120, maxKids: 40, ageMin: 8, ageMax: 14, price: 2400, includes: "שלושה מדריכים, מגלשה מתנפחת, הגברה", active: true, extraKidPrice: 40 },
    ],
    extras: [
      { id: "slide", name: "מגלשת מים מתנפחת", price: 450 },
      { id: "guide", name: "מדריך נוסף", price: 250 },
    ],
    about:
      "קרב מים מאורגן עם משימות, קבוצות וניקוד. המדריכים מגיעים עם כל הציוד, מקימים עמדות מילוי ומנהלים את המשחק מההתחלה ועד הסוף, כך שההורים יכולים פשוט ליהנות.",
    facts: [
      { label: "יחס מדריכים", value: "מדריך לכל 15 ילדים" },
      { label: "עונה", value: "אפריל עד נובמבר" },
      { label: "שפות", value: "עברית, אנגלית" },
      { label: "מתאים גם ל", value: "בתי ספר, קייטנות, ימי משפחות" },
    ],
    prepare: ["חצר או דשא של 100 מ״ר לפחות", "ברז מים זמין במקום", "בגדי ים ומגבת לכל ילד", "לא נדרש חיבור לחשמל"],
    sub: { punctuality: 4.9, communication: 5.0, asPromised: 4.8, kidsFun: 4.9, ageFit: 4.8, value: 4.7 },
    reviews: [
      { id: "r1", author: "מיכל ש.", context: "יום הולדת 9", when: "אוקטובר 2026", score: 5, text: "הגיעו בזמן, הקימו הכול תוך רבע שעה והילדים לא הפסיקו לצחוק. הכי טוב שהמדריכים ניהלו את הכול ואנחנו רק צילמנו.", reply: "תודה מיכל! היה כיף גדול עם החבר׳ה.", verified: true },
      { id: "r2", author: "אבי ל.", context: "יום כיף בבית ספר", when: "ספטמבר 2026", score: 5, text: "הזמנו לשלוש שכבות ביום אחד. המפעיל התאים את המשימות לכל גיל והכול היה מאורגן מאוד.", verified: true },
      { id: "r3", author: "רונית כ.", context: "יום הולדת 7", when: "אוגוסט 2026", score: 4, text: "הפעלה מעולה. הייתי שמחה לדעת מראש שצריך יותר מגבות, אבל חוץ מזה מושלם.", reply: "הוספנו את זה לרשימת ההכנה. תודה!", verified: true },
    ],
    cancellation: "regular",
    slots: ["10:00", "12:30", "15:00", "17:30", "18:30", "19:30"],
    plan: "basic",
    status: "active",
    insuranceUntil: "03/2027",
    bookingsCount: 64,
  },
  {
    slug: "kfitzot-anak",
    name: "קפיצות ענק",
    category: "inflatables",
    tagline: "מתקנים מתנפחים עם הקמה ופירוק",
    rating: 4.6,
    reviewsCount: 31,
    ageMin: 3,
    ageMax: 10,
    regions: ["מרכז", "שרון"],
    regionLabel: "מרכז ושרון",
    durationLabel: "3 שעות",
    includes: "שני מתקנים, הקמה ופירוק, השגחה",
    locations: ["home", "park"],
    sponsored: true,
    verified: true,
    insured: true,
    responseHours: 5,
    packages: [
      { id: "duo", name: "זוג מתקנים", durationMin: 180, maxKids: null, ageMin: 3, ageMax: 10, price: 1200, includes: "שני מתקנים, הקמה ופירוק, השגחה", popular: true, active: true },
      { id: "trio", name: "שלישיית מתקנים", durationMin: 240, maxKids: null, ageMin: 3, ageMax: 12, price: 1750, includes: "שלושה מתקנים כולל מגלשה, מפעיל צמוד", active: true },
    ],
    extras: [{ id: "popcorn", name: "מכונת פופקורן", price: 300 }],
    about: "מתקנים מתנפחים נקיים ובטוחים, עם הקמה ופירוק ומפעיל שמשגיח לאורך כל הזמן. מתאים לחצר, לגינה ולפארק.",
    facts: [
      { label: "שטח נדרש", value: "6×8 מטר למתקן" },
      { label: "חשמל", value: "שקע רגיל במרחק עד 20 מ׳" },
      { label: "עונה", value: "כל השנה" },
      { label: "מתאים גם ל", value: "גנים, ימי משפחות" },
    ],
    prepare: ["משטח ישר בלי אבנים", "שקע חשמל זמין", "גישה לרכב עד 30 מטר"],
    sub: { ...baseSub, punctuality: 4.5, value: 4.6 },
    reviews: [
      { id: "r1", author: "שירן א.", context: "יום הולדת 5", when: "אוקטובר 2026", score: 5, text: "המתקנים היו נקיים, המפעיל היה סבלני עם הקטנים. נזמין שוב.", verified: true },
    ],
    cancellation: "flexible",
    slots: ["09:00", "12:00", "15:00", "17:00"],
    plan: "basic",
    status: "active",
    insuranceUntil: "02/2027",
    bookingsCount: 31,
  },
  {
    slug: "mada-bakufsa",
    name: "מדע בקופסה",
    category: "science",
    tagline: "ניסויים מגניבים שכל ילד מנסה בעצמו",
    rating: 4.8,
    reviewsCount: 41,
    ageMin: 5,
    ageMax: 10,
    regions: ["מרכז", "ירושלים"],
    regionLabel: "מרכז וירושלים",
    durationLabel: "60 דקות",
    includes: "ניסויים, ערכה לכל ילד, מדריך",
    locations: ["home", "hall"],
    verified: true,
    insured: true,
    responseHours: 4,
    packages: [
      { id: "lab", name: "מעבדה ניידת", durationMin: 60, maxKids: 20, ageMin: 5, ageMax: 10, price: 950, includes: "ניסויים, ערכה לכל ילד, מדריך", popular: true, active: true, extraKidPrice: 35 },
      { id: "school", name: "יום מדע לכיתה", durationMin: 90, maxKids: 35, ageMin: 6, ageMax: 12, price: 1450, includes: "שלוש תחנות ניסוי, שני מדריכים", active: true },
    ],
    extras: [{ id: "slime", name: "סליים זוהר לכל ילד", price: 180 }],
    about: "הפעלת מדע שבה כל ילד הוא חוקר. ניסויים עם תגובות, בועות ענק וסליים, והכול נלקח הביתה בסוף.",
    facts: [
      { label: "יחס מדריכים", value: "מדריך לכל 20 ילדים" },
      { label: "עונה", value: "כל השנה" },
      { label: "שפות", value: "עברית" },
      { label: "מתאים גם ל", value: "בתי ספר, חוגים" },
    ],
    prepare: ["שולחן גדול", "כיסוי לרצפה אם בתוך הבית"],
    sub: { ...baseSub, kidsFun: 4.9, value: 4.8 },
    reviews: [
      { id: "r1", author: "גלית מ.", context: "יום הולדת 8", when: "ספטמבר 2026", score: 5, text: "הילדים היו מרותקים מההתחלה ועד הסוף. כל ילד קיבל ערכה משלו ולקח הביתה את הניסוי.", verified: true },
    ],
    cancellation: "regular",
    slots: ["10:00", "16:00", "17:30", "19:00"],
    plan: "pro",
    status: "active",
    insuranceUntil: "09/2027",
    bookingsCount: 41,
  },
  {
    slug: "hakosem-noam",
    name: "הקוסם נועם",
    category: "magic",
    tagline: "מופע קסמים אינטראקטיבי עם בלונים",
    rating: 4.7,
    reviewsCount: 88,
    ageMin: 4,
    ageMax: 9,
    regions: ["מרכז", "שרון", "שפלה", "ירושלים", "חיפה והקריות", "צפון", "דרום"],
    regionLabel: "כל הארץ",
    durationLabel: "45 דקות",
    includes: "מופע, בלונים, השתתפות של חתן השמחה",
    locations: ["home", "park", "hall"],
    verified: true,
    insured: true,
    responseHours: 2,
    packages: [
      { id: "show", name: "מופע קסמים", durationMin: 45, maxKids: null, ageMin: 4, ageMax: 9, price: 1100, includes: "מופע, בלונים, השתתפות של חתן השמחה", popular: true, active: true },
      { id: "show-plus", name: "מופע וסדנה", durationMin: 75, maxKids: 25, ageMin: 5, ageMax: 10, price: 1550, includes: "מופע וסדנת קסמים קצרה, ערכה לכל ילד", active: true },
    ],
    extras: [{ id: "balloons", name: "פסלי בלונים לכל ילד", price: 200 }],
    about: "מופע קסמים קומי ואינטראקטיבי שבו הילדים עולים לבמה. חתן או כלת השמחה הופכים לעוזרי הקוסם.",
    facts: [
      { label: "קהל", value: "ללא הגבלת ילדים" },
      { label: "עונה", value: "כל השנה" },
      { label: "שפות", value: "עברית, אנגלית, רוסית" },
      { label: "מתאים גם ל", value: "גנים, אירועי חברה" },
    ],
    prepare: ["פינה של 3×3 מטר", "כיסאות או שטיח לילדים"],
    sub: { ...baseSub, punctuality: 4.8, value: 4.6 },
    reviews: [
      { id: "r1", author: "דנה ל.", context: "יום הולדת 6", when: "יוני 2026", score: 5, text: "הילדים צחקו בלי הפסקה. נועם מקצוען אמיתי.", verified: true },
    ],
    cancellation: "regular",
    slots: ["10:00", "11:30", "16:00", "17:00", "18:30"],
    plan: "pro",
    status: "active",
    insuranceUntil: "12/2026",
    bookingsCount: 88,
  },
  {
    slug: "extreme-junior",
    name: "אקסטרים ג׳וניור",
    category: "sport",
    tagline: "מסלול אתגרים נייד עם מדריכים",
    rating: 4.9,
    reviewsCount: 27,
    ageMin: 7,
    ageMax: 13,
    regions: ["מרכז", "צפון"],
    regionLabel: "מרכז וצפון",
    durationLabel: "2 שעות",
    includes: "מסלול אתגרים, שני מדריכים, ציוד בטיחות",
    locations: ["park", "hall"],
    verified: true,
    insured: true,
    responseHours: 6,
    packages: [
      { id: "course", name: "מסלול אתגרים", durationMin: 120, maxKids: 30, ageMin: 7, ageMax: 13, price: 1900, includes: "מסלול אתגרים, שני מדריכים, ציוד בטיחות", popular: true, active: true },
      { id: "odt", name: "ODT לכיתה", durationMin: 180, maxKids: 40, ageMin: 9, ageMax: 14, price: 2800, includes: "משימות גיבוש, שלושה מדריכים, תחקיר", active: true },
    ],
    extras: [{ id: "medals", name: "מדליות לכל ילד", price: 220 }],
    about: "מסלול אתגרים נייד עם קירות טיפוס נמוכים, זחילות ומשימות קבוצתיות. הכול עם ציוד בטיחות ומדריכים מוסמכים.",
    facts: [
      { label: "יחס מדריכים", value: "מדריך לכל 15 ילדים" },
      { label: "עונה", value: "כל השנה" },
      { label: "שפות", value: "עברית" },
      { label: "מתאים גם ל", value: "בתי ספר, תנועות נוער" },
    ],
    prepare: ["שטח פתוח של 200 מ״ר", "נעליים סגורות לכל ילד"],
    sub: { ...baseSub, kidsFun: 5.0 },
    reviews: [
      { id: "r1", author: "יואב ר.", context: "יום הולדת 10", when: "אוקטובר 2026", score: 5, text: "הבנים היו בעננים. המדריכים מקצועיים והקפידו על בטיחות.", verified: true },
    ],
    cancellation: "strict",
    slots: ["09:00", "11:00", "14:00", "16:30"],
    plan: "basic",
    status: "active",
    insuranceUntil: "12/2026",
    bookingsCount: 27,
  },
  {
    slug: "studio-tzeva",
    name: "סטודיו צבע ונצנץ",
    category: "art",
    tagline: "סדנת יצירה שכל ילד חוזר ממנה עם יצירה",
    rating: 4.8,
    reviewsCount: 35,
    ageMin: 5,
    ageMax: 11,
    regions: ["מרכז"],
    regionLabel: "מרכז",
    durationLabel: "90 דקות",
    includes: "חומרים לכל ילד, תוצר שלוקחים הביתה",
    locations: ["home", "hall"],
    verified: true,
    insured: false,
    responseHours: 8,
    packages: [
      { id: "canvas", name: "ציור על קנבס", durationMin: 90, maxKids: 15, ageMin: 5, ageMax: 11, price: 850, includes: "חומרים לכל ילד, תוצר שלוקחים הביתה", popular: true, active: true, extraKidPrice: 40 },
      { id: "tote", name: "עיצוב תיקי בד", durationMin: 75, maxKids: 20, ageMin: 6, ageMax: 12, price: 980, includes: "תיק בד, צבעי טקסטיל, שבלונות", active: true },
    ],
    extras: [{ id: "glitter", name: "עמדת נצנצים וקעקועים", price: 250 }],
    about: "סדנת יצירה צבעונית עם חומרים איכותיים. כל ילד יוצר בקצב שלו ולוקח הביתה יצירה גמורה.",
    facts: [
      { label: "יחס מדריכים", value: "מדריכה לכל 15 ילדים" },
      { label: "עונה", value: "כל השנה" },
      { label: "שפות", value: "עברית" },
      { label: "מתאים גם ל", value: "גנים, בנות מצווה" },
    ],
    prepare: ["שולחנות וכיסאות לכל הילדים", "כיסוי לשולחן"],
    sub: { ...baseSub, value: 4.9 },
    reviews: [
      { id: "r1", author: "הילה ב.", context: "יום הולדת 7", when: "ספטמבר 2026", score: 5, text: "סדנה מקסימה, הבנות לא רצו ללכת הביתה.", verified: true },
    ],
    cancellation: "flexible",
    slots: ["10:00", "15:00", "17:00", "19:00"],
    plan: "basic",
    status: "active",
    insuranceUntil: "—",
    bookingsCount: 35,
  },
  {
    slug: "robotika",
    name: "רובוטיקה לגיבורים",
    category: "science",
    tagline: "בונים ומתכנתים רובוט בשעה אחת",
    rating: 4.8,
    reviewsCount: 19,
    ageMin: 8,
    ageMax: 13,
    regions: ["מרכז", "שרון", "חיפה והקריות"],
    regionLabel: "מרכז, שרון וחיפה",
    durationLabel: "75 דקות",
    includes: "ערכת רובוט לכל זוג ילדים, מדריך",
    locations: ["home", "hall"],
    verified: true,
    insured: true,
    responseHours: 6,
    packages: [
      { id: "bots", name: "קרב רובוטים", durationMin: 75, maxKids: 20, ageMin: 8, ageMax: 13, price: 1350, includes: "ערכת רובוט לכל זוג ילדים, מדריך", popular: true, active: true },
    ],
    extras: [],
    about: "הילדים בונים רובוט בזוגות, מתכנתים אותו מהטאבלט ומסיימים בטורניר קרב רובוטים.",
    facts: [
      { label: "יחס מדריכים", value: "מדריך לכל 20 ילדים" },
      { label: "עונה", value: "כל השנה" },
      { label: "שפות", value: "עברית, אנגלית" },
      { label: "מתאים גם ל", value: "בתי ספר, חוגים" },
    ],
    prepare: ["שולחנות לעבודה", "שקע חשמל"],
    sub: baseSub,
    reviews: [],
    cancellation: "regular",
    slots: ["10:00", "16:00", "18:00"],
    plan: "pro",
    status: "active",
    insuranceUntil: "06/2027",
    bookingsCount: 19,
  },
  {
    slug: "olam-hadmuyot",
    name: "עולם הדמויות",
    category: "characters",
    tagline: "הדמויות האהובות מגיעות למסיבה",
    rating: 4.5,
    reviewsCount: 52,
    ageMin: 3,
    ageMax: 8,
    regions: ["מרכז", "שפלה", "דרום"],
    regionLabel: "מרכז, שפלה ודרום",
    durationLabel: "60 דקות",
    includes: "שתי דמויות, ריקודים, משחקים ובלונים",
    locations: ["home", "park", "hall"],
    verified: true,
    insured: true,
    responseHours: 4,
    packages: [
      { id: "two", name: "שתי דמויות", durationMin: 60, maxKids: null, ageMin: 3, ageMax: 8, price: 1050, includes: "שתי דמויות, ריקודים, משחקים ובלונים", popular: true, active: true },
    ],
    extras: [{ id: "face", name: "איפור פנים", price: 200 }],
    about: "שחקנים מקצועיים בתחפושות איכותיות מגיעים עם מוזיקה, ריקודים ומשחקים.",
    facts: [
      { label: "קהל", value: "ללא הגבלת ילדים" },
      { label: "עונה", value: "כל השנה" },
      { label: "שפות", value: "עברית" },
      { label: "מתאים גם ל", value: "גנים" },
    ],
    prepare: ["רמקול או שקע חשמל"],
    sub: { ...baseSub, punctuality: 4.4, value: 4.5 },
    reviews: [],
    cancellation: "regular",
    slots: ["10:00", "16:00", "17:30"],
    plan: "basic",
    status: "active",
    insuranceUntil: "01/2027",
    bookingsCount: 52,
  },
  {
    slug: "park-etgarim",
    name: "פארק אתגרים נייד",
    category: "mobile",
    tagline: "עמדות משחק שמגיעות עד אליכם",
    rating: 4.6,
    reviewsCount: 23,
    ageMin: 5,
    ageMax: 14,
    regions: ["שרון", "מרכז", "צפון"],
    regionLabel: "שרון, מרכז וצפון",
    durationLabel: "3 שעות",
    includes: "שש עמדות משחק, שני מפעילים",
    locations: ["park", "hall"],
    verified: true,
    insured: true,
    responseHours: 10,
    packages: [
      { id: "six", name: "שש עמדות", durationMin: 180, maxKids: 60, ageMin: 5, ageMax: 14, price: 2900, includes: "שש עמדות משחק, שני מפעילים", popular: true, active: true },
    ],
    extras: [],
    about: "פארק משחקים נייד עם עמדות כדורגל־שולחן ענק, מטרות ומשחקי זריזות. מתאים לימי משפחות ולאירועי קהילה.",
    facts: [
      { label: "יחס מפעילים", value: "מפעיל לכל 3 עמדות" },
      { label: "עונה", value: "כל השנה" },
      { label: "שפות", value: "עברית" },
      { label: "מתאים גם ל", value: "רשויות, ועדי עובדים" },
    ],
    prepare: ["שטח של 300 מ״ר", "גישה למשאית"],
    sub: baseSub,
    reviews: [],
    cancellation: "strict",
    slots: ["09:00", "13:00", "16:00"],
    plan: "basic",
    status: "active",
    insuranceUntil: "11/2027",
    bookingsCount: 23,
  },
  {
    slug: "pinat-hachai",
    name: "פינת החי הנודדת",
    category: "animals",
    tagline: "מפגש עדין עם בעלי חיים",
    rating: 0,
    reviewsCount: 0,
    ageMin: 3,
    ageMax: 10,
    regions: ["שפלה", "מרכז"],
    regionLabel: "שפלה ומרכז",
    durationLabel: "60 דקות",
    includes: "ארנבים, שרקנים, צב ותוכי",
    locations: ["home", "hall"],
    verified: false,
    insured: true,
    responseHours: 6,
    packages: [
      { id: "meet", name: "מפגש בעלי חיים", durationMin: 60, maxKids: 25, ageMin: 3, ageMax: 10, price: 990, includes: "ארנבים, שרקנים, צב ותוכי", active: true },
    ],
    extras: [],
    about: "מפגש מודרך ועדין עם בעלי חיים קטנים, עם הסבר על טיפול ואחריות.",
    facts: [],
    prepare: [],
    sub: baseSub,
    reviews: [],
    cancellation: "regular",
    slots: ["10:00", "16:00"],
    plan: "basic",
    status: "pending",
    insuranceUntil: "08/2027",
    bookingsCount: 0,
  },
  {
    slug: "mitnapchei-hacarmel",
    name: "מתנפחי הכרמל",
    category: "inflatables",
    tagline: "מתנפחים לכל גיל בצפון",
    rating: 3.6,
    reviewsCount: 19,
    ageMin: 3,
    ageMax: 12,
    regions: ["חיפה והקריות", "צפון"],
    regionLabel: "חיפה והצפון",
    durationLabel: "3 שעות",
    includes: "מתקן אחד, הקמה ופירוק",
    locations: ["home", "park"],
    verified: true,
    insured: true,
    responseHours: 24,
    packages: [{ id: "one", name: "מתקן אחד", durationMin: 180, maxKids: null, ageMin: 3, ageMax: 12, price: 800, includes: "מתקן אחד, הקמה ופירוק", active: true }],
    extras: [],
    about: "",
    facts: [],
    prepare: [],
    sub: { ...baseSub, punctuality: 3.2, asPromised: 3.4 },
    reviews: [],
    cancellation: "flexible",
    slots: ["10:00", "15:00"],
    plan: "basic",
    status: "suspended",
    insuranceUntil: "10/2026",
    bookingsCount: 19,
  },
];

export const operatorBySlug = (slug: string) => operators.find((o) => o.slug === slug);
export const publicOperators = () => operators.filter((o) => o.status === "active");

export const priceFrom = (o: Operator) => Math.min(...o.packages.filter((p) => p.active).map((p) => p.price));

/* ---------------------------------------------------------------- Bookings */

export type BookingStatus = "pending" | "awaiting_payment" | "confirmed" | "completed" | "cancelled" | "declined";

export const statusMeta: Record<BookingStatus, { label: string; tone: Tone; step: number }> = {
  pending: { label: "ממתינה לאישור", tone: "warning", step: 1 },
  awaiting_payment: { label: "ממתינה לתשלום", tone: "accent", step: 3 },
  confirmed: { label: "אושרה", tone: "accent", step: 4 },
  completed: { label: "הושלמה", tone: "success", step: 5 },
  cancelled: { label: "בוטלה", tone: "neutral", step: -1 },
  declined: { label: "נדחתה", tone: "neutral", step: -1 },
};

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

export const statusSteps = ["בקשה נשלחה", "ממתינה לאישור", "אושרה", "ממתינה לתשלום", "הושלמה"];

export type Booking = {
  id: number;
  operatorSlug: string;
  packageId: string;
  customerId: string;
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
  status: BookingStatus;
  createdAt: string;
  paid: number;
  rated: boolean;
  proposal?: { date: string; time: string };
};

export const CURRENT_CUSTOMER = "dana";
export const CURRENT_OPERATOR = "water-battle";
export const COMMISSION = 0.1;
export const DEPOSIT = 0.3;

export const seedBookings: Booking[] = [
  { id: 10482, operatorSlug: "water-battle", packageId: "party", customerId: "dana", customerName: "דנה לוי", customerKind: "parent", phone: "050-0000000", email: "dana@example.com", eventType: "יום הולדת 8", date: "2026-12-11", time: "10:00", city: "רעננה", address: "הרימון 12, רעננה", distanceKm: 18, kids: 22, ageRange: "6–8", locationType: "home", notes: "חצר גדולה עם דשא וברז. ילד אחד אלרגי לבוטנים, אז בלי חטיפים בבקשה. חניה ברחוב.", extras: [], price: 1650, travelFee: 0, status: "pending", createdAt: "2026-11-07T19:12:00", paid: 0, rated: false },
  { id: 10486, operatorSlug: "water-battle", packageId: "mega", customerId: "matnas-rh", customerName: "מתנ״ס רמת השרון", customerKind: "institution", phone: "03-5400000", email: "matnas@example.org", eventType: "מסיבת חנוכה לקהילה", date: "2026-12-11", time: "10:30", city: "רמת השרון", address: "סוקולוב 40, רמת השרון", distanceKm: 9, kids: 40, ageRange: "8–12", locationType: "hall", notes: "אולם ספורט מקורה, יש ניקוז.", extras: [], price: 2400, travelFee: 0, status: "pending", createdAt: "2026-11-07T23:30:00", paid: 0, rated: false },
  { id: 10490, operatorSlug: "water-battle", packageId: "party", customerId: "avraham", customerName: "משפחת אברהם", customerKind: "parent", phone: "052-1111111", email: "avraham@example.com", eventType: "יום הולדת 11", date: "2026-12-24", time: "17:00", city: "הוד השרון", address: "הדקל 3, הוד השרון", distanceKm: 14, kids: 18, ageRange: "10–12", locationType: "home", notes: "", extras: [], price: 1650, travelFee: 0, status: "pending", createdAt: "2026-11-06T11:00:00", paid: 0, rated: false },
  { id: 10455, operatorSlug: "hakosem-noam", packageId: "show", customerId: "dana", customerName: "דנה לוי", customerKind: "parent", phone: "050-0000000", email: "dana@example.com", eventType: "יום הולדת 6", date: "2026-12-18", time: "17:00", city: "כפר סבא", address: "ויצמן 80, כפר סבא", distanceKm: 0, kids: 18, ageRange: "6–8", locationType: "home", notes: "", extras: [], price: 1100, travelFee: 0, status: "awaiting_payment", createdAt: "2026-11-04T10:00:00", paid: 0, rated: false },
  { id: 10471, operatorSlug: "water-battle", packageId: "mega", customerId: "hitech", customerName: "יום משפחות · חברת הייטק", customerKind: "institution", phone: "03-6000000", email: "hr@example.com", eventType: "יום משפחות", date: "2026-12-12", time: "11:00", city: "הרצליה", address: "פארק הרצליה", distanceKm: 6, kids: 40, ageRange: "6–12", locationType: "park", notes: "", extras: [], price: 2400, travelFee: 0, status: "awaiting_payment", createdAt: "2026-11-02T10:00:00", paid: 0, rated: false },
  { id: 10466, operatorSlug: "water-battle", packageId: "party", customerId: "cohen", customerName: "משפחת כהן", customerKind: "parent", phone: "054-2222222", email: "cohen@example.com", eventType: "יום הולדת", date: "2026-12-04", time: "10:00", city: "הרצליה", address: "סוקולוב 5, הרצליה", distanceKm: 6, kids: 20, ageRange: "6–8", locationType: "home", notes: "", extras: [], price: 1650, travelFee: 0, status: "confirmed", createdAt: "2026-10-28T10:00:00", paid: 495, rated: false },
  { id: 10467, operatorSlug: "water-battle", packageId: "basic", customerId: "levin", customerName: "משפחת לוין", customerKind: "parent", phone: "054-3333333", email: "levin@example.com", eventType: "יום הולדת", date: "2026-12-05", time: "10:00", city: "הוד השרון", address: "הבנים 2, הוד השרון", distanceKm: 14, kids: 14, ageRange: "6–8", locationType: "home", notes: "", extras: [], price: 1250, travelFee: 0, status: "confirmed", createdAt: "2026-10-29T10:00:00", paid: 375, rated: false },
  { id: 10468, operatorSlug: "water-battle", packageId: "party", customerId: "mizrahi", customerName: "משפחת מזרחי", customerKind: "parent", phone: "054-4444444", email: "m@example.com", eventType: "יום הולדת", date: "2026-12-05", time: "14:00", city: "נתניה", address: "הרצל 20, נתניה", distanceKm: 22, kids: 24, ageRange: "8–10", locationType: "home", notes: "", extras: [], price: 1650, travelFee: 0, status: "confirmed", createdAt: "2026-10-30T10:00:00", paid: 495, rated: false },
  { id: 10449, operatorSlug: "mada-bakufsa", packageId: "school", customerId: "hadar", customerName: "בית ספר הדר", customerKind: "institution", phone: "09-7000000", email: "hadar@example.org", eventType: "יום מדע", date: "2026-12-09", time: "09:00", city: "רעננה", address: "בית ספר הדר", distanceKm: 0, kids: 70, ageRange: "9–12", locationType: "hall", notes: "", extras: [], price: 2850, travelFee: 0, status: "confirmed", createdAt: "2026-10-20T10:00:00", paid: 855, rated: false },
  { id: 10402, operatorSlug: "water-battle", packageId: "mega", customerId: "hadar", customerName: "בית ספר הדר", customerKind: "institution", phone: "09-7000000", email: "hadar@example.org", eventType: "יום כיף", date: "2026-11-19", time: "09:00", city: "רעננה", address: "בית ספר הדר", distanceKm: 0, kids: 40, ageRange: "9–12", locationType: "park", notes: "", extras: [], price: 2400, travelFee: 0, status: "completed", createdAt: "2026-10-10T10:00:00", paid: 2400, rated: true },
  { id: 10398, operatorSlug: "water-battle", packageId: "basic", customerId: "noa", customerName: "נועה ב.", customerKind: "parent", phone: "050-5555555", email: "noa@example.com", eventType: "יום הולדת", date: "2026-11-14", time: "16:00", city: "רעננה", address: "", distanceKm: 0, kids: 12, ageRange: "6–8", locationType: "home", notes: "", extras: [], price: 1250, travelFee: 0, status: "cancelled", createdAt: "2026-10-08T10:00:00", paid: 0, rated: false },
  { id: 10311, operatorSlug: "mada-bakufsa", packageId: "lab", customerId: "dana", customerName: "דנה לוי", customerKind: "parent", phone: "050-0000000", email: "dana@example.com", eventType: "יום הולדת", date: "2026-10-30", time: "16:00", city: "רעננה", address: "הרימון 12, רעננה", distanceKm: 0, kids: 15, ageRange: "6–8", locationType: "home", notes: "", extras: [], price: 950, travelFee: 0, status: "completed", createdAt: "2026-10-01T10:00:00", paid: 950, rated: false },
  { id: 10250, operatorSlug: "studio-tzeva", packageId: "canvas", customerId: "dana", customerName: "דנה לוי", customerKind: "parent", phone: "050-0000000", email: "dana@example.com", eventType: "יום הולדת", date: "2026-09-11", time: "17:00", city: "רעננה", address: "הרימון 12, רעננה", distanceKm: 0, kids: 12, ageRange: "6–8", locationType: "home", notes: "", extras: [], price: 850, travelFee: 0, status: "completed", createdAt: "2026-08-20T10:00:00", paid: 850, rated: true },
];

/* ----------------------------------------------------------- Formatting */

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

export const packageOf = (b: Booking) => operatorBySlug(b.operatorSlug)?.packages.find((p) => p.id === b.packageId);

export const bookingTotal = (b: Booking) => {
  const op = operatorBySlug(b.operatorSlug);
  const extras = b.extras.reduce((s, id) => s + (op?.extras.find((e) => e.id === id)?.price ?? 0), 0);
  return b.price + b.travelFee + extras;
};
export const depositOf = (b: Booking) => Math.round(bookingTotal(b) * DEPOSIT);

/** Two bookings overlap when the same operator is booked for intersecting windows (+ travel buffer). */
export const overlaps = (a: Booking, b: Booking, bufferMin = 60) => {
  if (a.id === b.id || a.operatorSlug !== b.operatorSlug || a.date !== b.date) return false;
  const pa = packageOf(a)?.durationMin ?? 90;
  const pb = packageOf(b)?.durationMin ?? 90;
  const sa = toMinutes(a.time);
  const sb = toMinutes(b.time);
  return sa < sb + pb + bufferMin && sb < sa + pa + bufferMin;
};

export const isLive = (s: BookingStatus) => s === "pending" || s === "awaiting_payment" || s === "confirmed";

/* ----------------------------------------------------------- Availability
   Demo availability is deterministic so every visitor sees the same calendar. */

export const availableOn = (op: Operator, iso: string) => {
  const d = parseDate(iso);
  return (d.getDate() + d.getMonth() * 31 + op.slug.length) % 6 !== 0;
};

export const availabilityWindow = (op: Operator) => `${op.slots[0]}–${op.slots[op.slots.length - 1]}`;

/** Slots the operator can't take on a date: confirmed/awaiting bookings plus demo blocks. */
export const takenSlots = (op: Operator, iso: string, bookings: Booking[]) => {
  const day = parseDate(iso).getDate();
  const taken = new Set<string>();
  op.slots.forEach((slot, i) => {
    if ((day + i) % 4 === 2) taken.add(slot);
    if (day % 2 === 1 && i === op.slots.length - 1) taken.add(slot);
    const probe = { id: -1, operatorSlug: op.slug, packageId: op.packages[0].id, date: iso, time: slot } as Booking;
    if (bookings.some((b) => (b.status === "awaiting_payment" || b.status === "confirmed") && overlaps(b, probe, 30))) taken.add(slot);
  });
  return taken;
};
