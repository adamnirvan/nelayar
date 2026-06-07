// Lift the generated service worker to the web root so it controls root scope (`/`).
//
// vite-plugin-pwa emits sw.js into the Vite outDir (public/build), which would scope
// the SW to `/build/` — too narrow to intercept the Inertia HTML documents served from
// `/`, `/map`, dst. Browsers cap a SW's scope at its own directory, so the file must
// physically live at the web root for fishermen's pages to load offline.
//
// Moving it up breaks the SW-relative precache URLs (`assets/…` would resolve to
// `/assets/…` instead of `/build/assets/…`), so we rewrite those to be root-absolute.
// Runs as a discrete step after `vite build` because the plugin generates the SW after
// Vite's closeBundle hook — copying inside a plugin hook races the generation.
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = resolve(root, 'public/build');
const publicDir = resolve(root, 'public');

const swSrc = resolve(buildDir, 'sw.js');
if (!existsSync(swSrc)) {
    console.error('[pwa-postbuild] public/build/sw.js not found — did the PWA build run?');
    process.exit(1);
}

let sw = readFileSync(swSrc, 'utf8');

// Rewrite precache + workbox URLs from SW-relative (valid under /build/) to
// root-absolute (valid from / where the SW now lives).
sw = sw
    .replaceAll('url:"assets/', 'url:"/build/assets/')
    .replaceAll('url:"manifest.webmanifest"', 'url:"/manifest.webmanifest"')
    .replaceAll('"./workbox-', '"/build/workbox-');

writeFileSync(resolve(publicDir, 'sw.js'), sw);

// Copy the PWA manifest (icon/start_url paths are already root-absolute).
const manifestSrc = resolve(buildDir, 'manifest.webmanifest');
if (existsSync(manifestSrc)) {
    copyFileSync(manifestSrc, resolve(publicDir, 'manifest.webmanifest'));
}

// Fallback: if the Workbox runtime wasn't inlined, the SW still importScripts a
// separate workbox-*.js — keep that file reachable at the rewritten /build path.
const workboxFiles = readdirSync(buildDir).filter((f) => /^workbox-.*\.js$/.test(f));
const inlined = !sw.includes('/build/workbox-');
console.log(
    `[pwa-postbuild] sw.js → public/sw.js (root scope). ` +
        `Workbox runtime ${inlined ? 'inlined' : `external: ${workboxFiles.join(', ')}`}.`,
);
