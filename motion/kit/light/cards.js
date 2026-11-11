/* ==========================================================================
   KnightWebstudio motion kit: the folder stack (cards.css draws it).
   A list of folder cards becomes a tabs pattern: a tab for each folder, the
   chosen folder in front. Without this script every folder shows, one under
   the other. Load with defer. The head snippet in NOTES.md keeps its place
   before it loads, and shows the plain list if it never does.

     <div class="kws-folders kws-folders--stack" data-kws="folders" data-label="Website packages">
       <article class="kws-folder" id="pkg-starter">
         <h3 class="kws-folder-tab">Starter <b>$2,000</b></h3>
         <div class="kws-folder-body"> ... </div>
       </article> ...

   Add class kws-folders--phone to stack below 760px only (a row above it).
   data-start="3" opens on the third folder; a #hash that names a folder, or
   something inside one, opens that folder. Keys: Left, Right, Home, End.
   From script: KWS.folders.mount(el, { start: 2, label: '...' }) returns a
   function that puts the list back as it was.
   ========================================================================== */
(function () {
  'use strict';
  var KWS = window.KWS = window.KWS || {}, doc = document, uid = 0, live = new WeakMap();
  var phone = matchMedia('(max-width: 759.98px)');

  function mount(root, o) {
    if (!root) return function () {};
    if (live.has(root)) return live.get(root).end;   // mounted twice: the same stack, the same remover
    o = o || {};
    var id = 'kws-f' + (++uid), list = null, tabs = [], folders = [], made = [], at = -1;

    function show(i, user) {
      if (!tabs[i]) return;
      if (user && i !== at) root.classList.add('is-moved');   // only a choice animates, never the first paint
      at = i;
      folders.forEach(function (f, n) {
        f.classList.toggle('is-front', n === i);
        tabs[n].setAttribute('aria-selected', n === i ? 'true' : 'false');
        tabs[n].tabIndex = n === i ? 0 : -1;
      });
    }
    function fromHash() {
      var t = null, n;
      try { t = location.hash.length > 1 && doc.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
      for (n = 0; t && n < folders.length; n++) if (folders[n].contains(t)) { show(n); return true; }
    }
    function click(e) {
      var t = e.target.closest('[role="tab"]');
      if (t) show(tabs.indexOf(t), true);
    }
    function key(e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;   // Alt+Left is the browser's Back
      var n = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (n == null) return;
      e.preventDefault();
      n = (n + tabs.length) % tabs.length;
      show(n, true);
      tabs[n].focus();
    }
    function build() {
      var all = [].filter.call(root.children, function (c) { return c.classList.contains('kws-folder'); });
      if (!all.length) return;   // nothing to choose between: leave the page alone
      folders = all;
      list = doc.createElement('div');
      list.className = 'kws-tabs';
      list.setAttribute('role', 'tablist');
      list.setAttribute('aria-label', o.label || root.getAttribute('data-label') || 'Choose one');
      tabs = folders.map(function (f, n) {
        var from = f.querySelector('.kws-folder-tab'), b = doc.createElement('button');
        b.type = 'button'; b.className = 'kws-folder-tab'; b.id = id + '-t' + n;
        b.innerHTML = from ? from.innerHTML : n + 1;
        b.setAttribute('role', 'tab');
        if (!f.id) { f.id = id + '-p' + n; made.push(f); }
        b.setAttribute('aria-controls', f.id);
        f.setAttribute('role', 'tabpanel'); f.setAttribute('aria-labelledby', b.id);
        // a panel with nothing to focus inside takes focus itself, so keyboard users can reach and scroll it
        if (!f.querySelector('a[href], button, input, select, textarea, [tabindex]')) f.tabIndex = 0;
        list.appendChild(b);
        return b;
      });
      list.addEventListener('click', click);
      list.addEventListener('keydown', key);
      root.insertBefore(list, root.firstChild);
      root.classList.add('is-live');
      if (!fromHash()) show(Math.min(folders.length, Math.max(1, Math.floor(o.start || +root.getAttribute('data-start') || 1))) - 1);
    }
    function tear() {
      if (!list) return;
      root.removeChild(list); list = null;
      root.classList.remove('is-live', 'is-moved');
      folders.forEach(function (f) {
        f.classList.remove('is-front');
        ['role', 'aria-labelledby', 'tabindex'].forEach(function (a) { f.removeAttribute(a); });
      });
      made.forEach(function (f) { f.removeAttribute('id'); });
      made = []; tabs = []; folders = []; at = -1;
    }
    function sync() { if (!root.classList.contains('kws-folders--phone') || phone.matches) { if (!list) build(); } else tear(); }
    function end() {
      if (!live.has(root)) return;
      live.delete(root);
      tear();
    }
    live.set(root, { end: end, sync: sync, hash: fromHash });
    sync();
    return end;
  }

  /* One listener each for the page, whatever the number of stacks. A stack that has left the page
     without its remover being called is let go here, and holds nothing in the meantime */
  function each(what) {
    return function () {
      [].forEach.call(doc.querySelectorAll('.kws-folders--stack'), function (el) { var s = live.get(el); if (s) s[what](); });
    };
  }
  window.addEventListener('hashchange', each('hash'));
  phone.addEventListener('change', each('sync'));

  KWS.folders = { mount: mount };
  function start() { [].forEach.call(doc.querySelectorAll('[data-kws="folders"]'), function (el) { mount(el); }); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})();
