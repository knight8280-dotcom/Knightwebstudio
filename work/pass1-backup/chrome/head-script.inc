  // Set the theme before first paint, so nobody sees a flash of the wrong
  // one. Light is the default: a saved choice wins, otherwise a device set
  // to dark gets the night theme. main.js still owns the toggle itself.
  (function () {
    var d = document.documentElement; d.classList.add('js');
    // The header crest builds itself on the first page of a visit only
    try { if (!sessionStorage.getItem('kws-crest')) { d.classList.add('crest-intro'); sessionStorage.setItem('kws-crest', '1'); } } catch (e) {}
    try {
      var t = localStorage.getItem('theme');
      if (t !== 'dark' && t !== 'light') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      d.setAttribute('data-theme', t);
    } catch (e) { /* private mode: the stylesheet follows the device instead */ }
  })();
