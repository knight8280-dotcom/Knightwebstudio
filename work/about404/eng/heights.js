const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }); await ctx.route(/plausible|calendly|hcaptcha|onrender/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  const m = () => p.evaluate(() => { const h = s => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : null; };
    return { doc: document.documentElement.scrollHeight, topbar: h('.topbar'), header: h('.site-header'), head: h('.page-head'), card: h('.page-head-aside'), letter: h('#about'), opening: h('.opening'), prose: h('.prose'), notes: h('.notes'), work: h('.notes > div:first-child'), local: h('.notes > div:last-child'), how: h('.section-sand'), terms: h('.terms'), cta: h('.cta-band'), footer: h('.site-footer'), mainPadBottom: getComputedStyle(document.querySelector('main')).paddingBottom, firstScreen: [...document.querySelectorAll('.page-head h1, .page-head .lede, .page-head .btn, .bizcard')].map(e => e.className.toString().slice(0, 20) + ':' + Math.round(e.getBoundingClientRect().top) + '-' + Math.round(e.getBoundingClientRect().bottom)) }; });
  console.log('as built:', JSON.stringify(await m()));
  const tries = {
    'A hide card <980': '[data-page="about"] .page-head-aside{display:none}',
    'B opening at lede size, text face': '[data-page="about"] .opening{font:400 var(--fs-lede)/1.52 var(--font-text);letter-spacing:0;max-width:var(--measure)}',
    'C terms rows tighter (s-3) + section pad .7': '[data-page="about"] .terms>li{padding-block:var(--s-3)} [data-page="about"] .section-sand{padding-block:calc(var(--sec)*.7)} [data-page="about"] .section-sand .section-head{margin-bottom:var(--s-5)}',
    'D drop "Work you can visit" line + more-link margin': '[data-page="about"] .notes>div:first-child>h2+p{display:none}',
    'E towns as wrapping row of 44px links': '[data-page="about"] .towns{display:flex;flex-wrap:wrap;gap:0 var(--s-5)} [data-page="about"] .towns li{border:0} [data-page="about"] .towns a{flex:none}',
    'F closing band text at body size': '[data-page="about"] .cta-copy p{font-size:var(--fs-body);margin-bottom:var(--s-5)}',
  };
  let all = '';
  for (const [k, css] of Object.entries(tries)) { const h = await p.addStyleTag({ content: css }); const r = await m(); console.log(k, '→ doc', r.doc); await h.evaluate(e => e.remove()); all += css; }
  await p.addStyleTag({ content: all }); console.log('ALL together → doc', (await m()).doc);
  const p2 = await ctx.newPage();
  for (const path of ['/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/services/']) { await p2.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p2.waitForTimeout(300); console.log(path, await p2.evaluate(() => [document.documentElement.scrollHeight, Math.round(document.querySelector('.site-footer').getBoundingClientRect().height)])); }
  await b.close(); })();
