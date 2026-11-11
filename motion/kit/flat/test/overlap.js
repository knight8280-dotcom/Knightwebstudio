// The blocker from review: at every width from 360 to 1920 (4px steps) and with every item in focus, no sign that shows may
// touch the text of the caption, no sign may be left half faded, and no sign's lettering may be scaled under 12px.
// Both wheels on the page are checked (the site's type and the client band's), with motion reduced so each move is instant.
const { chromium, say, done, open } = require('./lib');
(async () => {
  const b = await chromium.launch(); const { p, errs } = await open(b, { viewport: { width: 360, height: 900 }, reducedMotion: 'reduce' });
  const bad = []; const counts = {}; let states = 0, least = 1e9, smallest = 99;
  for (let w = 360; w <= 1920; w += 4) {
    await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(70);
    const r = await p.evaluate(() => [...document.querySelectorAll('.kws-arc')].map(arc => {
      const out = { hits: [], ghosts: [], small: 99, gap: 1e9, showing: 0, n: 0 }; const lis = [...arc.querySelectorAll('.kws-arc-item')]; const next = arc.querySelector('.kws-arc-nav:last-child');
      for (let i = 0; i < lis.length; i++) {
        const cap = arc.querySelector('.is-on .kws-arc-cap'), lines = [...cap.children].map(c => c.getBoundingClientRect());
        const shown = lis.map(li => li.querySelector('.kws-arc-tile')).filter(t => getComputedStyle(t).visibility !== 'hidden');
        out.showing = shown.length; out.n++;
        for (const t of shown) {
          const cs = getComputedStyle(t), a = t.getBoundingClientRect(), m = new DOMMatrix(cs.transform), scale = Math.hypot(m.a, m.b);
          if (+cs.opacity < 1) out.ghosts.push(t.textContent.trim() + '@' + cs.opacity);
          out.small = Math.min(out.small, parseFloat(cs.fontSize) * scale);
          for (const l of lines) {
            if (a.left < l.right && a.right > l.left && a.top < l.bottom && a.bottom > l.top) out.hits.push(`${t.textContent.trim()} over "${cap.children[lines.indexOf(l)].textContent.trim().slice(0, 18)}" with item ${i + 1} in focus`);
            else if (a.bottom > l.top && a.top < l.bottom) out.gap = Math.min(out.gap, a.left >= l.right ? a.left - l.right : l.left - a.right);
          }
        }
        next.click();
      }
      return out;
    }));
    r.forEach((x, k) => { states += x.n; least = Math.min(least, x.gap); smallest = Math.min(smallest, x.small); if (k === 0) counts[x.showing] = (counts[x.showing] || []).concat(w);
      if (x.hits.length || x.ghosts.length || x.small < 11.95) bad.push(`${w}px wheel ${k + 1}: ${x.hits.slice(0, 2).join('; ')} ${x.ghosts.slice(0, 2).join(' ')} lettering ${x.small.toFixed(1)}px`); });
  }
  say(`no sign that shows touches a line of the caption, at ${states} states (391 widths from 360 to 1920, every item in focus, two wheels)`, bad.length === 0, bad.slice(0, 6).join(' | '));
  say('nearest a sign beside the caption comes to a line of it', least >= 16, `${least.toFixed(1)}px`);
  say('smallest lettering on any sign that shows, after scaling', smallest >= 11.95, `${smallest.toFixed(2)}px`);
  console.log('      signs showing on the site wheel: ' + Object.keys(counts).map(k => `${k} from ${counts[k][0]}px to ${counts[k][counts[k].length - 1]}px`).join('; '));
  say('no console errors', errs.length === 0, errs.join(' | '));
  await done(b);
})();
