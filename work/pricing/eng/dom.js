const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const src = fs.readFileSync('/home/user/Knightwebstudio/pricing/index.html', 'utf8');
  const main = src.match(/<main[\s\S]*?<\/main>/)[0];
  const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr']);
  const opens = {}; for (const m of main.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g)) { const t = m[1].toLowerCase(); opens[t] = (opens[t] || 0) + 1; }
  const closes = {}; for (const m of main.matchAll(/<\/([a-zA-Z][a-zA-Z0-9]*)>/g)) { const t = m[1].toLowerCase(); closes[t] = (closes[t] || 0) + 1; }
  const unbalanced = Object.keys(opens).filter(t => !VOID.has(t) && !['path','circle','rect','line','textpath','use','stop','polygon','ellipse','polyline'].includes(t) && opens[t] !== (closes[t] || 0)).map(t => `${t}: ${opens[t]} open / ${closes[t] || 0} close`);
  const b = await chromium.launch(); const p = await b.newPage(); await p.route(/plausible|hcaptcha|calendly|stripe|onrender/, r => r.abort()); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'domcontentloaded' });
  const dom = await p.evaluate(() => { const c = {}; for (const e of document.querySelector('main').querySelectorAll('*')) { const t = e.tagName.toLowerCase(); c[t] = (c[t] || 0) + 1; } c.main = 1;
    const bad = []; for (const pEl of document.querySelectorAll('main p')) if (pEl.querySelector('div,ul,ol,p,table,h1,h2,h3,h4,figure,section')) bad.push('block inside p: ' + pEl.className);
    for (const e of document.querySelectorAll('main p:empty')) bad.push('empty p (parser split?) near ' + (e.previousElementSibling && e.previousElementSibling.tagName));
    // tbody/tr/td structure
    const t = [...document.querySelectorAll('main table')].map(tb => ({ cls: tb.className, rows: tb.rows.length, cellsPerRow: [...tb.rows].map(r => r.cells.length) }));
    // interactive nesting
    for (const a of document.querySelectorAll('main a a, main a button, main button a')) bad.push('nested interactive');
    return { c, bad, t, dupIds: [...document.querySelectorAll('[id]')].map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i), emptyHref: [...document.querySelectorAll('a')].filter(a => !a.getAttribute('href') || a.getAttribute('href') === '#').length, relMissing: [...document.querySelectorAll('a[target=_blank]')].filter(a => !/noopener/.test(a.rel)).length, lang: document.documentElement.lang, title: document.title }; });
  const diff = Object.keys(opens).filter(t => (dom.c[t] || 0) !== opens[t]).map(t => `${t}: source ${opens[t]} vs DOM ${dom.c[t] || 0}`);
  console.log('unbalanced tags in source:', unbalanced); console.log('source vs parsed DOM element counts differ:', diff); console.log(JSON.stringify({ bad: dom.bad, tables: dom.t, dupIds: dom.dupIds, emptyHref: dom.emptyHref, blankWithoutNoopener: dom.relMissing, lang: dom.lang, title: dom.title }));
  await b.close();
})();
