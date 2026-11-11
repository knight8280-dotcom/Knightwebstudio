/* KWS motion kit: arc focus carousel. Signs ride the top of a wheel; the one at the top is in focus.
   Starts itself on [data-kws="arc"], or: const off = KWS.arc.mount(el, { start: 0, loop: true, noun: 'service' }); off();
   Drag, swipe, arrows, dots and arrow keys turn it; never by itself. Markup and notes: NOTES.md */
(function () {
'use strict';
const { abs, min, max, round, sign, sin, cos } = Math, live = new WeakMap(),
	calm = matchMedia('(prefers-reduced-motion: reduce)'),
	still = () => calm.matches || document.documentElement.dataset.motion === 'off',
	set = (e, k, v) => e.setAttribute(k, v),
	size = k => k < 1 ? 1 : max(.5, .86 - .1 * k), // scale of the sign k places from the top
	make = (tag, cls, label, text = '') => {
		const e = document.createElement(tag);
		e.className = 'kws-arc-' + cls; e.textContent = text;
		if (label) { e.type = 'button'; set(e, 'aria-label', label); }
		return e;
	};

function mount(el, opt = {}) {
	if (live.has(el)) return live.get(el);
	const list = el.querySelector('.kws-arc-list'), items = list ? [...list.children] : [], n = items.length;
	if (!n) return () => {};
	const pick = q => items.map(li => li.querySelector(q)), tiles = pick('.kws-arc-tile'), caps = pick('.kws-arc-cap'),
		noun = opt.noun || el.dataset.noun || 'item',
		names = pick('h2,h3,h4').map((h, i) => `${h ? h.textContent.trim() : noun}, ${i + 1} of ${n}`),
		prev = make('button', 'nav', 'Previous ' + noun, '‹'), next = make('button', 'nav', 'Next ' + noun, '›'),
		dots = names.map(name => make('button', 'dot', name)), ctl = make('div', 'ctl'), tell = make('p', 'sr'),
		loop = n > 2 && opt.loop !== false && el.dataset.loop !== 'false', ang = [0], ac = new AbortController(),
		// how: 1 not passive, 2 capture too
		on = (t, type, fn, how) => t.addEventListener(type, fn, { signal: ac.signal, passive: !how, capture: how > 1 }),
		mod = i => (i % n + n) % n,
		wrap = d => loop ? mod(d + n / 2) - n / 2 : d, // the short way round
		to = i => go(target + wrap(i - target));
	let pos = min(n - 1, max(0, +(opt.start || el.dataset.start) || 0)), target = pos, vel = 0, frame = 0, last = 0, cur = -1,
		seen = true, drag, moved, say, R = 0, step = 1;

	// Measured once, then on resize: the wheel's radius and each place's angle
	const measure = () => {
		const w = list.clientWidth, t = tiles[0].offsetWidth;
		R = min(max(w / 2 - t * .36, t * 1.1), t * 2.9);
		for (let k = 1; k < 8; k++) ang[k] = ang[k - 1] + t * ((size(k - 1) + size(k)) / 2 + .22) / R;
		step = R * sin(ang[1]);
		render();
	};

	const render = () => {
		tiles.forEach((tile, i) => {
			const d = wrap(i - pos), a = abs(d), k = a | 0, f = a - k, th = ang[k] + (ang[k + 1] - ang[k]) * f,
				o = min(1, (1.4 - th) / .4, loop ? n - a * 2 : 1), s = tile.style;
			s.visibility = o > 0 ? '' : 'hidden';
			if (o > 0) {
				s.opacity = o.toFixed(2);
				s.transform = `translate(${(sign(d) * R * sin(th)).toFixed(1)}px,${(R * .78 * (1 - cos(th))).toFixed(1)}px) rotate(${(sign(d) * th * 28).toFixed(1)}deg) scale(${(size(k) + (size(k + 1) - size(k)) * f).toFixed(3)})`;
			}
			caps[i].style.opacity = max(0, 1 - a * 2.5).toFixed(2);
		});
		const i = mod(round(pos));
		if (i === cur) return;
		cur = i;
		items.forEach((li, j) => {
			li.classList.toggle('is-on', j === i); dots[j].tabIndex = j === i ? 0 : -1;
			set(dots[j], 'aria-current', j === i);
		});
	};

	const settle = () => { el.classList.remove('is-moving'); if (say) tell.textContent = names[cur]; say = 0; };
	const tick = now => {
		const dt = last ? min(.034, (now - last) / 1000) : .016;
		last = now; vel += (150 * (target - pos) - 22 * vel) * dt; pos += vel * dt;
		if (abs(target - pos) < .002 && abs(vel) < .05) { pos = target; vel = frame = 0; } else frame = requestAnimationFrame(tick);
		render(); if (!frame) settle();
	};
	// With no loop, stepping past an end goes round
	const go = (i, quiet) => {
		say = !quiet; target = loop ? i : mod(i);
		if (still() || !seen) { cancelAnimationFrame(frame); pos = target; vel = frame = 0; render(); settle(); }
		else if (!frame) { last = 0; el.classList.add('is-moving'); frame = requestAnimationFrame(tick); }
	};

	// Only a clearly sideways drag is taken
	const move = e => {
		const g = drag;
		if (!g || e.pointerId !== g.id) return;
		let dx = e.clientX - g.x;
		if (!g.on) {
			const dy = abs(e.clientY - g.y);
			if (abs(dx) < 8 && dy < 8) return;
			if (abs(dx) < dy * 1.4) { drag = 0; return; }
			g.on = moved = 1; g.x = e.clientX; g.p = pos; dx = 0;
			try { list.setPointerCapture(g.id); } catch {}
			cancelAnimationFrame(frame); vel = frame = 0; el.classList.add('is-moving');
		}
		g.v = .6 * (e.clientX - g.lx) / (e.timeStamp - g.t || 16) + .4 * g.v; g.lx = e.clientX; g.t = e.timeStamp;
		if (still()) return;
		pos = g.p - dx / step; if (!loop) pos = min(n - .7, max(-.3, pos));
		frame = frame || requestAnimationFrame(() => { frame = 0; render(); });
	};
	const up = e => {
		const g = drag;
		if (!g || e.pointerId !== g.id) return;
		drag = 0; if (!g.on) return;
		setTimeout(() => moved = 0, 60);
		cancelAnimationFrame(frame); frame = 0;
		const dx = g.lx - g.x, v = e.timeStamp - g.t > 90 ? 0 : max(-14, min(14, -g.v * 1000 / step)),
			i = still() ? round(g.p) - (abs(dx) < 24 ? 0 : sign(dx)) : round(pos + v * .16);
		vel = v; go(loop ? i : min(n - 1, max(0, i)));
	};

	items.forEach((li, i) => { set(li, 'aria-roledescription', 'slide'); set(li, 'aria-label', `${i + 1} of ${n}`); });
	set(ctl, 'role', 'group'); set(ctl, 'aria-label', 'Choose a ' + noun); set(tell, 'aria-live', 'polite');
	ctl.append(prev, ...dots, next); el.append(ctl, tell);
	set(el, 'aria-roledescription', 'carousel'); el.classList.add('is-live');

	on(ctl, 'click', e => {
		const b = e.target.closest('button');
		if (b) b === prev ? go(target - 1) : b === next ? go(target + 1) : to(dots.indexOf(b));
	});
	on(list, 'pointerdown', e => {
		moved = 0;
		if (!e.button && !(drag && drag.on)) drag = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, t: e.timeStamp, v: 0 };
	});
	on(list, 'pointermove', move); on(list, 'pointerup', up); on(list, 'pointercancel', up);
	on(list, 'dragstart', e => e.preventDefault(), 1);
	// A click that ends a drag follows no link. A side sign comes to the top; the top sign opens its link
	on(el, 'click', e => {
		const i = tiles.indexOf(e.target.closest('.kws-arc-tile'));
		if (moved) { moved = 0; e.preventDefault(); e.stopPropagation(); } else if (i > -1) i === cur ? (caps[i].querySelector('a') || tell).click() : to(i);
	}, 2);
	on(list, 'focusin', e => {
		const i = items.indexOf(e.target.closest('li'));
		if (i > -1 && i !== mod(target)) go(target + wrap(i - target), 1);
	});
	on(el, 'keydown', e => {
		const d = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
		if (!d || e.altKey || e.ctrlKey || e.metaKey) return;
		e.preventDefault(); go(target + d);
		// keep focus on what shows
		const a = document.activeElement, f = dots.includes(a) ? dots[mod(target)] : list.contains(a) && items[mod(target)].querySelector('a,button');
		if (f) f.focus({ preventScroll: true });
	}, 1);

	const ro = new ResizeObserver(measure), io = new IntersectionObserver(r => { seen = r.pop().isIntersecting; });
	ro.observe(list); io.observe(el); measure();

	const off = () => {
		ac.abort(); cancelAnimationFrame(frame); ro.disconnect(); io.disconnect(); ctl.remove(); tell.remove(); live.delete(el);
		el.classList.remove('is-live', 'is-moving'); el.removeAttribute('aria-roledescription');
		items.forEach((li, i) => {
			li.classList.remove('is-on'); li.removeAttribute('aria-roledescription'); li.removeAttribute('aria-label');
			for (const x of [tiles[i], caps[i]]) x.getAttribute('style'), x.removeAttribute('style');
		});
	};
	live.set(el, off); return off;
}

(window.KWS = window.KWS || {}).arc = { mount };
const start = () => document.querySelectorAll('[data-kws=arc]').forEach(el => mount(el));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
