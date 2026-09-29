/* ==========================================================================
   KnightWebstudio — site behaviour
   No dependencies. Every block is independent, so removing one is safe.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Site settings — EDIT ME ----------
     Both are off while empty, so nothing half-configured ever ships.

     bookingUrl      Your public scheduling link (Cal.com, Calendly…). When
                     set, every "Book a discovery call" button opens it, and
                     the contact page shows a "Book a 30-minute call" option
                     beside the form. Empty: those buttons go to /contact/.
     analyticsScript The script URL from Plausible's install snippet (Site
                     settings → Site installation; it looks like
                     https://plausible.io/js/pa-XXXX.js). When set, loads
                     Plausible's cookieless tracking and records an "Enquiry"
                     goal on each sent form and a "Book call" goal on each
                     booking click. Create both as custom-event goals in the
                     Plausible dashboard. Keep the analytics paragraph on
                     /privacy/ in step with this setting. */
  var SITE_CONFIG = {
    bookingUrl: 'https://calendly.com/knightwebstudio1/30min',
    analyticsScript: 'https://plausible.io/js/pa-M8H39gIN2J-TgmR4OOcVA.js'
  };

  function track(goal) {
    if (typeof window.plausible === 'function') window.plausible(goal);
  }

  if (SITE_CONFIG.analyticsScript) {
    // Plausible's own install snippet, unchanged: a queue stub so events
    // fired before the script arrives are kept, then init().
    window.plausible = window.plausible || function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };
    window.plausible.init = window.plausible.init || function (i) {
      window.plausible.o = i || {};
    };
    window.plausible.init();
    var pa = document.createElement('script');
    pa.async = true;
    pa.src = SITE_CONFIG.analyticsScript;
    document.head.appendChild(pa);
  }

  if (SITE_CONFIG.bookingUrl) {
    document.querySelectorAll('[data-booking]').forEach(function (a) {
      a.href = SITE_CONFIG.bookingUrl;
      a.target = '_blank';
      a.rel = 'noopener';
      a.addEventListener('click', function () { track('Book call'); });
    });
    document.querySelectorAll('.booking-only').forEach(function (el) { el.hidden = false; });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Crest animations ----------
     The header crest builds itself on a visit's first page (the inline head
     script sets .crest-intro). After that, hovering a crest replays it, and
     the full crest builds when it scrolls into view. */
  function playCrest(svg) {
    if (!svg || reduceMotion) return;
    document.documentElement.classList.remove('crest-intro');
    svg.classList.remove('play');
    void svg.getBoundingClientRect();   // restart the animation
    svg.classList.add('play');
  }
  document.querySelectorAll('.brand').forEach(function (link) {
    var svg = link.querySelector('.crest');
    if (svg) link.addEventListener('mouseenter', function () { playCrest(svg); });
  });
  // A crest that arrives with .play (the landing hero) builds on load; only
  // one without it waits to scroll into view.
  document.querySelectorAll('.crest-full.play').forEach(function (svg) {
    svg.addEventListener('mouseenter', function () { playCrest(svg); });
  });
  var fullCrest = document.querySelector('.crest-full:not(.play)');
  if (fullCrest && 'IntersectionObserver' in window && !reduceMotion) {
    var crestObs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { playCrest(fullCrest); crestObs.disconnect(); }
    }, { threshold: 0.3 });
    // Hidden until it builds, so it never shows finished and then blinks out
    fullCrest.classList.add('crest-wait');
    crestObs.observe(fullCrest);
    fullCrest.addEventListener('mouseenter', function () { playCrest(fullCrest); });
  }

  /* ---------- Theme toggle (remembers the choice) ---------- */
  var root = document.documentElement;
  var themeToggle = document.getElementById('theme-toggle');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeToggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      );
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#080b14' : '#ffffff');
  }

  var storedTheme = null;
  try { storedTheme = localStorage.getItem('theme'); } catch (e) { /* private mode */ }

  if (storedTheme) {
    applyTheme(storedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    applyTheme('light');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('nav');

  var navItems = nav ? Array.prototype.slice.call(nav.querySelectorAll('.nav-links li')) : [];

  function setNavOpen(open) {
    if (!nav) return;
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    // Stop the page scrolling behind the overlay
    document.body.style.overflow = open ? 'hidden' : '';
    navItems.forEach(function (li, i) {
      li.style.transitionDelay = open ? (0.06 + i * 0.045) + 's' : '0s';
    });
  }
  function closeNav() { setNavOpen(false); }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      setNavOpen(!nav.classList.contains('open'));
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        closeNav();
        navToggle.focus();
      }
    });

    // Leaving the breakpoint with the sheet open would strand the scroll lock
    window.matchMedia('(min-width: 981px)').addEventListener('change', function (e) {
      if (e.matches) closeNav();
    });
  }

  /* ---------- Header shadow on scroll + active nav link ---------- */
  var header = document.getElementById('site-header');
  var progress = document.getElementById('scroll-progress');
  var indicator = document.querySelector('.nav-indicator');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var ticking = false;

  function currentNavLink() { return document.querySelector('.nav-links a[aria-current="page"]'); }

  // Desktop only: glide the pill to whichever link is active
  function moveIndicator(target) {
    if (!indicator || window.innerWidth <= 980) return;
    if (!target) { indicator.classList.remove('on'); return; }
    indicator.style.width = target.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + target.offsetLeft + 'px)';
    indicator.classList.add('on');
  }

  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);


    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
    }
    ticking = false;
  }

  // Hovering previews where the pill would go; leaving restores the active one
  navLinks.forEach(function (link) {
    link.addEventListener('mouseenter', function () { moveIndicator(link); });
  });
  var navInner = document.querySelector('.nav-inner');
  if (navInner) navInner.addEventListener('mouseleave', function () {
    moveIndicator(currentNavLink());
  });
  window.addEventListener('resize', function () {
    moveIndicator(currentNavLink());
  });

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();
  moveIndicator(currentNavLink());

  /* ---------- Reveal on scroll ---------- */
  var revealables = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        // Stagger siblings so grids cascade rather than pop, but cap the delay —
        // a large batch (fast scroll, tall viewport) must not leave the last
        // card hidden for over a second.
        setTimeout(function () { entry.target.classList.add('visible'); }, Math.min(i, 5) * 70);
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Mobile sticky CTA ----------
     Appears once the hero is behind you, and gets out of the way over the
     contact section and footer so it never covers the form it points at. */
  var mobileCta = document.getElementById('mobile-cta');
  if (mobileCta) {
    mobileCta.hidden = false;
    // Sub-pages have no #contact section, only the footer — observe whichever
    // exists, and track each target separately so one leaving the viewport
    // doesn't cancel the other still being in it.
    var avoid = [document.getElementById('contact'), document.querySelector('.site-footer')]
      .filter(Boolean);
    var inView = [];
    var nearForm = false;

    if ('IntersectionObserver' in window && avoid.length) {
      var ctaObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { inView[avoid.indexOf(e.target)] = e.isIntersecting; });
        nearForm = inView.some(Boolean);
        updateCta();
      }, { threshold: 0 });
      avoid.forEach(function (el) { ctaObs.observe(el); });
    }

    var ctaShown = false;
    function updateCta() {
      var past = window.scrollY > window.innerHeight * 0.6;
      var show = past && !nearForm && !(nav && nav.classList.contains('open'));
      if (show !== ctaShown) { ctaShown = show; mobileCta.classList.toggle('show', show); }
    }
    window.addEventListener('scroll', function () {
      window.requestAnimationFrame(updateCta);
    }, { passive: true });
    updateCta();
  }

  /* ---------- hCaptcha ----------
     Deferred rather than loaded with the page, so no third-party iframe sits
     in the contact section during first paint. Uses hCaptcha's auto-render:
     the script renders every .h-captcha element it finds when it parses, which
     is one moving part instead of an explicit-render callback that silently
     leaves no widget if anything in the chain fails. */
  var captchaSlot = document.getElementById('hcaptcha-slot');
  var captchaRequested = false;

  function loadCaptcha() {
    if (captchaRequested || !captchaSlot) return;
    captchaRequested = true;
    var sc = document.createElement('script');
    sc.src = 'https://js.hcaptcha.com/1/api.js';
    sc.async = true; sc.defer = true;
    document.head.appendChild(sc);
  }

  if (captchaSlot) {
    if ('IntersectionObserver' in window) {
      var capObs = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) {
          loadCaptcha();
          capObs.disconnect();
        }
      }, { rootMargin: '900px' });
      capObs.observe(captchaSlot);
    } else {
      loadCaptcha();
    }
    var cf0 = document.getElementById('contact-form');
    if (cf0) cf0.addEventListener('focusin', loadCaptcha, { once: true });
    // Backstop: whatever the visitor does, the widget is ready long before
    // they can fill the form. Late enough to stay out of first paint.
    setTimeout(loadCaptcha, 4000);
  }

  /* ---------- Contact form: validation + async submit ---------- */
  var form = document.getElementById('contact-form');

  if (form) {
    var statusEl = document.getElementById('form-status');
    var submitBtn = document.getElementById('submit-btn');
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setError(field, message) {
      var errEl = document.getElementById(field.id + '-error');
      if (errEl) errEl.textContent = message;
      field.classList.toggle('invalid', Boolean(message));
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function validateField(field) {
      var value = field.value.trim();

      if (!value) {
        setError(field, 'This field is required.');
        return false;
      }
      if (field.type === 'email' && !emailPattern.test(value)) {
        setError(field, 'Please enter a valid email address.');
        return false;
      }
      if (field.id === 'message' && value.length < 10) {
        setError(field, 'Please add a little more detail (10 characters or more).');
        return false;
      }
      setError(field, '');
      return true;
    }

    /* Draft persistence — a half-written enquiry survives a tab switch, a
       phone call or an accidental back button. Cleared on a successful send.
       Kept to this device: nothing is transmitted anywhere. */
    var DRAFT_KEY = 'kws-enquiry-draft';
    var draftFields = ['name', 'email', 'company', 'package', 'message'];

    function saveDraft() {
      try {
        var d = {};
        draftFields.forEach(function (n) { if (form.elements[n]) d[n] = form.elements[n].value; });
        d.services = Array.prototype.slice.call(form.querySelectorAll('input[name="services"]:checked'))
          .map(function (c) { return c.value; });
        var empty = draftFields.every(function (n) { return !d[n]; }) && !d.services.length;
        if (empty) localStorage.removeItem(DRAFT_KEY);
        else localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      } catch (e) { /* private mode, quota — a draft is never worth an error */ }
    }
    function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }
    function restoreDraft() {
      try {
        var raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        var d = JSON.parse(raw);
        draftFields.forEach(function (n) {
          if (form.elements[n] && typeof d[n] === 'string') form.elements[n].value = d[n];
        });
        (d.services || []).forEach(function (v) {
          var c = form.querySelector('input[name="services"][value="' + CSS.escape(v) + '"]');
          if (c) c.checked = true;
        });
      } catch (e) { /* ignore malformed or unavailable storage */ }
    }
    restoreDraft();

    // /contact/?package=business (the pricing page's buttons) picks the package
    try {
      var chosen = new URLSearchParams(location.search).get('package');
      var pkg = form.elements['package'];
      if (chosen && pkg && pkg.querySelector('option[value="' + CSS.escape(chosen) + '"]')) pkg.value = chosen;
    } catch (e) { /* old browser: the visitor picks it themselves */ }

    var draftTimer = null;
    form.addEventListener('input', function () {
      clearTimeout(draftTimer);
      draftTimer = setTimeout(saveDraft, 400);
    });
    form.addEventListener('change', saveDraft);

    var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));

    required.forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); });
      field.addEventListener('input', function () {
        if (field.classList.contains('invalid')) validateField(field);
      });
    });

    function setStatus(message, kind) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.className = 'form-status' + (kind ? ' ' + kind : '');
    }

    // Used when the POST fails, so a broken endpoint never costs an enquiry.
    // `form.elements` — `form.name` would resolve to the form's own name attribute.
    function mailtoFallback() {
      var f = form.elements;
      var subject = encodeURIComponent('Website enquiry from ' + f.name.value.trim());
      var body = encodeURIComponent(
        'Name: ' + f.name.value.trim() + '\n' +
        'Email: ' + f.email.value.trim() + '\n' +
        'Business: ' + f.company.value.trim() + '\n' +
        'Package: ' + (f['package'].selectedOptions[0] || {}).text + '\n\n' +
        f.message.value.trim()
      );
      return 'mailto:knightwebstudio1@gmail.com?subject=' + subject + '&body=' + body;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstInvalid = null;
      required.forEach(function (field) {
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        setStatus('Please fix the highlighted fields.', 'error');
        return;
      }

      // hCaptcha injects h-captcha-response into the form once solved.
      var captchaEl = document.getElementById('captcha-error');
      var captchaField = form.elements['h-captcha-response'];
      var widgetPresent = !!(captchaSlot && captchaSlot.querySelector('iframe, textarea'));

      if (widgetPresent && (!captchaField || !captchaField.value)) {
        if (captchaEl) captchaEl.textContent = 'Please tick the verification box above.';
        setStatus('');
        if (captchaSlot) captchaSlot.scrollIntoView({ block: 'center' });
        return;
      }
      if (captchaEl) captchaEl.textContent = '';

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      setStatus('');

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          // Web3Forms reports rejections (bad key, spam heuristics) inside a
          // 200 body, so response.ok alone is not proof the mail was sent.
          return response.json()
            .catch(function () { return { success: response.ok }; })
            .then(function (data) {
              if (!response.ok || data.success === false) {
                throw new Error(data.message || 'Request failed with status ' + response.status);
              }
              form.reset();
              clearDraft();
              track('Enquiry');
              setStatus('Thanks — your enquiry is in. We’ll reply within one business day.', 'ok');
            });
        })
        .catch(function (err) {
          // Never lose an enquiry: hand the visitor a pre-filled email instead.
          var why = (err && err.message) ? ' (' + err.message + ')' : '';
          setStatus('Couldn’t send that' + why + '. Opening your email app so nothing is lost…', 'error');
          window.location.href = mailtoFallback();
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send enquiry';
          // Tokens are single-use — without this a second send always fails.
          if (window.hcaptcha) { try { window.hcaptcha.reset(); } catch (e) { /* not rendered */ } }
        });
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
