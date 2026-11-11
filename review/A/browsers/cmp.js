// node cmp.js <dirA> <dirB> [--modes a,b] [--tol 3] [--style]   DOM metric + computed style diff between two captures
const fs = require('fs'); const path = require('path');
const [A, B] = process.argv.slice(2, 4);
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const tol = +arg('tol', 3); const wantStyle = process.argv.includes('--style'); const modes = arg('modes', '').split(',').filter(Boolean);
const max = +arg('max', 12);
const files = fs.readdirSync(A).filter(f => f.endsWith('.json') && f !== 'report.json' && fs.existsSync(path.join(B, f)) && (!modes.length || modes.some(m => f.includes('__' + m))));
for (const f of files.sort()) {
  const a = JSON.parse(fs.readFileSync(path.join(A, f))), b = JSON.parse(fs.readFileSync(path.join(B, f)));
  const out = [];
  if (a.els.length !== b.els.length) out.push(`  ELEMENT COUNT ${a.els.length} vs ${b.els.length}`);
  const n = Math.min(a.els.length, b.els.length); const flagged = new Set(); const kids = new Map();
  // parent tracking by nesting: use the rect containment + order is unreliable; use selector of parent and nearest previous element with that selector
  const stack = [];
  const parentIdx = new Array(n).fill(-1); const lastBySel = new Map();
  for (let i = 0; i < n; i++) { const e = a.els[i]; if (lastBySel.has(e.p)) parentIdx[i] = lastBySel.get(e.p); lastBySel.set(e.s, i); }
  const diffs = [];
  for (let i = 0; i < n; i++) {
    const x = a.els[i], y = b.els[i]; if (x.s !== y.s) { out.push(`  ORDER MISMATCH at ${i}: ${x.s} vs ${y.s}`); break; }
    if (x.d === 'none' && y.d === 'none') continue;
    if (x.d !== y.d || x.v !== y.v || x.pos !== y.pos) { diffs.push({ i, kind: 'display', msg: `${x.s}: display ${x.d}/${x.v}/${x.pos} vs ${y.d}/${y.v}/${y.pos}` }); continue; }
    const dw = y.w - x.w, dh = y.h - x.h;
    if (Math.abs(dw) > tol || Math.abs(dh) > tol) { flagged.add(i); diffs.push({ i, kind: 'size', dw, dh, x, y }); }
    if (wantStyle) for (const k of ['c', 'bg', 'bc', 'ff', 'fs', 'fw', 'lh', 'o']) if (x[k] !== y[k] && x.w && x.h) {
      // ignore tiny colour rounding
      const num = s => (String(s).match(/[\d.]+/g) || []).map(Number); const p = num(x[k]), q = num(y[k]);
      if (p.length === q.length && p.length && p.every((v, j) => Math.abs(v - q[j]) <= 1.01) && k !== 'ff') continue;
      diffs.push({ i, kind: 'style', msg: `${x.s} "${x.t}": ${k} ${x[k]} vs ${y[k]}` });
    }
  }
  // leaf-most size diffs: no flagged descendant
  const hasFlaggedChild = new Set(); for (const i of flagged) { let p = parentIdx[i]; while (p >= 0) { hasFlaggedChild.add(p); p = parentIdx[p]; } }
  const roots = diffs.filter(d => d.kind === 'size' && !hasFlaggedChild.has(d.i));
  const styles = diffs.filter(d => d.kind !== 'size'); const seen = new Set();
  console.log(`${f.replace('.json', '')}: height ${a.height} vs ${b.height} (${b.height - a.height >= 0 ? '+' : ''}${b.height - a.height}), overflowX ${a.overflowX}/${b.overflowX}, size diffs ${diffs.filter(d => d.kind === 'size').length} (leaf ${roots.length}), other ${styles.length}`);
  for (const l of out) console.log(l);
  for (const d of roots.sort((p, q) => Math.abs(q.dh) + Math.abs(q.dw) - Math.abs(p.dh) - Math.abs(p.dw)).slice(0, max)) console.log(`    size ${d.x.s.slice(0, 70)} "${d.x.t.slice(0, 30)}" @y${d.x.y}: ${d.x.w}x${d.x.h} vs ${d.y.w}x${d.y.h}`);
  for (const d of styles) { const k = d.msg.replace(/"[^"]*"/, ''); if (seen.has(k)) continue; seen.add(k); if (seen.size > max) break; console.log('    ' + d.kind + ' ' + d.msg.slice(0, 200)); }
}
