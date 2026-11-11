const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const src = fs.readFileSync('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/pages/services/main.html', 'utf8');
  const b = await chromium.launch(); const p = await b.newPage(); await p.goto('about:blank');
  const r = await p.evaluate(src => {
    const doc = new DOMParser().parseFromString('<!doctype html><body>' + src, 'text/html'); const main = doc.querySelector('main');
    const norm = s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').replace(/> </g, '><').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/=""/g, '').trim();
    const a = norm(main.outerHTML), c = norm(src.slice(src.indexOf('<main'), src.indexOf('</main>') + 7));
    let i = 0; while (i < a.length && a[i] === c[i]) i++;
    const issues = [];
    const block = 'address,article,aside,blockquote,details,div,dl,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,header,hr,main,nav,ol,p,pre,section,table,ul';
    for (const el of main.querySelectorAll('p, span, a, b, i, strong, small, h1, h2, h3, h4')) { const inner = el.querySelector(block); if (inner && !(el.tagName === 'A')) issues.push(`block <${inner.tagName.toLowerCase()}> inside <${el.tagName.toLowerCase()} class="${el.className}">`); }
    for (const el of main.querySelectorAll('ul, ol')) for (const ch of el.children) if (ch.tagName !== 'LI') issues.push(`<${ch.tagName}> directly in <${el.tagName}>`);
    for (const el of main.querySelectorAll('li')) if (!/^(UL|OL)$/.test(el.parentElement.tagName)) issues.push('li outside list');
    for (const el of main.querySelectorAll('dl')) for (const ch of el.children) if (!/^(DT|DD|DIV)$/.test(ch.tagName)) issues.push('bad dl child ' + ch.tagName);
    for (const el of main.querySelectorAll('a, button, summary')) if (el.querySelector('a, button, summary, input, select, textarea, details')) issues.push('interactive inside interactive: ' + el.outerHTML.slice(0, 80));
    for (const d of main.querySelectorAll('details')) if (!d.firstElementChild || d.firstElementChild.tagName !== 'SUMMARY') issues.push('details without leading summary');
    for (const el of main.querySelectorAll('summary')) { const kids = [...el.children].map(c => c.tagName); issues.push('NOTE summary children: ' + kids.join(',')); break; }
    for (const el of main.querySelectorAll('figure')) { const fc = el.querySelectorAll(':scope > figcaption'); if (fc.length > 1 || (fc.length === 1 && fc[0] !== el.firstElementChild && fc[0] !== el.lastElementChild)) issues.push('figcaption position'); }
    for (const el of main.querySelectorAll('[aria-hidden="true"]')) if (el.querySelector('a[href], button, summary, [tabindex]')) issues.push('focusable inside aria-hidden: ' + el.className);
    for (const el of main.querySelectorAll('section')) if (!el.querySelector('h1,h2,h3')) issues.push('section without heading ' + el.className);
    for (const el of main.querySelectorAll('i')) if (!el.closest('.bubble-typing, .cal, .browser-bar')) issues.push('<i> used outside a mock');
    for (const el of main.querySelectorAll('em')) issues.push('<em> used (no italic loaded)');
    for (const el of main.querySelectorAll('svg')) if (el.getAttribute('aria-hidden') !== 'true' && !el.getAttribute('role')) issues.push('svg without aria-hidden: ' + (el.parentElement.className));
    for (const el of main.querySelectorAll('a[target="_blank"]')) if (!/noopener/.test(el.rel)) issues.push('target blank without noopener');
    for (const el of main.querySelectorAll('a[href^="http"], a[href^="//"]')) issues.push('absolute link ' + el.getAttribute('href'));
    for (const el of main.querySelectorAll('a')) { const h = el.getAttribute('href'); if (!h || !(h.startsWith('/') || h.startsWith('#') || h.startsWith('tel:') || h.startsWith('mailto:'))) issues.push('non root-absolute link ' + h); }
    const txt = main.textContent; const ph = txt.match(/lorem|ipsum|TODO|TBD|xxx|placeholder|\?\?\?/i);
    const classes = new Set(); main.querySelectorAll('[class]').forEach(e => e.classList.forEach(c => classes.add(c)));
    return { sameAfterParse: a === c, firstDiff: a === c ? null : [a.slice(Math.max(0, i - 80), i + 120), c.slice(Math.max(0, i - 80), i + 120)], issues: [...new Set(issues)], placeholder: ph && ph[0], classes: [...classes].sort() };
  }, src);
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
