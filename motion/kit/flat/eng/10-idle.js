// Listener options, idle rAF, off-screen behaviour, background tab, will-change, timers, globals.
const { chromium, URL, state, settle, scrollToSel } = require('./lib');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => {
    window.__raf = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => { window.__raf++; return r.call(window, f); };
    window.__timers = []; const st = window.setTimeout, si = window.setInterval; window.setTimeout = (f, ms, ...a) => { window.__timers.push(['timeout', ms, (new Error()).stack.split('\n')[2] || '']); return st(f, ms, ...a); }; window.setInterval = (f, ms, ...a) => { window.__timers.push(['interval', ms]); return si(f, ms, ...a); };
    window.__ls = []; const ael = EventTarget.prototype.addEventListener; EventTarget.prototype.addEventListener = function (type, fn, opt) { const src = (new Error()).stack.split('\n').slice(2, 4).join(' | '); if (/arc\.js|spotlight\.js/.test(src)) window.__ls.push({ type, on: this === window ? 'window' : this === document ? 'document' : (this.className || this.tagName || '?').toString().split(' ')[0], passive: opt && typeof opt === 'object' ? opt.passive : undefined, capture: opt && typeof opt === 'object' ? !!opt.capture : !!opt, file: /arc\.js/.test(src) ? 'arc' : 'spot' }); return ael.call(this, type, fn, opt); };
    window.__g0 = Object.getOwnPropertyNames(window);
  });
  const p = await ctx.newPage(); const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(800);
  const ls = await p.evaluate(() => window.__ls);
  const tally = {}; for (const l of ls) { const k = `${l.file}: ${l.type} on .${l.on} passive=${l.passive} capture=${l.capture}`; tally[k] = (tally[k] || 0) + 1; }
  console.log('== listeners added by the kit (count across 2 instances each) =='); Object.entries(tally).forEach(([k, v]) => console.log('  ', v, k));
  console.log('   wheel/touch/scroll listeners:', ls.filter(l => /wheel|touch|scroll/.test(l.type)).length, ' window/document-level listeners:', ls.filter(l => l.on === 'window' || l.on === 'document').map(l => l.type).join(',') || 'none');
  console.log('== timers set by anyone during load ==', JSON.stringify((await p.evaluate(() => window.__timers)).filter(t => /arc\.js|spotlight\.js/.test(t[2] || ''))));
  console.log('== new globals ==', JSON.stringify(await p.evaluate(() => Object.getOwnPropertyNames(window).filter(k => !window.__g0.includes(k) && !k.startsWith('__')))));
  // idle rAF for 3s
  let r0 = await p.evaluate(() => window.__raf); await p.waitForTimeout(3000); console.log('== rAF requested in 3s idle (top of page):', (await p.evaluate(() => window.__raf)) - r0);
  console.log('   will-change at idle:', await p.evaluate(() => [...document.querySelectorAll('.kws-arc-tile,.kws-spot-frame')].map(e => getComputedStyle(e).willChange).filter((v, i, a) => a.indexOf(v) === i).join(',')));
  // off-screen: the client arc is far below; trigger Next on it programmatically
  r0 = await p.evaluate(() => window.__raf); const off = await p.evaluate(() => { const el = document.querySelector('.demo-client .kws-arc'); const r = el.getBoundingClientRect(); el.querySelector('button[aria-label^="Next"]').click(); return { top: Math.round(r.top), vh: innerHeight, moving: el.classList.contains('is-moving'), on: [...el.querySelectorAll('li')].findIndex(l => l.classList.contains('is-on')) }; });
  await p.waitForTimeout(500); console.log('== off-screen Next:', JSON.stringify(off), ' rAF requested:', (await p.evaluate(() => window.__raf)) - r0);
  // in-flight animation, then scrolled off-screen immediately: does it keep requesting frames?
  await scrollToSel(p, '#services .kws-arc', 150); await p.waitForTimeout(300);
  await p.evaluate(() => { const el = document.querySelector('#services .kws-arc'); const nx = el.querySelector('button[aria-label^="Next"]'); for (let i = 0; i < 6; i++) nx.click(); });
  await p.waitForTimeout(50); r0 = await p.evaluate(() => window.__raf); await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(1500);
  console.log('== spring in flight, then scrolled away: further rAF requested while off screen:', (await p.evaluate(() => window.__raf)) - r0, ' (ends when the spring settles)');
  r0 = await p.evaluate(() => window.__raf); await p.waitForTimeout(1500); console.log('   after that, 1.5s more:', (await p.evaluate(() => window.__raf)) - r0);
  // background tab: start a long move then hide the page
  await scrollToSel(p, '#services .kws-arc', 150); await p.waitForTimeout(300);
  const cdp = await ctx.newCDPSession(p);
  await p.evaluate(() => { const el = document.querySelector('#services .kws-arc'); const nx = el.querySelector('button[aria-label^="Next"]'); for (let i = 0; i < 6; i++) nx.click(); });
  const p2 = await ctx.newPage(); await p2.goto('about:blank'); await p2.bringToFront(); await p2.waitForTimeout(300);
  const vis = await p.evaluate(() => document.visibilityState); r0 = await p.evaluate(() => window.__raf); await p2.waitForTimeout(1500); const r1 = await p.evaluate(() => window.__raf);
  console.log(`== background tab: visibilityState=${vis}; rAF requested in 1.5s while in background: ${r1 - r0}; still is-moving: ${await p.evaluate(() => document.querySelector('#services .kws-arc').classList.contains('is-moving'))}`);
  await cdp.send('Page.setWebLifecycleState', { state: 'frozen' }).catch(e => console.log('   freeze n/a', e.message.slice(0, 60)));
  await p.bringToFront(); await cdp.send('Page.setWebLifecycleState', { state: 'active' }).catch(() => {}); await p.waitForTimeout(1500);
  console.log('   back in front: is-moving', await p.evaluate(() => document.querySelector('#services .kws-arc').classList.contains('is-moving')), 'state', JSON.stringify((await state(p, '#services .kws-arc')).on));
  console.log('errors:', errs.join(' ; ') || 'none');
  await b.close();
})();
