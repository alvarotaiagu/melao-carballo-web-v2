// This template's motion is deliberately lighter than the other Melao
// templates: no GSAP/ScrollTrigger/Lenis. Everything here is plain CSS
// transitions triggered by IntersectionObserver, which suits a reusable
// bento-grid template better — one dependency-free file any client site
// can drop in as-is.

const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- Mega-menu drawer (grid of tappable tiles) ---------- */
(function initSiteMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("site-menu");
  const closeBtn = menu ? menu.querySelector("[data-menu-close]") : null;
  if (!toggle || !menu) return;

  function open() {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add("is-open"));
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeydown);
  }
  function close() {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; }, 300);
  }
  function onKeydown(e) {
    if (e.key === "Escape") { close(); toggle.focus(); }
  }
  toggle.addEventListener("click", () => {
    toggle.getAttribute("aria-expanded") === "true" ? close() : open();
  });
  closeBtn && closeBtn.addEventListener("click", () => { close(); toggle.focus(); });
  menu.querySelectorAll(".menu-tile").forEach((a) => a.addEventListener("click", close));
})();

/* ---------- Cookie notice ---------- */
(function initCookieBanner() {
  const banner = document.querySelector(".cookie-banner");
  const ackBtn = document.querySelector(".cookie-ack");
  if (!banner || !ackBtn) return;
  const KEY = "melao-bento-cookie-ack";
  let acknowledged = false;
  try { acknowledged = localStorage.getItem(KEY) === "1"; } catch (e) {}
  if (!acknowledged) banner.hidden = false;
  ackBtn.addEventListener("click", () => {
    banner.hidden = true;
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
  });
})();

/* ---------- WhatsApp FAB: appears once past the hero ---------- */
(function initWhatsappFab() {
  const fab = document.querySelector(".whatsapp-fab");
  const hero = document.getElementById("top");
  if (!fab || !hero) return;
  const observer = new IntersectionObserver(([entry]) => {
    fab.classList.toggle("is-visible", !entry.isIntersecting);
  });
  observer.observe(hero);
})();

/* ---------- Map: loads Google's iframe only on click ---------- */
(function initMapConsent() {
  document.querySelectorAll(".map-consent").forEach((btn) => {
    btn.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.title = btn.dataset.mapTitle || "Mapa";
      iframe.src = btn.dataset.mapSrc;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      btn.replaceWith(iframe);
    }, { once: true });
  });
})();

/* ---------- Opening hours: live "open now" + today highlight.
   Same confirmed real hours as the other Melao templates. Two status
   readouts exist on this page (hero cell + Encuéntranos cell) since the
   bento layout repeats the "open now" signal in two different cells. ---------- */
const OPENING_HOURS = {
  1: [], 2: [], 3: [],
  4: [["09:00", "13:30"]],
  5: [["09:00", "13:30"], ["20:00", "00:00"]],
  6: [["09:00", "13:30"], ["20:00", "00:00"]],
  0: [["10:00", "14:00"], ["20:00", "23:30"]],
};
function toMinutes(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
function isOpenAt(date) {
  const day = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();
  const today = OPENING_HOURS[day] || [];
  const yesterday = OPENING_HOURS[(day + 6) % 7] || [];
  const openNow = today.some(([open, close]) => {
    const o = toMinutes(open), c = toMinutes(close);
    return c > o ? minutes >= o && minutes < c : minutes >= o;
  });
  if (openNow) return true;
  return yesterday.some(([open, close]) => {
    const o = toMinutes(open), c = toMinutes(close);
    return c <= o && minutes < c;
  });
}
(function initOpeningHours() {
  const statusEls = [document.getElementById("hours-status-text"), document.getElementById("hours-status-text-2")].filter(Boolean);
  const list = document.getElementById("hours-list");
  const dots = document.querySelectorAll(".live-dot");
  if (!statusEls.length && !list) return;
  function update() {
    const now = new Date();
    if (list) list.querySelectorAll("li").forEach((li) => li.classList.toggle("is-today", Number(li.dataset.day) === now.getDay()));
    const open = isOpenAt(now);
    const label = open ? "Abierto ahora" : "Cerrado ahora";
    statusEls.forEach((el) => { el.textContent = label; });
    dots.forEach((dot) => dot.classList.toggle("is-closed", !open));
  }
  update();
  setInterval(update, 60000);
})();

/* ---------- Generic bento filter: powers both the menu category chips
   and the gallery day/night chips with the same plain-JS logic. Cards
   not matching the active filter get [hidden] so the CSS grid's
   auto-flow: dense repacks the remaining ones without gaps. ---------- */
function initFilterGrid(group) {
  const buttons = Array.from(group.querySelectorAll("[data-filter-value]"));
  const targetSelector = group.dataset.filterTarget;
  if (!buttons.length || !targetSelector) return;
  const section = group.closest("section");
  const cards = section ? Array.from(section.querySelectorAll(targetSelector)) : [];
  const empty = section ? section.querySelector("[data-filter-empty]") : null;
  if (!cards.length) return;

  function apply(value) {
    let visible = 0;
    cards.forEach((card) => {
      const match = value === "todos" || card.dataset.category === value;
      card.hidden = !match;
      if (match) visible++;
    });
    if (empty) empty.hidden = visible !== 0;
  }
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.toggle("is-active", b === btn));
      apply(btn.dataset.filterValue);
    });
  });
  apply("todos");
}
document.querySelectorAll("[data-filter-group]").forEach(initFilterGrid);

/* ---------- Cifras: count-up on scroll into view (rAF tween, no GSAP) ---------- */
function animateCount(el) {
  const target = parseFloat(el.dataset.countTo);
  const decimals = Number(el.dataset.countDecimals || 0);
  const isYear = el.dataset.countFormat === "year";
  const format = (v) => (isYear ? String(Math.round(v)) : v.toFixed(decimals));
  if (reduceQuery.matches) { el.textContent = format(target); return; }
  const duration = 1200;
  const start = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = format(target * eased);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
(function initCifras() {
  const items = document.querySelectorAll(".cifra-number");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) { items.forEach(animateCount); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { animateCount(entry.target); io.unobserve(entry.target); }
    });
  }, { threshold: 0.6 });
  items.forEach((el) => io.observe(el));
})();

/* ---------- Gallery lightbox: re-scanned whenever the day/night filter
   changes the set of visible cards, so it always matches what's on
   screen. ---------- */
let lightboxApi = null;
function rebuildLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;
  const triggers = Array.from(document.querySelectorAll("[data-photo-card]")).filter((el) => !el.hidden);
  if (lightboxApi) lightboxApi.teardown();
  if (!triggers.length) { lightboxApi = null; return; }

  const slides = triggers.map((btn) => {
    const img = btn.querySelector("img");
    const captionEl = btn.querySelector(".gallery-caption");
    const caption = captionEl ? captionEl.textContent.trim() : "";
    if (caption) btn.setAttribute("aria-label", `Ver foto ampliada: ${caption}`);
    return { src: img.currentSrc || img.src, alt: img.alt, caption };
  });

  const backdrop = lightbox.querySelector(".lightbox-backdrop");
  const closeBtn = lightbox.querySelector(".lightbox-close");
  const prevBtn = lightbox.querySelector(".lightbox-prev");
  const nextBtn = lightbox.querySelector(".lightbox-next");
  const figure = lightbox.querySelector(".lightbox-figure");
  const imgEl = lightbox.querySelector(".lightbox-img");
  const captionEl = lightbox.querySelector(".lightbox-caption");

  let currentIndex = 0;
  let lastTrigger = null;

  function render() {
    const slide = slides[currentIndex];
    imgEl.src = slide.src; imgEl.alt = slide.alt; captionEl.textContent = slide.caption;
  }
  function show(index) { currentIndex = (index + slides.length) % slides.length; render(); }
  function onKeydown(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowRight") show(currentIndex + 1);
    else if (e.key === "ArrowLeft") show(currentIndex - 1);
    else if (e.key === "Tab") {
      e.preventDefault();
      const focusList = [closeBtn, prevBtn, nextBtn];
      let idx = focusList.indexOf(document.activeElement);
      if (idx === -1) idx = 0;
      idx = e.shiftKey ? (idx - 1 + focusList.length) % focusList.length : (idx + 1) % focusList.length;
      focusList[idx].focus();
    }
  }
  function open(index, triggerEl) {
    currentIndex = index; lastTrigger = triggerEl || null; render();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => lightbox.classList.add("is-open"));
    document.addEventListener("keydown", onKeydown);
    closeBtn.focus();
  }
  function close() {
    lightbox.classList.remove("is-open");
    document.removeEventListener("keydown", onKeydown);
    document.body.style.overflow = "";
    let done = false;
    const finish = () => { if (done) return; done = true; lightbox.hidden = true; if (lastTrigger) lastTrigger.focus(); };
    figure.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, 350);
  }

  const clickHandlers = triggers.map((btn, i) => {
    const fn = () => open(i, btn);
    btn.addEventListener("click", fn);
    return fn;
  });
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  prevBtn.addEventListener("click", () => show(currentIndex - 1));
  nextBtn.addEventListener("click", () => show(currentIndex + 1));

  lightboxApi = {
    teardown() {
      triggers.forEach((btn, i) => btn.removeEventListener("click", clickHandlers[i]));
      if (!lightbox.hidden) close();
    },
  };
}
rebuildLightbox();
document.querySelectorAll('[data-filter-group][data-filter-target="[data-photo-card]"] [data-filter-value]')
  .forEach((btn) => btn.addEventListener("click", rebuildLightbox));

/* ---------- Smooth-scroll wiring (native, no smooth-scroll library) ---------- */
function smoothScrollToSelector(selector) {
  const target = document.querySelector(selector);
  if (!target) return;
  const headerOffset = 64;
  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top, behavior: reduceQuery.matches ? "auto" : "smooth" });
}
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const id = link.getAttribute("href");
  if (id.length <= 1 || !document.querySelector(id)) return;
  link.addEventListener("click", (e) => { e.preventDefault(); smoothScrollToSelector(id); });
});
document.querySelectorAll("[data-scroll-target]").forEach((btn) => {
  btn.addEventListener("click", () => smoothScrollToSelector(btn.dataset.scrollTarget));
});

/* ---------- Scroll progress bar (plain scroll listener, no GSAP) ---------- */
(function initScrollProgress() {
  const bar = document.querySelector(".scroll-progress-bar");
  if (!bar) return;
  let ticking = false;
  function update() {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const progress = scrollable > 0 ? doc.scrollTop / scrollable : 0;
    bar.style.transform = `scaleX(${progress})`;
    ticking = false;
  }
  update();
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener("resize", update);
})();

/* ---------- On-scroll reveals: IntersectionObserver toggles `.is-visible`
   on every [data-reveal] cell, which CSS then animates with a simple
   transition (see the [data-reveal] rules in style.css). Cells inside
   the same [data-reveal-group] stagger slightly via a CSS transition-delay
   set here, so a whole bento row doesn't pop in as one flat block. ---------- */
(function initReveals() {
  const groups = document.querySelectorAll("[data-reveal-group]");
  groups.forEach((group) => {
    const cells = Array.from(group.querySelectorAll("[data-reveal]"));
    cells.forEach((cell, i) => { cell.style.transitionDelay = `${Math.min(i, 6) * 60}ms`; });
  });
  const targets = document.querySelectorAll("[data-reveal]");
  if (!targets.length) return;
  if (reduceQuery.matches || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  targets.forEach((el) => io.observe(el));
})();
