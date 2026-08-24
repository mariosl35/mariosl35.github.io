# mariosl35 | v1.2.2

A personal developer and creator index for mariosl35. It documents real FiveM resources, GTA V modding work, graphics, experiments, and browser tools. The site uses plain HTML, CSS, and vanilla JavaScript with no build step, framework, backend, or database.

## Structure

```
index.html        Home: hero, live log feed, featured registry, tools preview, and about teaser
projects.html      Full project registry with type filters + search
project.html       Legacy dynamic project fallback, rendered from ?slug= in the URL
projects/acw.html  A Cleaner World project page and share URL
projects/cm.html   Cloud Menu project page and share URL
tools.html         Tools/utilities grid
tools/colorc.html  Built-in Color Converter utility
tools/fxman.html   Built-in fxmanifest Generator
changelog.html     Full dated changelog
about.html         Bio, stack, and principles
css/style.css      All styles. Tokens are at the top of the file.
js/data.js         ALL editable content: PROJECTS, TOOLS, CHANGELOG arrays
js/main.js         Nav toggle, clock, generative thumbnail system
js/registry.js     Renders registry rows, tools grid, changelog, stat strip, log ticker
js/project.js      Renders the individual project page from data.js + the URL slug
js/colorc.js       Runs the built-in Color Converter
js/fxman.js        Runs the built-in fxmanifest Generator
assets/favicon.svg Site icon
assets/Inter/      Self-hosted Inter webfont files and license
assets/SpaceGrotesk/ Self-hosted Space Grotesk webfont files and license
assets/JetBrainsMono/ Self-hosted JetBrains Mono webfont files and license
```

## Design system

Tokens (colors, spacing, type) are defined as CSS custom properties at the top of
`css/style.css` under `:root`. Fonts are Space Grotesk (display), Inter (body), and
JetBrains Mono (labels/data), self-hosted from the `assets` folder as `.woff2` files.
Project and tool pages provide server-visible metadata for Discord and other link preview
crawlers. Project pages are now maintained inside the `projects` folder and tool pages
inside the `tools` folder.

## Known gaps

- The FiveM Resource Inspector and GTA Hash Converter are planned explanation-only tools.
- No CMS, build step, or database. This is intentional. If the project list grows
  large enough that hand-editing `data.js` gets unwieldy, that's the point where a small
  build step or headless CMS would start to earn its keep.
