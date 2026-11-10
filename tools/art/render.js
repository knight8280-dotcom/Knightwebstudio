// Rasterise the crest into the site's icons and link-preview image.
//
//   python3 tools/art/build.py            (first: writes logo.svg and crest.svg)
//   node tools/art/render.js              (needs Playwright + a Chromium)
//
// Writes favicon.ico (16/32/48), assets/img/apple-touch-icon.png (180),
// assets/img/icon-192.png, assets/img/icon-512.png and assets/img/og-image.png
// (1200×630). The small icons use emblems.favicon_mark(): at 16px, rivets and
// the glint are noise, so they are left out.
//
// Colours and fonts follow assets/css/styles.css: warm paper, ink, brick, with
// Fraunces (soft) for the headline and Figtree for text. The link-preview image
// says only what the site says: what we do, that prices are fixed, where we are.
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync, execSync } = require('child_process');

let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }

const ROOT = path.resolve(__dirname, '..', '..');
const py = (expr) => execFileSync('python3', ['-c',
  `import sys; sys.path.insert(0, ${JSON.stringify(__dirname)}); import emblems as e; print(${expr})`]).toString();

const FAVICON = py('e.favicon_mark()');
const LOGO = fs.readFileSync(path.join(ROOT, 'assets/img/logo.svg'), 'utf8');
const CREST = fs.readFileSync(path.join(ROOT, 'assets/img/crest.svg'), 'utf8');
const STREET = py('e.street("og")');
const PAPER = '#F6F0E4', INK = '#1A2238', INK2 = '#454C61', BRICK = '#A83C26';
const font = (f) => 'file://' + path.join(ROOT, 'assets/fonts', f);

function page(body, w, h, transparent) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: "Fraunces"; src: url("${font('fraunces-soft.woff2')}") format("woff2"); font-weight: 100 900; }
    @font-face { font-family: "Figtree"; src: url("${font('figtree.woff2')}") format("woff2"); font-weight: 300 900; }
    :root { --L: initial; --D: ; }   /* the drawings' day palette (see the stylesheet's theme switches) */
    html, body { margin: 0; width: ${w}px; height: ${h}px; background: ${transparent ? 'transparent' : PAPER}; }
    svg { display: block; }
    .sc-sign { font-family: Fraunces, Georgia, serif; font-weight: 700; font-variation-settings: "SOFT" 100; letter-spacing: .16em; }
    .sc-open { font-family: Figtree, Arial, sans-serif; font-weight: 800; }
    .sc-night { opacity: 0; }
  </style></head><body>${body}</body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kws-art-'));

  async function shot(html, w, h, transparent) {
    const file = path.join(tmp, `p${w}x${h}.html`);
    fs.writeFileSync(file, page(html, w, h, transparent));
    const pg = await browser.newPage({ viewport: { width: w, height: h } });
    await pg.goto('file://' + file);
    await pg.evaluate(() => document.fonts.ready);
    const png = await pg.screenshot({ type: 'png', omitBackground: !!transparent });
    await pg.close();
    return png;
  }
  const sized = (svg, s) => svg.replace('<svg ', `<svg width="${s}" height="${s}" `);
  // Solid tiles keep the crest inside the central ~64%, safe for Android's circular crop
  const tile = (s) => `<div style="width:${s}px;height:${s}px;display:grid;place-items:center;
      background:${PAPER}">${sized(LOGO, Math.round(s * .64))}</div>`;

  fs.writeFileSync(path.join(ROOT, 'assets/img/apple-touch-icon.png'), await shot(tile(180), 180, 180));
  fs.writeFileSync(path.join(ROOT, 'assets/img/icon-192.png'), await shot(tile(192), 192, 192));
  fs.writeFileSync(path.join(ROOT, 'assets/img/icon-512.png'), await shot(tile(512), 512, 512));

  // favicon.ico holding PNG images (every current browser reads these)
  const icos = [];
  for (const s of [16, 32, 48]) icos.push([s, await shot(sized(FAVICON, s), s, s, true)]);
  const header = Buffer.alloc(6 + 16 * icos.length);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(icos.length, 4);
  let offset = header.length;
  icos.forEach(([s, png], i) => {
    const o = 6 + i * 16;
    header.writeUInt8(s, o); header.writeUInt8(s, o + 1); header.writeUInt8(0, o + 2); header.writeUInt8(0, o + 3);
    header.writeUInt16LE(1, o + 4); header.writeUInt16LE(32, o + 6);
    header.writeUInt32LE(png.length, o + 8); header.writeUInt32LE(offset, o + 12);
    offset += png.length;
  });
  fs.writeFileSync(path.join(ROOT, 'favicon.ico'), Buffer.concat([header, ...icos.map(([, p]) => p)]));

  // Link preview: the promise on the left, the shop front on the right
  const og = `<div style="position:relative;width:1200px;height:630px;overflow:hidden;background:${PAPER};font-family:Figtree,sans-serif;color:${INK2}">
    <div style="position:absolute;left:0;right:0;top:0;height:14px;background:${INK}"></div>
    <div style="position:absolute;right:64px;top:74px;width:470px">${STREET.replace('<svg ', '<svg width="470" height="501" ')}</div>
    <div style="position:absolute;left:72px;top:78px;width:560px">
      <div style="display:flex;align-items:center;gap:16px">${sized(LOGO, 64)}
        <span style="font:700 34px/1 Fraunces;font-variation-settings:'SOFT' 100;letter-spacing:-.015em;color:${INK}">KnightWebstudio</span></div>
      <div style="margin-top:44px;font:600 72px/1 Fraunces;font-variation-settings:'SOFT' 100;letter-spacing:-.022em;color:${INK}">
        Websites that win you customers</div>
      <div style="margin-top:28px;font:500 27px/1.42 Figtree">Websites, automation and consulting for local businesses. Fixed, published prices.</div>
      <div style="display:flex;align-items:center;gap:14px;margin-top:34px;font:800 20px/1.3 Figtree;letter-spacing:.12em;text-transform:uppercase;color:${BRICK}">
        <span style="width:30px;height:3px;border-radius:2px;background:${BRICK}"></span>Baton Rouge, Louisiana</div>
      <div style="margin:8px 0 0 44px;font:700 24px/1.3 Figtree;color:${INK}">knightwebstudio.com</div>
    </div></div>`;
  fs.writeFileSync(path.join(ROOT, 'assets/img/og-image.png'), await shot(og, 1200, 630));

  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, og-image.png');
})();
