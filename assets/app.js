/* =========================================================
   MiaMe · app.js
   Models · payment simulator · WhatsApp routing · lead form
   Compliance: estimate only, no online clearing. CTA -> WhatsApp / human close.
   ========================================================= */
(() => {
  "use strict";

  /* ---- config (swap WHATSAPP with the real number, digits only, intl format) ---- */
  const CONFIG = {
    // MiaMe business WhatsApp · override at runtime with window.MIAME_WHATSAPP
    whatsapp: window.MIAME_WHATSAPP || "972547477477",
    defaultModel: "pro-max",
  };

  /* ---- Mia Four lineup (final · prices per founder, 0% interest) ----
     All prices shown as non-binding estimates per the on-page disclosure. */
  const MODELS = [
    {
      id: "city", name: "מיה פור · City", platform: "4×2", emoji: "🛵",
      sub: "2 מנועים · עיר ויומיום", price: 19900, featured: false,
      specs: [["מנועים", "2 · 1,800W"], ["סוללה", "60V · 25Ah"], ["טווח", "עד ~60 ק״מ"], ["משקל", "42 ק״ג"]],
    },
    {
      id: "city-max", name: "מיה פור · City Max Range", platform: "4×2", emoji: "🔋",
      sub: "2 מנועים · סוללת טווח מורחב", price: 21900, featured: false, tag: "טווח מורחב",
      specs: [["מנועים", "2 · 1,800W"], ["סוללה", "60V · 35Ah נשלפת"], ["טווח", "עד 100 ק״מ"], ["משקל", "43 ק״ג"]],
    },
    {
      id: "pro-max", name: "מיה פור · Pro Max", platform: "4×4", emoji: "🚀",
      sub: "4 מנועים · הנעה כפולה לשטח", price: 27900, featured: true, tag: "הנמכר ביותר",
      specs: [["מנועים", "4 · 1,800W"], ["סוללה", "60V · 35Ah נשלפת"], ["טווח", "עד 100 ק״מ"], ["משקל", "48 ק״ג"]],
    },
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const ils = (n) => "₪" + Math.round(n).toLocaleString("en-US");
  const modelById = (id) => MODELS.find((m) => m.id === id) || MODELS[0];

  /* ===================== nav ===================== */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = $("#navToggle");
  const closeMenu = () => { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); };
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  $$(".nav__links a").forEach((a) => a.addEventListener("click", closeMenu));

  /* ===================== reveal on scroll ===================== */
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" })
    : null;
  $$(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("is-in")));

  /* ===================== animated stats ===================== */
  $$("b[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const obs = new IntersectionObserver((ents) => {
      ents.forEach((ent) => {
        if (!ent.isIntersecting) return;
        obs.disconnect();
        const dur = 1100; const start = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - start) / dur);
          const val = Math.round(target * (1 - Math.pow(1 - p, 3)));
          el.textContent = prefix + val.toLocaleString("en-US") + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    obs.observe(el);
  });

  /* ===================== models render ===================== */
  const grid = $("#modelsGrid");
  if (grid) {
    grid.innerHTML = MODELS.map((m) => `
      <article class="model-card${m.featured ? " is-featured" : ""}" data-model="${m.id}" tabindex="0" role="button" aria-label="בחר ${m.name}">
        ${m.tag ? `<span class="model-card__tag">${m.tag}</span>` : ""}
        <div class="model-card__art" aria-hidden="true">${m.emoji}</div>
        <h3>${m.name}</h3>
        <p class="model-card__sub">${m.platform} · ${m.sub}</p>
        <ul class="model-card__specs">
          ${m.specs.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join("")}
        </ul>
        <div class="model-card__price"><small>החל מ־</small><b>${ils(m.price)}</b></div>
        <span class="btn btn--ghost">בחרו דגם זה ←</span>
      </article>`).join("");

    const pick = (id) => {
      const sel = $("#simModel"); if (sel) sel.value = id;
      sync();
      $("#simulator").scrollIntoView({ behavior: "smooth", block: "start" });
    };
    $$(".model-card", grid).forEach((c) => {
      c.addEventListener("click", () => pick(c.dataset.model));
      c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(c.dataset.model); } });
    });
  }

  /* populate model selects */
  const optionsHTML = MODELS.map((m) => `<option value="${m.id}">${m.name} · ${ils(m.price)}</option>`).join("");
  ["#simModel", "#leadModel"].forEach((sel) => { const el = $(sel); if (el) el.innerHTML = optionsHTML; });
  const simModel = $("#simModel");
  if (simModel) simModel.value = CONFIG.defaultModel;
  const leadModel = $("#leadModel");
  if (leadModel) leadModel.value = CONFIG.defaultModel;

  /* ===================== simulator ===================== */
  const down = $("#down"), balloon = $("#balloon"), term = $("#term");
  let track = "private";

  const fillRange = (el) => {
    const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
    el.style.setProperty("--fill", pct + "%");
  };

  const sync = () => {
    if (!simModel) return;
    const m = modelById(simModel.value);
    const price = m.price;
    const dPct = Number(down.value), bPct = Number(balloon.value), months = Number(term.value);
    const dAmt = price * dPct / 100;
    const bAmt = price * bPct / 100;
    const financed = Math.max(0, price - dAmt - bAmt);
    const monthly = financed / months;

    $("#downOut").textContent = ils(dAmt);
    $("#balloonOut").textContent = ils(bAmt);
    $("#downPct").textContent = dPct + "% מהמחיר";
    $("#balloonPct").textContent = bPct + "% מהמחיר";
    $("#termOut").textContent = months + " ח׳";
    $("#monthly").textContent = ils(monthly);
    $("#full").textContent = ils(price);
    $("#financed").textContent = ils(financed);
    $("#periodOut").textContent = months + " ח׳";
    [down, balloon, term].forEach(fillRange);
  };

  [down, balloon, term].forEach((el) => el && el.addEventListener("input", sync));
  if (simModel) simModel.addEventListener("change", sync);

  $$(".seg__btn").forEach((b) => b.addEventListener("click", () => {
    $$(".seg__btn").forEach((x) => { x.classList.remove("is-active"); x.setAttribute("aria-selected", "false"); });
    b.classList.add("is-active"); b.setAttribute("aria-selected", "true");
    track = b.dataset.track;
  }));

  /* current simulator state -> human-readable WhatsApp message */
  const simMessage = () => {
    const m = modelById(simModel.value);
    const months = Number(term.value);
    return `היי MiaMe 🛵 אני מעוניין/ת ב${m.name} (${m.platform}).\n` +
      `מסלול: ${track === "business" ? "שותף עסקי" : "לקוח פרטי"}\n` +
      `מחיר: ${$("#full").textContent} · מקדמה: ${$("#downOut").textContent} · בלון: ${$("#balloonOut").textContent}\n` +
      `${months} תשלומים · תשלום חודשי משוער: ${$("#monthly").textContent} (0% ריבית)\n` +
      `אשמח להצעה אישית.`;
  };

  /* ===================== WhatsApp routing ===================== */
  const waLink = (msg) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  const DEFAULT_MSG = "היי MiaMe 🛵 אשמח לקבל הצעת תשלום למיה פור";

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-wa]");
    if (!t) return;
    e.preventDefault();
    const isSim = t.id === "confirmDeal" || t.id === "askWa";
    const msg = isSim ? simMessage() : (t.dataset.waMsg || DEFAULT_MSG);
    window.open(waLink(msg), "_blank", "noopener");
  });

  /* ===================== lead form ===================== */
  const form = $("#leadForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = $("#leadStatus");
      const btn = $("#leadSubmit");
      const data = Object.fromEntries(new FormData(form).entries());
      const m = modelById(data.model);
      data.model_name = m ? m.name : data.model;
      data.source = "miame.co.il";
      data.track = "private";

      if (!data.name || !data.phone) {
        status.textContent = "נא למלא שם וטלפון"; status.className = "lead-form__status is-err"; return;
      }

      btn.disabled = true; status.textContent = "שולח…"; status.className = "lead-form__status";

      // Try to persist the lead (optional backend). The funnel works regardless via WhatsApp.
      try {
        await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch (_) { /* no backend yet -> WhatsApp is the channel */ }

      const msg = `היי MiaMe 🛵 ${data.name} (${data.phone}).\nמתעניין/ת ב${data.model_name}.` +
        (data.note ? `\nהערה: ${data.note}` : "");
      window.open(waLink(msg), "_blank", "noopener");

      status.textContent = "נפתחה שיחת וואטסאפ ✓ נחזור אליכם מיד";
      status.className = "lead-form__status is-ok";
      btn.disabled = false; form.reset();
      if (leadModel) leadModel.value = CONFIG.defaultModel;
    });
  }

  /* init */
  sync();
})();
