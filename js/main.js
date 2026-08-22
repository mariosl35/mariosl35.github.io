/* ==========================================================================
   mariosl35 shared behavior
   Nav toggle, header clock, and the generative thumbnail system used to
   give every project/tool a distinct mark without using stock imagery.
   ========================================================================== */

(function () {
  "use strict";

  // Keep the visible site identity consistent without touching social URLs.
  const oldName = "mariosl357";
  const newName = "mariosl35";
  const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (textWalker.nextNode()) textNodes.push(textWalker.currentNode);
  textNodes.forEach((node) => {
    if (node.parentElement?.closest("a[href^='http']")) return;
    node.nodeValue = node.nodeValue
      .replaceAll(oldName, newName)
      .replaceAll("v1.2.0 | static folders and console easter egg", "v1.2.1 | console and identity update");
  });
  document.querySelectorAll("title, meta[name='description'], meta[property='og:site_name'], meta[property='og:title'], meta[property='og:description'], [aria-label]").forEach((element) => {
    if (element.tagName === "TITLE") {
      element.textContent = element.textContent.replaceAll(oldName, newName);
    }
    ["content", "aria-label"].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (value?.includes(oldName)) element.setAttribute(attribute, value.replaceAll(oldName, newName));
    });
  });
  if (document.title.includes(oldName)) document.title = document.title.replaceAll(oldName, newName);

  /* ---------- mobile nav ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    const closeNav = () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", closeNav)
    );
    document.addEventListener("click", (event) => {
      if (nav.classList.contains("open") && !nav.contains(event.target) && !toggle.contains(event.target)) closeNav();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ---------- header clock (local system time, UTC offset shown) ---------- */
  const clockEl = document.querySelector("[data-clock]");
  if (clockEl) {
    const tick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      clockEl.textContent = `${hh}:${mm}:${ss} LOCAL`;
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- date formatting ---------- */
  window.formatDate = function formatDate(isoDate) {
    const d = new Date(isoDate + "T00:00:00");
    const months = [
      "JAN","FEB","MAR","APR","MAY","JUN",
      "JUL","AUG","SEP","OCT","NOV","DEC",
    ];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
  };

  /* ---------- deterministic PRNG (mulberry32) seeded from a string ---------- */
  function seedFromString(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822519);
      h = Math.imul(h ^ (h >>> 13), 3266489917);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }

  /**
   * Generates a small deterministic SVG "mark" for a project/tool based on
   * a seed string, so every entry gets a distinct visual identity without
   * placeholder photography. Renders in graphite + accent green only.
   */
  window.generateMark = function generateMark(seed, size) {
    size = size || 64;
    const rand = seedFromString(seed);
    const cells = 5;
    const cell = size / cells;
    const accentChance = 0.32;
    let rects = "";

    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < Math.ceil(cells / 2); x++) {
        if (rand() > 0.52) continue;
        const isAccent = rand() < accentChance;
        const fill = isAccent ? "var(--accent)" : "var(--border-strong)";
        const opacity = isAccent ? 0.9 : 0.7;
        const mirroredX = cells - 1 - x;
        rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${fill}" fill-opacity="${opacity}"/>`;
        if (mirroredX !== x) {
          rects += `<rect x="${mirroredX * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${fill}" fill-opacity="${opacity}"/>`;
        }
      }
    }

    return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <rect width="${size}" height="${size}" fill="var(--bg-inset)"/>
      ${rects}
    </svg>`;
  };
})();
