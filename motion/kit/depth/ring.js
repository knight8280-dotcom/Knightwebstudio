/* KWS motion kit: carousel ring. A rotary card file: every line of the lists stands as a blank index card on a tilted
   turntable that turns as the page scrolls past it, and by drag. The card at the front is lifted out, flat-on, to be read.
   Decoration only (aria-hidden): the lists beside it are the content.
   Starts itself on [data-kws="ring"], or: const off = KWS.ring.mount(el, { speed: .1 }); off();
   Still under reduced motion and when html[data-motion="off"]. Markup and notes: NOTES.md */
(function () {
'use strict';
const D = document, H = D.documentElement, { abs, min, max, round, sin, cos, exp } = Math, live = new WeakMap(),
	TILT = 32, FAN = 32, RAD = Math.PI / 180,
	calm = matchMedia('(prefers-reduced-motion: reduce)'), wide = matchMedia('(min-width: 980px)'),
	still = () => calm.matches || H.dataset.motion === 'off',
	make = cls => { const e = D.createElement('div'); e.className = 'kws-ring-' + cls; return e; },
	text = e => e ? e.textContent.trim() : '';

function mount(el, opt = {}) {
	if (live.has(el)) return live.get(el);
	let stage = el.querySelector('.kws-ring-stage'), group, R = 0, S = 0, Y = 0, vh = 0, top = 0, ang = 0, goal = 0, turn = 0, vel = 0,
		frame = 0, last = 0, head = '', seen = false, busy = false, moved = 0, paused = 0, drag = null;
	const made = !stage, items = [];
	el.querySelectorAll('li').forEach(li => {
		const g = li.closest('.kws-ring-group'), name = g ? g.dataset.tab || text(g.querySelector('.kws-ring-name')) : '';
		if (g !== group && name) items.push([name, text(g.querySelector('.kws-ring-price')) || name, 1]); // a guide card opens each list
		group = g;
		items.push([name, li.dataset.short || text(li)]);
	});
	const n = items.length;
	if (n < 3 || H.dataset.kws3d === 'off' || !CSS.supports('transform', 'perspective(1px)')) {
		if (stage) stage.style.display = 'none'; // the lists alone, and no space kept for a ring that will not come
		return () => { if (stage) stage.style.display = ''; };
	}
	const speed = +(opt.speed || el.dataset.speed) || .1, step = 360 / n, hub = make('hub'), ac = new AbortController(), side = [], rank = [],
		on = (t, type, fn) => t.addEventListener(type, fn, { signal: ac.signal, passive: true }),
		cards = items.map((it, i) => {
			const c = make(it[2] ? 'card is-tab' : 'card');
			c.style.cssText = '--k:' + i % 3;
			hub.append(c);
			return c;
		}),
		readers = [0, 0].map(() => { const e = make('read'); e.innerHTML = '<b></b><span></span>'; return { e, i: -1, p: 0 }; });
	if (made) { stage = make('stage'); el.prepend(stage); }
	stage.setAttribute('aria-hidden', 'true');
	stage.append(hub, readers[0].e, readers[1].e);
	el.classList.add('is-live');

	// One write turns the whole file: the cards ride inside the hub, and a card is only touched when it shows its other side.
	// The front card is read on a larger card that lifts out of its place and comes to rest flat and upright in the middle.
	const draw = dt => {
		const f = ((round(-ang / step) % n) + n) % n;
		cards.forEach((c, i) => {
			let a = (i * step + ang) % 360; a += a > 180 ? -360 : a < -180 ? 360 : 0;
			// Each card turns a little towards the reader (most at the sides), so the near half shows faces and the far half backs
			const fan = FAN * sin(a * RAD), v = cos((a - fan) * RAD) - .31 * cos(fan * RAD), s = v > .07 ? 0 : v < -.07 ? 1 : 2, // 2: edge-on, not drawn
				z = round(abs(abs(a) - 105) / step); // no 3D sorting is asked of the browser: the cards are stacked here, lowest where they are edge-on
			c.style.transform = `${head} rotateY(${a.toFixed(2)}deg) translateZ(${R}px) rotateY(${(-fan).toFixed(2)}deg)`;
			if (s !== side[i]) { side[i] = s; c.classList.toggle('is-back', s === 1); c.style.visibility = s > 1 ? 'hidden' : ''; }
			if (z !== rank[i]) c.style.zIndex = rank[i] = z;
		});
		if (readers.every(r => r.i !== f)) {
			const r = readers[readers[0].p > readers[1].p ? 1 : 0], it = items[f];
			r.i = f; r.p = 0; r.e.firstChild.textContent = it[0]; r.e.lastChild.textContent = it[1]; r.e.classList.toggle('is-tab', !!it[2]);
		}
		busy = false;
		readers.forEach(r => {
			const t = r.i === f ? 1 : 0, s = r.e.style;
			let p = r.p, a = (r.i * step + ang) % 360;
			if (p !== t) { p += (t - p) * (dt ? 1 - exp(-dt / (t ? 130 : 50)) : 1); if (abs(t - p) < .004) p = t; else busy = true; r.p = p; }
			else if (r.w === p) return;
			r.w = p;
			const q = 1 - p; // 1 in its place in the file, 0 out and facing the reader
			a += a > 180 ? -360 : a < -180 ? 360 : 0;
			s.opacity = min(1, p * 5);
			s.transform = `perspective(${R * 2.8}px) translateZ(${-R * q}px) rotateX(${-TILT * q}deg) rotateY(${a * q}deg) translateZ(${R * q}px) rotateY(${-FAN * sin(a * RAD) * q}deg) translateY(${R * .5 * p}px) scale(${S + (.5 - S) * p})`;
			r.e.classList.toggle('is-open', p > .6); // its words wait until it is nearly up, so two cards never read at once
		});
	};
	const aim = () => { goal = turn - max(0, Y + vh - top) * speed; };
	const tick = now => {
		frame = 0;
		const dt = min(50, now - last || 16), stop = still(); last = now;
		if (!seen) { vel = 0; el.classList.remove('is-moving'); return; } // scrolled away mid-turn: stop here
		if (stop) { vel = 0; goal = ang; } else {
			if (moved) { moved = 0; Y = scrollY; aim(); if (paused) { paused = 0; turn += ang - goal; goal = ang; } } // resumes from where it stood
			if (!drag) {
				if (vel) { turn += vel * dt; vel *= exp(-dt / 300); if (abs(vel) < .002) vel = 0; aim(); }
				else if (ang === goal) goal = round(goal / step) * step; // left alone, it settles on the nearest card
			}
		}
		ang += (goal - ang) * (drag ? 1 : 1 - exp(-dt / 110));
		if (abs(goal - ang) < .03) ang = goal;
		draw(stop ? 0 : dt);
		if (ang !== goal || vel && !drag || busy) frame = requestAnimationFrame(tick); else el.classList.remove('is-moving');
	};
	const kick = () => { if (!frame && seen) { last = 0; el.classList.add('is-moving'); frame = requestAnimationFrame(tick); } };
	// Measured here, never in the frame loop
	const measure = jump => {
		const w = stage.clientWidth, fresh = !R;
		if (!w) return;
		R = round(min(stage.clientHeight / 1.12, wide.matches ? (w - 160) / .92 : w));
		stage.style.fontSize = R + 'px';
		head = `perspective(${R * 2.8}px) translateZ(${-R}px) rotateX(${-TILT}deg)`;
		S = cards[0].offsetWidth / readers[0].e.offsetWidth;
		vh = innerHeight; Y = scrollY; top = el.getBoundingClientRect().top + Y;
		readers.forEach(r => { r.w = -1; });
		if (!still()) {
			aim();
			if (jump || fresh) ang = goal = round(goal / step) * step; // coming on screen: on a card, with no catching up to watch
			else { turn += ang - goal; goal = ang; } // a resize does not turn it
		}
		draw(0);
	};
	const scroll = () => {
		if (!el.isConnected) return off();
		if (still()) paused = 1; else if (seen) { moved = 1; kick(); }
	};
	const ro = new ResizeObserver(() => measure()), io = new IntersectionObserver(es => {
		seen = es[es.length - 1].isIntersecting;
		hub.style.display = seen ? '' : 'none'; // off screen the cards are not kept as layers: the rest of the page scrolls lighter
		if (!el.isConnected) off(); else if (seen) measure(1);
	}, { rootMargin: '20%' });
	ro.observe(stage); io.observe(stage); measure();
	on(window, 'scroll', scroll);

	// Drag turns it; a clearly sideways move only, so the page still scrolls up and down
	on(stage, 'pointerdown', e => { if (!e.button && e.isPrimary && !still()) drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, on: 0 }; });
	on(stage, 'pointermove', e => {
		if (!drag || e.pointerId !== drag.id) return;
		const dx = e.clientX - drag.x, dy = e.clientY - drag.y, dt = max(1, e.timeStamp - drag.t);
		if (!drag.on) {
			if (abs(dx) < 6 || abs(dx) < abs(dy)) { if (abs(dy) > 10) drag = null; return; }
			drag.on = 1; stage.setPointerCapture(e.pointerId);
		} else {
			const d = dx * 57.3 / R;
			turn += d; vel = .6 * d / dt + .4 * vel; aim(); kick();
		}
		drag.x = e.clientX; drag.t = e.timeStamp;
	});
	const drop = e => {
		if (!drag || e.pointerId !== drag.id) return;
		if (e.timeStamp - drag.t > 80) vel = 0; // it had stopped under the finger: no fling
		drag = null; kick();
	};
	on(stage, 'pointerup', drop); on(stage, 'pointercancel', drop);

	function off() {
		ac.abort(); ro.disconnect(); io.disconnect(); cancelAnimationFrame(frame);
		hub.remove(); readers.forEach(r => r.e.remove());
		if (made) stage.remove(); else stage.removeAttribute('style');
		el.classList.remove('is-live', 'is-moving');
		live.delete(el);
	}
	live.set(el, off);
	return off;
}

const boot = () => D.querySelectorAll('[data-kws="ring"]').forEach(el => mount(el));
(window.KWS = window.KWS || {}).ring = { mount };
if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
})();
