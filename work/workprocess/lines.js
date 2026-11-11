const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  const variants = {
    3: ["We build on a private staging link you can check any time, with weekly progress notes. Before launch, the finished site gets:",
        "We build on a private staging link you can check any time, with weekly progress notes. Then, before launch:",
        "We build on a private staging link you can check any time, with weekly progress notes. Before launch:"],
    4: ["We set up your domain (IONOS) and hosting (Netlify) in your name, plus analytics and redirects. After launch you get a walkthrough video and free support:",
        "We set up your domain (IONOS) and hosting (Netlify) in your name, plus analytics and redirects. Then you get a walkthrough video and free support:",
        "We set up your domain (IONOS) and hosting (Netlify) in your name, plus analytics and redirects. After launch: a walkthrough video and free support."],
    1: ["A call about your business, your customers and what the site needs to achieve. You leave with a plan whether or not you hire us."],
    2: ["A fixed quote and timeline, then design concepts for your key pages. We refine the design with you:"] };
  for (const w of [360, 375, 390, 414, 430]) { const c = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: true }); const p = await c.newPage(); await p.goto('http://localhost:8720/process/'); await p.waitForTimeout(300);
    const r = await p.evaluate(v => { const out = {}; for (const k in v) { const el = document.querySelector(`.steps > li:nth-child(${k}) p`); out[k] = v[k].map(t => { el.textContent = t; return Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)); }); } return out; }, variants);
    console.log(w, JSON.stringify(r)); await c.close(); }
  await b.close(); })();
