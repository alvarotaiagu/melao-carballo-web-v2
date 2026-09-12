// GSAP/ScrollTrigger/Lenis load from a CDN — if that fails, nothing below
// should break: only motion is optional, not the menu, hours, map, carousels.
const gsapReady = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
if (gsapReady) gsap.registerPlugin(ScrollTrigger);

const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- Word splitting (accessible) ---------- */
function splitWords(el) {
  const text = el.textContent.trim();
  el.setAttribute("aria-label", text);
  const words = text.split(/\s+/);
  el.innerHTML = "";
  const wrap = document.createElement("span");
  wrap.className = "split-wrap";
  wrap.setAttribute("aria-hidden", "true");
  words.forEach((word, i) => {
    const outer = document.createElement("span");
    outer.className = "split-word";
    const inner = document.createElement("span");
    inner.textContent = word;
    outer.appendChild(inner);
    wrap.appendChild(outer);
    if (i < words.length - 1) wrap.appendChild(document.createTextNode(" "));
  });
  el.appendChild(wrap);
  return Array.from(wrap.querySelectorAll(".split-word > span"));
}
const splitMap = new Map();
document.querySelectorAll("[data-split-word]").forEach((el) => splitMap.set(el, splitWords(el)));

/* ---------- Google rating: single source of truth for the UI copy ---------- */
const GOOGLE_RATING = { value: "4,8" };
(function initGoogleRating() {
  const seal = document.querySelector(".google-seal");
  if (seal) seal.setAttribute("aria-label", `${GOOGLE_RATING.value} sobre 5 en Google — ver ficha de Google (se abre en una pestaña nueva)`);
})();

/* ---------- Full-screen nav overlay ---------- */
(function initSiteMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("site-menu");
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
    setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; }, 350);
  }
  function onKeydown(e) {
    if (e.key === "Escape") { close(); toggle.focus(); }
  }
  toggle.addEventListener("click", () => {
    toggle.getAttribute("aria-expanded") === "true" ? close() : open();
  });
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
})();

/* ---------- Cookie notice ---------- */
(function initCookieBanner() {
  const banner = document.querySelector(".cookie-banner");
  const ackBtn = document.querySelector(".cookie-ack");
  if (!banner || !ackBtn) return;
  const KEY = "melao-v2-cookie-ack";
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
  const hero = document.querySelector(".hero");
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

/* ---------- Day/night tab switches (carta + cocina galleries) ----------
   Each switch controls a pair of panels shown/hidden together, plus a
   sliding thumb behind the active pill. Two independent instances live
   on the page (menu deck, photo filmstrip) — this wires any of them. ---------- */
function initDaypartSwitch(root, onChange) {
  const btns = Array.from(root.querySelectorAll("[data-daypart-btn]"));
  if (!btns.length) return;
  function select(part, { focus = false } = {}) {
    btns.forEach((b) => {
      const active = b.dataset.daypartBtn === part;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
      b.tabIndex = active ? 0 : -1;
      if (active && focus) b.focus();
    });
    onChange(part);
  }
  btns.forEach((btn, i) => {
    btn.addEventListener("click", () => select(btn.dataset.daypartBtn));
    btn.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const next = btns[(i + (e.key === "ArrowRight" ? 1 : -1) + btns.length) % btns.length];
      select(next.dataset.daypartBtn, { focus: true });
    });
  });
}

initDaypartSwitch(document.querySelector(".carta .daypart-switch"), (part) => {
  document.querySelectorAll(".carta-deck").forEach((deck) => { deck.hidden = deck.dataset.deck !== part; });
});

initDaypartSwitch(document.querySelector(".cocina .daypart-switch--cocina"), (part) => {
  document.querySelectorAll(".filmstrip").forEach((fs) => { fs.hidden = fs.dataset.filmstrip !== part; });
  rebuildLightbox();
});

/* ---------- Menu deck: arrow-scroll one card at a time. The visible
   deck is re-queried on every click (not captured once) because the
   day/night tab switch swaps which deck is hidden. ---------- */
function initHorizontalArrows(wrapSelector, trackSelector, itemSelector) {
  document.querySelectorAll(wrapSelector).forEach((wrap) => {
    const prev = wrap.querySelector("[data-deck-prev]");
    const next = wrap.querySelector("[data-deck-next]");
    function step(dir) {
      const track = wrap.querySelector(trackSelector);
      if (!track) return;
      const item = track.querySelector(itemSelector);
      const gap = item ? parseFloat(getComputedStyle(track).gap || "16") : 300;
      const width = item ? item.getBoundingClientRect().width + gap : 300;
      track.scrollBy({ left: dir * width, behavior: reduceQuery.matches ? "auto" : "smooth" });
    }
    prev && prev.addEventListener("click", () => step(-1));
    next && next.addEventListener("click", () => step(1));
  });
}
initHorizontalArrows(".carta-deck-wrap", ".carta-deck:not([hidden])", ".dish-card");

/* ---------- Cifras: count-up on scroll into view ---------- */
function animateCount(el) {
  const target = parseFloat(el.dataset.countTo);
  const decimals = Number(el.dataset.countDecimals || 0);
  const isYear = el.dataset.countFormat === "year";
  if (reduceQuery.matches || !gsapReady) {
    el.textContent = isYear ? String(target) : target.toFixed(decimals);
    return;
  }
  const obj = { v: 0 };
  gsap.to(obj, {
    v: target,
    duration: 1.6,
    ease: "power2.out",
    onUpdate: () => { el.textContent = isYear ? String(Math.round(obj.v)) : obj.v.toFixed(decimals); },
  });
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

/* ---------- Kitchen gallery lightbox (rebuilt when the day/night tab
   changes, so it always reflects the currently visible filmstrip) ---------- */
let lightboxApi = null;
function rebuildLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;
  const visibleStrip = document.querySelector(".filmstrip:not([hidden])");
  const triggers = visibleStrip ? Array.from(visibleStrip.querySelectorAll(".film-item")) : [];
  if (lightboxApi) lightboxApi.teardown();
  if (!triggers.length) { lightboxApi = null; return; }

  const slides = triggers.map((btn) => {
    const img = btn.querySelector("img");
    const captionEl = btn.querySelector(".film-caption");
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
    if (lenis) lenis.stop();
    requestAnimationFrame(() => lightbox.classList.add("is-open"));
    document.addEventListener("keydown", onKeydown);
    closeBtn.focus();
  }
  function close() {
    lightbox.classList.remove("is-open");
    document.removeEventListener("keydown", onKeydown);
    document.body.style.overflow = "";
    if (lenis) lenis.start();
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

/* ---------- Reviews: single-card carousel, autoplay pauses on
   hover/focus/reduced-motion ---------- */
(function initReviewCarousel() {
  const root = document.querySelector("[data-review-carousel]");
  if (!root) return;
  const slides = Array.from(root.querySelectorAll(".review-slide"));
  const dots = Array.from(root.querySelectorAll(".review-dot"));
  const prevBtn = root.querySelector("[data-review-prev]");
  const nextBtn = root.querySelector("[data-review-next]");
  if (!slides.length) return;

  let index = 0;
  let timer = null;

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle("is-active", n === index));
    dots.forEach((d, n) => {
      d.classList.toggle("is-active", n === index);
      d.setAttribute("aria-selected", n === index ? "true" : "false");
    });
  }
  function next() { show(index + 1); }
  function prev() { show(index - 1); }
  function play() {
    if (reduceQuery.matches) return;
    stop();
    timer = setInterval(next, 5200);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  nextBtn && nextBtn.addEventListener("click", () => { next(); play(); });
  prevBtn && prevBtn.addEventListener("click", () => { prev(); play(); });
  dots.forEach((dot, i) => dot.addEventListener("click", () => { show(i); play(); }));
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", play);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", play);

  show(0);
  play();
})();

/* ---------- Smooth-scroll wiring ---------- */
let lenis = null;
const revealTimelines = [];
function completeRevealsBefore(targetEl) {
  const targetTop = targetEl.getBoundingClientRect().top + window.scrollY;
  revealTimelines.forEach(({ group, tl }) => {
    const groupTop = group.getBoundingClientRect().top + window.scrollY;
    if (groupTop <= targetTop + 40) tl.progress(1);
  });
}
function smoothScrollToSelector(selector) {
  const target = document.querySelector(selector);
  if (!target) return;
  completeRevealsBefore(target);
  const headerOffset = 60;
  if (lenis) {
    lenis.scrollTo(target, { offset: -headerOffset });
  } else {
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: reduceQuery.matches ? "auto" : "smooth" });
  }
}
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const id = link.getAttribute("href");
  if (id.length <= 1 || !document.querySelector(id)) return;
  link.addEventListener("click", (e) => { e.preventDefault(); smoothScrollToSelector(id); });
});
document.querySelectorAll("[data-scroll-target]").forEach((btn) => {
  btn.addEventListener("click", () => smoothScrollToSelector(btn.dataset.scrollTarget));
});

/* ---------- Scroll chrome: progress bar (state, not motion) ---------- */
function initScrollChrome() {
  if (!gsapReady) return;
  const bar = document.querySelector(".scroll-progress-bar");
  if (!bar) return;
  ScrollTrigger.create({
    trigger: document.documentElement,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => { bar.style.transform = `scaleX(${self.progress})`; },
  });
}

/* ---------- Section-by-section reveals (plays once, forward) ---------- */
function runSectionReveals() {
  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    const heading = group.querySelector("h2");
    const headingTargets = heading ? (heading.matches("[data-split-word]") ? [heading] : Array.from(heading.querySelectorAll("[data-split-word]"))) : [];
    const headingWords = headingTargets.length ? headingTargets.flatMap((el) => splitMap.get(el) || []) : null;
    const blocks = group.querySelectorAll(":scope > .section-inner > p, :scope > p");
    const cards = group.querySelectorAll(".turno-card, .dish-card, .film-item, .cifra-item, .hours-status-row, .info-list li");

    if (headingWords) gsap.set(headingWords, { yPercent: 110, opacity: 0 });
    gsap.set(blocks, { y: 16, opacity: 0 });
    gsap.set(cards, { y: 26, opacity: 0 });

    const tl = gsap.timeline({ scrollTrigger: { trigger: group, start: "top 78%", toggleActions: "play none none none" } });
    if (headingWords) tl.to(headingWords, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: "power4.out" });
    tl.to(blocks, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power2.out" }, headingWords ? "-=0.35" : 0);
    tl.to(cards, { y: 0, opacity: 1, duration: 0.55, stagger: Math.min(0.06, 0.4 / Math.max(cards.length, 1)), ease: "power3.out" }, "-=0.3");
    revealTimelines.push({ group, tl });
  });
}

/* ---------- Hero intro (runs once, on load) ---------- */
function runHeroIntro() {
  const tl = gsap.timeline({ delay: 0.1 });
  tl.from(".site-header", { y: -20, opacity: 0, duration: 0.6, ease: "power3.out" });
  tl.from(".hero-eyebrow", { y: 14, opacity: 0, duration: 0.5 }, "-=0.3");
  tl.from(".hero-title", { y: 24, opacity: 0, duration: 0.7, ease: "power3.out" }, "-=0.25");
  tl.from(".hero-claim", { y: 16, opacity: 0, duration: 0.6 }, "-=0.4");
  tl.from(".hero-actions, .google-seal", { y: 14, opacity: 0, duration: 0.6, stagger: 0.08 }, "-=0.35");
}

/* ---------- Hero day → night: pinned, scroll-scrubbed crossfade ---------- */
function runHeroScrub() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const nightPhoto = hero.querySelector(".hero-photo--noche");
  const nightBg = hero.querySelector(".lqip-bg--noche");
  const titleNoche = hero.querySelector(".hero-title-line--noche");
  const titleDia = hero.querySelector(".hero-title-line--dia");
  const claimNoche = hero.querySelector(".hero-claim-noche");
  const claimDia = hero.querySelector(".hero-claim-dia");
  const moonIcon = hero.querySelector(".hero-eyebrow-icon--moon");
  const fill = document.querySelector(".hero-scrub-fill");

  ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: "+=75%",
    pin: true,
    scrub: 0.4,
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set([nightPhoto, nightBg], { opacity: p });
      gsap.set(titleNoche, { opacity: p });
      gsap.set(titleDia, { opacity: 1 - p });
      gsap.set(claimNoche, { opacity: p });
      gsap.set(claimDia, { opacity: 1 - p });
      if (moonIcon) gsap.set(moonIcon, { opacity: 0.4 + p * 0.6 });
      if (fill) fill.style.height = `${p * 100}%`;
      document.body.dataset.daypart = p > 0.5 ? "noche" : "dia";
    },
  });
}

/* ---------- Motion setup ---------- */
if (!gsapReady) {
  document.body.classList.add("motion-reduced");
  initScrollChrome();
} else {
  const mm = gsap.matchMedia();
  mm.add({ isMotion: "(prefers-reduced-motion: no-preference)" }, (context) => {
    if (context.conditions.isMotion) {
      lenis = new Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);

      runHeroIntro();
      runHeroScrub();
      runSectionReveals();
      initScrollChrome();

      window.addEventListener("pagehide", () => {
        lenis && lenis.destroy();
        ScrollTrigger.getAll().forEach((t) => t.kill());
      });
    } else {
      document.body.classList.add("motion-reduced");
      initScrollChrome();
    }
    return () => { if (lenis) { lenis.destroy(); lenis = null; } };
  });
}

if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => gsapReady && ScrollTrigger.refresh());
window.addEventListener("load", () => gsapReady && ScrollTrigger.refresh());
