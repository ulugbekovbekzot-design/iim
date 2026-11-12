"use strict";

/* ===== Yil ===== */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ===== Sarlavha: sahifa aylantirilganda fon ===== */
const header = document.getElementById("header");
function onScroll() {
  if (header) header.classList.toggle("scrolled", window.scrollY > 40);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ===== Mobil menyu ===== */
const burger = document.getElementById("burger");
const menu = document.getElementById("menu");

function setMenu(open) {
  menu.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Menyuni yopish" : "Menyuni ochish");
}
if (burger && menu) {
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  menu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });
}

/* ===== Yo'nalishlar: tablar ===== */
const tabs = Array.from(document.querySelectorAll('[role="tab"]'));

function selectTab(tab) {
  tabs.forEach((t) => {
    const active = t === tab;
    t.setAttribute("aria-selected", String(active));
    t.tabIndex = active ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !active;
  });
}
tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (e) => {
    let next = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
    if (next) {
      e.preventDefault();
      next.focus();
      selectTab(next);
    }
  });
});

/* ===== Raqamlar: sanab chiqish ===== */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const counters = document.querySelectorAll("[data-count]");

function runCounter(el) {
  const target = Number(el.dataset.count);
  if (reduceMotion) { el.textContent = target; return; }
  const duration = 1400;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => io.observe(c));
} else {
  counters.forEach(runCounter);
}

/* ===== Hero: g'oyalar tarmog'i (canvas) ===== */
(function network() {
  const canvas = document.getElementById("network");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const hero = canvas.parentElement;
  const colors = ["#FFC83D", "#19C3A3", "#6F8BFF", "#FFFFFF"];
  const pointer = { x: -9999, y: -9999 };
  let w = 0, h = 0, dpr = 1, nodes = [], running = true;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth;
    h = hero.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(24, Math.min(70, Math.round((w * h) / 20000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1.6 + Math.random() * 2.2,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const maxD = 140;

    for (const n of nodes) {
      if (!reduceMotion) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < maxD) {
          ctx.strokeStyle = "rgba(255,255,255," + (0.22 * (1 - d / maxD)).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      // kursor atrofida tugunlar yorqin ulanadi
      const dp = Math.hypot(a.x - pointer.x, a.y - pointer.y);
      if (dp < 180) {
        ctx.strokeStyle = "rgba(255,200,61," + (0.7 * (1 - dp / 180)).toFixed(3) + ")";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(pointer.x, pointer.y);
        ctx.stroke();
      }
    }

    for (const n of nodes) {
      ctx.fillStyle = n.c;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    if (running) draw();
    if (!reduceMotion) requestAnimationFrame(loop);
  }

  hero.addEventListener("pointermove", (e) => {
    const rect = hero.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
  });
  hero.addEventListener("pointerleave", () => { pointer.x = pointer.y = -9999; });

  // Hero ko'rinmay qolsa, animatsiyani to'xtatamiz
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { running = entries[0].isIntersecting; }).observe(hero);
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); if (reduceMotion) draw(); }, 150);
  });

  resize();
  draw();
  loop();
})();

/* ===== Qabul formasi ===== */
const form = document.getElementById("form");
const formOk = document.getElementById("formOk");

function setError(name, message) {
  const input = form.elements[name];
  const box = form.querySelector('.err[data-for="' + name + '"]');
  const field = input.closest(".field");
  field.classList.toggle("invalid", Boolean(message));
  box.textContent = message || "";
  input.setAttribute("aria-invalid", message ? "true" : "false");
}

function validate() {
  let ok = true;
  const ism = form.elements.ism.value.trim();
  const tel = form.elements.tel.value.replace(/[\s()-]/g, "");
  const sinf = form.elements.sinf.value;

  if (ism.length < 2) { setError("ism", "Ismingizni kiriting."); ok = false; } else setError("ism");
  if (!/^(\+?998)?\d{9}$/.test(tel)) { setError("tel", "Telefon raqamini to‘g‘ri kiriting. Masalan: +998 90 123 45 67"); ok = false; } else setError("tel");
  if (!sinf) { setError("sinf", "Sinfni tanlang."); ok = false; } else setError("sinf");

  return ok;
}

if (form) form.addEventListener("submit", (e) => {
  e.preventDefault();
  formOk.hidden = true;
  if (!validate()) return;

  /* Hozircha ma'lumot hech qayerga yuborilmaydi.
     Haqiqiy sayt uchun shu yerga serverga yuborish (fetch) kodini qo'shing. */
  const ism = form.elements.ism.value.trim();
  formOk.textContent = "Rahmat, " + ism + "! Arizangiz qabul qilindi. Tez orada siz bilan bog‘lanamiz.";
  formOk.hidden = false;
  form.reset();
});

if (form) form.addEventListener("input", (e) => {
  if (e.target.name && form.querySelector('.err[data-for="' + e.target.name + '"]')) {
    setError(e.target.name);
  }
});
