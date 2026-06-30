'use strict';

/* =====================================================
   ZAIN AGENCY — main.js
   ===================================================== */

// ─── Helpers ──────────────────────────────────────────────
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ─── DOM refs ─────────────────────────────────────────────
const preloader   = $('#preloader');
const preloadFill = $('#preloaderFill');
const progressBar = $('#progressBar');
const nav         = $('#nav');
const hamburger   = $('#hamburger');
const mobileMenu  = $('#mobileMenu');
const mobileClose = $('#mobileClose');
const backToTop   = $('#backToTop');
const contactForm = $('#contactForm');
const submitBtn   = $('#submitBtn');
const formSuccess = $('#formSuccess');
const yearEl      = $('#year');
const sections    = $$('main section[id]');

// ─── Reduced-motion gate ──────────────────────────────────
// Single source of truth used by every animation in this file.
// CSS handles its own reduced-motion via @media; JS must check
// separately because setTimeout / setInterval ignore media queries.
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Preloader ────────────────────────────────────────────
let loadPct = 0;
const fillTimer = setInterval(() => {
  loadPct = Math.min(loadPct + Math.random() * 14, 90);
  if (preloadFill) preloadFill.style.width = loadPct + '%';
}, 80);

window.addEventListener('load', () => {
  clearInterval(fillTimer);
  if (preloadFill) preloadFill.style.width = '100%';
  setTimeout(() => {
    preloader?.classList.add('hidden');
    document.body.classList.remove('no-scroll');
    // Trigger hero animations only AFTER the preloader exits,
    // so .fade-up transitions play in front of the user.
    triggerHeroAnimations();
  }, 380);
});
document.body.classList.add('no-scroll');

// ─── Hero staggered entrance ──────────────────────────────
// Uses CSS transitions (not keyframe animations) controlled by
// adding .visible, so the delay set here is always honoured —
// no race with a CSS animation that already fired on render.
function triggerHeroAnimations() {
  if (prefersReducedMotion) {
    $$('.fade-up').forEach(el => el.classList.add('visible'));
    return;
  }
  $$('.fade-up').forEach(el => {
    const delay = Number(el.dataset.delay ?? 0);
    setTimeout(() => el.classList.add('visible'), delay);
  });
}

// ─── Scroll: progress + nav + active link + back-to-top ──
function updateProgress() {
  const pct = window.scrollY /
    (document.documentElement.scrollHeight - window.innerHeight) * 100 || 0;
  if (progressBar) {
    progressBar.style.width = pct + '%';
    progressBar.setAttribute('aria-valuenow', Math.round(pct));
  }
}

function updateNav() {
  nav?.classList.toggle('scrolled', window.scrollY > 24);
}

function updateActiveLink() {
  const offset = window.scrollY + window.innerHeight * 0.35;
  sections.forEach(({ id, offsetTop, offsetHeight }) => {
    const link = $(`a.nav__link[href="#${id}"]`);
    link?.classList.toggle('active', offset >= offsetTop && offset < offsetTop + offsetHeight);
  });
}

window.addEventListener('scroll', () => {
  updateProgress();
  updateNav();
  updateActiveLink();
  backToTop?.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });

// run once on load
updateProgress();
updateNav();

// ─── Back to top ──────────────────────────────────────────
backToTop?.addEventListener('click', () =>
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' })
);

// ─── Focus trap ───────────────────────────────────────────
// Constrains Tab / Shift+Tab within a container while it's open.
// Returns a cleanup function that removes the listener.
function trapFocus(container) {
  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), ' +
    'textarea:not([disabled]), select:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"])';

  const nodes = () => $$FOCUSABLE(container).filter(el =>
    !el.closest('[hidden]') &&
    window.getComputedStyle(el).display !== 'none'
  );

  // Helper to query focusable children (avoids shadowing the outer $$)
  function $$FOCUSABLE(ctx) {
    return [...ctx.querySelectorAll(FOCUSABLE)];
  }

  function onKey(e) {
    if (e.key !== 'Tab') return;
    const focusable = nodes();
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first || !container.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || !container.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  container.addEventListener('keydown', onKey);
  // Move focus into the menu immediately
  nodes()[0]?.focus();

  return () => container.removeEventListener('keydown', onKey);
}

// ─── Mobile menu ──────────────────────────────────────────
let menuOpen   = false;
let cleanupTrap = null;
let lastFocused = null;

function setMenu(open) {
  menuOpen = open;
  hamburger?.classList.toggle('open', open);
  mobileMenu?.classList.toggle('open', open);
  hamburger?.setAttribute('aria-expanded', String(open));
  mobileMenu?.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('no-scroll', open);

  if (open) {
    lastFocused = document.activeElement;
    cleanupTrap = trapFocus(mobileMenu);
  } else {
    cleanupTrap?.();
    cleanupTrap = null;
    // Return focus to the element that opened the menu
    lastFocused?.focus();
    lastFocused = null;
  }
}

hamburger?.addEventListener('click', () => setMenu(!menuOpen));
mobileClose?.addEventListener('click', () => setMenu(false));

$$('.mobile-menu__link, .mobile-menu__cta').forEach(el =>
  el.addEventListener('click', () => setMenu(false))
);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menuOpen) setMenu(false);
});

// Close on backdrop click (outside the menu panel)
document.addEventListener('click', e => {
  if (menuOpen && !mobileMenu?.contains(e.target) && !hamburger?.contains(e.target)) {
    setMenu(false);
  }
});

// ─── Smooth scroll for in-page anchors ───────────────────
document.addEventListener('click', e => {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;
  const target = document.querySelector(anchor.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: prefersReducedMotion ? 'instant' : 'smooth' });
});

// ─── Scroll-reveal ────────────────────────────────────────
const revealObserver = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el    = entry.target;
    const delay = prefersReducedMotion ? 0 : Number(el.dataset.delay ?? 0);
    setTimeout(() => el.classList.add('visible'), delay);
    revealObserver.unobserve(el);
  }),
  { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
);

$$('.reveal').forEach(el => revealObserver.observe(el));

// ─── Counter animations ───────────────────────────────────
// data-target  : final numeric value
// data-suffix  : text appended after the number ("+", "%", "/7" …)
function animateCount(el) {
  const target = Number(el.dataset.target ?? 0);
  const suffix = el.dataset.suffix ?? '';

  if (prefersReducedMotion) {
    el.textContent = target + suffix;
    return;
  }

  const DURATION = 1600;
  const TICK     = 16;
  const steps    = DURATION / TICK;
  let   n        = 0;

  const timer = setInterval(() => {
    n++;
    const eased = 1 - Math.pow(1 - n / steps, 3); // ease-out cubic
    el.textContent = Math.round(eased * target) + suffix;
    if (n >= steps) {
      el.textContent = target + suffix;
      clearInterval(timer);
    }
  }, TICK);
}

const counterObserver = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    animateCount(entry.target);
    counterObserver.unobserve(entry.target);
  }),
  { threshold: 0.5 }
);

$$('[data-target]').forEach(el => counterObserver.observe(el));

// ─── Form validation ──────────────────────────────────────
const validators = {
  name:     v => v.trim().length >= 2                             ? '' : 'Please enter your full name.',
  email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())    ? '' : 'Enter a valid email address.',
  location: v => v.trim().length >= 2                            ? '' : 'Please enter your city or country.',
  message:  v => v.trim().length >= 10                           ? '' : 'Message must be at least 10 characters.',
};

function getField(id) { return $(`#${id}`, contactForm); }
function getError(id) { return $(`#${id}Error`, contactForm); }

function showFieldError(id, msg) {
  const input = getField(id);
  const error = getError(id);
  input?.classList.toggle('error', !!msg);
  if (error) error.textContent = msg;
}

function validateField(id) {
  const input = getField(id);
  if (!input || !validators[id]) return true;
  const msg = validators[id](input.value);
  showFieldError(id, msg);
  return !msg;
}

// Validate on blur; re-validate on input only if the field is already errored
['name', 'email', 'location', 'message'].forEach(id => {
  const el = getField(id);
  if (!el) return;
  el.addEventListener('blur',  () => validateField(id));
  el.addEventListener('input', () => {
    if (el.classList.contains('error')) validateField(id);
  });
});

// ─── Form submission ──────────────────────────────────────
contactForm?.addEventListener('submit', async e => {
  e.preventDefault();

  const valid = ['name', 'email', 'location', 'message'].map(validateField).every(Boolean);
  if (!valid) {
    // Focus the first input that failed — scoped to .form-input.error
    // so we target the actual control, not a wrapper or error span.
    $('.form-input.error', contactForm)?.focus();
    return;
  }

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  await new Promise(r => setTimeout(r, 1400)); // simulate network

  submitBtn.classList.remove('loading');
  submitBtn.disabled = false;
  contactForm.reset();

  if (formSuccess) {
    formSuccess.hidden = false;
    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => { formSuccess.hidden = true; }, 7000);
  }
});

// ─── Service cards accordion ──────────────────────────────
// Clicking any card (or pressing Enter/Space) expands it and
// collapses the previously open one — one card open at a time.
(function initServiceCards() {
  const cards = $$('.svc-card');

  function closeCard(card) {
    card.classList.remove('open');
    card.setAttribute('aria-expanded', 'false');
    const panel  = $('.svc-card__panel', card);
    const label  = $('.svc-card__toggle-text', card);
    if (panel) panel.setAttribute('aria-hidden', 'true');
    if (label) label.textContent = 'View Details';
  }

  function openCard(card) {
    // Collapse every other card first
    cards.forEach(c => { if (c !== card) closeCard(c); });

    card.classList.add('open');
    card.setAttribute('aria-expanded', 'true');
    const panel  = $('.svc-card__panel', card);
    const label  = $('.svc-card__toggle-text', card);
    if (panel) panel.setAttribute('aria-hidden', 'false');
    if (label) label.textContent = 'Close';
  }

  function toggleCard(card) {
    card.classList.contains('open') ? closeCard(card) : openCard(card);
  }

  cards.forEach(card => {
    // Mouse click on the card (but let the "Get a Quote" link through)
    card.addEventListener('click', e => {
      if (e.target.closest('.svc-card__cta')) return; // let anchor navigate
      toggleCard(card);
    });

    // Keyboard: Enter or Space when the card itself is focused
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('.svc-card__cta')) return;
        e.preventDefault();
        toggleCard(card);
      }
    });
  });
})();

// ─── Process steps accordion ─────────────────────────────
(function initProcessSteps() {
  const steps = $$('.process__step');

  function closeStep(step) {
    step.classList.remove('open');
    step.setAttribute('aria-expanded', 'false');
    const panel = $('.process__panel', step);
    const label = $('.process__toggle-text', step);
    if (panel) panel.setAttribute('aria-hidden', 'true');
    if (label) label.textContent = 'View Details';
  }

  function openStep(step) {
    steps.forEach(s => { if (s !== step) closeStep(s); });
    step.classList.add('open');
    step.setAttribute('aria-expanded', 'true');
    const panel = $('.process__panel', step);
    const label = $('.process__toggle-text', step);
    if (panel) panel.setAttribute('aria-hidden', 'false');
    if (label) label.textContent = 'Close';
  }

  function toggleStep(step) {
    step.classList.contains('open') ? closeStep(step) : openStep(step);
  }

  steps.forEach(step => {
    step.addEventListener('click', () => toggleStep(step));
    step.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStep(step); }
    });
  });
})();

// ─── Footer year ──────────────────────────────────────────
if (yearEl) yearEl.textContent = new Date().getFullYear();
