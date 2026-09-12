// Cinematic single-scroll template — plain JS, no build step, no motion
// libraries (deliberately no GSAP/ScrollTrigger/Lenis-style scroll-jacking:
// the horizontal gallery relies on native CSS scroll-snap, and reveals run
// through IntersectionObserver toggling a class that CSS transitions handle).
const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- Scroll reveals ---------- */
(function initReveals() {
  const targets = document.querySelectorAll("[data-reveal]");
  if (!targets.length) return;
  if (reduceQuery.matches || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -10% 0px" });
  targets.forEach((el) => io.observe(el));
})();

/* ---------- Side-rail active-section tracking ---------- */
(function initRail() {
  const links = Array.from(document.querySelectorAll("[data-rail-link]"));
  if (!links.length) return;
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if (!sections.length) return;

  function setCurrent(id) {
    links.forEach((link) => {
      link.parentElement.classList.toggle("is-current", link.getAttribute("href") === `#${id}`);
    });
  }
  if (!("IntersectionObserver" in window)) { setCurrent(sections[0].id); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) setCurrent(entry.target.id); });
  }, { rootMargin: "-45% 0px -45% 0px" });
  sections.forEach((s) => io.observe(s));
})();

/* ---------- Smooth in-page scrolling for rail + hero cue ---------- */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const id = link.getAttribute("href");
  const target = id.length > 1 && document.querySelector(id);
  if (!target) return;
  link.addEventListener("click", (e) => {
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceQuery.matches ? "auto" : "smooth", block: "start" });
  });
});

/* ---------- Accordion menu: plain JS expand/collapse, one open at a time ---------- */
(function initAccordion() {
  const root = document.querySelector("[data-accordion]");
  if (!root) return;
  const triggers = Array.from(root.querySelectorAll(".accordion-trigger"));

  function setHeight(panel, expanded) {
    if (expanded) {
      panel.hidden = false;
      const h = panel.querySelector(".accordion-panel-inner").offsetHeight;
      panel.style.height = "0px";
      requestAnimationFrame(() => { panel.style.height = `${h}px`; });
      panel.addEventListener("transitionend", function onEnd() {
        panel.style.height = "auto";
        panel.removeEventListener("transitionend", onEnd);
      }, { once: true });
    } else {
      const h = panel.offsetHeight;
      panel.style.height = `${h}px`;
      requestAnimationFrame(() => { panel.style.height = "0px"; });
      panel.addEventListener("transitionend", function onEnd() {
        panel.hidden = true;
        panel.removeEventListener("transitionend", onEnd);
      }, { once: true });
    }
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const panel = document.getElementById(trigger.getAttribute("aria-controls"));
      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        trigger.setAttribute("aria-expanded", "false");
        setHeight(panel, false);
        return;
      }
      triggers.forEach((other) => {
        if (other === trigger) return;
        const otherPanel = document.getElementById(other.getAttribute("aria-controls"));
        if (other.getAttribute("aria-expanded") === "true") {
          other.setAttribute("aria-expanded", "false");
          setHeight(otherPanel, false);
        }
      });
      trigger.setAttribute("aria-expanded", "true");
      setHeight(panel, true);
    });
  });
})();

/* ---------- Gallery arrows: scroll one card at a time ---------- */
(function initGalleryArrows() {
  const track = document.querySelector("[data-galeria-track]");
  const prev = document.querySelector("[data-galeria-prev]");
  const next = document.querySelector("[data-galeria-next]");
  if (!track) return;
  function step(dir) {
    const item = track.querySelector(".galeria-slide");
    if (!item) return;
    const gap = parseFloat(getComputedStyle(track).gap || "20");
    const width = item.getBoundingClientRect().width + gap;
    track.scrollBy({ left: dir * width, behavior: reduceQuery.matches ? "auto" : "smooth" });
  }
  prev && prev.addEventListener("click", () => step(-1));
  next && next.addEventListener("click", () => step(1));
})();

/* ---------- Sticky bottom CTA bar: visible once hero is scrolled past ---------- */
(function initCtaBar() {
  const bar = document.querySelector("[data-cta-bar]");
  const hero = document.querySelector(".hero");
  if (!bar || !hero) return;
  bar.hidden = false;
  if (!("IntersectionObserver" in window)) { bar.classList.add("is-visible"); return; }
  const io = new IntersectionObserver(([entry]) => {
    bar.classList.toggle("is-visible", !entry.isIntersecting);
  });
  io.observe(hero);
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

/* ---------- Opening hours: live "open now" + today highlight ---------- */
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

/* ---------- Footer year ---------- */
(function initFooterYear() {
  const el = document.getElementById("footer-year");
  if (el) el.textContent = new Date().getFullYear();
})();
