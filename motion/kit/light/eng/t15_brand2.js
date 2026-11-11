const { launch, ctx, URL, PORT } = require('./common');
const zlib = require('zlib');
(async () => {
  const b = await launch();
  for (const theme of ['light', 'dark']) {
    const c = await ctx(b, { viewport: { width: 1280, height: 900 }, colorScheme: theme }); const p = await c.newPage();
    await p.addInitScript(t => { try { localStorage.setItem('theme', t); localStorage.setItem('kws-motion', 'on'); } catch (e) {} }, theme);
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.evaluate(() => document.querySelector('.demo-brand-head').scrollIntoView({ block: 'center', behavior: 'instant' })); await p.waitForTimeout(1500);
    const info = await p.evaluate(() => { const el = document.querySelector('.demo-brand-head > .kws-shader'); const cs = getComputedStyle(el);
      const px = document.createElement('canvas').getContext('2d'); const L = css => { px.fillStyle = css.trim(); px.fillRect(0, 0, 1, 1); const d = px.getImageData(0, 0, 1, 1).data; const f = x => { x /= 255; return x <= .04045 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }; return .2126 * f(d[0]) + .7152 * f(d[1]) + .0722 * f(d[2]); };
      const bg = getComputedStyle(document.querySelector('.demo-brand')).backgroundColor; const Lb = L(bg); const out = { live: el.classList.contains('is-live'), bg, Lb: +Lb.toFixed(3), texts: {} };
      for (const [n, v] of [['ink', '--kws-t1'], ['muted', '--kws-t2'], ['accent', '--kws-t3'], ['notice', '--kws-t4']]) { const t = cs.getPropertyValue(v); const Lt = L(t); const ratio = (Math.max(Lt, Lb) + .05) / (Math.min(Lt, Lb) + .05); out.texts[n] = t.trim() + ' ' + ratio.toFixed(2) + ':1 on plain ground' + (ratio < 4.8 ? '  <-- under the 4.8 guard: no light can be added' : ''); }
      const r = el.getBoundingClientRect(); out.rect = { x: r.left + r.width * .55, y: r.top + 8, width: r.width * .43, height: Math.min(r.height - 16, 120) }; return out; });
    const shot = async () => { const buf = await p.screenshot({ clip: info.rect, type: 'png' }); return buf; };
    const live = await shot();
    // pixel stats via PNG decode in page
    const stat = async buf => p.evaluate(async b64 => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const x = cv.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, cv.width, cv.height).data; let mn = [255, 255, 255], mx = [0, 0, 0]; for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], d[i + k]); mx[k] = Math.max(mx[k], d[i + k]); } return { min: mn, max: mx }; }, buf.toString('base64'));
    const sLive = await stat(live);
    await p.evaluate(() => { const el = document.querySelector('.demo-brand-head > .kws-shader'); KWS.shader.mount(el)(); }); await p.waitForTimeout(900);
    const sStill = await stat(await shot());
    console.log(theme, JSON.stringify(info.texts, null, 1), 'ground L', info.Lb, 'live', info.live, '\n  right half of the panel, canvas live: rgb range', JSON.stringify(sLive), '\n  same area, CSS still (unmounted):       rgb range', JSON.stringify(sStill));
    await c.close();
  }
  await b.close();
})();
