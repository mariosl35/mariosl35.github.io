/* mariosl357 fxmanifest Generator */
(function () {
  "use strict";

  const picker = document.querySelector("[data-resource-files]");
  const count = document.querySelector("[data-file-count]");
  const detected = document.querySelector("[data-detected]");
  const output = document.querySelector("[data-manifest-output]");
  const saveButton = document.querySelector("[data-download]");
  const warning = document.querySelector("[data-manifest-warning]");
  const changesEl = document.querySelector("[data-manifest-changes]");
  let manifestText = "";

  const cleanPath = (file) => (file.webkitRelativePath || file.name).replace(/\\/g, "/");
  const listFiles = (files, extension) => files.filter((file) => file.toLowerCase().endsWith(extension));
  const quoteList = (items) => items.map((item) => `    '${item}'`).join(",\n");
  const hasLine = (text, pattern) => new RegExp(pattern, "im").test(text);

  function detect(paths, source) {
    const lua = listFiles(paths, ".lua");
    const client = lua.filter((path) => /(^|\/)client([._-]|\/)/i.test(path));
    const server = lua.filter((path) => /(^|\/)server([._-]|\/)/i.test(path));
    const shared = lua.filter((path) => /(^|\/)shared([._-]|\/)/i.test(path));
    const html = paths.filter((path) => /\.html?$/i.test(path));
    const css = paths.filter((path) => /\.css$/i.test(path));
    const js = paths.filter((path) => /\.js$/i.test(path));
    const assets = paths.filter((path) => /(^|\/)(stream|assets?)(\/|$)/i.test(path));
    const ui = html.find((path) => /(^|\/)(index|main)\.html?$/i.test(path)) || html[0];
    return {
      lua,
      client,
      server,
      shared,
      html,
      css,
      js,
      assets,
      ui,
      manifest: paths.find((path) => /(^|\/)fxmanifest\.lua$/i.test(path)),
      nativeUI: /\bNativeUI\s*\./i.test(source),
      oxLib: /(?:@ox_lib\/init\.lua|exports\.ox_lib\b|\blib\.)/i.test(source),
    };
  }

  function dependencyLines(groups) {
    const lines = [];
    if (groups.nativeUI) lines.push("dependency 'NativeUI'", "");
    if (groups.oxLib) lines.push("dependency 'ox_lib'", "shared_script '@ox_lib/init.lua'", "");
    return lines;
  }

  function freshManifest(groups) {
    const lines = ["fx_version 'cerulean'", "game 'gta5'", "", ...dependencyLines(groups)];
    if (groups.shared.length) lines.push("shared_scripts {", quoteList(groups.shared), "}", "");
    if (groups.client.length === 1 && groups.client[0] === "client.lua" && !groups.shared.length && !groups.server.length) {
      lines.push("client_script 'client.lua'", "");
    } else if (groups.client.length) {
      lines.push("client_scripts {", quoteList(groups.client), "}", "");
    }
    if (groups.server.length) lines.push("server_scripts {", quoteList(groups.server), "}", "");
    if (groups.ui) {
      lines.push(`ui_page '${groups.ui}'`, "");
      const uiFiles = [...groups.html, ...groups.css, ...groups.js, ...groups.assets];
      if (uiFiles.length) lines.push("files {", quoteList([...new Set(uiFiles)]), "}", "");
    }
    return lines.join("\n");
  }

  function repairManifest(existing, groups) {
    let text = existing.trim();
    const changes = [];
    if (!hasLine(text, "^\\s*fx_version\\s")) {
      text = "fx_version 'cerulean'\n" + text;
      changes.push("Added missing fx_version 'cerulean'.");
    }
    if (!hasLine(text, "^\\s*game\\s")) {
      text += `${text.endsWith("\n") ? "" : "\n"}game 'gta5'`;
      changes.push("Added missing game 'gta5'.");
    }
    if (groups.client.includes("client.lua") && !/client_scripts?\b[\s\S]*client\.lua/i.test(text)) {
      text += `${text.endsWith("\n") ? "" : "\n"}\nclient_script 'client.lua'`;
      changes.push("Added client.lua to the manifest.");
    }
    if (groups.nativeUI && !hasLine(text, "^\\s*dependency\\s+['\"]NativeUI['\"]")) {
      text += `${text.endsWith("\n") ? "" : "\n"}\ndependency 'NativeUI'`;
      changes.push("Added the NativeUI dependency.");
    }
    if (groups.oxLib && !hasLine(text, "^\\s*dependency\\s+['\"]ox_lib['\"]")) {
      text += `${text.endsWith("\n") ? "" : "\n"}\ndependency 'ox_lib'\nshared_script '@ox_lib/init.lua'`;
      changes.push("Added the ox_lib dependency and init script.");
    }
    return { text: `${text.trim()}\n`, changes };
  }

  function renderDetected(groups, changes, hasExistingManifest) {
    const entries = [
      ["Lua files", groups.lua.length],
      ["Client scripts", groups.client.length],
      ["Server scripts", groups.server.length],
      ["NUI files", groups.html.length + groups.css.length + groups.js.length],
      ["Assets", groups.assets.length],
      ["Existing fxmanifest", groups.manifest ? "yes" : "no"],
      ["NativeUI detected", groups.nativeUI ? "yes" : "no"],
      ["ox_lib detected", groups.oxLib ? "yes" : "no"],
    ];
    detected.innerHTML = entries.map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`).join("");
    changesEl.innerHTML = changes.length
      ? `<strong>Changes applied</strong>${changes.map((change) => `<span>${change}</span>`).join("")}`
      : hasExistingManifest
        ? "<strong>No automatic changes</strong><span>The existing manifest was loaded as-is.</span>"
        : "<strong>Manifest generated</strong><span>No manifest exists, so one was generated from the detected files.</span>";
  }

  picker.addEventListener("change", () => {
    const selectedFiles = [...picker.files];
    const rawPaths = selectedFiles.map(cleanPath);
    const firstParts = rawPaths[0] ? rawPaths[0].split("/") : [];
    const commonRoot = firstParts.length > 1 ? firstParts[0] : "";
    const paths = commonRoot && rawPaths.every((path) => path.startsWith(`${commonRoot}/`))
      ? rawPaths.map((path) => path.slice(commonRoot.length + 1))
      : rawPaths;
    count.textContent = `${paths.length} file${paths.length === 1 ? "" : "s"} selected.`;
    if (!paths.length) return;
    Promise.all(selectedFiles.map(async (file) => ({
      path: cleanPath(file),
      contents: /\.lua$/i.test(cleanPath(file)) ? await file.text() : "",
    }))).then((entries) => {
      const source = entries.map((entry) => entry.contents).join("\n");
      const groups = detect(paths, source);
      const manifestEntry = entries.find((entry) => /(^|\/)fxmanifest\.lua$/i.test(entry.path));
      const result = manifestEntry ? repairManifest(manifestEntry.contents, groups) : { text: freshManifest(groups), changes: [] };
      manifestText = result.text;
      output.value = manifestText;
      renderDetected(groups, result.changes, Boolean(manifestEntry));
      saveButton.disabled = false;
      warning.textContent = groups.nativeUI
        ? "NativeUI was detected. If it does not work, remove dependency 'NativeUI' and use client_scripts { '@NativeUI/NativeUI.lua' } instead."
        : groups.oxLib
          ? "ox_lib was detected and added. Review the generated lines before using the file."
          : "Review the generated file before using it. Browser-side detection cannot validate every resource dependency.";
    });
  });

  saveButton.addEventListener("click", async () => {
    if (!manifestText) return;
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: "fxmanifest.lua",
          types: [{ description: "Lua file", accept: { "text/plain": [".lua"] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(manifestText);
        await writable.close();
        saveButton.textContent = "Saved locally";
        setTimeout(() => { saveButton.textContent = "Save fxmanifest.lua"; }, 1200);
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    const blob = new Blob([manifestText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "fxmanifest.lua";
    link.click();
    URL.revokeObjectURL(link.href);
  });
})();
