/* KWS motion kit: cylinder slider. Cards stand on a wide, shallow drum; the one in the middle faces you, flat and sharp.
   Starts itself on [data-kws="cylinder"], or: const off = KWS.cylinder.mount(el, { start: 0, loop: true, noun: 'step' }); off();
   Drag, swipe, the arrows, the dots and the arrow keys turn it; never by itself. Markup and notes: NOTES.md */
(function () {
'use strict';
const D = document, H = D.documentElement, { abs, min, max, round, sign, sin } = Math, live = new WeakMap(),
	calm = matchMedia('(prefers-reduced-motion: reduce)'), small = matchMedia('(max-width: 379.98px)'), phone = matchMedia('(max-width: 599.98px)'),
	deep = !!(window.CSS && CSS.supports('transform', 'perspective(1px)')),
	still = () => calm.matches || H.dataset.motion === 'off',
	set = (e, k, v) => e.setAttribute(k, v),
	make = (tag, cls, label) => {
		const e = D.createElement(tag);
		e.className = 'kws-cyl-' + cls;
		if (label) { e.type = 'button'; set(e, 'aria-label', label); }
		return e;
	};

function mount(el, opt = {}) {
	if (live.has(el)) return live.get(el);
	const track = el.querySelector('.kws-cyl-track'), cards = track ? [...track.children] : [], n = cards.length;
	if (n < 2) return () => {};
	const noun = opt.noun || el.dataset.noun || 'slide', loop = n > 2 && opt.loop !== false && el.dataset.loop !== 'false',
		names = cards.map((c, i) => {
			const h = c.querySelector('h2,h3,h4');
			return `${noun[0].toUpperCase() + noun.slice(1)} ${i + 1} of ${n}${h ? ': ' + h.textContent.trim() : ''}`;
		}),
		prev = make('button', 'nav', 'Previous ' + noun), next = make('button', 'nav', 'Next ' + noun),
		dots = names.map(name => make('button', 'dot', name)), ctl = make('div', 'ctl'), tell = make('p', 'sr'),
		bare = cards.map(c => !c.hasAttribute('style')), far = loop ? min(2.5, n / 2) : 2.5, ac = new AbortController(),
		// A drum with two ends carries blank cards before the first and after the last, so it is never bare on one side
		ends = loop ? [] : [-2, -1, n, n + 1], all = cards.concat(ends.map(() => track.appendChild(make('li', 'card')))),
		// how: 1 not passive, 2 capture too
		on = (t, type, fn, how) => t.addEventListener(type, fn, { signal: ac.signal, passive: !how, capture: how > 1 }),
		mod = i => (i % n + n) % n,
		wrap = d => loop ? mod(d + n / 2) - n / 2 : d, // the short way round
		at = e => cards.findIndex(c => c.contains(e.target));
	let pos = min(n - 1, max(0, +(opt.start || el.dataset.start) || 0)), target = pos, vel = 0, frame = 0, last = 0, cur = -1,
		drag = null, moved = false, side = -1, W = 0, R = 0, turn = 17, flat = false;

	const render = () => {
		all.forEach((c, i) => {
			// Every card in view is at full strength, so its words keep their contrast: the turn and the light carry the depth.
			// A card fades only over its last 0.4 of a step, out past the second card, as it leaves or crosses to the other side.
			const d = wrap((i < n ? i : ends[i - n]) - pos), a = abs(d), s = c.style, o = max(0, min(1, (far - a) / .4));
			s.opacity = o.toFixed(3); s.pointerEvents = o ? '' : 'none';
			s.transform = a < .001 ? 'none' : flat ? `translateX(${(d * W * 1.06).toFixed(1)}px)`
				: `perspective(${R * 1.4}px) translateZ(${-R}px) rotateY(${(d * turn).toFixed(2)}deg) translateZ(${R}px)`;
		});
		const i = mod(round(pos));
		if (i === cur) return;
		cur = i;
		cards.forEach((c, j) => c.classList.toggle('is-on', j === i));
		dots.forEach((b, j) => j === i ? set(b, 'aria-current', 'true') : b.removeAttribute('aria-current'));
		if (!loop) { set(prev, 'aria-disabled', i < 1); set(next, 'aria-disabled', i > n - 2); }
	};
	// A soft spring to the target; it runs only until it lands. Only a drag in progress holds it: a mere press does not
	const tick = now => {
		frame = 0;
		const dt = last ? min(.05, (now - last) / 1e3) : .016, held = drag && drag.on; last = now;
		if (!held) {
			vel += ((target - pos) * 160 - vel * 25) * dt; pos += vel * dt;
			if (abs(target - pos) < .002 && abs(vel) < .03) { pos = target; vel = 0; }
		}
		render();
		if (held) return;
		if (pos !== target) frame = requestAnimationFrame(tick);
		else { pos = target = mod(target); el.classList.remove('is-moving'); }
	};
	const kick = () => { if (!frame) { last = 0; el.classList.add('is-moving'); frame = requestAnimationFrame(tick); } };
	const go = (t, say) => {
		t = loop ? t : min(n - 1, max(0, t));
		if (say && mod(t) !== mod(target)) tell.textContent = names[mod(t)];
		target = t;
		if (still()) { pos = target = mod(t); vel = 0; render(); } else kick();
	};
	const to = (i, say) => go(target + wrap(i - target), say);
	const measure = () => {
		const w = cards[0].offsetWidth;
		if (!w) return;
		W = w; turn = phone.matches ? 21 : 17; // a tighter drum on a phone, so the neighbours' curve shows in the little room there is
		R = round(W * 1.06 / sin(turn * Math.PI / 180));
		flat = !deep || small.matches || H.dataset.kws3d === 'off';
		render();
	};

	set(el, 'aria-roledescription', 'carousel');
	set(tell, 'aria-live', 'polite');
	all.forEach((c, i) => i < n ? (set(c, 'aria-roledescription', 'slide'), set(c, 'aria-label', `${i + 1} of ${n}`)) : set(c, 'aria-hidden', 'true'));
	ctl.append(prev, ...dots, next);
	el.append(ctl, tell);
	el.classList.add('is-live');
	const ro = new ResizeObserver(measure);
	ro.observe(el); measure();

	on(prev, 'click', () => go(target - 1, 1));
	on(next, 'click', () => go(target + 1, 1));
	dots.forEach((b, i) => on(b, 'click', () => to(i, 1)));
	on(el, 'keydown', e => {
		const k = e.key, t = k === 'ArrowLeft' ? target - 1 : k === 'ArrowRight' ? target + 1 : k === 'Home' ? 0 : k === 'End' ? n - 1 : null,
			was = target, inside = at(e) > -1;
		if (t === null || e.altKey || e.ctrlKey || e.metaKey || e.target.matches('input,textarea,select')) return;
		e.preventDefault();
		if (k.length > 4) go(t, !inside); else to(t, !inside);
		// Focus was on a card that is now turning away: it moves to the dot of the card that has come round, and that is what is announced
		if (inside && target !== was) dots[mod(target)].focus({ preventScroll: true });
	}, 1);
	// Tabbing to something on a card at the side brings that card to the middle
	on(track, 'focusin', e => { const i = at(e); track.scrollLeft = 0; if (i > -1 && i !== mod(target)) to(i); });
	// A click that ends a drag is not a click; a click or tap on a side card brings it round instead of following its link.
	// A click made from the keyboard (detail 0) is never either of those.
	on(track, 'click', e => {
		if (e.detail && (moved || side > -1)) { e.preventDefault(); e.stopPropagation(); if (!moved) to(side, 1); }
		moved = false; side = -1;
	}, 2);

	// Drag: only a clearly sideways move is taken, so the page still scrolls up and down (touch-action: pan-y)
	on(track, 'pointerdown', e => {
		if (e.button || !e.isPrimary) return;
		drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, p: pos, v: 0, on: 0 };
		moved = false; side = at(e); if (side === mod(target)) side = -1; // noted now: focus moves the drum before the click arrives
	});
	on(track, 'pointermove', e => {
		if (!drag || e.pointerId !== drag.id) return;
		const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
		if (!drag.on) {
			if (abs(dx) < 6 || abs(dx) < abs(dy)) { if (abs(dy) > 10) drag = null; return; }
			drag.on = 1; moved = true; track.setPointerCapture(e.pointerId); el.classList.add('is-held');
			drag.p = pos; drag.x = e.clientX;
			return;
		}
		drag.dx = dx;
		if (still()) return;
		let p = drag.p - dx / (W * 1.06);
		if (!loop) p = p < 0 ? p * .35 : p > n - 1 ? n - 1 + (p - n + 1) * .35 : p;
		drag.v = .7 * (p - pos) / max(1, e.timeStamp - drag.t) + .3 * drag.v; drag.t = e.timeStamp;
		pos = p; kick();
	});
	const drop = e => {
		if (!drag || e.pointerId !== drag.id) return;
		const d = drag; drag = null;
		el.classList.remove('is-held');
		if (!d.on) return;
		if (still()) return abs(d.dx) > 30 && go(target - sign(d.dx), 1);
		vel = e.timeStamp - d.t > 80 ? 0 : d.v * 1e3; // it had stopped under the finger: no fling
		go(round(pos + max(-.6, min(.6, vel * .22))), 1);
	};
	on(track, 'pointerup', drop); on(track, 'pointercancel', drop);
	on(track, 'dragstart', e => e.preventDefault(), 1); // links and pictures in a card are not picked up and carried off

	function off() {
		ac.abort(); ro.disconnect(); cancelAnimationFrame(frame);
		ctl.remove(); tell.remove();
		el.removeAttribute('aria-roledescription');
		el.classList.remove('is-live', 'is-moving', 'is-held');
		all.forEach((c, i) => {
			if (i >= n) return c.remove();
			c.removeAttribute('aria-roledescription'); c.removeAttribute('aria-label');
			c.classList.remove('is-on');
			if (bare[i]) c.removeAttribute('style'); else c.style.transform = c.style.opacity = c.style.pointerEvents = '';
		});
		live.delete(el);
	}
	live.set(el, off);
	return off;
}

const boot = () => D.querySelectorAll('[data-kws="cylinder"]').forEach(el => mount(el));
(window.KWS = window.KWS || {}).cylinder = { mount };
if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
})();
