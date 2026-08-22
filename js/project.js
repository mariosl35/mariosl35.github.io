/* ==========================================================================
   mariosl35 project detail renderer
   Reads ?slug= from the URL and renders the matching entry from PROJECTS.
   ========================================================================== */

(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug") || document.body.dataset.projectSlug;
  const project = PROJECTS.find((p) => p.slug === slug);

  const root = document.querySelector("[data-project-root]");
  const notFound = document.querySelector("[data-project-not-found]");

  if (!project) {
    if (root) root.style.display = "none";
    if (notFound) notFound.style.display = "block";
    document.title = "Not found | mariosl35";
    return;
  }

  document.title = `${project.name} | mariosl35`;
  const descriptionMeta = document.querySelector("[data-meta-description]");
  if (descriptionMeta) descriptionMeta.setAttribute("content", project.tagline);
  const shareUrl = project.shareUrl || `https://mariosl35.github.io/projects/${project.slug}/`;
  const ogTitle = document.querySelector("[data-meta-og-title]");
  const ogDescription = document.querySelector("[data-meta-og-description]");
  const ogUrl = document.querySelector("[data-meta-og-url]");
  if (ogTitle) ogTitle.setAttribute("content", `${project.name} | mariosl35`);
  if (ogDescription) ogDescription.setAttribute("content", project.tagline);
  if (ogUrl) ogUrl.setAttribute("content", shareUrl);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute("href", shareUrl);

  const setText = (sel, val) => {
    document.querySelectorAll(sel).forEach((el) => {
      el.textContent = val;
    });
  };
  const setHTML = (sel, val) => {
    const el = document.querySelector(sel);
    if (el) el.innerHTML = val;
  };

  setText("[data-p-name]", project.name);
  setText("[data-p-slug]", `/${project.slug}`);
  setText("[data-p-tagline]", project.tagline);
  setText("[data-p-description]", project.description);
  setText("[data-p-type]", project.typeLabel);

  setHTML("[data-p-thumb]", generateMark(project.seed, 220));
  setHTML(
    "[data-p-status]",
    `<span class="status-pill status-${project.status}">${project.statusLabel}</span>`
  );

  setText("[data-meta-type]", project.typeLabel);
  setText("[data-meta-stack]", project.stack);
  setText("[data-meta-version]", project.version);
  setText("[data-meta-status]", project.statusLabel);
  setText("[data-meta-visibility]", project.visibility);
  setText("[data-meta-date]", project.date);

  const highlightsEl = document.querySelector("[data-p-highlights]");
  if (highlightsEl) {
    highlightsEl.innerHTML = (project.features || []).map((feature) => `<li>${feature}</li>`).join("");
    highlightsEl.closest(".detail-block")?.toggleAttribute("hidden", !(project.features || []).length);
  }

  const linksEl = document.querySelector("[data-p-links]");
  if (linksEl) {
    const links = [
      ["Repository", project.repository],
      ["Download", project.download],
      ["Documentation", project.documentation],
      ["Preview", project.preview],
    ].filter(([, href]) => href);
    linksEl.innerHTML = links
      .map(([label, href]) => `<a class="btn" href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`)
      .join("");
    linksEl.hidden = !links.length;
  }

  const publicNotesEl = document.querySelector("[data-p-public-notes]");
  const publicNotesTextEl = document.querySelector("[data-p-public-notes-text]");
  const publicNotes = project.notes?.public || "";
  if (publicNotesEl && publicNotesTextEl) {
    publicNotesTextEl.textContent = publicNotes;
    publicNotesEl.hidden = !publicNotes;
  }

  const assetsEl = document.querySelector("[data-p-assets]");
  if (assetsEl) {
    assetsEl.innerHTML = (project.screenshots || [])
      .map((asset) => `<img src="${asset.src}" alt="${asset.alt || project.name + " screenshot"}">`)
      .join("");
    assetsEl.hidden = !(project.screenshots || []).length;
  }

  // related changelog entries referencing this project
  const relatedEl = document.querySelector("[data-p-related-log]");
  if (relatedEl) {
    const related = CHANGELOG.filter((c) => c.target === project.slug).slice(0, 4);
    relatedEl.innerHTML = related.length
      ? related
          .map(
            (c) =>
              `<li>${formatDate(c.date)} | ${c.title}</li>`
          )
          .join("")
      : "<li>No log entries yet.</li>";
  }

  // other projects (simple "adjacent in registry" list)
  const otherEl = document.querySelector("[data-p-other]");
  if (otherEl) {
    const projectLink = (entry) => window.location.pathname.includes("/projects/")
      ? `${entry.slug}.html`
      : `projects/${entry.slug}.html`;
    const others = PROJECTS.filter((p) => p.slug !== project.slug).slice(0, 3);
    otherEl.innerHTML = others
      .map(
        (p) =>
          `<li><a class="text-link" href="${projectLink(p)}">${p.name}</a></li>`
      )
      .join("");
  }
})();
