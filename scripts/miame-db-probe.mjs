// scripts/miame-db-probe.mjs — פסק-הדין "ה-DB של MiaMe עונה?" עבור arch-guardian.
//
// טהור: אין כאן I/O. arch-guardian.mjs מבצע את ה-GET ומעביר לכאן את התוצאה, כך
// שפסק-הדין נבדק בלי רשת (test/archGuardianDbProbe.test.ts).
//
// למה זה קיים: פרויקט ה-Supabase של MiaMe מושהה לפחות מאז 14.09.26, ו-arch-guardian
// רץ עליו 10 פעמים (ריצות 487–496, 28–30.09.26) ונשאר ירוק — בדיקות ה-live שלו
// בודקות דפים ואת /api/lead, ואף אחד מהם לא נוגע במסד. GET /api/embed קורא את
// public.knowledge ומחזיר pending=-1 כשהקריאה נכשלת (app/api/embed/route.ts), ולכן
// מספר שלם ≥ 0 הוא הוכחה שהמסד ענה.

/** טוקן האדמין נשלח רק ל-host של MiaMe, ורק ב-https. */
export function tokenMayGoTo(base) {
  try {
    const u = new URL(base);
    return u.protocol === 'https:' && /^(www\.)?miame\.co\.il$/.test(u.hostname);
  } catch {
    return false;
  }
}

/**
 * @param {{ tokenPresent: boolean, hostAllowed: boolean,
 *           probe: null | { ok: boolean, status: number, body?: string, error?: string } }} input
 * @returns {{ status: 'pass' | 'warn' | 'fail', detail: string }}
 */
export function classifyDbProbe({ tokenPresent, hostAllowed, probe }) {
  // לא רצה ≠ עברה. warn מופיע בסיכום ולא פותח Issue; היעדר הסוד בריפו כבר מפיל
  // את knowledge-embed.yml מדי יום, כך שיש לו אות רועש משלו.
  if (!tokenPresent) {
    return { status: 'warn', detail: 'EMBED_ADMIN_TOKEN לא הועבר לשלב — בדיקת המסד לא רצה' };
  }
  if (!hostAllowed) {
    return { status: 'warn', detail: 'הטוקן נשלח רק ל-https://(www.)miame.co.il — בדיקת המסד לא רצה' };
  }
  if (!probe || !probe.ok) {
    return { status: 'fail', detail: `אין מענה מ-/api/embed: ${probe?.error ?? 'unknown'}` };
  }
  // redirect ידני: 3xx כאן הוא כשל תצורה, לא סיבה לשלוח את הטוקן הלאה.
  if (probe.status !== 200) {
    return { status: 'fail', detail: `/api/embed החזיר HTTP ${probe.status}` };
  }
  let pending;
  try {
    pending = JSON.parse(probe.body || '').pending;
  } catch {
    pending = undefined;
  }
  if (!Number.isInteger(pending) || pending < 0) {
    return {
      status: 'fail',
      detail: `המסד לא נקרא (pending=${JSON.stringify(pending)}) — בדקו שפרויקט ה-Supabase של MiaMe פעיל`,
    };
  }
  // נגישות בלבד. שורות בלי ווקטור הן עניינו של השער היומי ב-knowledge-embed.yml.
  return { status: 'pass', detail: `המסד עונה · pending=${pending}` };
}
