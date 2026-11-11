// How visible is the wash? Photograph the first screen with the words (and the stamp, buttons, price strip) hidden, shaders 20x faster.
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (const theme of ['light', 'dark']) for (const [w, h] of [[1440, 900], [390, 844]]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
    await c.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await c.addInitScript(t => { try { localStorage.setItem('theme', t); localStorage.setItem('kws-motion', 'on'); sessionStorage.setItem('kws-crest', '1'); } catch (e) {} }, theme);
    const p = await c.newPage(); await p.goto('http://localhost:8730/kit/light/demo.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
    const info = await p.evaluate(() => { const host = document.querySelector('#top'), hb = host.getBoundingClientRect(), tw = document.createTreeWalker(host, 4), out = []; let n; while ((n = tw.nextNode())) if (/\S/.test(n.data)) { const r = document.createRange(); r.selectNodeContents(n); for (const q of r.getClientRects()) out.push([q.left, q.top, q.width, q.height]); } return { rects: out, host: [hb.left, hb.top, hb.width, hb.height] }; });
    await p.addStyleTag({ content: '#top .container { visibility: hidden !important; } #top .kws-shader::after { }' });
    await p.evaluate(() => { const el = document.querySelector('#top .kws-shader'); KWS.shader.mount(el)(); KWS.shader.mount(el, { speed: 20 }); }); await p.waitForTimeout(900);
    const clip = { x: 0, y: info.host[1], width: w, height: Math.min(h - info.host[1], info.host[3]) };
    for (let i = 0; i < 5; i++) { await p.screenshot({ path: `wash-${w}-${theme}-${i}.png`, clip }); await p.waitForTimeout(2000); }
    // the same with the layer hidden: the plain ground (with nothing on it)
    await p.addStyleTag({ content: '#top .kws-shader { display: none !important; }' }); await p.waitForTimeout(200);
    await p.screenshot({ path: `wash-${w}-${theme}-plain.png`, clip });
    info.clip = clip; fs.writeFileSync(`wash-${w}-${theme}.json`, JSON.stringify(info));
    await c.close();
  }
  await b.close();
})();
