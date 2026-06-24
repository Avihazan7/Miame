// brain/masters.ts — Master specialists (Sonnet tier): domain quality decisions.
//
// Each Master is GROUNDED in retrieved knowledge and encodes one piece of the unique
// methodology: Big Five matching, deal construction, content generation, support
// triage. Masters never invent prices/specs — they answer only from the RAG context.
import { callModel } from "./client";
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
    "(4×2 · 2×4 LR · 4×4 · השכרה Hub). הסבר את ההתאמה בקצרה. אל תמציא מחירים/מפרט מעבר להקשר.",
  deal:
    "אתה Deal-Master של MiaMe. בנה הצעת עסקה (דגם, מקדמה, בלון, תקופה, חודשי) והסבר ערך. " +
    "כל מספר חייב להישען על ההקשר שסופק; אם חסר נתון — אמור שתבדוק, אל תנחש.",
  content:
    "אתה Content-Master של MiaMe. מעסקה סגורה צור סיפור הצלחה אנונימי קצר ל-SEO/GEO בקול המותג, " +
    "בלי פרטים מזהים.",
  support:
    "אתה Support-Master של MiaMe. תעדף ונסח תשובת שירות. נושאי בטיחות/סוללה — הסלם לאדם, אל תייעץ טכנית."
};

export async function runMaster(name: MasterName, input: string): Promise<AgentResult> {
  const { context, sources } = await groundedContext(input);
  const output = await callModel({
    tier: "master",
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
