import Image from "next/image";
import WaCta from "@/components/WaCta";
export default function Specs() {
  return (
    <section className="block specs-sec" id="specs">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">מפרט טכני</div>
          <h2 className="sec-title">כל מה שמתחת למעטפת</h2>
          <p className="sec-desc">
            הנדסה מדויקת, רכיבים איכותיים ושליטה מלאה. כל הנתונים במקום אחד.
          </p>
        </div>
        <div className="specs-wrap">
          <div className="specs-media specs-media--product">
            {/* Was a plain <img>, so the 81 KB original shipped whole with no srcset
                to a box that is .9fr of a two-column grid (~45vw) and one column on
                a phone. The optimizer needs `sizes` to know that; without it every
                viewport is quoted 100vw and gets a rendition it cannot use. */}
            {/* The manufacturer's cut-out, supplied 2026-09-02. It replaces a
                900×880 shot in a slot that needs 968px at 2× DPR — the old one was
                short and the browser was upscaling it. This one also carries real
                alpha (a tRNS chunk), so it sits on the white stage without a baked
                background edge.
                ⚠ It is a 256-colour PALETTE png and the palette is FULL, which is
                the fingerprint of a quantised export: on a black body with gradients
                that means banding in the shadows. Nothing downstream can undo it —
                the optimizer re-encodes to AVIF from whatever colours survive. A
                PNG-24 or lossless-WebP original is still worth asking for.
                quality={90} because Next defaults to 75, and 75 on a near-black
                subject is where gradient banding is manufactured rather than merely
                inherited. */}
            <Image
              sizes="(min-width: 1120px) 484px, (max-width: 760px) 100vw, 45vw"
              className="floaty"
              src="/mia-four-x4-hero-cutout.png"
              alt="מיה פור 4×4 Pro Max · מבט חזית-צד, כיסא בשחרור מהיר ומתלים עצמאיים"
              loading="lazy"
              quality={90}
              width={1066}
              height={1141}
            />
          </div>
          <div className="specs-table">
            <div className="spec-row">
              <span className="spec-k">מהירות מרבית</span>
              <span className="spec-v">12 קמ"ש</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">טווח נסיעה</span>
              <span className="spec-v">עד 100 ק"מ ריאלי · יצרן עד 120 ק"מ*</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">מנועים</span>
              <span className="spec-v">2 או 4 · BLDC · 1,800W כל אחד</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">סוללה</span>
              <span className="spec-v">ליתיום נשלפת 60V · 25/35Ah</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">משקל סוללה</span>
              <span className="spec-v">6.3 ק"ג · תאי LG 21700</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">זמן טעינה</span>
              <span className="spec-v">עד 8 שעות · מטען סטנדרטי</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">מידות (ר×א×ג)</span>
              <span className="spec-v">689 × 1,244 × 1,190 מ"מ</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">משקל הקלנועית</span>
              <span className="spec-v">42 ק"ג (דגם <bdi dir="ltr">2×4 City</bdi>) · עד 136 ק"ג עומס</span>
            </div>
            {/* Tyre size. The figure is legible on the sidewall in the wheel close-up
                two sections down (components/Lifestyle.tsx) — but it is published here
                because the OWNER confirmed it on 2026-09-02, not because a photograph
                showed it. Reading a spec off pixels is inference; the same discipline
                that keeps `handNumber` quoted rather than deduced applies to a number
                a buyer will use to order a replacement. Provenance, not decoration. */}
            <div className="spec-row">
              <span className="spec-k">צמיגים</span>
              <span className="spec-v">
                <bdi dir="ltr">14.5×4.8-7</bdi> · צמיגי שטח, חישוקי סגסוגת
              </span>
            </div>
            <div className="spec-row">
              <span className="spec-k">בלמים</span>
              <span className="spec-v">דיסק הידראולי כפול · 140 מ"מ</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">תקן ותקנות</span>
              <span className="spec-v">EN17128 · מותאם לתקנות הקלנועית בישראל</span>
            </div>
          </div>
        </div>
        <div className="sec-wa-out">
          <WaCta cta="specs" variant="ghost" />
        </div>
        <p
          className="spec-note"
          style={{ marginTop: "16px", fontSize: "13px", lineHeight: 1.6, color: "var(--ink-muted)" }}
        >
          * נתון טווח היצרן נמדד בתנאי מעבדה. הטווח בפועל מושפע ממשקל הנהג, תוואי הדרך, תנאי השטח וסגנון הנהיגה.
        </p>
      </div>
    </section>
  );
}
