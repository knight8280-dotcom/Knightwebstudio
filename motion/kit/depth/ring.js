/* KWS motion kit: carousel ring. A rotary card file: each line of the lists stands as a blank index card on a tilted
   turntable that turns as the page scrolls past, and by drag. The card at the front is lifted out, flat-on, to be read.
   Decoration only (aria-hidden): the lists beside it are the content. Still under reduced motion and html[data-motion="off"].
   Starts itself on [data-kws="ring"], or: const off = KWS.ring.mount(el, { speed: .1 }); off();   Notes: NOTES.md */
(function () {
'use strict';
const D = document, H = D.documentElement, { abs, min, max, round, sin, cos, exp } = Math, live = new WeakMap(), RAD = Math.PI / 180,
	calm = matchMedia('(prefers-reduced-motion: reduce)'),
	still = () => calm.matches || H.dataset.motion === 'off',
	make = cls => { const e = D.createElement('div'); e.className = 'kws-ring-' + cls; return e; },
	text = e => e ? e.textContent.trim() : '',
	bare = e => { e.getAttribute('style'); e.removeAttribute('style'); }; // read first, or it stays

function mount(el, opt) {
	if (live.has(el)) return live.get(el);
	let R = 0, S = 0, Y = 0, vh = 0, top = 0, ang = 0, goal = 0, turn = 0, vel = 0,
		frame = 0, last = 0, head = '', seen = false, busy = false, moved = 0, paused = 0, drag = null;
	const stage = el.querySelector('.kws-ring-stage'), groups = [...el.querySelectorAll('.kws-ring-group')],
		// a line: its words, its list's name for the tab, and which of four tab places that list takes
		items = [...el.querySelectorAll('li')].map(li => {
			const g = li.closest('.kws-ring-group');
			return [li.dataset.short || text(li), g ? g.dataset.tab || text(g.querySelector('.kws-ring-name')) : '', max(0, groups.indexOf(g)) % 4];
		}), n = items.length;
	if (!stage || n < 3 || H.dataset.kws3d === 'off' || !CSS.supports('transform', 'perspective(1px)')) {
		if (stage) stage.style.display = 'none'; // the lists alone; no space kept
		return () => stage && bare(stage);
	}
	const speed = +({ ...el.dataset, ...opt }).speed || .1, step = 360 / n, hub = make('hub'), ac = new AbortController(), side = [], rank = [],
		on = (t, type, fn) => t.addEventListener(type, fn, { signal: ac.signal, passive: true }),
		cards = items.map(it => { const c = hub.appendChild(make('card')); c.style.cssText = '--k:' + it[2]; return c; }),
		readers = [0, 0].map(() => { const e = hub.appendChild(make('read')); e.innerHTML = '<b></b><div></div>'; return { e, i: -1, p: 0 }; });
	stage.append(hub);
	el.classList.add('is-live');

	const draw = dt => {
		const f = ((round(-ang / step) % n) + n) % n;
		cards.forEach((c, i) => {
			let a = (i * step + ang) % 360; a += a > 180 ? -360 : a < -180 ? 360 : 0;
			// Each card turns a little towards the reader, most at the sides: faces on the near half, backs on the far.
			// No 3D sorting is asked of the browser: they are stacked here, lowest where edge-on (2: not drawn)
			const fan = 32 * sin(a * RAD), v = cos((a - fan) * RAD) - .31 * cos(fan * RAD), s = v > .07 ? 0 : v < -.07 ? 1 : 2,
				z = round(abs(abs(a) - 105) / step);
			c.style.transform = `${head} rotateY(${a}deg) translateZ(${R}px) rotateY(${-fan}deg)`;
			if (s !== side[i]) { side[i] = s; c.classList.toggle('is-back', s === 1); c.style.visibility = s > 1 ? 'hidden' : ''; }
			if (z !== rank[i]) c.style.zIndex = rank[i] = z;
		});
		// The front card is read on a larger card that lifts out of its place and rests flat, in the middle
		if (readers.every(r => r.i !== f)) {
			const r = readers[readers[0].p > readers[1].p ? 1 : 0];
			r.i = f; r.p = 0; r.e.lastChild.textContent = items[f][0]; r.e.firstChild.textContent = items[f][1];
		}
		busy = false;
		readers.forEach(r => {
			const t = r.i === f ? 1 : 0, s = r.e.style;
			let p = r.p, a = (r.i * step + ang) % 360;
			if (p !== t) { p += (t - p) * (dt ? 1 - exp(-dt / (t ? 130 : 50)) : 1); if (abs(t - p) < .004) p = t; else busy = true; r.p = p; }
			else if (r.w === p) return;
			r.w = p;
			const q = 1 - p; // 1 in its place in the file, 0 out and facing you
			a += a > 180 ? -360 : a < -180 ? 360 : 0;
			s.opacity = min(1, p * 5);
			s.transform = `perspective(${R * 2.8}px) translateZ(${-R * q}px) rotateX(${-32 * q}deg) rotateY(${a * q}deg) translateZ(${R * q}px) rotateY(${-32 * sin(a * RAD) * q}deg) translateY(${R * .5 * p}px) scale(${S + (.5 - S) * p})`;
			r.e.lastChild.style.opacity = +(p > .6); // words wait until it is nearly up: two cards never read at once
		});
	};
	const aim = () => { goal = turn - max(0, Y + vh - top) * speed; };
	const tick = now => {
		frame = 0;
		const dt = min(50, now - last || 16), stop = still(); last = now;
		if (!seen) return vel = 0; // scrolled away mid-turn
		if (stop) { vel = 0; goal = ang; } else {
			if (moved) { moved = 0; Y = scrollY; aim(); if (paused) { paused = 0; turn += ang - goal; goal = ang; } }
			if (vel && !drag) { turn += vel * dt; vel *= exp(-dt / 240); if (abs(vel) < .01) vel = 0; aim(); }
		}
		ang += (goal - ang) * (drag && drag.on ? 1 : 1 - exp(-dt / 110));
		if (abs(goal - ang) < .03) ang = goal;
		if (ang === goal && !vel && !drag && !stop) goal = round(goal / step) * step; // left alone, it settles on a card
		draw(stop ? 0 : dt);
		if (ang !== goal || vel && !drag || busy) frame = requestAnimationFrame(tick);
	};
	const kick = () => { if (!frame && seen) { last = 0; frame = requestAnimationFrame(tick); } };
	const measure = jump => {
		const w = stage.clientWidth, fresh = !R;
		if (!w) return;
		// it runs off the window's left edge only if the stage reaches that edge
		R = round(min(stage.clientHeight / 1.12, innerWidth < 980 ? w : stage.getBoundingClientRect().left < 1 ? (w - 230) / .92 : w / 1.9));
		stage.style.fontSize = R + 'px';
		head = `perspective(${R * 2.8}px) translateZ(${-R}px) rotateX(-32deg)`;
		S = cards[0].offsetWidth / readers[0].e.offsetWidth;
		vh = innerHeight; Y = scrollY; top = el.getBoundingClientRect().top + Y;
		readers.forEach(r => r.w = -1);
		if (!still()) {
			aim();
			if (jump || fresh) ang = goal = round(goal / step) * step; // coming on screen: no catching up
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
		hub.style.display = seen ? '' : 'none'; // off screen its cards are not kept as layers
		if (!el.isConnected) off(); else if (seen) measure(1);
	}, { rootMargin: '20%' });
	ro.observe(stage); io.observe(stage); measure();
	on(window, 'scroll', scroll);

	// a drag is a clearly sideways move only
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
		if (e.timeStamp - drag.t > 80) vel = 0; // it had stopped: no fling
		drag = null; kick();
	};
	on(stage, 'pointerup', drop); on(stage, 'pointercancel', drop);

	function off() {
		ac.abort(); ro.disconnect(); io.disconnect(); cancelAnimationFrame(frame);
		hub.remove();
		bare(stage);
		el.classList.remove('is-live');
		live.delete(el);
	}
	live.set(el, off);
	return off;
}

const boot = () => D.querySelectorAll('[data-kws="ring"]').forEach(el => mount(el));
(window.KWS = window.KWS || {}).ring = { mount };
D.readyState === 'loading' ? D.addEventListener('DOMContentLoaded', boot) : boot();
})();
