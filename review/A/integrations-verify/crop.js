const { chromium } = require('playwright');
// crop helper: node crop.js in.png out.png x y w h [scale]
(async () => {
  const [inp, out, x, y, w, h, s] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: Math.round(w * (s || 1)), height: Math.round(h * (s || 1)) } });
  const data = require('fs').readFileSync(inp).toString('base64');
  await p.setContent(`<body style="margin:0;overflow:hidden"><div style="width:${w}px;height:${h}px;overflow:hidden;transform:scale(${s || 1});transform-origin:0 0"><img src="data:image/png;base64,${data}" style="margin-left:-${x}px;margin-top:-${y}px;display:block"></div>`);
  await p.screenshot({ path: out }); await b.close();
})();
