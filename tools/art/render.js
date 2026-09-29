// Rasterise the crest into the site's icons and link-preview image.
//
//   python3 tools/art/build.py            (first: writes logo.svg and crest.svg)
//   node tools/art/render.js              (needs Playwright + a Chromium)
//
// Writes favicon.ico (16/32/48), assets/img/apple-touch-icon.png (180),
// assets/img/icon-192.png, assets/img/icon-512.png and assets/img/og-image.png
// (1200×630). The small icons use emblems.favicon_mark(): at 16px, rivets and
// the glint are noise, so they are left out.
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
const SHARDS = py('e.shards()');
const font = (f) => 'file://' + path.join(ROOT, 'assets/fonts', f);

function page(body, w, h, transparent) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: "Bricolage"; src: url("${font('bricolage-grotesque.woff2')}") format("woff2"); font-weight: 200 800; }
    @font-face { font-family: "Manrope"; src: url("${font('manrope.woff2')}") format("woff2"); font-weight: 400 800; }
    html, body { margin: 0; width: ${w}px; height: ${h}px; background: ${transparent ? 'transparent' : '#080b14'}; }
    svg { display: block; }
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
      background:radial-gradient(70% 70% at 50% 42%, #17203a, #080b14)">${sized(LOGO, Math.round(s * .64))}</div>`;

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

  // Link preview: crest on the left, the promise on the right
  const og = `<div style="position:relative;width:1200px;height:630px;overflow:hidden;
      background:radial-gradient(60% 80% at 28% 45%, #17203a, #080b14 70%);font-family:Manrope,sans-serif;color:#eef2fb">
    <div style="position:absolute;inset:0;opacity:.9">${SHARDS.replace('class="shards"', 'class="shards" width="1200" height="630"')}</div>
    <div style="position:absolute;left:70px;top:95px;width:400px">${CREST.replace('<svg ', '<svg width="400" height="410" ')}</div>
    <div style="position:absolute;left:520px;top:128px;width:610px">
      <div style="font:700 22px Manrope;letter-spacing:.14em;text-transform:uppercase;color:#a5b8ff">KnightWebstudio</div>
      <div style="margin-top:22px;font:700 66px/1.02 Bricolage;letter-spacing:-.04em;font-variation-settings:'wdth' 92">
        Websites that make your business <span style="color:#6d8bff">impossible to ignore</span></div>
      <div style="margin-top:30px;font:500 26px/1.4 Manrope;color:#9aa8c7">Custom sites for small businesses, live in as little as 7–10 days, quoted up front.</div>
      <div style="margin-top:30px;font:700 24px Manrope;color:#46e0c0">knightwebstudio.com</div>
    </div></div>`;
  fs.writeFileSync(path.join(ROOT, 'assets/img/og-image.png'), await shot(og, 1200, 630));

  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, og-image.png');
})();
