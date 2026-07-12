// brain/masters.ts — Master specialists (Sonnet tier): domain quality decisions.
//
// Each Master is GROUNDED in retrieved knowledge and encodes one piece of the unique
// methodology: Big Five matching, deal construction, content generation, support
// triage. Masters never invent prices/specs — they answer only from the RAG context.
import { router } from "./router";
import { retrieve } from "./knowledge";
import type { MasterName } from "./ultra";
import type { AgentResult } from "./types";

async function groundedContext(query: string): Promise<{ context: string; sources: string[] }> {
  const docs = await retrieve(query);
  return {
    context: docs.map((d) => `[${d.source}] ${d.text}`).join("\n"),
    sources: docs.map((d) => d.source)
  };
}

const SYSTEM: Record<MasterName, string> = {
  match:
    "אתה Match-Master של MiaMe. בעזרת מודל Big Five (OCEAN) התאם בין פרופיל הלקוח לדגם/מסלול " +
    "(2×4 City · 2×4 City Long Range · 4×4 Pro Max · השכרה Hub). הסבר את ההתאמה בקצרה. אל תמציא מחירים/מפרט מעבר להקשר.",
  deal:
    "אתה Deal-Master של MiaMe. בנה הצעת עסקה (דגם, מקדמה 0%–50%, 3–18 תשלומים, חודשי) והסבר ערך — " +
    "עד 18 תשלומים ללא ריבית והצמדה, ללא תשלום בלון. כל מספר חייב להישען על ההקשר שסופק; " +
    "אם חסר נתון — אמור שתבדוק, אל תנחש.",
  content:
    "אתה Content-Master של MiaMe. מעסקה סגורה צור סיפור הצלחה אנונימי קצר ל-SEO/GEO בקול המותג, " +
    "בלי פרטים מזהים.",
  support:
    "אתה Support-Master של MiaMe. תעדף ונסח תשובת שירות. נושאי בטיחות/סוללה — הסלם לאדם, אל תייעץ טכנית.",
  concierge:
    "אתה AskBrain של MiaMe.co.il — מומחה מוצר, לא צ'אט קליל. ענה בעברית קצרה, יוקרתית וברורה " +
    "(2-3 משפטים). עזור למשתמש לבחור מסלול: רכישה, זכאות כוחות הביטחון, השכרה באילת או שותפות " +
    "MiaMe Hub. בסס כל מספר/מפרט אך ורק על ההקשר המבוסס-מקור; אל תמציא. אל תבטיח מימון, זכאות, " +
    "ביטוח, מחיר סופי, זמינות או אישור/unlock אוטומטי — הכול בכפוף לאישור עסקה ולתנאי החברה/היבואן. " +
    "שאל לכל היותר שאלה אחת, וסיים בפעולה אחת בלבד לפי ההקשר (בדרך כלל המשך בוואטסאפ). ללא emoji מוגזם."
};

export async function runMaster(name: MasterName, input: string): Promise<AgentResult> {
  const { context, sources } = await groundedContext(input);
  const { text: output } = await router.generate({
    task: "reason",
    system: `${SYSTEM[name]}\n\nהקשר מבוסס-מקור:\n${context}`,
    user: input
  });
  return {
    agent: name,
    tier: "master",
    output,
    grounded: sources.length > 0,
    notes: sources.join(", ")
  };
}
