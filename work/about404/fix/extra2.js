// Fix-pass checks for /about/ and /404.html
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/x';
const BASE = 'http://localhost:8720';
(async () => {
  const b = await chromium.launch();
  const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());

  // 1. Reflow (WCAG 1.4.10) at 320 and text spacing (1.4.12) on /about/ and /404.html
  console.log('== reflow and text spacing');
  for (const path of ['/about/', '/404.html']) for (const [w, spacing] of [[320, false], [340, false], [360, false], [390, false], [320, true], [360, true], [390, true], [1280, true]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 700 }, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(BASE + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    if (spacing) await p.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important} p{margin-bottom:2em!important}' });
    await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const vw = innerWidth; const bad = [...document.querySelectorAll('main *')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && (r.right > vw + 1 || r.left < -1) && cs.position !== 'absolute' && !e.closest('.sr-only') && !e.closest('svg'); }).map(e => e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] + ':' + Math.round(e.getBoundingClientRect().right)).slice(0, 6); return { over: document.documentElement.scrollWidth - vw, bad }; });
    console.log(path, w, spacing ? 'text-spacing' : '', JSON.stringify(r));
    if ((w === 320 && !spacing) || (spacing && w !== 1280)) await p.screenshot({ path: `${OUT}/reflow${path.replace(/\W/g, '')}-${w}${spacing ? '-spacing' : ''}.png` });
    await ctx.close();
  }

  // 2. JavaScript off
  console.log('== javascript off');
  for (const [name, path, w, h] of [['about-nojs-390', '/about/', 390, 844], ['about-nojs-1440', '/about/', 1440, 900], ['404-nojs-390', '/404.html', 390, 844], ['404-nojs-1440', '/404.html', 1440, 900]]) {
    const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: w, height: h } });
    const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(900);
    await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }); await ctx.close();
  }
  { // main.js blocked: after the head script's 4s fallback nothing is faded
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route('**/assets/js/main.js', r => r.abort());
    const p = await ctx.newPage(); await p.goto(BASE + '/about/'); await p.waitForTimeout(4600);
    const faded = await p.evaluate(() => [...document.querySelectorAll('main *')].filter(e => +getComputedStyle(e).opacity < 1 && e.getBoundingClientRect().height > 0).map(e => e.className).slice(0, 5));
    console.log('about, main.js blocked, after 4.6s: faded elements =', JSON.stringify(faded)); await ctx.close();
  }

  // 3. Keyboard order and focus rings
  console.log('== keyboard');
  for (const [path, w, theme] of [['/about/', 1440, 'light'], ['/about/', 390, 'dark'], ['/404.html', 1440, 'dark'], ['/404.html', 390, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme }); await block(ctx);
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(700);
    const stops = []; let noRing = 0, shot = 0;
    for (let i = 0; i < 70; i++) {
      await p.keyboard.press('Tab');
      const s = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
        return { text: (e.textContent || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 30), outline: cs.outlineStyle + ' ' + cs.outlineWidth, inMain: !!e.closest('main'), inFooter: !!e.closest('footer'), y: Math.round(r.top + scrollY), x: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), cls: String(e.className).slice(0, 20), inView: r.top >= 0 && r.bottom <= innerHeight }; });
      if (!s) break; stops.push(s); if (!/solid [23]px/.test(s.outline)) noRing++;
      if (s.inMain && /Smilys|Baton Rouge|Call \(225|FAQ|pricing page/.test(s.text) && shot < 5) { shot++; await p.waitForTimeout(350); await p.screenshot({ path: `${OUT}/focus-${path.replace(/\W/g, '')}-${w}-${theme}-${stops.length}.png` }); }
      if (s.inFooter) break;
    }
    console.log(`${path} @${w} ${theme}: ${stops.length} stops to the footer, ${noRing} without a ring, ${stops.filter(s => s.inMain && !s.inView).length} main stops out of view`);
    console.log(stops.filter(s => s.inMain).map(s => `  y${String(s.y).padStart(5)} x${String(s.x).padStart(5)} ${String(s.w).padStart(4)}x${String(s.h).padEnd(3)} "${s.text}"`).join('\n'));
    await ctx.close();
  }

  // 4. 404: footer at the bottom of tall windows; block centred; label centred
  console.log('== 404 in tall windows');
  for (const [w, h] of [[390, 844], [680, 900], [820, 1180], [1024, 1366], [1440, 900], [1920, 1080], [2560, 1440], [844, 390]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage(); await p.goto(BASE + '/404.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const R = s => document.querySelector(s).getBoundingClientRect(); const f = R('.site-footer'), nf = R('.nf'), lab = R('.nf-more .label'), ul = R('.nf-more ul');
      const range = document.createRange(); range.selectNodeContents(document.querySelector('.nf-more .label')); const lt = range.getBoundingClientRect();
      const links = [...document.querySelectorAll('.nf-more a')].map(a => { const q = a.getBoundingClientRect(); return Math.round(q.width) + 'x' + Math.round(q.height); });
      return { doc: document.documentElement.scrollHeight, gapUnderFooter: Math.round(Math.max(innerHeight, document.documentElement.scrollHeight) - (f.bottom + scrollY)), labelCentre: Math.round(lt.left + lt.width / 2), pageCentre: innerWidth / 2, textAlign: getComputedStyle(document.querySelector('.nf')).textAlign, links, over: document.documentElement.scrollWidth - innerWidth, firstScreenBtnBottom: Math.round(Math.max(...[...document.querySelectorAll('.nf .btn')].map(e => e.getBoundingClientRect().bottom))) }; });
    console.log(`${w}x${h}`, JSON.stringify(r));
    await ctx.close();
  }

  // 5. 404 served at a deep missing address
  console.log('== 404 at a deep address');
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const html = fs.readFileSync('/home/user/Knightwebstudio/404.html', 'utf8');
    const p = await ctx.newPage(); const failed = [];
    await p.route('**/services/old/missing-page/', r => r.fulfill({ status: 404, contentType: 'text/html', body: html }));
    p.on('response', r => { if (r.status() >= 400 && !/missing-page/.test(r.url())) failed.push(r.status() + ' ' + r.url()); });
    p.on('requestfailed', r => failed.push('failed ' + r.url()));
    await p.goto(BASE + '/services/old/missing-page/'); await p.waitForTimeout(500);
    const info = await p.evaluate(() => ({ scripts: document.querySelectorAll('script[src]').length, links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')), resolved: [...document.querySelectorAll('a[href]')].map(a => a.href), assets: [...document.querySelectorAll('link[href], img[src], use[href]')].map(e => e.getAttribute('href') || e.getAttribute('src')), sheetRules: [...document.styleSheets].map(s => s.href.replace(location.origin, '') + ':' + s.cssRules.length) }));
    console.log('failed requests =', JSON.stringify(failed), '| external scripts =', info.scripts, '| stylesheets:', info.sheetRules.join(' , '));
    console.log('hrefs/assets that are not root-absolute:', JSON.stringify([...info.links, ...info.assets].filter(h => !/^(\/|tel:|mailto:|#|https?:|data:)/.test(h))));
    console.log('link targets:', JSON.stringify([...new Set(info.links)]));
    for (const u of [...new Set(info.resolved)].filter(u => u.startsWith('http'))) { const r = await p.request.get(u); if (r.status() !== 200) console.log('  NOT 200:', r.status(), u); }
    console.log('every http link answered 200 unless listed above');
    await p.screenshot({ path: `${OUT}/404-deep-390.png` });
    await ctx.close();
  }
  await b.close();
})();
