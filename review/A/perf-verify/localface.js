// How does Chromium resolve @font-face src: local("Family") when the element asks for weight 600?
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();
  await page.route('**/__f/**', r => r.fulfill({ body: fs.readFileSync(__dirname + '/fonts/' + r.request().url().split('/__f/')[1]), contentType: 'font/woff2' }));
  await page.goto('http://localhost:8720/404.html');
  await page.setContent(`<style>
    @font-face { font-family: "T1"; src: local("Liberation Serif"); }
    @font-face { font-family: "T2"; src: local("Liberation Serif Bold"), local("LiberationSerif-Bold"); font-weight: 100 900; }
    @font-face { font-family: "Fraunces"; src: url("/assets/fonts/fraunces-soft.woff2") format("woff2"); font-weight: 100 900; }
    @font-face { font-family: "NotoS"; src: url("/__f/notoserif-var.woff2") format("woff2"); font-weight: 400; }
    @font-face { font-family: "Geo"; src: url("/__f/gelasio-var.woff2") format("woff2"); font-weight: 400 700; }
    span { font-size: 100px; white-space: nowrap; position: absolute; }
  </style>
  <span id="a" style="font-family:T1;font-weight:600;font-synthesis:none">Fixed prices, published up front</span>
  <span id="a2" style="font-family:T1;font-weight:600">Fixed prices, published up front</span>
  <span id="b" style="font-family:'Liberation Serif';font-weight:400">Fixed prices, published up front</span>
  <span id="c" style="font-family:'Liberation Serif';font-weight:700">Fixed prices, published up front</span>
  <span id="d" style="font-family:T2;font-weight:600;font-synthesis:none">Fixed prices, published up front</span>
  <span id="f" style="font-family:Fraunces;font-weight:600;font-variation-settings:'SOFT' 100">Fixed prices, published up front</span>
  <span id="n" style="font-family:NotoS;font-weight:400">Fixed prices, published up front</span>
  <span id="g7" style="font-family:Geo;font-weight:700">Fixed prices, published up front</span>`);
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(500);
  const w = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('span')].map(s => [s.id, +s.getBoundingClientRect().width.toFixed(1)])));
  console.log(w);
  console.log('local("Liberation Serif") at weight 600 = regular face?', w.a === w.b, '| = bold face?', w.a === w.c, '| with synthesis allowed:', w.a2);
  console.log('local("Liberation Serif Bold") + weight range at 600 = bold face?', w.d === w.c);
  console.log('Fraunces / Noto Serif regular =', (w.f / w.n).toFixed(3));
  // font metrics
  const m = await page.evaluate(() => { const c = document.createElement('canvas').getContext('2d'); const r = {}; for (const [k, f] of [['Fraunces', '600 1000px Fraunces'], ['Georgia-bold stand-in', '700 1000px Geo'], ['Noto Serif', '400 1000px NotoS']]) { c.font = f; const t = c.measureText('Hxg'); r[k] = [Math.round(t.fontBoundingBoxAscent), Math.round(t.fontBoundingBoxDescent)]; } return r; });
  console.log('ascent/descent per 1000:', m);
  await b.close();
})();
