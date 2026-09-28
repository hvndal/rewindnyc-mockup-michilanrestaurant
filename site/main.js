// Free key from https://web3forms.com, registered to sales@mander.tech.
// Empty = Mander form falls back to a prefilled email.
const WEB3FORMS_KEY = "";
const SALES_EMAIL = "sales@mander.tech";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- loader: logo mark draws in while hero posters load (1.1s min, 2.2s max) ---------- */
(() => {
  const bar = $(".loader__bar i");
  const imgs = $$(".hero video").map(v => v.poster).filter(Boolean);
  const t0 = performance.now();
  let done = 0;
  const finish = () => {
    if (!document.body.classList.contains("is-loading")) return;
    document.body.classList.remove("is-loading");
    requestAnimationFrame(() => document.body.classList.add("is-ready"));
  };
  const tick = () => {
    done++; bar.style.setProperty("--p", done / imgs.length);
    if (done >= imgs.length) setTimeout(finish, Math.max(250, 1100 - (performance.now() - t0)));
  };
  imgs.forEach(src => { const i = new Image(); i.onload = i.onerror = tick; i.src = src; });
  setTimeout(finish, 2200);
})();

/* ---------- nav ---------- */
const nav = $(".nav");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true }); onScroll();
const burger = $("[data-burger]"), sheet = $("[data-sheet]");
burger.addEventListener("click", () => {
  const open = burger.getAttribute("aria-expanded") !== "true";
  burger.setAttribute("aria-expanded", open); sheet.hidden = !open;
});
$$("a", sheet).forEach(a => a.addEventListener("click", () => { sheet.hidden = true; burger.setAttribute("aria-expanded", "false"); }));

/* ---------- video: only play what's on screen ---------- */
const vio = new IntersectionObserver(entries => {
  entries.forEach(({ target: v, isIntersecting }) => {
    if (isIntersecting) {
      if (v.dataset.lazyVideo !== undefined && !v.dataset.loaded) {
        $$("source[data-src]", v).forEach(s => (s.src = s.dataset.src));
        v.load(); v.dataset.loaded = 1;
      }
      if (!reduce) v.play().catch(() => {});
    } else v.pause();
  });
}, { threshold: 0.15 });
$$("video").forEach(v => vio.observe(v));

/* ---------- scroll reveal (visible by default; only hide what's below the fold) ---------- */
if (!reduce && "IntersectionObserver" in window) {
  const els = $$(".reveal").filter(el => el.getBoundingClientRect().top > innerHeight * 0.9);
  els.forEach(el => el.classList.add("pre"));
  const rio = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.remove("pre"); rio.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  els.forEach(el => rio.observe(el));
}

/* ---------- drawers ---------- */
let lastFocus;
function openDrawer(id) {
  const d = document.getElementById(id); if (!d) return;
  lastFocus = document.activeElement;
  d.hidden = false; document.body.classList.add("is-locked");
  requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("is-open")));
  setTimeout(() => $("button, input, select, a", $(".drawer__panel", d))?.focus(), 350);
}
function closeDrawer(d) {
  d.classList.remove("is-open"); document.body.classList.remove("is-locked");
  setTimeout(() => { d.hidden = true; lastFocus?.focus?.(); }, 550);
}
$$("[data-open]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); openDrawer(b.dataset.open); }));
$$(".drawer").forEach(d => $$("[data-close]", d).forEach(c => c.addEventListener("click", () => closeDrawer(d))));
addEventListener("keydown", e => { if (e.key === "Escape") $$(".drawer.is-open").forEach(closeDrawer); });
// Lounge hero panel reserves a table rather than scrolling
$(".hero__panel[data-side='lounge'] .hero__go").addEventListener("click", e => {
  e.preventDefault(); e.stopPropagation(); openDrawer("reserve"); pick($(".choice[data-choice^='Lounge']"));
});

/* ---------- reservation flow ---------- */
const R = { choice: "", guests: "" };
const res = $("#reserve");
const stepLabel = $("#reserve-step");
const dateIn = $("#r-date"), sizeIn = $("#r-size"), timeIn = $("#r-time");
dateIn.min = new Date().toISOString().slice(0, 10);
dateIn.value = (() => { const d = new Date(); d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7)); return d.toISOString().slice(0, 10); })();

function go(n) {
  $$(".step", res).forEach(s => (s.hidden = +s.dataset.step !== n));
  stepLabel.textContent = `Step ${n} of 3`;
}
function pick(btn) {
  if (!btn) return;
  R.choice = btn.dataset.choice.replace("&amp;", "&"); R.guests = btn.dataset.guests;
  $("[data-picked]", res).textContent = `${R.choice} · ${R.guests} guests`;
  const [lo, hi] = R.guests.split("–").map(Number);
  sizeIn.min = lo; sizeIn.max = hi; sizeIn.value = Math.min(Math.max(+sizeIn.value || lo, lo), hi);
  hint(); go(2);
}
function hint() {
  const d = new Date(dateIn.value + "T12:00"), n = +sizeIn.value;
  const [lo, hi] = (R.guests || "1–30").split("–").map(Number);
  const h = $("[data-hint]", res);
  if (d.getDay() === 2) h.textContent = "Rewind is closed on Tuesdays — try another night.";
  else if (n > hi) h.textContent = `That's more than this room holds. Try a bigger room or a private event.`;
  else if (n < lo) h.textContent = `This room starts at ${lo} guests.`;
  else if ((d.getDay() === 5 || d.getDay() === 6) && /pm/.test(timeIn.value) && parseInt(timeIn.value) >= 10 && R.choice.includes("Karaoke"))
    h.textContent = "Friday and Saturday after 10pm is a flat minimum spend for the night.";
  else h.textContent = "";
}
$$(".choice", res).forEach(b => b.addEventListener("click", () => pick(b)));
[dateIn, sizeIn, timeIn].forEach(i => i.addEventListener("input", hint));
$$("[data-back]", res).forEach(b => b.addEventListener("click", () => go(+b.closest(".step").dataset.step - 1)));
$("[data-next]", res).addEventListener("click", e => {
  const b = e.currentTarget; const [lo, hi] = R.guests.split("–").map(Number); const n = +sizeIn.value;
  if (!dateIn.value || n < lo || n > hi || new Date(dateIn.value + "T12:00").getDay() === 2) { hint(); return; }
  b.classList.add("is-busy"); b.disabled = true;
  setTimeout(() => {
    b.classList.remove("is-busy"); b.disabled = false;
    const nice = new Date(dateIn.value + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    $("[data-summary]", res).innerHTML =
      `<div><span>Experience</span><b>${R.choice}</b></div><div><span>Date</span><b>${nice}</b></div><div><span>Arrival</span><b>${timeIn.value}</b></div><div><span>Guests</span><b>${n}</b></div>`;
    const u = new URL("https://www.sevenrooms.com/explore/rewindnyc/reservations/create/search/");
    u.searchParams.set("date", dateIn.value); u.searchParams.set("party_size", n);
    $("[data-sevenrooms]", res).href = u.toString();
    go(3);
  }, reduce ? 0 : 650);
});

/* ---------- form helpers ---------- */
function validate(form) {
  let first = null;
  $$(".field", form).forEach(f => { f.classList.remove("is-error"); $(".err", f)?.remove(); });
  $$("[required]", form).forEach(i => {
    let msg = "";
    if (!i.value.trim()) msg = "Required";
    else if (i.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value)) msg = "Check this email address";
    else if (i.type === "number" && i.max && +i.value > +i.max) msg = `Up to ${i.max} — for more, choose a full buyout`;
    if (msg) {
      const f = i.closest(".field"); f.classList.add("is-error");
      f.insertAdjacentHTML("beforeend", `<span class="err">${msg}</span>`);
      first ||= i;
    }
  });
  const t1 = form.startTime?.value, t2 = form.endTime?.value;
  if (t1 && t2 && t2 <= t1 && !form.endDate?.value) {
    const f = form.endTime.closest(".field"); f.classList.add("is-error");
    f.insertAdjacentHTML("beforeend", `<span class="err">Ends after midnight? Add an end date.</span>`);
    first ||= form.endTime;
  }
  first?.focus();
  return !first;
}
function busy(btn, on) { btn.classList.toggle("is-busy", on); btn.disabled = on; }
function status(form, text, kind) { const s = $(".form__status", form); s.textContent = text; s.className = "form__status" + (kind ? " is-" + kind : ""); }

/* Rewind forms: demo only, nothing leaves the page */
const ev = $("#eventForm");
$("#ev-start").min = new Date().toISOString().slice(0, 10);
ev.addEventListener("submit", e => {
  e.preventDefault();
  if (!validate(ev)) { status(ev, "A few details are missing.", "error"); return; }
  status(ev, "Sending…"); busy($("button[type=submit]", ev), true);
  setTimeout(() => { busy($("button[type=submit]", ev), false); status(ev, ""); $(".form__done", ev).hidden = false; }, 900);
});
$("[data-reset]", ev).addEventListener("click", () => { ev.reset(); $(".form__done", ev).hidden = true; });

const cf = $("#contactForm");
cf.addEventListener("submit", e => {
  e.preventDefault();
  if (!validate(cf)) return;
  busy($("button[type=submit]", cf), true); status(cf, "Sending…");
  setTimeout(() => { busy($("button[type=submit]", cf), false); cf.reset(); status(cf, "Message sent. The team will reply by email. (Demo)", "ok"); }, 800);
});
$$(".field input, .field select, .field textarea").forEach(i => i.addEventListener("input", () => {
  const f = i.closest(".field"); if (f.classList.contains("is-error")) { f.classList.remove("is-error"); $(".err", f)?.remove(); }
}));

/* Mander form: real delivery via Web3Forms, else prefilled email */
const mf = $("#manderForm");
mf.addEventListener("submit", async e => {
  e.preventDefault();
  if (!validate(mf)) return;
  const btn = $("button[type=submit]", mf);
  const data = { name: mf.name.value, email: mf.email.value, message: mf.message.value };
  if (!WEB3FORMS_KEY) {
    const body = `${data.message}\n\n— ${data.name} (${data.email})`;
    location.href = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent("Rewind redesign — let's talk")}&body=${encodeURIComponent(body)}`;
    status(mf, `Opening your email app… if nothing happens, write to ${SALES_EMAIL}.`, "ok");
    return;
  }
  busy(btn, true); status(mf, "Sending…");
  try {
    const r = await fetch("https://api.web3forms.com/submit", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: "Rewind redesign — client reply", from_name: "Rewind concept site", ...data })
    });
    const j = await r.json();
    if (!j.success) throw new Error(j.message);
    status(mf, "Sent — we'll be in touch within a day.", "ok");
  } catch {
    status(mf, `Couldn't send. Email ${SALES_EMAIL} directly.`, "error");
  } finally { busy(btn, false); }
});

/* ---------- Five Elements cocktail tabs ---------- */
(() => {
  const tabs = $$(".elements__tabs [role=tab]"), stage = $("#el-stage");
  if (!tabs.length) return;
  const img = $("[data-el-img]", stage);
  let warm = false;
  const preload = () => { if (warm) return; warm = true; tabs.forEach(t => { new Image().src = t.dataset.img; }); };
  const select = (t, focus) => {
    if (t.getAttribute("aria-selected") === "true") return;
    tabs.forEach(x => { const on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; });
    if (focus) t.focus();
    stage.setAttribute("aria-labelledby", t.id);
    stage.classList.add("is-swapping");
    setTimeout(() => {
      img.src = t.dataset.img;
      img.alt = `${t.dataset.name}, a ${t.dataset.el} (${t.dataset.flavor.toLowerCase()}) cocktail at Rewind`;
      $("[data-el-cn]", stage).textContent = t.dataset.cn;
      $("[data-el-meta]", stage).textContent = `${t.dataset.el} · ${t.dataset.flavor}`;
      $("[data-el-name]", stage).textContent = t.dataset.name;
      const show = () => stage.classList.remove("is-swapping");
      img.complete ? show() : (img.onload = show);
    }, reduce ? 0 : 260);
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("pointerenter", preload, { once: true });
    t.addEventListener("keydown", e => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { preload(); o.disconnect(); } }, { rootMargin: "400px" }).observe(stage);
})();

/* ---------- dish rail ---------- */
(() => {
  const track = $("[data-rail-track]"); if (!track) return;
  const btns = $$("[data-rail]");
  const step = () => (track.firstElementChild?.getBoundingClientRect().width || 280) * 2;
  const sync = () => {
    btns[0].disabled = track.scrollLeft < 8;
    btns[1].disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
  };
  btns.forEach(b => b.addEventListener("click", () => track.scrollBy({ left: step() * +b.dataset.rail, behavior: reduce ? "auto" : "smooth" })));
  track.addEventListener("scroll", sync, { passive: true }); addEventListener("resize", sync); sync();
})();

/* ---------- rooms open the booking drawer preselected ---------- */
$$(".room").forEach(room => {
  const btn = $(".room__book", room); if (!btn) return;
  const book = () => { openDrawer("reserve"); pick($(`.choice[data-choice="${btn.dataset.book}"]`)); };
  btn.addEventListener("click", book);
  $("figure", room).addEventListener("click", book);
});

/* ---------- mobile dock: after the hero, hidden over forms and footer ---------- */
(() => {
  const dock = $("[data-dock]"); if (!dock) return;
  const state = { pastHero: false, blocked: new Set() };
  const render = () => {
    const on = state.pastHero && state.blocked.size === 0;
    dock.classList.toggle("is-on", on);
    dock.setAttribute("aria-hidden", !on);
    $$("a,button", dock).forEach(el => (el.tabIndex = on ? 0 : -1));
  };
  new IntersectionObserver(([e]) => { state.pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; render(); }).observe($(".hero"));
  const bo = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? state.blocked.add(e.target) : state.blocked.delete(e.target)); render(); });
  ["#eventForm", ".foot", ".mander"].forEach(sel => { const el = $(sel); el && bo.observe(el); });
})();

/* ---------- nav: highlight the section in view ---------- */
(() => {
  const links = $$(".nav__links a");
  const map = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
  const so = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { links.forEach(a => a.classList.remove("is-active")); map.get(e.target.id)?.classList.add("is-active"); }
  }), { rootMargin: "-45% 0px -50% 0px" });
  map.forEach((_, id) => { const el = document.getElementById(id); el && so.observe(el); });
})();
