/* mariosl357 Color Converter */
(function () {
  "use strict";

  const hexInput = document.querySelector("[data-hex]");
  const inputs = {
    r: document.querySelector("[data-r]"),
    g: document.querySelector("[data-g]"),
    b: document.querySelector("[data-b]"),
  };
  const outputs = {
    hex: document.querySelector("[data-out-hex]"),
    rgb: document.querySelector("[data-out-rgb]"),
    hsv: document.querySelector("[data-out-hsv]"),
    lch: document.querySelector("[data-out-lch]"),
  };
  const swatch = document.querySelector("[data-swatch]");
  const error = document.querySelector("[data-error]");
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function parseHex(value) {
    const clean = value.trim().replace(/^#/, "");
    if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(clean)) return null;
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  }

  function rgbToHex([r, g, b]) {
    return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  }

  function rgbToHsv([r, g, b]) {
    const values = [r, g, b].map((value) => value / 255);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const delta = max - min;
    let h = 0;
    if (delta) {
      if (max === values[0]) h = 60 * (((values[1] - values[2]) / delta) % 6);
      else if (max === values[1]) h = 60 * ((values[2] - values[0]) / delta + 2);
      else h = 60 * ((values[0] - values[1]) / delta + 4);
    }
    if (h < 0) h += 360;
    return [h, max ? (delta / max) * 100 : 0, max * 100];
  }

  function rgbToLch(rgb) {
    const linear = rgb.map((value) => {
      const v = value / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    const [r, g, b] = linear;
    const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1;
    const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
    const f = (value) => (value > 0.008856 ? value ** (1 / 3) : 7.787 * value + 16 / 116);
    const fx = f(x);
    const fy = f(y);
    const fz = f(z);
    const lab = [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
    const chroma = Math.sqrt(lab[1] ** 2 + lab[2] ** 2);
    let hue = Math.atan2(lab[2], lab[1]) * (180 / Math.PI);
    if (hue < 0) hue += 360;
    return [lab[0], chroma, hue];
  }

  function update(rgb) {
    const hex = rgbToHex(rgb);
    const hsv = rgbToHsv(rgb);
    const lch = rgbToLch(rgb);
    outputs.hex.textContent = hex;
    outputs.rgb.textContent = `rgb(${rgb.join(", ")})`;
    outputs.hsv.textContent = `hsv(${hsv.map((v) => v.toFixed(1)).join(", ")})`;
    outputs.lch.textContent = `lch(${lch.map((v) => v.toFixed(1)).join(", ")})`;
    swatch.style.backgroundColor = hex;
    error.textContent = "";
  }

  function fromHex() {
    const rgb = parseHex(hexInput.value);
    if (!rgb) {
      error.textContent = "Enter a valid 3 or 6 digit Hex value.";
      return;
    }
    ["r", "g", "b"].forEach((key, index) => { inputs[key].value = rgb[index]; });
    update(rgb);
  }

  function fromRgb() {
    const rgb = ["r", "g", "b"].map((key) => clamp(parseInt(inputs[key].value, 10) || 0, 0, 255));
    ["r", "g", "b"].forEach((key, index) => { inputs[key].value = rgb[index]; });
    hexInput.value = rgbToHex(rgb);
    update(rgb);
  }

  hexInput.addEventListener("input", fromHex);
  Object.values(inputs).forEach((input) => input.addEventListener("input", fromRgb));
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(outputs[button.dataset.copy].textContent);
        button.textContent = "Copied";
      } catch (clipboardError) {
        button.textContent = "Copy unavailable";
      }
      setTimeout(() => { button.textContent = "Copy"; }, 900);
    });
  });
  fromHex();
})();
