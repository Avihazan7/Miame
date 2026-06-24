// brain/knowledge.ts — RAG knowledge layer (ULEASE_SPEC §7.1).
//
// The corpus (specs, battery docs, maintenance SLAs, regulation, happy-path stories)
// belongs in pgvector and is fed by events — NOT fine-tuned (D-022: RAG over
// retraining). This is the interface plus a seed corpus so the brain answers
// grounded questions on day one. Swap `retrieve` for a real vector query later.

export interface KnowledgeDoc {
  id: string;
  source: string; // provenance — REQUIRED so Guardian's grounding gate can pass
  text: string;
  score?: number;
}

const SEED: KnowledgeDoc[] = [
  { id: "spec-range", source: "MiaMe/Specs", text: 'טווח שימוש ריאלי עד 100 ק"מ; נתון יצרן עד 120 ק"מ.' },
  { id: "spec-motor", source: "MiaMe/Specs", text: "2 או 4 מנועים, 1,800W כל אחד; סוללת ליתיום נשלפת 60V 25/35Ah." },
  { id: "price-4x2", source: "MiaMe/Models", text: "מיה פור 4×2 — מחיר MiaMe החל מ-19,900 ₪." },
  { id: "rental", source: "MiaMe/Hub", text: "השכרה החל מ-50 ₪ לשעה; שותף משלם 13% Success Fee מהפניות בלבד." }
];

export async function retrieve(query: string, k = 4): Promise<KnowledgeDoc[]> {
  // TODO: replace with pgvector cosine search. Until then, naive keyword overlap
  // over the seed corpus keeps the grounding contract real rather than faked.
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = SEED.map((d) => {
    const hay = d.text.toLowerCase();
    return { ...d, score: words.filter((w) => hay.includes(w)).length };
  });
  return scored.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, k);
}
