# mariosl357 | v1.1.0

A personal developer and creator index for mariosl357. It documents real FiveM resources, GTA V modding work, graphics, experiments, and browser tools. The site uses plain HTML, CSS, and vanilla JavaScript with no build step, framework, backend, or database.

## Run it locally

Any static file server works. From this folder:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Opening `index.html` directly by double-clicking also works for browsing, but a local
server is recommended so relative paths and the URL-param-based project page
(`project.html?slug=...`) behave consistently across browsers.

## Structure

```
index.html        Home: hero, live log feed, featured registry, tools preview, and about teaser
projects.html      Full project registry with type filters + search
project.html       Single project template, rendered from ?slug= in the URL
tools.html         Tools/utilities grid
colorc.html        Built-in Color Converter utility
fxman.html         Built-in fxmanifest Generator
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

## Editing content

Everything you'll want to change day-to-day lives in **`js/data.js`**:

- Add a project → add an object to the `PROJECTS` array. It automatically appears in the
  home registry, the full `/projects` registry, filters, and gets its own `/project.html?slug=`
  page. No other file needs to change.
- Add a tool → add an object to `TOOLS`.
- Add a log entry → add an object to `CHANGELOG`, newest at the top. It automatically shows
  up on the home page's live feed and on `/changelog.html`. Set `target` to a project's `slug`
  to link it back to that project's page.

Every project gets a small generated geometric mark instead of a placeholder photo. It is
seeded from the `seed` field on each project object (see `generateMark()` in `js/main.js`),
so it's deterministic and free, and you can swap in real screenshots later by replacing
`generateMark(...)` calls with `<img>` tags once you have real project imagery.

## Design system

Tokens (colors, spacing, type) are defined as CSS custom properties at the top of
`css/style.css` under `:root`. Fonts are Space Grotesk (display), Inter (body), and
JetBrains Mono (labels/data), self-hosted from the `assets` folder as `.woff2` files.

## Known gaps

- Discord has no public community link yet.
- The FiveM Resource Inspector and GTA Hash Converter are planned explanation-only tools.
- No CMS, build step, or database. This is intentional. If the project list grows
  large enough that hand-editing `data.js` gets unwieldy, that's the point where a small
  build step or headless CMS would start to earn its keep.
