/* mariosl35 FiveM Resource Inspector */
(function () {
  "use strict";

  const picker = document.querySelector("[data-resource-files]");
  const count = document.querySelector("[data-file-count]");
  const summary = document.querySelector("[data-summary]");
  const empty = document.querySelector("[data-empty-report]");
  const results = document.querySelector("[data-results]");
  const copyButton = document.querySelector("[data-copy-report]");
  let reportText = "";

  const cleanPath = (file) => (file.webkitRelativePath || file.name).replace(/\\/g, "/");
  const stripRoot = (paths) => {
    const firstParts = paths[0] ? paths[0].split("/") : [];
    const commonRoot = firstParts.length > 1 ? firstParts[0] : "";
    return commonRoot && paths.every((path) => path.startsWith(`${commonRoot}/`))
      ? paths.map((path) => path.slice(commonRoot.length + 1))
      : paths;
  };
  const byExt = (paths, ext) => paths.filter((path) => path.toLowerCase().endsWith(ext));
  const has = (paths, pattern) => paths.some((path) => pattern.test(path));
  const unique = (items) => [...new Set(items)];
  const fileName = (path) => path.split("/").pop().toLowerCase();

  const vehicleMeta = {
    "vehicles.meta": "Vehicle definitions",
    "carvariations.meta": "Vehicle variation data",
    "handling.meta": "Handling data",
    "vehiclelayouts.meta": "Vehicle layout data",
    "carcols.meta": "Vehicle color/modkit data",
    "dlctext.meta": "DLC text labels",
    "contentunlocks.meta": "Content unlock metadata",
    "shop_vehicle.meta": "Vehicle shop data",
  };

  function detectDependencies(source, paths) {
    const checks = [
      ["NativeUI", /\bNativeUI\s*\.|@NativeUI\/NativeUI\.lua/i],
      ["MenuAPI", /\bMenuAPI\b|@menuapi\/menuapi\.lua/i],
      ["ox_lib", /@ox_lib\/init\.lua|exports\.ox_lib\b|\blib\./i],
      ["ESX", /\bESX\b|es_extended|getSharedObject/i],
      ["qb-core", /\bQBCore\b|qb-core|GetCoreObject/i],
      ["mysql-async", /mysql-async|MySQL\.Async/i],
      ["oxmysql", /oxmysql|MySQL\.query|MySQL\.insert|MySQL\.update/i],
    ];
    const detected = checks.filter(([, pattern]) => pattern.test(source)).map(([name]) => name);
    if (has(paths, /(^|\/)html\/|(^|\/)ui\/|(^|\/)web\//i)) detected.push("NUI");
    return unique(detected);
  }

  function inspect(paths, source, manifestText) {
    const lua = byExt(paths, ".lua");
    const client = lua.filter((path) => /(^|\/)client([._-]|\/)|client\.lua$/i.test(path));
    const server = lua.filter((path) => /(^|\/)server([._-]|\/)|server\.lua$/i.test(path));
    const shared = lua.filter((path) => /(^|\/)shared([._-]|\/)|config\.lua$|shared\.lua$/i.test(path));
    const html = paths.filter((path) => /\.html?$/i.test(path));
    const css = byExt(paths, ".css");
    const js = byExt(paths, ".js");
    const stream = paths.filter((path) => /(^|\/)stream\//i.test(path));
    const ymap = paths.filter((path) => /\.ymap$/i.test(path));
    const ytyp = paths.filter((path) => /\.ytyp$/i.test(path));
    const meta = byExt(paths, ".meta");
    const manifest = paths.find((path) => /(^|\/)(fxmanifest|__resource)\.lua$/i.test(path));
    const vehicleMetaFiles = meta.filter((path) => vehicleMeta[fileName(path)]);
    const dependencies = detectDependencies(source + "\n" + manifestText, paths);
    const warnings = [];
    const notes = [];
    const resourceTypes = [];

    if (!manifest) warnings.push("No fxmanifest.lua or __resource.lua was found.");
    if (manifest && /__resource\.lua$/i.test(manifest)) warnings.push("__resource.lua is legacy. Prefer fxmanifest.lua for new resources.");
    if (manifestText && !/^\s*fx_version\s/m.test(manifestText)) warnings.push("The manifest does not declare fx_version.");
    if (manifestText && !/^\s*game\s/m.test(manifestText)) warnings.push("The manifest does not declare game 'gta5'.");
    if (html.length && !/^\s*ui_page\s/m.test(manifestText)) warnings.push("NUI files were found, but ui_page was not detected in the manifest.");
    if (ymap.length && !/this_is_a_ymap\s+['"]yes['"]/i.test(manifestText)) warnings.push("YMAP files were found. Map resources usually need this_is_a_ymap 'yes'.");
    if (ytyp.length && !/DLC_ITYP_REQUEST/i.test(manifestText)) warnings.push("YTYP files were found, but DLC_ITYP_REQUEST was not detected.");
    if (vehicleMetaFiles.length && !/data_file\s+['"][A-Z_]+['"]/i.test(manifestText)) warnings.push("Vehicle metadata files were found, but data_file entries were not detected.");
    if (!lua.length && !stream.length && !meta.length && !html.length) warnings.push("No common FiveM resource files were detected.");

    if (client.length) resourceTypes.push("client script resource");
    if (server.length) resourceTypes.push("server script resource");
    if (shared.length) resourceTypes.push("shared/configured Lua resource");
    if (html.length || css.length || js.length) resourceTypes.push("NUI resource");
    if (stream.length || ymap.length || ytyp.length) resourceTypes.push("stream/map resource");
    if (vehicleMetaFiles.length) resourceTypes.push("vehicle metadata resource");
    if (!resourceTypes.length && lua.length) resourceTypes.push("Lua resource");
    if (!dependencies.length && (lua.length || html.length || stream.length || meta.length)) resourceTypes.push("likely standalone resource");

    if (dependencies.length) notes.push(`Dependency hints: ${dependencies.join(", ")}.`);
    if (vehicleMetaFiles.length) notes.push(`Vehicle metadata: ${vehicleMetaFiles.map((path) => `${path} (${vehicleMeta[fileName(path)]})`).join(", ")}.`);
    if (manifest) notes.push(`Manifest found: ${manifest}.`);

    return {
      resourceTypes,
      dependencies,
      warnings,
      notes,
      counts: {
        files: paths.length,
        lua: lua.length,
        client: client.length,
        server: server.length,
        shared: shared.length,
        nui: html.length + css.length + js.length,
        stream: stream.length,
        meta: meta.length,
        ymap: ymap.length,
        ytyp: ytyp.length,
      },
    };
  }

  function renderList(items, fallback) {
    return `<ul>${(items.length ? items : [fallback]).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function renderReport(report) {
    const cards = [
      ["Likely resource type", renderList(report.resourceTypes, "Unknown until more recognizable files are present.")],
      ["Dependency hints", renderList(report.dependencies, "No common framework or library dependency was detected.")],
      ["Warnings", renderList(report.warnings, "No obvious setup issues detected from file names and readable text files.")],
      ["Notes", renderList(report.notes, "Select a resource with Lua, manifest, NUI, stream, or metadata files for a richer report.")],
    ];

    results.innerHTML = cards.map(([title, body]) => `
      <section class="inspector-card">
        <h3>${title}</h3>
        ${body}
      </section>
    `).join("");
  }

  function buildTextReport(report) {
    const lines = [
      "FiveM Resource Inspector report",
      "",
      `Files: ${report.counts.files}`,
      `Lua: ${report.counts.lua}`,
      `Client scripts: ${report.counts.client}`,
      `Server scripts: ${report.counts.server}`,
      `Shared/config files: ${report.counts.shared}`,
      `NUI files: ${report.counts.nui}`,
      `Stream files: ${report.counts.stream}`,
      `Meta files: ${report.counts.meta}`,
      `YMAP files: ${report.counts.ymap}`,
      `YTYP files: ${report.counts.ytyp}`,
      "",
      `Likely type: ${report.resourceTypes.join(", ") || "Unknown"}`,
      `Dependencies: ${report.dependencies.join(", ") || "None detected"}`,
      "",
      "Warnings:",
      ...(report.warnings.length ? report.warnings.map((item) => `- ${item}`) : ["- No obvious setup issues detected."]),
      "",
      "Notes:",
      ...(report.notes.length ? report.notes.map((item) => `- ${item}`) : ["- No extra notes."]),
    ];
    return lines.join("\n");
  }

  picker.addEventListener("change", () => {
    const selectedFiles = [...picker.files];
    const rawPaths = selectedFiles.map(cleanPath);
    const paths = stripRoot(rawPaths);
    count.textContent = `${paths.length} file${paths.length === 1 ? "" : "s"} selected.`;
    if (!paths.length) return;

    Promise.all(selectedFiles.map(async (file, index) => {
      const path = paths[index];
      const readable = /\.(lua|json|cfg|txt|html?|css|js)$/i.test(path);
      return {
        path,
        contents: readable ? await file.text() : "",
      };
    })).then((entries) => {
      const source = entries.map((entry) => entry.contents).join("\n");
      const manifest = entries.find((entry) => /(^|\/)(fxmanifest|__resource)\.lua$/i.test(entry.path));
      const report = inspect(paths, source, manifest?.contents || "");
      const summaryEntries = [
        ["Files", report.counts.files],
        ["Lua files", report.counts.lua],
        ["NUI files", report.counts.nui],
        ["Stream files", report.counts.stream],
        ["Meta files", report.counts.meta],
        ["Warnings", report.warnings.length],
      ].filter(([, value]) => value);

      summary.innerHTML = summaryEntries.map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`).join("");
      renderReport(report);
      reportText = buildTextReport(report);
      empty.hidden = true;
      results.hidden = false;
      copyButton.disabled = false;
    });
  });

  copyButton.addEventListener("click", async () => {
    if (!reportText) return;
    try {
      await navigator.clipboard.writeText(reportText);
      copyButton.textContent = "Copied";
    } catch (error) {
      copyButton.textContent = "Copy unavailable";
    }
    setTimeout(() => { copyButton.textContent = "Copy report"; }, 1000);
  });
})();
