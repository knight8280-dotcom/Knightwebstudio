// Rewrites the stylesheet the way an older Safari would read it, so a newer WebKit build shows the fallback paths.
// level '15.4': no container queries (property, at-rule, units), no subgrid, no overflow: clip, no text-wrap.
// level '16.0': container queries, subgrid and clip exist; no text-wrap, no nesting.  (nothing to strip but text-wrap)
function stripAtRule(css, name) {            // removes "@name ... { ... }" blocks, brace matched
  let out = '', i = 0;
  for (;;) { const k = css.indexOf('@' + name, i); if (k < 0) { out += css.slice(i); break; }
    out += css.slice(i, k); let j = css.indexOf('{', k), depth = 1; j++;
    while (depth && j < css.length) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
    i = j; }
  return out;
}
module.exports = function (css, level) {
  if (level === '15.4') {
    css = css.replace(/@supports not \(container-type: inline-size\)/g, '@supports not (container-type: kws-none)');
    css = css.replace(/@supports \(container-type: inline-size\)/g, '@supports (container-type: kws-none)');
    css = css.replace(/@supports \(grid-template-rows: subgrid\)/g, '@supports (grid-template-rows: kws-none)');
    css = css.replace(/@supports \(width: 1cqi\)/g, '@supports (width: 1kwsnone)');
    css = stripAtRule(css, 'container');
    css = css.replace(/container-type:\s*inline-size;?/g, '');
    css = css.replace(/overflow-x: clip;?/g, '');
    css = css.replace(/font-size:\s*min\(calc\(var\(--fs-title\) \* 1\.25\), 12cqi\);?/g, '');
  }
  css = css.replace(/text-wrap:\s*(balance|pretty);?/g, '');
  return css;
};
