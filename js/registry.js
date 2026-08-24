/* ==========================================================================
   mariosl35 registry, tools, changelog, and stat rendering
   Reads from PROJECTS / TOOLS / CHANGELOG in data.js.
   ========================================================================== */

(function () {
  "use strict";

  const TYPE_LABELS = {
    fivem: "FiveM",
    gta: "GTA Mod",
    lua: "Lua",
    nui: "NUI",
    graphics: "Graphics",
    experiment: "Experiment",
  };

  const STATUS_CLASS = {
    active: "status-active",
    stable: "status-stable",
    dev: "status-dev",
    exp: "status-exp",
    planned: "status-planned",
  };

  /* ---------- registry row markup ---------- */
  function registryRow(p, index) {
    return `
      <button class="registry-row" data-slug="${p.slug}" data-type="${p.type}" data-name="${p.name.toLowerCase()}">
        <span class="idx">${String(index + 1).padStart(2, "0")}</span>
        <span class="rname">
          <span class="reg-thumb">${generateMark(p.seed, 32)}</span>
          <span class="names">
            <span class="display-name">${p.name}</span>
            <span class="slug">/${p.slug}</span>
          </span>
        </span>
        <span class="reg-type">${p.typeLabel}</span>
        <span class="reg-stack">${p.stack}</span>
        <span class="status-pill ${STATUS_CLASS[p.status]}">${p.statusLabel}</span>
        <svg class="reg-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>`;
  }

  function goToProject(slug) {
    const project = PROJECTS.find((entry) => entry.slug === slug);
    window.location.href = project?.shareUrl || `project.html?slug=${encodeURIComponent(slug)}`;
  }

  function wireRows(container) {
    container.querySelectorAll(".registry-row").forEach((row) => {
      row.addEventListener("click", () => goToProject(row.dataset.slug));
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToProject(row.dataset.slug);
        }
      });
    });
  }

  /* ---------- featured registry (home page, top N) ---------- */
  const featured = document.querySelector("[data-registry-featured]");
  if (featured) {
    const list = PROJECTS.slice(0, 5);
    featured.innerHTML = list.map(registryRow).join("");
    wireRows(featured);
  }

  /* ---------- full registry with filter + search (projects page) ---------- */
  const fullRegistry = document.querySelector("[data-registry-full]");
  if (fullRegistry) {
    const filterBar = document.querySelector("[data-filter-tags]");
    const searchInput = document.querySelector("[data-search]");
    const emptyState = document.querySelector("[data-empty-state]");
    let activeType = "all";
    let query = "";

    function render() {
      const filtered = PROJECTS.filter((p) => {
        const matchesType = activeType === "all" || p.type === activeType;
        const matchesQuery =
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.slug.includes(query) ||
          p.stack.toLowerCase().includes(query);
        return matchesType && matchesQuery;
      });
      fullRegistry.innerHTML = filtered.map(registryRow).join("");
      wireRows(fullRegistry);
      if (emptyState) emptyState.classList.toggle("visible", filtered.length === 0);
    }

    if (filterBar) {
      filterBar.querySelectorAll(".filter-tag").forEach((btn) => {
        btn.addEventListener("click", () => {
          filterBar
            .querySelectorAll(".filter-tag")
            .forEach((b) => b.setAttribute("aria-pressed", "false"));
          btn.setAttribute("aria-pressed", "true");
          activeType = btn.dataset.type;
          render();
        });
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        query = e.target.value.trim().toLowerCase();
        render();
      });
    }

    render();
  }

  /* ---------- stat strip (real counts derived from data) ---------- */
  const statStrip = document.querySelector("[data-stats]");
  if (statStrip) {
    const total = PROJECTS.length;
    const byType = PROJECTS.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {});
    const topTypes = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1)[0];
    const activeCount = PROJECTS.filter((p) => p.status === "active" || p.status === "stable").length;
    const toolsLive = TOOLS.filter((t) => t.status === "live" || t.usable).length;

    const stats = [
      { num: String(total).padStart(2, "0"), label: "Projects indexed" },
      { num: String(activeCount).padStart(2, "0"), label: "Actively maintained" },
      { num: `${topTypes ? TYPE_LABELS[topTypes[0]] || topTypes[0] : "-"}`, label: "Most common category" },
      { num: String(toolsLive).padStart(2, "0"), label: "Tools available on site" },
    ];

    statStrip.innerHTML = stats
      .map(
        (s) => `<div class="stat"><div class="num">${s.num}</div><div class="label">${s.label}</div></div>`
      )
      .join("");
  }

  /* ---------- tools grid ---------- */
  const toolsGrid = document.querySelector("[data-tools-grid]");
  if (toolsGrid) {
    toolsGrid.innerHTML = TOOLS.map(
      (t) => `
      <article class="tool-card${["tools/colorc.html", "tools/fxman.html"].includes(t.url) ? " tool-card-featured" : ""}">
        <div class="tool-head">
          <span class="eyebrow dim">${t.kind}</span>
          <span class="status-pill ${STATUS_CLASS[t.status] || "status-planned"}">${t.statusLabel}</span>
        </div>
        <h3>${t.name}</h3>
        <p>${t.summary}</p>
        ${t.status === "planned" && t.description ? `<p class="tool-planned-detail">${t.description}</p>` : ""}
        <div class="tool-foot">
          <span>/${t.slug}</span>
          ${t.url ? `<a class="text-link" href="${t.url}">Open →</a>` : "<span>-</span>"}
        </div>
        ${t.url === "tools/colorc.html" ? '<div class="tool-preview" aria-label="Color Converter preview"><span>Preview</span><div class="tool-preview-color" aria-hidden="true"></div><span class="converter-output-label">Hex color</span><output class="tool-preview-input">#7FD99A</output></div>' : ""}
        ${t.url === "tools/fxman.html" ? '<div class="tool-preview" aria-label="fxmanifest Generator preview"><span>Preview / resource</span><pre class="tool-preview-code">resource/\n└── client.lua\n\nfx_version \'cerulean\'\ngame \'gta5\'\n\nclient_script \'client.lua\'</pre></div>' : ""}
      </article>`
    ).join("");
  }

  /* ---------- changelog list (full, on changelog.html) ---------- */
  const changelogList = document.querySelector("[data-changelog]");
  if (changelogList) {
    changelogList.innerHTML = CHANGELOG.map(
      (c) => `
      <li class="changelog-entry">
        <time datetime="${c.date}">${formatDate(c.date)}</time>
        <span class="eyebrow dim">${c.tag}</span>
        <div>
          <h3>${c.title}</h3>
          <p>${c.body}</p>
          ${c.target ? `<a class="cl-target" href="projects/${c.target}.html">/${c.target} →</a>` : ""}
        </div>
      </li>`
    ).join("");
  }

  /* ---------- live log ticker (home hero panel) ---------- */
  const logFeed = document.querySelector("[data-log-feed]");
  if (logFeed) {
    const entries = CHANGELOG.slice(0, 8);
    let i = 0;
    const lines = [];
    const consoleLines = [];

    function escapeHTML(value) {
      return value.replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      }[character]));
    }

    function cssClassFor(tag) {
      if (tag === "fix") return "fix";
      if (tag === "exp") return "exp";
      return "";
    }

    function renderLines() {
      logFeed.innerHTML =
        lines
          .map(
            (l) =>
              `<div class="log-line"><span class="t">${l.date}</span> <span class="tag ${cssClassFor(l.tag)}">[${l.tag.toUpperCase()}]</span> ${l.title}</div>`
          )
          .join("") +
        consoleLines
          .map((line) => line.kind === "ascii"
            ? `<pre class="console-ascii">${escapeHTML(line.text)}</pre>`
            : `<div class="log-line console-${line.kind}">${escapeHTML(line.text)}</div>`)
          .join("") +
        '<span class="log-cursor" aria-hidden="true"></span>';
    }

    function pushLine() {
      if (i >= entries.length) i = 0;
      const c = entries[i];
      lines.push({ date: c.date, tag: c.tag, title: c.title });
      if (lines.length > 6) lines.shift();
      renderLines();
      i++;
    }

    pushLine();
    const interval = setInterval(pushLine, 2200);

    // Respect reduced motion: render the full static list once, no interval.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      clearInterval(interval);
      lines.length = 0;
      entries.forEach((c) => lines.push({ date: c.date, tag: c.tag, title: c.title }));
      renderLines();
    }

    const consoleInput = document.querySelector("[data-console-input]");
    if (consoleInput) {
      consoleInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        const rawCommand = consoleInput.value.trim();
        if (!rawCommand) return;
        const command = rawCommand.toLowerCase().replace(/\s+/g, " ");
        consoleLines.push({ kind: "command", text: `$ ${rawCommand}` });

        if (["sudo rm rf/", "sudo rm -rf /", "sudo rm -rf/"].includes(command)) {
          consoleLines.push({ kind: "response", text: "close request sent. The browser may refuse to close this tab." });
          renderLines();
          window.close();
        } else if (command === "neofetch") {
          consoleLines.push({
            kind: "ascii",
            text: "  ##    ##\n          \n    ++    \n          \n  ##    ##\n\nmariosl35\nsite index / static web\nprojects + tools",
          });
          renderLines();
        } else {
          consoleLines.push({ kind: "response", text: `command not found: ${rawCommand}` });
          renderLines();
        }

        while (consoleLines.length > 4) consoleLines.shift();
        renderLines();
        consoleInput.value = "";
      });
    }
  }
})();
