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
  // THE TRACK LIST IS THE PRODUCTS WE SELL, AND ONLY THOSE. It read
  // "· השכרה Hub" until 2026-09-09 — a rental Hub that does not exist. The owner
  // settled it on 2026-09-02 (supabase/phases.json, phase 9-rental-fleet-os: "no
  // rental, no business partners"), phase 18 removed the rental surfaces and
  // /rent-eilat answers 410. This is the SYSTEM PROMPT, so the instruction ran on
  // every conversation, not only on the offline path: the model was being told a
  // rental track was one of the answers. Same defect the 2026-09-09 audit found in
  // this file and did not finish — one instance survived it.
  match:
    "אתה Match-Master של MiaMe. בעזרת מודל Big Five (OCEAN) התאם בין פרופיל הלקוח לדגם " +
    "(2×4 City · 2×4 City Long Range · 4×4 Pro Max). הסבר את ההתאמה בקצרה. אל תמציא מחירים/מפרט מעבר להקשר.",
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
    "(2-3 משפטים). עזור למשתמש לבחור מסלול: רכישה, זכאות כוחות הביטחון או הרשמה מוקדמת ל-SPYQE. " +
    "בסס כל מספר/מפרט אך ורק על ההקשר המבוסס-מקור; אל תמציא. אל תבטיח מימון, זכאות, " +
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
