/* KnightWebstudio motion kit: the animated backgrounds (wash, band, ribbon) and the pause control.
   Hand-written WebGL, no dependencies. Load with defer, beside motion.css. Markup and API: README.md.
   KWS.shader.mount(el, {speed, contrast}) and KWS.motion.mount(button) return their removers. */
(() => {
'use strict';
const KWS = window.KWS = window.KWS || {}, doc = document, html = doc.documentElement, css = getComputedStyle;
const { min, max, round, pow, sqrt, abs } = Math, raf = requestAnimationFrame, make = tag => doc.createElement(tag), none = () => {};
const reduce = matchMedia('(prefers-reduced-motion: reduce)'), dark = matchMedia('(prefers-color-scheme: dark)');
const off = () => html.getAttribute('data-motion') === 'off';

// == The pause control (WCAG 2.2.2): html[data-motion="off"], kept in localStorage. Its name says what pressing does
const KEY = 'kws-motion', ends = new WeakMap();
let btns = [], status;
const saved = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
const word = (b, n, d) => b.getAttribute('data-' + n) || d;
const label = b => {
	const t = off() ? word(b, 'play', 'Play motion') : word(b, 'pause', 'Pause motion'), s = b.querySelector('.kws-motion-label');
	if (s) { s.textContent = t; b.removeAttribute('aria-label'); b.removeAttribute('title'); } else { b.setAttribute('aria-label', t); b.title = t; }
};
const apply = (v, keep) => {
	const was = off();
	v = !!v;
	v ? html.setAttribute('data-motion', 'off') : html.removeAttribute('data-motion');
	if (keep) try { localStorage.setItem(KEY, v ? 'off' : 'on'); } catch (e) {}
	(btns = btns.filter(b => b.isConnected)).forEach(label);
	if (was !== v) doc.dispatchEvent(new CustomEvent('kws:motion', { detail: { off: v } }));
};
const sync = () => { const s = saved(); apply(s ? s === 'off' : reduce.matches); };
const press = b => {
	if (!b) return none;
	if (ends.has(b)) return ends.get(b);
	const click = () => {
		apply(!off(), true);
		if (!status) { status = doc.body.appendChild(make('span')); status.className = 'kws-sr'; status.setAttribute('role', 'status'); status.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)'; }
		status.textContent = off() ? word(b, 'paused', 'Motion paused') : word(b, 'playing', 'Motion playing');
	};
	const end = () => {
		if (ends.get(b) !== end) return;
		ends.delete(b); b.removeEventListener('click', click); b.hidden = true; btns = btns.filter(x => x !== b);
	};
	b.addEventListener('click', click);
	b.hidden = false; btns.push(b); label(b); ends.set(b, end);
	return end;
};
// no saved choice: what the page ships with, or the device's setting
apply(saved() ? saved() === 'off' : off() || reduce.matches);
addEventListener('storage', e => { if (e.key === KEY || e.key === null) sync(); });
addEventListener('pageshow', e => { if (e.persisted) sync(); });
reduce.addEventListener('change', sync);
KWS.motion = { off, set: v => apply(v, true), mount: press };

// == The backgrounds
// GLSL. R size, O origin, Lm luminance range, T time, Z seed, D dark ground, C colours (K: text-safe), B ground,
// N grain, M text mask. ok: text reads here, grained or not; gd: the most opacity that keeps it
const HEAD = `precision highp float;
#define S smoothstep
uniform vec2 R,Lm,O;uniform float T,Z,D;uniform vec3 C1,C2,C3,K1,K2,K3,B;uniform vec4 N;uniform sampler2D M;
float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float sn(vec2 p){vec2 i=floor(p),f=fract(p);f*=f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+1.),f.x),f.y)*2.-1.;}
float lu(vec3 c){vec3 l=mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(.04045,c));return dot(l,vec3(.2126,.7152,.0722));}
bool ir(vec3 c){float L=lu(c);return L>=Lm.x&&L<=Lm.y;}
bool ok(vec3 c,float a){c=mix(B,c,a);return ir(c)&&ir(mix(c,N.rgb,N.a));}
float gd(vec3 c,float a){if(ok(c,a))return a;float lo=0.,hi=a;for(int i=0;i<7;i++){float m=.5*(lo+hi);if(ok(c,m))lo=m;else hi=m;}return lo;}
void main(){vec2 fc=gl_FragCoord.xy-O,uv=fc/R;float u=sqrt(R.x*R.y);vec2 p=fc/u,k=R/u;`;
const FRAG = {
	// window light: a warm pool, a shade, slanted shafts. g: 1 where text sits
	wash: `float g=S(0.,.8,texture2D(M,clamp(vec2(uv.x,1.-uv.y),.004,.996)).a);
vec2 q=p+.2*vec2(sn(p*1.3+vec2(0.,T*.05)),sn(p*1.3+vec2(5.2,-T*.04)));
vec2 a1=q-k*vec2(.78+.07*sin(T*.11),.7),a2=q-k*vec2(.2,.56+.09*sin(T*.1)),a3=q-k*vec2(.62+.15*sin(T*.07),.22);
float f2=.9*exp(-dot(a2,a2)/.24),f3=.7*exp(-dot(a3,a3)/.16);
float l=1.6*S(.25,.75,.5+.5*sin((q.x*.82+q.y*.57)*13.+1.4*sn(q+T*.02)+T*.07))*(.35+.65*exp(-dot(a1,a1)/.45)),s=f2+f3+l;
vec3 c=(mix(C1,K1,g)*f2+mix(C3,K3,g)*f3+mix(C2,K2,g)*l)/max(s,1e-4);
float a=clamp(min(s,1.)*S(0.,.35,uv.y)*S(1.,.9,uv.y)*(1.-.2*D)+(hs(fc)-.5)/128.,0.,1.);
a=mix(a,gd(c,a),g);gl_FragColor=vec4(c*a,a);}`,
	// slow folds in two tones of the ground
	band: `float n=sn(p*vec2(.8,1.3)+vec2(T*.02,-T*.015)),v=p.y*3.2-p.x*1.1+n*1.3+T*.05;
float h=S(0.,1.,mix(.5+.5*sin(v*2.),.5+.5*sin(v*5.3+n*2.+1.7),.25));
vec3 c=mix(C3,C1,h)+C1*.25*pow(h,8.);
gl_FragColor=vec4(mix(B,c,gd(c,S(1.,.88,uv.y))),1.);}`,
	// three silk ribbons. s: distance across one, f: a pixel of it; D: lit edge at night
	ribbon: `p=(uv-.5)*vec2(R.x/R.y,1.);p=vec2(p.x*.92-p.y*.38,p.x*.38+p.y*.92);vec3 c=B;
for(int j=0;j<3;j++){float i=float(j),m=1.2+.25*i,x=p.x*m+i*2.3+Z,x1=x*1.7+T*.2+i,x2=x*3.9-T*.13+i*2.;
float y=(i-1.)*.27+.15*sin(x1)+.06*sin(x2),tw=cos(x*1.3+T*.16+i*1.9),dy=m*(.255*cos(x1)+.234*cos(x2));
float w=(j==1?.19:.08)*(.45+.55*abs(tw))*sqrt(1.+dy*dy),s=(p.y-y)/w,f=1.2/R.y/w,e=.5+.5*sin(x*2.6+T*.11+i*3.),z=(s-.3*tw)/.5;
c*=1.-.18*S(1.6,.2,abs(s+.035/w));
vec3 t=j==1?C1:C3,b=mix(t*.62,t,S(-.3,.3,tw));
b=mix(b,mix(t,vec3(1.),.6),.5*e*e*(.62+.38*s)+.12*exp(-z*z))*(1.-.07*s*s)+D*.35*t*S(.55,1.,abs(s));
if(j==1)b=mix(b,C2,S(.065+f,.04-f,abs(abs(s)-.72)));
c=mix(c,b,S(1.+f,1.-f,abs(s)));}
gl_FragColor=vec4(c,1.);}`
};
// pixels per CSS pixel, pixel-ratio cap, most pixels, least ms between frames
const P = { wash: [.5, 1, 8e4, 96], band: [.66, 1, 1e5, 48], ribbon: [1, 2, 1.2e5, 30] };
const UNI = 'R Lm O T Z D N C1 C2 C3 K1 K2 K3 B'.split(' '), mounts = [], byEl = new WeakMap();
let G, io, ro, mo, px, lead, id = 0, last = 0, share = 1e5, credit = 0, turn = 0;

// any CSS colour as [r, g, b, a], over `under` if given
const rgb = (col, under) => {
	if (!px) { px = make('canvas'); px.width = px.height = 1; px = px.getContext('2d', { willReadFrequently: true }); }
	px.fillStyle = '#010203'; px.fillStyle = (col || '').trim();
	const f = px.fillStyle;
	if (f === '#010203') return null;
	px.clearRect(0, 0, 1, 1);
	if (under) { px.fillStyle = `rgb(${under.slice(0, 3).map(x => round(x * 255))})`; px.fillRect(0, 0, 1, 1); }
	px.fillStyle = f; px.fillRect(0, 0, 1, 1);
	return [...px.getImageData(0, 0, 1, 1).data].map(x => x / 255);
};
const lum = c => {
	c = c.map(x => x <= .04045 ? x / 12.92 : pow((x + .055) / 1.055, 2.4));
	return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
};
const mix = (a, b, t) => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t);
// the flat colour behind a layer; null behind a picture or gradient (a band takes one over a solid colour)
const ground = (el, band) => {
	const stack = [];
	let out = [1, 1, 1], s, a;
	for (; el; el = el.parentElement) {
		s = css(el); a = rgb(s.backgroundColor)[3] === 1;
		if (s.backgroundImage !== 'none' && !(band && a)) return null;
		stack.push(s.backgroundColor);
		if (a) break;
	}
	while (stack.length) out = rgb(stack.pop(), out);
	return out;
};
// where the host's text and controls sit; the colours of text on the layer itself. Never in a frame
const measure = m => {
	m.stale = m.dirty = true;
	if (m.name === 'ribbon' || !m.w) return;
	const host = m.el.parentElement, b = m.el.getBoundingClientRect(), tw = doc.createTreeWalker(host, 4), r = doc.createRange(), cols = {};
	const add = q => m.rects.push([q.left - b.left, q.top - b.top, q.width, q.height]);
	let n, e, s, q;
	m.rects = [];
	host.querySelectorAll('a,button').forEach(e => add(e.getBoundingClientRect()));
	while ((n = tw.nextNode())) if (/\S/.test(n.data)) {
		r.selectNodeContents(n);
		q = [...r.getClientRects()].map(add);
		for (e = n.parentElement; e !== host; e = e.parentElement) { s = css(e); if (s.backgroundImage !== 'none' || rgb(s.backgroundColor)[3] > .5) break; }
		if (e === host && q.length) cols[css(n.parentElement).color] = 1;
	}
	m.txt = Object.keys(cols); m.old = true;
	if (m.gs) glints(m);
};
// band: gilt glints, 22px clear of text, 12px of the edge
const glints = m => {
	const most = min(18, round(m.w * m.h / 4e4)), all = [];
	for (let i = 1, x, y, s, g; i < 120 && all.length < most; i++) {
		x = i * .7548776662 % 1 * m.w; y = i * .569840291 % 1 * m.h; s = 7 + 13 * pow(i * .381966 % 1, 2);
		if (x < 12 + s || x > m.w - 12 - s || y < 26 + s || y > m.h - 12 - s ||
			m.rects.some(q => x > q[0] - 22 - s && x < q[0] + q[2] + 22 + s && y > q[1] - 22 - s && y < q[1] + q[3] + 22 + s)) continue;
		g = make('i');
		g.style.cssText = `--x:${x / m.w * 100}%;--y:${y / m.h * 100}%;--s:${s}px;--o:${.8 + .2 * (i * .618 % 1)};--n:${18 + 9 * (i % 3)};--k:${i * 7 % 36}`;
		all.push(g);
	}
	m.gs.replaceChildren(...(all[2] ? all : []));
};
// colours; the luminance the ground may take under text
const colours = m => {
	const cs = css(m.el), K = m.o.contrast || 4.6, v = (name, under) => rgb(cs.getPropertyValue(name), under || bg);
	const safe = c => { const a = lum(c), b = lum(mix(c, n, g)); return min(a, b) >= lo && max(a, b) <= hi; };
	let lo = 0, hi = 1, bg, n, g, c;
	m.stale = false;
	bg = v('--kit-shader-ground', [1, 1, 1]) || ground(m.el, m.name === 'band');
	if (!bg) { if (m.gs) m.gs.textContent = ''; return (m.dead = true); }
	(m.txt || []).forEach(t => {
		t = lum(rgb(t, bg));
		if (t > lum(bg)) hi = min(hi, (t + .05) / K - .05);
		else if (t < lum(bg)) lo = max(lo, K * (t + .05) - .05);
	});
	// the CSS grain: colour (inverted on a band), strength
	n = v('--kws-t1') || bg; g = +cs.getPropertyValue('--kws-ga') || 0;
	if (m.name === 'band') n = n.map(x => 1 - x);
	m.n = [...n.slice(0, 3), g]; m.lum = [lo, hi]; m.d = +(lum(bg) < .2);
	m.dead = m.name !== 'ribbon' && !safe(bg); // text too close to the ground
	c = [1, 2, 3].map(i => v('--kws-s' + i) || bg);
	if (m.name === 'band') { c[0] = bg.map(x => min(1, x * 1.3 + .01)); c[2] = bg.map(x => x * .66); }
	if (m.name === 'ribbon') {
		// dark ground: richer silk. The thread stays lighter than its ribbon
		if (m.d) c = c.map(x => x.map(y => max(0, min(1, y * 1.5 - (x[0] + x[1] + x[2]) / 6)) * .84));
		if (lum(c[1]) < lum(c[0]) + .08) c[1] = mix(c[0], [1, 1, 1], .72);
	}
	// K: moved towards white or black until text-safe; hue kept
	m.c = [...c, ...c.map(x => {
		for (let i = 0, w; i < 40 && !safe(x); i++) { w = +(min(lum(x), lum(mix(x, n, g))) < lo); x = mix(x, [w, w, w], .08); }
		return x;
	}), bg];
};

const context = () => {
	if (G || G === null) return G; // null: none worth using
	const cv = window.OffscreenCanvas && new OffscreenCanvas(2, 2);
	const gl = cv && cv.getContext('webgl', { antialias: false, depth: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
	if (!gl) return (G = null);
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
	// WebKit hands transferToImageBitmap's frame over one call late: there each layer copies its frame instead
	gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT); rgb('#000');
	px.clearRect(0, 0, 1, 1); px.drawImage(cv.transferToImageBitmap(), 0, 0);
	const lag = !px.getImageData(0, 0, 1, 1).data[0];
	cv.addEventListener('webglcontextlost', () => { // stills for now
		if (!G || G.cv !== cv) return;
		G = 0;
		mounts.forEach(m => { m.tex = 0; m.dirty = true; m.el.classList.remove('is-live'); });
		kick();
	});
	return (G = { cv, gl, lag, progs: {} });
};
const program = name => {
	const gl = G.gl;
	let p = G.progs[name];
	if (p) return p;
	p = G.progs[name] = { p: gl.createProgram() };
	[[gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'], [gl.FRAGMENT_SHADER, HEAD + FRAG[name]]].forEach(s => {
		const sh = gl.createShader(s[0]);
		gl.shaderSource(sh, s[1]); gl.compileShader(sh); gl.attachShader(p.p, sh);
	});
	gl.bindAttribLocation(p.p, 0, 'p');
	gl.linkProgram(p.p);
	p.ok = gl.getProgramParameter(p.p, gl.LINK_STATUS);
	UNI.forEach(n => p[n] = gl.getUniformLocation(p.p, n));
	return p;
};
// wash: the text mask: full 22px round each line, then a soft fall (blurred shadows)
const mask = m => {
	const gl = G.gl, N = 128, cv = make('canvas'), x = cv.getContext('2d'), e = 22 + max(m.w, m.h) / N;
	cv.width = cv.height = N;
	x.fillStyle = x.shadowColor = '#fff';
	[2 * N, 0].forEach(far => {
		const d = far ? e + 54 : e;
		x.setTransform(N / m.w, 0, 0, N / m.h, -far, 0);
		x.shadowOffsetX = far; x.shadowBlur = far && 72 * N / sqrt(m.w * m.h);
		m.rects.forEach(q => x.fillRect(q[0] - d, q[1] - d, q[2] + 2 * d, q[3] + 2 * d));
	});
	gl.bindTexture(gl.TEXTURE_2D, m.tex = m.tex || gl.createTexture());
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	m.old = false;
};
// one frame; true if drawn
const draw = m => {
	if (m.stale) colours(m);
	if (m.dead || !context() || !program(m.name).ok) { m.dead = true; m.el.classList.remove('is-live'); return; }
	const gl = G.gl, c = G.cv, w = m.cw, h = m.ch, p = program(m.name);
	// the shared canvas only grows; a layer shows one corner of it (in WebKit, a copy)
	if (c.width <= w || c.height <= h) { c.width = max(c.width, w + 1); c.height = max(c.height, h + 1); }
	if (G.lag) { if (m.cv.width !== w || m.cv.height !== h) { m.cv.width = w; m.cv.height = h; } }
	else if (m.key !== (m.key = [c.width, c.height, w, h] + '')) {
		m.cv.width = c.width; m.cv.height = c.height;
		m.cv.style.transform = `scale(${c.width / w},${c.height / h})`;
	}
	gl.useProgram(p.p);
	gl.viewport(c.width - w - 1, 0, w + 1, h + 1);
	if (m.name === 'wash') { if (m.old || !m.tex) mask(m); else gl.bindTexture(gl.TEXTURE_2D, m.tex); }
	gl.uniform2f(p.R, w, h); gl.uniform2f(p.O, c.width - w, 0); gl.uniform2fv(p.Lm, m.lum);
	gl.uniform1f(p.T, m.t); gl.uniform1f(p.Z, m.seed); gl.uniform1f(p.D, m.d); gl.uniform4fv(p.N, m.n);
	m.c.forEach((k, i) => gl.uniform3fv(p[UNI[i + 7]], k.slice(0, 3)));
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	try { G.lag ? (m.x.clearRect(0, 0, w, h), m.x.drawImage(c, c.width - w, c.height - h, w, h, 0, 0, w, h)) : m.x.transferFromImageBitmap(c.transferToImageBitmap()); } catch (e) { return; }
	m.dirty = false;
	m.el.classList.add('is-live');
	return true;
};

// one layer moves at a time: of those in view, the one most on screen (of two alike, the one nearer the middle); the
// rest hold their frame. The one moving keeps a margin, so two of a size never take turns
const pick = () => {
	const W = innerWidth, H = innerHeight;
	let best = null, ba = 0, bd = 0;
	mounts.forEach(m => {
		if (!m.vis || m.dead || !m.w) return;
		const r = m.el.getBoundingClientRect(), d = abs(r.left + r.right - W) + abs(r.top + r.bottom - H);
		const a = max(0, min(r.right, W) - max(r.left, 0)) * max(0, min(r.bottom, H) - max(r.top, 0)) * (m === lead ? 1.2 : 1);
		if (!best || a > ba * 1.02 || (a >= ba * .98 && d < bd)) { best = m; ba = a; bd = d; }
	});
	if (best !== lead) { if (lead) lead.el.classList.remove('is-seen'); if (best) best.el.classList.add('is-seen'); }
	return (lead = best);
};
const frame = now => {
	id = 0;
	const anim = !off() && !doc.hidden, dt = now - last, start = turn;
	let again, due;
	if (anim && last && dt < 30) { id = raf(frame); return; }
	if (anim && last) share = dt > 50 ? max(3e4, share * .8) : min(2.4e5, share * 1.02); // behind: draw less
	last = 0;
	credit = min(credit + share, 4.8e5);
	[...mounts].forEach(m => m.el.isConnected || unmount(m));
	pick();
	for (let i = 0, m; i < mounts.length; i++) {
		m = mounts[(start + i) % mounts.length];
		due = anim && m === lead;
		if (m.dead || !m.w || !(due || m.dirty)) continue;
		if (due) last = now;
		if (!m.dirty && now - m.at < P[m.name][3]) continue; // its own pace
		if (m.cw * m.ch > credit) { again = 1; break; }
		if (due) m.t += min(now - (m.at || now), 250) / 1000 * m.speed;
		m.at = now;
		if (draw(m)) { credit -= m.cw * m.ch; turn = start + i + 1; }
	}
	if (last || again) id = raf(frame);
};
const kick = () => { if (!id && mounts.length) id = raf(frame); };
const restyle = () => { mounts.forEach(m => { m.dead = false; measure(m); }); kick(); };

const unmount = m => {
	const i = mounts.indexOf(m);
	if (i < 0) return;
	mounts.splice(i, 1); byEl.delete(m.el);
	io.unobserve(m.el); ro.unobserve(m.el);
	m.cv.remove(); if (m.gs) m.gs.remove();
	m.el.classList.remove('is-live', 'is-seen');
	if (lead === m) lead = null;
	if (m.tex && G) G.gl.deleteTexture(m.tex);
	if (!mounts.length) { // last one out
		io.disconnect(); ro.disconnect(); mo.disconnect(); io = 0;
		dark.removeEventListener('change', restyle);
		doc.removeEventListener('visibilitychange', kick);
		cancelAnimationFrame(id); id = last = 0;
		const x = G && G.gl.getExtension('WEBGL_lose_context');
		if (x) x.loseContext();
		G = 0;
	}
};
const mount = (el, o) => {
	o = o || {};
	const name = el && el.getAttribute('data-shader') || 'wash';
	if (!el || !FRAG[name]) return none;
	if (byEl.get(el)) return byEl.get(el).end;
	if ((navigator.connection || {}).saveData || !context()) return none;
	const m = { el, o, name, cv: el.appendChild(make('canvas')), seed: 1.7 * el.getAttribute('data-tone') || 0, at: 0, speed: o.speed || 1, end: () => unmount(m) };
	m.x = m.cv.getContext(G.lag ? '2d' : 'bitmaprenderer'); m.t = 12 + m.seed * 5;
	if (name === 'band' && el.getAttribute('data-glints') !== '0') (m.gs = el.appendChild(make('span'))).className = 'kws-glints';
	if (!io) {
		io = new IntersectionObserver(es => {
			es.forEach(e => { const k = byEl.get(e.target); if (k) k.vis = e.isIntersecting; });
			kick();
		}, { rootMargin: '40px' });
		ro = new ResizeObserver(es => {
			es.forEach(e => {
				const k = byEl.get(e.target);
				if (!k) return;
				k.w = e.contentRect.width; k.h = e.contentRect.height;
				const p = P[k.name], s = min(p[0] * min(devicePixelRatio || 1, p[1]), sqrt(p[2] / (k.w * k.h || 1)));
				k.cw = max(2, round(k.w * s)); k.ch = max(2, round(k.h * s));
				measure(k);
			});
			kick();
		});
		mo = new MutationObserver(restyle);
		mo.observe(html, { attributeFilter: ['data-theme', 'data-motion'] });
		dark.addEventListener('change', restyle);
		doc.addEventListener('visibilitychange', kick);
		doc.fonts.ready.then(restyle);
	}
	mounts.push(m); byEl.set(el, m);
	io.observe(el); ro.observe(el);
	return m.end;
};
KWS.shader = { mount, refresh: restyle };

const go = () => doc.querySelectorAll('[data-kws="shader"]').forEach(el => mount(el));
const start = () => {
	doc.querySelectorAll('[data-kws="motion"]').forEach(press);
	window.requestIdleCallback ? requestIdleCallback(go, { timeout: 800 }) : setTimeout(go, 200);
};
if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})();
