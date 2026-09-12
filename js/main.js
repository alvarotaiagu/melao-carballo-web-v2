/* Editorial split-screen variant: no GSAP/Lenis here — motion is restrained
   CSS transitions driven by IntersectionObserver, since the layout already
   has a fixed rail + independently scrolling stage to keep simple. */

const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- Mobile drawer: collapses the rail into a header + off-canvas nav ---------- */
(function initDrawer() {
  const toggle = document.querySelector(".drawer-toggle");
  const rail = document.getElementById("rail");
  const scrim = document.querySelector(".drawer-scrim");
  if (!toggle || !rail || !scrim) return;

  function open() {
    rail.classList.add("is-open");
    scrim.classList.add("is-visible");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeydown);
  }
  function close() {
    rail.classList.remove("is-open");
    scrim.classList.remove("is-visible");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
  }
  function onKeydown(e) {
    if (e.key === "Escape") { close(); toggle.focus(); }
  }
  toggle.addEventListener("click", () => {
    toggle.getAttribute("aria-expanded") === "true" ? close() : open();
  });
  scrim.addEventListener("click", close);
  rail.querySelectorAll("a[data-nav-link]").forEach((a) => a.addEventListener("click", close));

  const mq = window.matchMedia("(min-width: 901px)");
  mq.addEventListener("change", (e) => { if (e.matches) close(); });
})();

/* ---------- Cookie notice ---------- */
(function initCookieBanner() {
  const banner = document.querySelector(".cookie-banner");
  const ackBtn = document.querySelector(".cookie-ack");
  if (!banner || !ackBtn) return;
  const KEY = "melao-editorial-cookie-ack";
  let acknowledged = false;
  try { acknowledged = localStorage.getItem(KEY) === "1"; } catch (e) {}
  if (!acknowledged) banner.hidden = false;
  ackBtn.addEventListener("click", () => {
    banner.hidden = true;
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
  });
})();

/* ---------- WhatsApp FAB: appears once the hero has scrolled past ---------- */
(function initWhatsappFab() {
  const fab = document.querySelector(".whatsapp-fab");
  const hero = document.getElementById("hero");
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

/* ---------- Opening hours: live "open now" + today highlight ----------
   Same confirmed real hours as the flagship site (Turismo de Carballo,
   ficha de Google y AXOBER). ---------- */
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
  const statusText = document.getElementById("hours-status-text");
  const list = document.getElementById("hours-list");
  const dot = document.querySelector(".live-dot");
  if (!statusText || !list) return;
  function update() {
    const now = new Date();
    list.querySelectorAll("li").forEach((li) => li.classList.toggle("is-today", Number(li.dataset.day) === now.getDay()));
    const open = isOpenAt(now);
    statusText.textContent = open ? "Abierto ahora" : "Cerrado ahora";
    if (dot) dot.classList.toggle("is-closed", !open);
  }
  update();
  setInterval(update, 60000);
})();

/* ---------- Gallery lightbox ---------- */
(function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  const triggers = Array.from(document.querySelectorAll(".gallery-item"));
  if (!lightbox || !triggers.length) return;

  const slides = triggers.map((btn) => {
    const img = btn.querySelector("img");
    const tagEl = btn.querySelector(".gallery-tag");
    const tag = tagEl ? tagEl.textContent.trim() : "";
    const title = btn.querySelector(".gallery-caption").lastChild.textContent.trim();
    const caption = tag ? `${tag} · ${title}` : title;
    btn.setAttribute("aria-label", `Ver foto ampliada: ${caption}`);
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
      const list = [closeBtn, prevBtn, nextBtn];
      let idx = list.indexOf(document.activeElement);
      if (idx === -1) idx = 0;
      idx = e.shiftKey ? (idx - 1 + list.length) % list.length : (idx + 1) % list.length;
      list[idx].focus();
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

  triggers.forEach((btn, i) => btn.addEventListener("click", () => open(i, btn)));
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  prevBtn.addEventListener("click", () => show(currentIndex - 1));
  nextBtn.addEventListener("click", () => show(currentIndex + 1));
})();

/* ---------- Rail nav: highlight the section currently in the stage's
   viewport. Intersection is computed against the browser viewport
   regardless of which ancestor actually scrolls, so this works both when
   .stage scrolls independently (desktop) and when the whole page scrolls
   (mobile) without needing a different `root` per breakpoint. ---------- */
(function initActiveNav() {
  const sections = Array.from(document.querySelectorAll(".stage-section[id]"));
  const navLinks = Array.from(document.querySelectorAll(".rail-nav a[data-nav-target]"));
  if (!sections.length || !navLinks.length || !("IntersectionObserver" in window)) return;

  const linkFor = new Map(navLinks.map((a) => [a.dataset.navTarget, a]));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const link = linkFor.get(entry.target.id);
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.forEach((a) => a.classList.remove("is-active"));
        link.classList.add("is-active");
      }
    });
  }, { threshold: 0, rootMargin: "-40% 0px -55% 0px" });

  sections.forEach((section) => io.observe(section));
})();

/* ---------- Smooth in-page navigation. scrollIntoView finds the nearest
   scrollable ancestor on its own, so the same handler works for both the
   independently scrolling .stage (desktop) and the scrolling document
   (mobile, once the rail collapses into a header). ---------- */
document.querySelectorAll("[data-nav-link]").forEach((link) => {
  const targetId = link.dataset.navTarget || (link.getAttribute("href") || "").replace("#", "");
  if (!targetId) return;
  const target = document.getElementById(targetId);
  if (!target) return;
  link.addEventListener("click", (e) => {
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceQuery.matches ? "auto" : "smooth", block: "start" });
  });
});

/* ---------- Reveal-on-scroll: restrained fade + rise, once per section ---------- */
(function initReveals() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;
  if (reduceQuery.matches || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
    });
  }, { threshold: 0.15 });
  items.forEach((el) => io.observe(el));
})();

/* ---------- Footer year ---------- */
(function initFooterYear() {
  const el = document.getElementById("footer-year");
  if (el) el.textContent = new Date().getFullYear();
})();
