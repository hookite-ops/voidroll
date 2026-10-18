'use strict';
/* ===== VOIDROLL : RENEWAL — 렌더러 (오라 · 날씨 · 오브 · 컷신) ===== */
const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const ease = k => 1 - Math.pow(1 - k, 3);

function hexRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgba(h, a) { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; }
function toHex(c) { return '#' + c.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function mix(h1, h2, t) { const a = hexRgb(h1), b = hexRgb(h2); return toHex(a.map((v, i) => v + (b[i] - v) * t)); }
function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}
const SPR = new Map();
function sprite(col) {
  let s = SPR.get(col); if (s) return s;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(.2, rgba(col, .7)); gr.addColorStop(.5, rgba(col, .2)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); SPR.set(col, c); return c;
}
function glow(ctx, col, x, y, r, a) { if (r <= 0 || a <= 0) return; const p = ctx.globalAlpha; ctx.globalAlpha = a; ctx.drawImage(sprite(col), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = p; }

/* ── 이펙트 성격별 파티클 설정 (값은 R=50px 기준) ── */
const FXC = {
  mist:     { sh: 'soft',   sp: 'ring',   rate: 5,  v: [0, -10], jit: 6,  life: [2, 3.5],   sz: [14, 26], a: .35 },
  sand:     { sh: 'dot',    sp: 'side',   rate: 16, v: [70, -4], jit: 10, life: [1.4, 2.2], sz: [1, 2.2],  a: .85, sway: 8 },
  leaf:     { sh: 'petal',  sp: 'above',  rate: 3,  v: [0, 24],  jit: 8,  life: [3, 4],     sz: [3, 5],    a: .9,  sway: 22, spin: 2 },
  firefly:  { sh: 'dot',    sp: 'ring',   rate: 3,  v: [0, -6],  jit: 14, life: [3, 5],     sz: [1.5, 2.6],a: 1,   wander: 30, blink: 1, glow: 1 },
  wind:     { sh: 'arc',    sp: 'orbit',  rate: 6,  life: [.9, 1.5],  sz: [1, 1.6], a: .65, orb: [1.1, 1.8], ov: 2.6 },
  water:    { sh: 'drop',   sp: 'ring',   rate: 7,  v: [0, -32], jit: 20, g: 95, life: [1.2, 1.8], sz: [2, 3.5], a: .9 },
  ember:    { sh: 'dot',    sp: 'below',  rate: 9,  v: [0, -40], jit: 14, life: [1.2, 2.2], sz: [1.2, 2.6], a: 1, sway: 9, glow: 1, flick: 1 },
  frost:    { sh: 'flake',  sp: 'ring',   rate: 5,  v: [0, 14],  jit: 8,  life: [2.5, 3.5], sz: [3, 6],    a: .9,  spin: 1 },
  bloom:    { sh: 'petal',  sp: 'spiral', rate: 6,  life: [2, 3],     sz: [3, 5.5], a: .9, spin: 3 },
  spark:    { sh: 'spark',  sp: 'burst',  rate: 10, spd: [60, 120], life: [.3, .6], sz: [1, 1.6], a: 1, glow: 1 },
  crystal:  { sh: 'shard',  sp: 'orbit',  rate: 3,  life: [2.5, 3.5], sz: [4, 8],   a: .95, orb: [1.15, 1.6], ov: .8, spin: 1.5 },
  shadow:   { sh: 'smoke',  sp: 'ring',   rate: 7,  v: [0, -18], jit: 8,  life: [1.5, 2.6], sz: [12, 24], a: .55, dark: 1 },
  flame:    { sh: 'soft',   sp: 'below',  rate: 16, v: [0, -62], jit: 18, life: [.6, 1.1], sz: [8, 16], a: .75, shrink: 1, glow: 1 },
  star:     { sh: 'star4',  sp: 'field',  rate: 5,  life: [1, 2],     sz: [3, 6],   a: 1, twinkle: 1, glow: 1 },
  bolt:     { sh: 'spark',  sp: 'burst',  rate: 6,  spd: [80, 160], life: [.2, .4], sz: [1, 1.6], a: 1, glow: 1 },
  blood:    { sh: 'drop',   sp: 'ring',   rate: 6,  v: [0, 10],  jit: 4,  g: 60, life: [1.5, 2.2], sz: [2, 3.5], a: .95 },
  lunar:    { sh: 'star4',  sp: 'field',  rate: 3,  life: [1.5, 2.5], sz: [2, 4],   a: .9, twinkle: 1, glow: 1 },
  eclipse:  { sh: 'soft',   sp: 'ring',   rate: 7,  v: [0, 0],   jit: 10, life: [1, 1.8],   sz: [6, 12],   a: .55, glow: 1 },
  prism:    { sh: 'shard',  sp: 'burst',  rate: 8,  spd: [30, 70], life: [1, 1.6], sz: [3, 5], a: 1, hue: 1, spin: 3, glow: 1 },
  solar:    { sh: 'soft',   sp: 'ring',   rate: 12, v: [0, -20], jit: 30, life: [.8, 1.4], sz: [6, 12],  a: .7, glow: 1, shrink: 1 },
  cosmic:   { sh: 'star4',  sp: 'spiral', rate: 8,  life: [2, 3],     sz: [2, 4],   a: 1, glow: 1 },
  angel:    { sh: 'feather',sp: 'below',  rate: 5,  v: [0, -26], jit: 16, life: [2, 3],     sz: [4, 7],    a: .9, sway: 14, spin: 1 },
  storm:    { sh: 'line',   sp: 'above',  rate: 30, v: [-40, 420], life: [.4, .6], sz: [10, 18], a: .5 },
  chrono:   { sh: 'dot',    sp: 'orbit',  rate: 6,  life: [2, 3],     sz: [1.5, 2.5], a: 1, orb: [1.3, 1.9], ov: -1.2, glow: 1 },
  abyss:    { sh: 'smoke',  sp: 'inward', rate: 10, life: [1.2, 1.8], sz: [10, 20], a: .55, dark: 1 },
  void:     { sh: 'dot',    sp: 'inward', rate: 22, life: [1, 1.5],   sz: [1, 2.2],  a: 1, glow: 1 },
  aurora:   { sh: 'soft',   sp: 'above',  rate: 5,  v: [0, 8],   jit: 4, life: [2, 3],      sz: [6, 10],   a: .5, glow: 1 },
  glitch:   { sh: 'sq',     sp: 'ring',   rate: 12, v: [0, 0],   jit: 40, life: [.15, .5],  sz: [2, 7],    a: 1, jump: 1 },
  infinity: { sh: 'star4',  sp: 'lemni',  rate: 14, life: [1.4, 2],   sz: [2, 4],   a: 1, glow: 1, hue: 1 },
  voidroll: { sh: 'dot',    sp: 'inward', rate: 30, life: [1, 1.4],   sz: [1, 2.4], a: 1, glow: 1 },
  bubble:   { sh: 'ring',   sp: 'below',  rate: 6,  v: [0, -30], jit: 10, life: [1.6, 2.6], sz: [2, 5], a: .9, sway: 16 },
  ash:      { sh: 'sq',     sp: 'above',  rate: 9,  v: [8, 20],  jit: 6,  life: [3, 4.5],  sz: [1.5, 3], a: .7, sway: 10, dark: 1 },
  ripple:   { sh: 'dot',    sp: 'field',  rate: 4,  life: [1, 1.8],    sz: [1.2, 2],  a: .8, twinkle: 1, glow: 1 },
  phoenix:  { sh: 'soft',   sp: 'below',  rate: 14, v: [0, -70], jit: 22, life: [.6, 1.1], sz: [7, 14], a: .75, shrink: 1, glow: 1 },
  venom:    { sh: 'drop',   sp: 'ring',   rate: 7,  v: [0, 6],   jit: 6,  g: 70, life: [1.2, 2], sz: [2, 3.6], a: .95 },
  rune:     { sh: 'glyph',  sp: 'orbit',  rate: 3,  life: [2.4, 3.4], sz: [5, 8],   a: 1, orb: [1.5, 2.1], ov: .6, glow: 1 },
  foxfire:  { sh: 'soft',   sp: 'ring',   rate: 8,  v: [0, -26], jit: 8,  life: [.8, 1.4], sz: [5, 9], a: .6, glow: 1, shrink: 1 },
  quasar:   { sh: 'dot',    sp: 'inward', rate: 20, life: [1, 1.5],   sz: [1, 2],   a: 1, glow: 1 },
  notes:    { sh: 'note',   sp: 'below',  rate: 3,  v: [0, -28], jit: 10, life: [2.2, 3.2], sz: [5, 8], a: .95, sway: 22, glow: 1 },
  nova:     { sh: 'spark',  sp: 'burst',  rate: 14, spd: [40, 140], life: [.4, .9], sz: [1, 2], a: 1, glow: 1 },
  tree:     { sh: 'petal',  sp: 'above',  rate: 5,  v: [4, 22],  jit: 8,  life: [3, 4.5], sz: [3, 5], a: .9, sway: 20, spin: 2 },
};
const DARK_ORB = new Set(['void', 'abyss', 'voidroll', 'eclipse']);

class AuraFX {
  constructor() { this.P = []; this.acc = 0; this.a = null; this.bolts = []; this.bacc = 0; this.slices = []; this.waves = []; this.wt = 0; }
  set(a, shiny = false) {
    if (this.a === a && this.shiny === shiny) return;
    this.a = a; this.shiny = shiny; this.nt = 0; this.ripples = []; this.P.length = 0; this.bolts.length = 0; this.slices.length = 0; this.waves.length = 0; this.acc = 0;
    if (a) { this.tier = tierOf(a.r); this.cfg = FXC[a.fx] || FXC.mist; }
  }
  mk() {
    const c = this.cfg, k = 1 / 50, an = rnd(0, TAU);
    const p = { l: 0, m: rnd(c.life[0], c.life[1]), s: rnd(c.sz[0], c.sz[1]) * k, ph: Math.random(), alt: Math.random(), rot: rnd(0, TAU), vr: (c.spin || 0) * rnd(-1, 1), x: 0, y: 0, vx: 0, vy: 0, z: 1 };
    const v = c.v || [0, 0], j = (c.jit || 0) * k;
    switch (c.sp) {
      case 'ring': { const r = rnd(.85, 1.35); p.x = Math.cos(an) * r; p.y = Math.sin(an) * r; p.vx = v[0] * k + rnd(-j, j); p.vy = v[1] * k + rnd(-j, j); break; }
      case 'below': p.x = rnd(-.8, .8); p.y = rnd(.3, .7); p.vx = rnd(-j, j); p.vy = v[1] * k * rnd(.7, 1.3); break;
      case 'above': p.x = rnd(-2.2, 2.2); p.y = rnd(-2.8, -2.2); p.vx = v[0] * k + rnd(-j, j); p.vy = v[1] * k * rnd(.8, 1.2); break;
      case 'side': p.x = -rnd(2.4, 3); p.y = rnd(-1.2, 1.4); p.vx = v[0] * k * rnd(.7, 1.3); p.vy = v[1] * k; break;
      case 'burst': { const s = rnd(c.spd[0], c.spd[1]) * k; p.x = Math.cos(an) * .9; p.y = Math.sin(an) * .9; p.vx = Math.cos(an) * s; p.vy = Math.sin(an) * s; break; }
      case 'spiral': p.a = an; p.r0 = 1; p.r1 = rnd(2, 2.8); p.av = rnd(1, 1.8); break;
      case 'orbit': p.a = an; p.r0 = rnd(c.orb[0], c.orb[1]); p.av = c.ov * rnd(.7, 1.3); p.tilt = rnd(.3, .6); break;
      case 'field': { const r = rnd(1.15, 2.7); p.x = Math.cos(an) * r; p.y = Math.sin(an) * r * .85; break; }
      case 'inward': p.a = an; p.r0 = rnd(2.6, 3.4); p.av = rnd(.8, 1.6); break;
      case 'lemni': p.a = an; p.av = rnd(.9, 1.3); p.r0 = rnd(2.1, 2.5); p.off = rnd(-.08, .08); break;
    }
    return p;
  }
  step(p, dt, t) {
    const c = this.cfg, k = p.l / p.m;
    switch (c.sp) {
      case 'spiral': { p.a += p.av * dt; const r = p.r0 + (p.r1 - p.r0) * k; p.x = Math.cos(p.a) * r; p.y = Math.sin(p.a) * r * .8; break; }
      case 'orbit': p.a += p.av * dt; p.x = Math.cos(p.a) * p.r0; p.y = Math.sin(p.a) * p.r0 * p.tilt; p.z = Math.sin(p.a); break;
      case 'inward': { p.a += p.av * dt * (1 + k * 2); const r = p.r0 * (1 - k * .82); p.x = Math.cos(p.a) * r; p.y = Math.sin(p.a) * r * .75; break; }
      case 'lemni': { p.a += p.av * dt; const s = Math.sin(p.a), cc = Math.cos(p.a), d = 1 + s * s; p.x = p.r0 * cc / d; p.y = p.r0 * s * cc / d + p.off; break; }
      default:
        p.vy += (c.g || 0) / 50 * dt;
        if (c.wander) { const w = c.wander / 50 * dt * 4; p.vx = (p.vx + rnd(-w, w)) * .985; p.vy = (p.vy + rnd(-w, w)) * .985; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (c.sway) p.x += Math.sin(t * 2.2 + p.ph * TAU) * c.sway / 50 * dt;
        if (c.jump && Math.random() < dt * 6) p.x += rnd(-.3, .3);
    }
    p.rot += p.vr * dt;
  }
  update(dt, t, q = 1) {
    if (!this.a) return;
    const c = this.cfg, tier = this.tier, fx = this.a.fx;
    this.acc += dt * c.rate * (1 + tier * .35) * q;
    while (this.acc >= 1) { this.acc--; if (this.P.length < 320) this.P.push(this.mk()); }
    for (let i = this.P.length - 1; i >= 0; i--) { const p = this.P[i]; p.l += dt; if (p.l >= p.m) { this.P.splice(i, 1); continue; } this.step(p, dt, t); }
    // 번개
    const br = fx === 'bolt' ? 2.5 + tier * .5 : fx === 'storm' ? 2 : fx === 'spark' ? 1.2 : fx === 'voidroll' ? 1 : 0;
    if (br) { this.bacc += dt * br; while (this.bacc >= 1) { this.bacc--; this.bolts.push(this.mkBolt(fx === 'spark' ? .55 : 1.2 + tier * .12)); } }
    for (let i = this.bolts.length - 1; i >= 0; i--) { const b = this.bolts[i]; b.l += dt; if (b.l > b.m) this.bolts.splice(i, 1); }
    // 글리치 조각
    if (fx === 'glitch' || fx === 'voidroll') {
      if (Math.random() < dt * (6 + tier)) this.slices.push({ y: rnd(-1.6, 1.6), h: rnd(.04, .22), dx: rnd(-.5, .5), w: rnd(.6, 2.4), l: 0, m: rnd(.05, .18), c: Math.random() < .5 ? 0 : 1 });
      for (let i = this.slices.length - 1; i >= 0; i--) { const s = this.slices[i]; s.l += dt; if (s.l > s.m) this.slices.splice(i, 1); }
    }
    if (fx === 'nova') { this.nt += dt; if (this.nt > 2.2) { this.nt = 0; this.waves.push({ l: 0, big: 1 }); for (let i = 0; i < 40; i++) { const p = this.mk(); const s2 = rnd(1.5, 4); p.vx *= s2; p.vy *= s2; p.m *= 1.3; this.P.push(p); } } }
    if (fx === 'ripple') { this.nt += dt; if (this.nt > .55) { this.nt = 0; this.ripples.push({ l: 0 }); } }
    for (let i = this.ripples.length - 1; i >= 0; i--) { this.ripples[i].l += dt; if (this.ripples[i].l > 2.2) this.ripples.splice(i, 1); }
    // 충격파
    if (tier >= 5) { this.wt += dt; if (this.wt > 2.6 - (tier - 5) * .3) { this.wt = 0; this.waves.push({ l: 0 }); } }
    for (let i = this.waves.length - 1; i >= 0; i--) { this.waves[i].l += dt; if (this.waves[i].l > 1.4) this.waves.splice(i, 1); }
  }
  mkBolt(len) {
    const a = rnd(0, TAU), pts = [[Math.cos(a) * .95, Math.sin(a) * .95]], n = 7;
    for (let i = 1; i <= n; i++) { const r = .95 + len * i / n, aa = a + rnd(-.38, .38); pts.push([Math.cos(aa) * r, Math.sin(aa) * r]); }
    return { pts, l: 0, m: rnd(.07, .17) };
  }
  pc(p, t) {
    const a = this.a, c = this.cfg;
    if (c.hue || (this.tier >= 8 && p.alt > .7)) return hsl(Math.round(((t * 70 + p.ph * 360) % 360) / 15) * 15, 1, .7);
    if (c.dark) return p.alt < .6 ? a.c2 : mix(a.c, a.c2, .4);
    if (this.tier < 1) return a.c;
    return p.alt < .62 ? a.c : p.alt < .88 ? a.c2 : '#ffffff';
  }
  drawP(ctx, p, cx, cy, R, t) {
    const c = this.cfg, k = p.l / p.m;
    let al = c.a * Math.min(1, p.l / .15) * (1 - k * k);
    if (c.twinkle) al *= .5 + .5 * Math.sin(t * 6 + p.ph * TAU);
    if (c.blink) al *= Math.max(0, Math.sin(t * 2.5 + p.ph * TAU));
    if (c.flick) al *= .7 + .3 * Math.random();
    if (c.sp === 'orbit' && p.z < 0) al *= .45;
    if (al <= .01) return;
    const x = cx + p.x * R, y = cy + p.y * R, s = p.s * R * (c.shrink ? 1 - k * .7 : 1), col = this.pc(p, t);
    ctx.globalAlpha = al;
    switch (c.sh) {
      case 'soft': case 'smoke': ctx.drawImage(sprite(col), x - s, y - s, s * 2, s * 2); break;
      case 'dot': case 'drop':
        if (c.glow || c.sh === 'drop') { ctx.globalAlpha = al * .55; ctx.drawImage(sprite(col), x - s * 4, y - s * 4, s * 8, s * 8); ctx.globalAlpha = al; }
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
        if (c.sh === 'drop') { ctx.beginPath(); ctx.moveTo(x - s * .8, y); ctx.lineTo(x, y - s * 2.6 * Math.sign(p.vy || 1)); ctx.lineTo(x + s * .8, y); ctx.fill(); }
        break;
      case 'spark': case 'line': {
        const vl = Math.hypot(p.vx, p.vy) || 1, L = c.sh === 'line' ? s : s * 7;
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, c.sh === 'line' ? R * .025 : s);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - p.vx / vl * L, y - p.vy / vl * L); ctx.stroke(); break;
      }
      case 'petal': ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, s, s * .48, 0, 0, TAU); ctx.fill(); ctx.restore(); break;
      case 'feather':
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, s * .34, s, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = Math.max(.6, s * .08); ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s * 1.2); ctx.stroke(); ctx.restore(); break;
      case 'flake':
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); ctx.strokeStyle = col; ctx.lineWidth = Math.max(.8, s * .17); ctx.beginPath();
        for (let i = 0; i < 3; i++) { const an = i * Math.PI / 3; ctx.moveTo(Math.cos(an) * s, Math.sin(an) * s); ctx.lineTo(-Math.cos(an) * s, -Math.sin(an) * s); }
        ctx.stroke(); ctx.restore(); break;
      case 'shard':
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * .42, 0); ctx.lineTo(0, s); ctx.lineTo(-s * .42, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * .42, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.restore(); break;
      case 'star4':
        ctx.globalAlpha = al * .5; ctx.drawImage(sprite(col), x - s * 3, y - s * 3, s * 6, s * 6); ctx.globalAlpha = al;
        ctx.fillStyle = col; ctx.beginPath();
        for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4 + p.rot * .2, r = i % 2 ? s * .25 : s * 1.3; ctx.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); }
        ctx.closePath(); ctx.fill(); break;
      case 'ring': ctx.strokeStyle = col; ctx.lineWidth = Math.max(.8, s * .18); ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(x - s * .35, y - s * .35, s * .22, 0, TAU); ctx.fill(); break;
      case 'note':
        ctx.globalAlpha = al * .4; ctx.drawImage(sprite(col), x - s * 2.5, y - s * 2.5, s * 5, s * 5); ctx.globalAlpha = al;
        ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, s * .16);
        ctx.beginPath(); ctx.ellipse(x, y, s * .42, s * .3, -.4, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + s * .38, y); ctx.lineTo(x + s * .38, y - s * 1.3); ctx.quadraticCurveTo(x + s * .9, y - s * 1.0, x + s * .8, y - s * .55); ctx.stroke(); break;
      case 'glyph': {
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot * .3); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, s * .16); ctx.lineCap = 'round';
        ctx.globalAlpha = al * .5; ctx.drawImage(sprite(col), -s * 2, -s * 2, s * 4, s * 4); ctx.globalAlpha = al;
        const g = Math.floor(p.ph * 6); ctx.beginPath();
        if (g === 0) { ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.moveTo(0, -s * .3); ctx.lineTo(s * .6, -s); }
        else if (g === 1) { ctx.moveTo(-s * .5, s); ctx.lineTo(0, -s); ctx.lineTo(s * .5, s); ctx.moveTo(-s * .3, 0); ctx.lineTo(s * .3, 0); }
        else if (g === 2) { ctx.moveTo(-s * .5, -s); ctx.lineTo(s * .5, 0); ctx.lineTo(-s * .5, s); }
        else if (g === 3) { ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.moveTo(-s * .5, -s * .5); ctx.lineTo(s * .5, s * .2); ctx.moveTo(s * .5, -s * .5); ctx.lineTo(-s * .5, s * .2); }
        else if (g === 4) { ctx.arc(0, 0, s * .6, 0, TAU); ctx.moveTo(0, -s); ctx.lineTo(0, s); }
        else { ctx.moveTo(-s * .5, -s); ctx.lineTo(s * .5, -s); ctx.lineTo(-s * .5, s); ctx.lineTo(s * .5, s); }
        ctx.stroke(); ctx.restore(); ctx.lineCap = 'butt'; break;
      }
      case 'sq': ctx.fillStyle = col; ctx.fillRect(x - s / 2, y - s * .3, s * (1 + p.ph * 2.5), s * .6); break;
      case 'arc':
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, p.s * R * 1.3); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.ellipse(cx, cy, p.r0 * R, p.r0 * R * p.tilt, 0, p.a - .55, p.a); ctx.stroke(); ctx.lineCap = 'butt'; break;
    }
  }
  /* 오브 뒤쪽 레이어 */
  drawBack(ctx, cx, cy, R, t) {
    const a = this.a; if (!a) return;
    const tier = this.tier, c = a.c, c2 = a.c2, fx = a.fx, pulse = .85 + .15 * Math.sin(t * 2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (tier >= 7) { // 빛기둥
      const w = R * (1.1 + .2 * Math.sin(t * 3)), g = ctx.createLinearGradient(cx - w, 0, cx + w, 0);
      g.addColorStop(0, rgba(c, 0)); g.addColorStop(.5, rgba(c, .3)); g.addColorStop(1, rgba(c, 0));
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(cx - w, cy - R * 14, w * 2, R * 15.4);
    }
    glow(ctx, c, cx, cy, R * (2 + tier * .32) * pulse, .26 + tier * .04);
    if (tier >= 2) glow(ctx, c2, cx, cy, R * (1.5 + tier * .15), .16);
    if (tier >= 4) { // 광선
      const n = 6 + tier * 2, L = R * (2.6 + tier * .35), g = ctx.createRadialGradient(cx, cy, R * .5, cx, cy, L);
      g.addColorStop(0, rgba(c, .7)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.globalAlpha = .12 + tier * .012;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const an = t * .15 * (i % 2 ? 1 : -1) + i * TAU / n, w = .05 + .035 * Math.sin(t * 2 + i);
        ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(an - w) * L, cy + Math.sin(an - w) * L); ctx.lineTo(cx + Math.cos(an + w) * L, cy + Math.sin(an + w) * L); ctx.closePath();
      }
      ctx.fill();
    }
    this.special(ctx, cx, cy, R, t, 0);
    if (tier >= 6) this.sigil(ctx, cx, cy + R * 1.5, R, t);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter';
    if (tier >= 1) { ctx.globalAlpha = .3 + .1 * Math.sin(t * 3); ctx.strokeStyle = c; ctx.lineWidth = Math.max(1, R * .03); ctx.beginPath(); ctx.arc(cx, cy, R * 1.22, 0, TAU); ctx.stroke(); }
    if (tier >= 3) {
      const n = Math.min(3, tier - 2);
      for (let i = 0; i < n; i++) {
        const rr = R * (1.5 + i * .32); ctx.globalAlpha = .28; ctx.strokeStyle = i % 2 ? c2 : c; ctx.lineWidth = Math.max(1, R * .022);
        if (fx === 'chrono' || fx === 'glitch') ctx.setLineDash([R * .12, R * .08]);
        ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * .3, t * .4 * (i % 2 ? 1 : -1) + i, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    for (const p of this.P) if (p.z < 0) { ctx.globalCompositeOperation = this.cfg.dark ? 'source-over' : 'lighter'; this.drawP(ctx, p, cx, cy, R, t); }
    ctx.restore();
  }
  /* 오브 앞쪽 레이어 */
  drawFront(ctx, cx, cy, R, t) {
    const a = this.a; if (!a) return;
    const tier = this.tier, c = a.c, c2 = a.c2, fx = a.fx;
    ctx.save();
    this.special(ctx, cx, cy, R, t, 1);
    ctx.globalCompositeOperation = this.cfg.dark ? 'source-over' : 'lighter';
    for (const p of this.P) if (p.z >= 0) this.drawP(ctx, p, cx, cy, R, t);
    ctx.globalCompositeOperation = 'lighter';
    if ((fx === 'star' || fx === 'lunar') && tier >= 2) { // 별자리 선
      ctx.strokeStyle = c; ctx.lineWidth = Math.max(.6, R * .012);
      for (let i = 1; i < this.P.length; i++) {
        const p = this.P[i], q = this.P[i - 1], d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 1.1) { ctx.globalAlpha = .25 * (1 - d / 1.1); ctx.beginPath(); ctx.moveTo(cx + p.x * R, cy + p.y * R); ctx.lineTo(cx + q.x * R, cy + q.y * R); ctx.stroke(); }
      }
    }
    if (tier >= 3) { // 위성
      const n = Math.min(7, tier - 1);
      for (let i = 0; i < n; i++) {
        const sp = .9 + (i % 3) * .3, rr = R * (1.55 + (i % 2) * .4), tl = .35 + (i % 3) * .1;
        for (let k = 5; k >= 0; k--) {
          const an = (t - k * .035) * sp + i * TAU / n, x = cx + Math.cos(an) * rr, y = cy + Math.sin(an) * rr * tl, z = Math.sin(an);
          const col = tier >= 8 ? hsl(t * 80 + i * 50, 1, .7) : (i % 2 ? c2 : c);
          glow(ctx, col, x, y, R * (k ? .1 : .2) * (z < 0 ? .7 : 1), (k ? .25 * (1 - k / 6) : .9) * (z < 0 ? .5 : 1));
        }
      }
    }
    for (const b of this.bolts) { // 번개
      const al = 1 - b.l / b.m;
      ctx.beginPath(); b.pts.forEach(([x, y], i) => i ? ctx.lineTo(cx + x * R, cy + y * R) : ctx.moveTo(cx + x * R, cy + y * R));
      ctx.globalAlpha = al * .5; ctx.strokeStyle = c; ctx.lineWidth = R * .09; ctx.stroke();
      ctx.globalAlpha = al; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, R * .025); ctx.stroke();
    }
    if (tier >= 6 || fx === 'angel') { // 헤일로
      const hy = cy - R * (this.hero ? 2.05 : 1.42) + Math.sin(t * 2) * R * .05;
      ctx.globalAlpha = .9; ctx.strokeStyle = fx === 'angel' ? '#fff6c8' : c2; ctx.lineWidth = R * .07;
      ctx.beginPath(); ctx.ellipse(cx, hy, R * .62, R * .16, 0, 0, TAU); ctx.stroke();
      glow(ctx, fx === 'angel' ? '#ffe58a' : c, cx, hy, R * .9, .35);
    }
    for (const r of this.ripples || []) { const k = r.l / 2.2; ctx.globalAlpha = (1 - k) * .7; ctx.strokeStyle = c; ctx.lineWidth = Math.max(1, R * .04 * (1 - k)); ctx.beginPath(); ctx.ellipse(cx, cy + R * .3, R * (1 + k * 2.4), R * (1 + k * 2.4) * .35, 0, 0, TAU); ctx.stroke(); }
    if (this.shiny) { // 빛나는 변이
      for (let i = 0; i < 10; i++) { const an = t * .9 + i * TAU / 10, rr = R * (1.35 + .15 * Math.sin(t * 3 + i)), x = cx + Math.cos(an) * rr, y = cy + Math.sin(an) * rr, s2 = R * (.08 + .06 * Math.sin(t * 5 + i * 2)), col = hsl(t * 90 + i * 36, 1, .75);
        glow(ctx, col, x, y, s2 * 4, .8); ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.beginPath(); for (let j = 0; j < 8; j++) { const a2 = j * Math.PI / 4, r2 = j % 2 ? s2 * .3 : s2 * 1.4; ctx.lineTo(x + Math.cos(a2) * r2, y + Math.sin(a2) * r2); } ctx.closePath(); ctx.fill(); }
      ctx.globalAlpha = .5; ctx.lineWidth = R * .045; ctx.strokeStyle = hsl(t * 120, 1, .7); ctx.beginPath(); ctx.arc(cx, cy, R * 1.08, 0, TAU); ctx.stroke();
    }
    for (const w of this.waves) { // 충격파
      const k = w.l / 1.4; ctx.globalAlpha = (1 - k) * (w.big ? .9 : .55); ctx.strokeStyle = c; ctx.lineWidth = R * .05 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(cx, cy, R * (1.1 + ease(k) * (w.big ? 4 : 2.6)), 0, TAU); ctx.stroke(); if (w.big && k < .3) glow(ctx, '#ffffff', cx, cy, R * 3 * (1 - k), (.3 - k) * 2);
    }
    if (tier >= 8) { // 초월 무지개 막
      ctx.globalAlpha = .18 + .08 * Math.sin(t * 3); ctx.lineWidth = R * .04;
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = hsl(t * 60 + i * 120, 1, .7); ctx.beginPath(); ctx.arc(cx, cy, R * (1.3 + ((t * .4 + i / 3) % 1) * 2), 0, TAU); ctx.stroke(); }
    }
    for (const s of this.slices) { // 글리치 조각
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .85; ctx.fillStyle = s.c ? c2 : c;
      ctx.fillRect(cx + (s.dx - s.w / 2) * R, cy + s.y * R, s.w * R, s.h * R);
    }
    ctx.restore();
  }
  sigil(ctx, cx, cy, R, t) {
    const c = this.a.c;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, .3); ctx.rotate(t * .3);
    ctx.globalAlpha = .55; ctx.strokeStyle = c; ctx.lineWidth = R * .05;
    ctx.beginPath(); ctx.arc(0, 0, R * 2.1, 0, TAU); ctx.stroke();
    ctx.lineWidth = R * .03; ctx.beginPath(); ctx.arc(0, 0, R * 1.75, 0, TAU); ctx.stroke();
    ctx.fillStyle = c;
    for (let i = 0; i < 16; i++) { ctx.save(); ctx.rotate(i * TAU / 16); ctx.fillRect(-R * .05, -R * 2.02, R * .1, R * (i % 2 ? .18 : .1)); ctx.restore(); }
    ctx.beginPath(); for (let i = 0; i <= 6; i++) { const an = i * TAU / 6 * 2; ctx.lineTo(Math.cos(an) * R * 1.75, Math.sin(an) * R * 1.75); } ctx.stroke();
    ctx.restore();
  }
  special(ctx, cx, cy, R, t, front) {
    const a = this.a, fx = a.fx, c = a.c, c2 = a.c2, tier = this.tier;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1;
    if (!front) {
      if (fx === 'lunar') {
        const mx = cx + R * 1.25, my = cy - R * 1.35, mr = R * .75;
        glow(ctx, c, mx, my, mr * 2.4, .4);
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.beginPath(); ctx.rect(cx - R * 10, cy - R * 10, R * 20, R * 20); ctx.arc(mx + mr * .45, my - mr * .2, mr * .85, 0, TAU, true); ctx.clip();
        ctx.globalAlpha = .95; ctx.fillStyle = mix(c, '#ffffff', .4); ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill(); ctx.restore();
      } else if (fx === 'solar') {
        const g = ctx.createRadialGradient(cx, cy, R * .8, cx, cy, R * 2.2); g.addColorStop(0, rgba(c, .8)); g.addColorStop(1, rgba(c2, 0));
        ctx.fillStyle = g; ctx.globalAlpha = .7; ctx.beginPath();
        for (let i = 0; i <= 72; i++) { const an = i / 72 * TAU, r = R * (1.35 + .28 * Math.sin(an * 9 + t * 3) + .14 * Math.sin(an * 5 - t * 2)); ctx.lineTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r); }
        ctx.fill();
      } else if (fx === 'aurora') {
        for (let b = 0; b < 3; b++) {
          const col = b % 2 ? c2 : c, by = cy - R * (1.5 + b * .38), hh = R * (1.1 + b * .15), sp = t * (.8 + b * .25) + b * 2;
          const g = ctx.createLinearGradient(0, by - R * .32, 0, by + hh + R * .3);
          g.addColorStop(0, rgba(col, 0)); g.addColorStop(.32, rgba(col, .36)); g.addColorStop(.6, rgba(col, .12)); g.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = g; ctx.globalAlpha = .75; ctx.beginPath();
          const xs = []; for (let x = -3.2; x <= 3.21; x += .2) xs.push(x);
          xs.forEach((x, i) => { const y = by + Math.sin(x * 1.4 + sp) * R * .32; i ? ctx.lineTo(cx + x * R, y) : ctx.moveTo(cx + x * R, y); });
          for (let i = xs.length - 1; i >= 0; i--) { const x = xs[i], tp = Math.max(0, 1 - Math.pow(x / 3.2, 2)); ctx.lineTo(cx + x * R, by + Math.sin(x * 1.4 + sp) * R * .32 + hh * tp); }
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = rgba(mix(col, '#ffffff', .4), .5); ctx.lineWidth = Math.max(1, R * .025); ctx.globalAlpha = .35;
          ctx.beginPath();
          for (let x = -3; x <= 3; x += .23) { const y = by + Math.sin(x * 1.4 + sp) * R * .32, L = hh * (.4 + .4 * Math.sin(x * 7 + t * 3 + b)) * Math.max(0, 1 - Math.pow(x / 3.2, 2)); ctx.moveTo(cx + x * R, y); ctx.lineTo(cx + x * R, y + L); }
          ctx.stroke();
        }
      } else if (fx === 'cosmic') {
        for (let i = 0; i < 3; i++) { const an = t * .2 + i * TAU / 3; glow(ctx, [c, c2, mix(c, c2, .5)][i], cx + Math.cos(an) * R * .9, cy + Math.sin(an) * R * .6, R * (1.7 + tier * .1), .22); }
      } else if (fx === 'void' || fx === 'abyss' || fx === 'voidroll') {
        this.disk(ctx, cx, cy, R, t, Math.PI, TAU);
      } else if (fx === 'chrono') {
        ctx.strokeStyle = c; ctx.lineWidth = Math.max(1, R * .025); ctx.globalAlpha = .55;
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.85, 0, TAU); ctx.stroke();
        for (let i = 0; i < 12; i++) { const an = i / 12 * TAU + t * .1, r1 = R * (i % 3 ? 1.72 : 1.6); ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); ctx.lineTo(cx + Math.cos(an) * R * 1.85, cy + Math.sin(an) * R * 1.85); ctx.stroke(); }
        ctx.lineWidth = R * .06; ctx.globalAlpha = .7;
        [[t * 1.2, 1.5], [t * .1, 1.15]].forEach(([an, l]) => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(an - Math.PI / 2) * R * l, cy + Math.sin(an - Math.PI / 2) * R * l); ctx.stroke(); });
      } else if (fx === 'angel') {
        const flap = Math.sin(t * 2.2) * .18;
        for (const sd of [-1, 1]) for (let i = 0; i < 7; i++) {
          const an = (-.9 + i * .26 + flap) * sd, len = R * (1.4 + i * .12);
          const x = cx + sd * R * .7, y = cy - R * .1;
          ctx.save(); ctx.translate(x, y); ctx.rotate(sd > 0 ? an : Math.PI + an * 1);
          ctx.globalAlpha = .28 + i * .03; ctx.fillStyle = i % 2 ? c : c2;
          ctx.beginPath(); ctx.ellipse(len * .55, 0, len * .55, R * .14, 0, 0, TAU); ctx.fill(); ctx.restore();
        }
      } else if (fx === 'crystal' && tier >= 2) {
        ctx.strokeStyle = c; ctx.lineWidth = Math.max(1, R * .03); ctx.globalAlpha = .35;
        ctx.beginPath(); for (let i = 0; i <= 6; i++) { const an = i / 6 * TAU + t * .25; ctx.lineTo(cx + Math.cos(an) * R * 1.9, cy + Math.sin(an) * R * 1.9); } ctx.stroke();
      } else if (fx === 'water' && tier >= 1) {
        ctx.strokeStyle = c; ctx.lineWidth = Math.max(1, R * .04); ctx.globalAlpha = .45;
        ctx.beginPath(); for (let i = 0; i <= 80; i++) { const an = i / 80 * TAU, r = R * (1.5 + .1 * Math.sin(an * 8 + t * 4)); ctx.lineTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r * .45 + R * .2); } ctx.stroke();
      } else if (fx === 'frost' && tier >= 2) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * .15); ctx.strokeStyle = c; ctx.lineWidth = Math.max(1, R * .05); ctx.globalAlpha = .3;
        for (let i = 0; i < 6; i++) { ctx.rotate(TAU / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -R * 2.1); ctx.moveTo(0, -R * 1.3); ctx.lineTo(R * .35, -R * 1.65); ctx.moveTo(0, -R * 1.3); ctx.lineTo(-R * .35, -R * 1.65); ctx.stroke(); }
        ctx.restore();
      } else if (fx === 'prism') {
        if (ctx.createConicGradient) {
          const g = ctx.createConicGradient(t * .8, cx, cy); for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, hsl(i * 60, 1, .65));
          ctx.strokeStyle = g; ctx.lineWidth = R * .1; ctx.globalAlpha = .6; ctx.beginPath(); ctx.arc(cx, cy, R * 1.4, 0, TAU); ctx.stroke();
        }
      } else if (fx === 'infinity') {
        ctx.strokeStyle = hsl(t * 50, 1, .75); ctx.lineWidth = R * .05; ctx.globalAlpha = .5; ctx.beginPath();
        for (let i = 0; i <= 120; i++) { const a2 = i / 120 * TAU, s = Math.sin(a2), cc = Math.cos(a2), d = 1 + s * s; ctx.lineTo(cx + R * 2.3 * cc / d, cy + R * 2.3 * s * cc / d); }
        ctx.stroke();
      } else if (fx === 'phoenix') {
        const flap = Math.sin(t * 3) * .25;
        for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) {
          const an = (-.7 + i * .24 + flap) * sd, len = R * (1.5 + i * .16);
          ctx.save(); ctx.translate(cx + sd * R * .6, cy); ctx.rotate(sd > 0 ? an : Math.PI + an);
          const g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, rgba(c2, .7)); g.addColorStop(1, rgba(c, 0));
          ctx.globalAlpha = .7; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -R * .1); ctx.quadraticCurveTo(len * .6, -R * .35, len, 0); ctx.quadraticCurveTo(len * .6, R * .1, 0, R * .1); ctx.fill(); ctx.restore();
        }
      } else if (fx === 'venom') {
        glow(ctx, c, cx, cy + R * .8, R * 2.2, .3);
        for (let i = 0; i < 5; i++) { const x = cx + Math.sin(i * 2.3 + t * .7) * R * 1.2, y = cy + R * (1.2 - ((t * .4 + i * .2) % 1) * 2.4); ctx.strokeStyle = c; ctx.lineWidth = R * .03; ctx.globalAlpha = .5; ctx.beginPath(); ctx.arc(x, y, R * (.08 + i % 3 * .04), 0, TAU); ctx.stroke(); }
      } else if (fx === 'rune') {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(-t * .25); ctx.strokeStyle = c; ctx.lineWidth = Math.max(1, R * .03); ctx.globalAlpha = .55;
        ctx.beginPath(); ctx.arc(0, 0, R * 1.35, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, R * 1.6, 0, TAU); ctx.stroke();
        for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); ctx.beginPath(); ctx.moveTo(R * 1.35, 0); ctx.lineTo(0, R * 1.35); ctx.stroke(); }
        ctx.restore();
      } else if (fx === 'quasar') {
        this.disk(ctx, cx, cy, R, t, Math.PI, TAU);
        for (const sd of [-1, 1]) { const L = R * (4 + Math.sin(t * 6) * .3), g = ctx.createLinearGradient(cx, cy, cx + sd * L * .25, cy + sd * -L); g.addColorStop(0, rgba(c, .9)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.globalAlpha = .8;
          ctx.beginPath(); ctx.moveTo(cx - R * .18, cy); ctx.lineTo(cx + sd * L * .25 - R * .05, cy - sd * L); ctx.lineTo(cx + sd * L * .25 + R * .05, cy - sd * L); ctx.lineTo(cx + R * .18, cy); ctx.fill(); }
      } else if (fx === 'tree') {
        ctx.strokeStyle = c2; ctx.lineCap = 'round';
        const br = (x, y, an, len, d) => { if (d > 5) return; const x2 = x + Math.cos(an) * len, y2 = y + Math.sin(an) * len; ctx.globalAlpha = .55 - d * .06; ctx.lineWidth = R * (.09 - d * .013); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); const sw = Math.sin(t * 1.3 + d) * .08; br(x2, y2, an - .45 + sw, len * .72, d + 1); br(x2, y2, an + .45 + sw, len * .72, d + 1); };
        br(cx, cy - R * .8, -Math.PI / 2, R * .9, 0); ctx.strokeStyle = c; br(cx, cy + R * .8, Math.PI / 2, R * .6, 2);
        ctx.lineCap = 'butt';
      } else if (fx === 'eclipse' && this.hero) {
        const ex = cx, ey = cy - R * 1.15; glow(ctx, c, ex, ey, R * 2.4, .45);
        ctx.strokeStyle = c; ctx.lineWidth = R * .08; ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(ex, ey, R * 1.15, 0, TAU); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .95; ctx.fillStyle = '#05010a'; ctx.beginPath(); ctx.arc(ex, ey, R * 1.1, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'lighter';
        glow(ctx, '#ffffff', ex + Math.cos(t * .7) * R * 1.12, ey + Math.sin(t * .7) * R * 1.12, R * .5, .8);
      } else if (fx === 'blood') {
        glow(ctx, '#ff0022', cx, cy + R * .3, R * 2.4, .25);
      }
    } else {
      if ((fx === 'void' || fx === 'abyss' || fx === 'voidroll') && this.hero) {
        this.disk(ctx, cx, cy, R, t, 0, Math.PI);
      } else if (fx === 'void' || fx === 'abyss' || fx === 'voidroll') {
        this.disk(ctx, cx, cy, R, t, 0, Math.PI);
        ctx.globalAlpha = .8; ctx.strokeStyle = fx === 'voidroll' ? hsl(t * 90, 1, .7) : c; ctx.lineWidth = R * .05;
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.03, 0, TAU); ctx.stroke();
      } else if (fx === 'quasar') {
        this.disk(ctx, cx, cy, R, t, 0, Math.PI);
      } else if (fx === 'foxfire') {
        for (let i = 0; i < 9; i++) {
          for (let k = 6; k >= 0; k--) { const an = (t - k * .05) * 1.1 + i * TAU / 9, x = cx + Math.cos(an) * R * 1.7, y = cy + Math.sin(an) * R * .7 - Math.sin(t * 3 + i) * R * .15; glow(ctx, i % 3 ? c : c2, x, y - k * R * .03, R * (.28 - k * .03), k ? .2 : .9); }
        }
      } else if (fx === 'eclipse' && !this.hero) {
        const ox = Math.sin(t * .5) * R * .06;
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .93; ctx.fillStyle = '#05010a';
        ctx.beginPath(); ctx.arc(cx + ox, cy, R * .98, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .9; ctx.strokeStyle = c; ctx.lineWidth = R * .05; ctx.beginPath(); ctx.arc(cx + ox, cy, R * 1.0, 0, TAU); ctx.stroke();
        glow(ctx, '#ffffff', cx + ox + Math.cos(t * .7) * R, cy + Math.sin(t * .7) * R, R * .5, .8);
      }
    }
  }
  disk(ctx, cx, cy, R, t, a0, a1) {
    const a = this.a, c = a.fx === 'abyss' ? a.c : a.c, n = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const rr = R * (1.35 + i * .2), col = a.fx === 'voidroll' ? hsl(t * 60 + i * 40, 1, .65) : (i % 2 ? mix(c, '#ffffff', .3) : c);
      ctx.strokeStyle = col; ctx.globalAlpha = (a0 ? .3 : .6) * (1 - i / n); ctx.lineWidth = R * (.12 - i * .015);
      ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * .22, -.18, a0 + t * .0, a1); ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }
}

/* ── 오브 ── */
function drawOrb(ctx, cx, cy, R, a, t, spin = 0) {
  const dark = a && DARK_ORB.has(a.fx), c = a ? a.c : '#a5abc0', c2 = a ? a.c2 : '#2a2e44';
  ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  const g = ctx.createRadialGradient(cx - R * .35, cy - R * .4, R * .05, cx, cy, R);
  if (dark) { g.addColorStop(0, mix(c, '#000000', .55)); g.addColorStop(.45, '#06030f'); g.addColorStop(1, '#000000'); }
  else { g.addColorStop(0, '#ffffff'); g.addColorStop(.22, mix(c, '#ffffff', .35)); g.addColorStop(.68, mix(c, c2, .5)); g.addColorStop(1, mix(c2, '#000000', .45)); }
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R * .97, 0, TAU); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
  const sp = t * (.6 + spin * 6);
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = rgba(i === 1 ? c2 : c, dark ? .5 : .3); ctx.lineWidth = R * .14;
    ctx.beginPath(); ctx.ellipse(cx, cy, R * (.5 + i * .18), R * (.2 + i * .1), sp + i * 2.1, 0, Math.PI * 1.2); ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = rgba(c, dark ? .95 : .7); ctx.lineWidth = Math.max(1, R * .04); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(cx - R * .36, cy - R * .46, R * .26, R * .14, -.55, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(cx + R * .3, cy + R * .52, R * .3, R * .08, -.4, 0, TAU); ctx.fill();
  ctx.restore();
}

/* ── 제단 ── */
function drawAltar(ctx, cx, y, R, a, t) {
  const c = a ? a.c : '#8c7cff';
  ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  glow(ctx, '#000000', cx, y + R * .9, R * 2.2, .5);
  let g = ctx.createLinearGradient(0, y, 0, y + R * .9);
  g.addColorStop(0, '#3a3270'); g.addColorStop(1, '#120e2c'); ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(cx - R * 1.1, y); ctx.lineTo(cx + R * 1.1, y); ctx.lineTo(cx + R * .8, y + R * .85); ctx.lineTo(cx - R * .8, y + R * .85); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0c0920'; ctx.beginPath(); ctx.ellipse(cx, y + R * .85, R * .8, R * .16, 0, 0, TAU); ctx.fill();
  g = ctx.createLinearGradient(0, y - R * .3, 0, y + R * .3); g.addColorStop(0, '#5a4ea6'); g.addColorStop(1, '#2a2360');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, y, R * 1.3, R * .32, 0, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(c, .55 + .2 * Math.sin(t * 2)); ctx.lineWidth = Math.max(1, R * .035);
  ctx.beginPath(); ctx.ellipse(cx, y, R * 1.05, R * .24, 0, 0, TAU); ctx.stroke();
  ctx.fillStyle = rgba(c, .7);
  for (let i = 0; i < 12; i++) { const an = i / 12 * TAU + t * .2, x = cx + Math.cos(an) * R * 1.05, yy = y + Math.sin(an) * R * .24; ctx.globalAlpha = Math.sin(an) > 0 ? 1 : .4; ctx.fillRect(x - R * .025, yy - R * .025, R * .05, R * .05); }
  glow(ctx, c, cx, y, R * 1.2, .3);
  ctx.restore();
}

/* ── 날씨 배경 ── */
class BiomeFX {
  constructor() {
    this.P = []; this.cur = 'normal'; this.prev = null; this.mix = 1; this.acc = 0; this.flash = 0; this.glit = [];
    this.stars = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random() * .75, s: rnd(.4, 1.6), ph: Math.random() * TAU }));
    this.nk = 0; this.clouds = Array.from({ length: 6 }, (_, i) => ({ x: Math.random(), y: rnd(.08, .4), s: rnd(.5, 1.2), v: rnd(.004, .012) * (i % 2 ? 1 : .6) }));
    this.hills = Array.from({ length: 3 }, (_, i) => Array.from({ length: 5 }, () => [rnd(.002, .012), rnd(0, TAU), rnd(8, 30) * (1 + i * .3)]));
  }
  set(b) { if (b === this.cur) return; this.prev = this.cur; this.cur = b; this.mix = 0; for (const p of this.P) if (p.k !== 'mote') p.m = Math.min(p.m, p.l + rnd(.3, 1.5)); }
  update(dt, w, h, t) {
    this.mix = Math.min(1, this.mix + dt / 2.5);
    const nt = this.forceNight != null ? this.forceNight : typeof isNight === 'function' && isNight() ? 1 : 0; this.nk += (nt - this.nk) * Math.min(1, dt * .5);
    for (const c of this.clouds) { c.x += c.v * dt; if (c.x > 1.4) c.x = -.4; }
    const b = this.cur, sc = w / 400;
    const rates = { sakura: 16 * sc, normal: 6, windy: 22, rainy: 140 * sc, snowy: 26 * sc, sand: 70 * sc, starfall: 1.2, hell: 26 * sc, glitch: 18, void: 34, eclipse: 18 * sc, deep: 22 * sc, garden: 12 * sc, dusk: 9 * sc, beach: 14 * sc };
    this.acc += dt * (rates[b] || 0);
    while (this.acc >= 1) { this.acc--; if (this.P.length < 500) this.P.push(this.mk(b, w, h)); }
    if (b === 'starfall' || b === 'garden') for (let i = 0; i < 2; i++) if (Math.random() < dt * 3) this.P.push({ k: 'tw', x: Math.random() * w, y: Math.random() * h * .6, l: 0, m: rnd(.4, 1), s: rnd(1, 2.5) });
    if (b === 'windy' && Math.random() < dt * 2) this.P.push({ k: 'leaf', x: -20, y: rnd(h * .1, h * .8), vx: rnd(160, 300), vy: rnd(-30, 30), l: 0, m: 4, rot: 0, vr: rnd(-6, 6), s: rnd(3, 6) });
    if (b === 'dusk' && Math.random() < dt * 1.4) this.P.push({ k: 'leaf', x: rnd(-20, w), y: -10, vx: rnd(10, 40), vy: rnd(40, 80), sway: rnd(20, 40), ph: rnd(0, TAU), l: 0, m: 20, rot: 0, vr: rnd(-3, 3), s: rnd(3, 5), c: pick(['#e0782a', '#c8502a', '#f0a040']) });
    for (let i = this.P.length - 1; i >= 0; i--) {
      const p = this.P[i]; p.l += dt;
      if (p.k === 'in') { const k = p.l / p.m; p.a += dt * (1 + k * 2.5); p.r = p.r0 * (1 - ease(k) * .95); p.x = w / 2 + Math.cos(p.a) * p.r; p.y = h * .4 + Math.sin(p.a) * p.r * .7; }
      else { p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; if (p.sway) p.x += Math.sin(t * 1.5 + p.ph) * p.sway * dt; if (p.rot !== undefined) p.rot += p.vr * dt; }
      if (p.l > p.m || p.y > h + 40 || p.x > w + 120 || p.x < -140) this.P.splice(i, 1);
    }
    if (b === 'rainy' && Math.random() < dt * .05) this.flash = 1;
    this.flash = Math.max(0, this.flash - dt * 2.5);
    if (b === 'glitch') { if (Math.random() < dt * 8) this.glit.push({ x: rnd(0, w), y: rnd(0, h), w: rnd(20, w * .6), h: rnd(2, 24), c: pick(['#ff2a6d', '#2affd0', '#ffffff', '#4a6aff']), l: 0, m: rnd(.05, .25) }); }
    for (let i = this.glit.length - 1; i >= 0; i--) { this.glit[i].l += dt; if (this.glit[i].l > this.glit[i].m) this.glit.splice(i, 1); }
  }
  mk(b, w, h) {
    switch (b) {
      case 'windy': return { k: 'streak', x: -100, y: rnd(0, h), vx: rnd(500, 800), vy: rnd(-10, 10), l: 0, m: 3, len: rnd(40, 110), c: '#e2fffa', a: rnd(.08, .25) };
      case 'rainy': return { k: 'rain', x: rnd(-w * .2, w * 1.1), y: -20, vx: -90, vy: rnd(850, 1100), l: 0, m: 2, len: rnd(14, 24), c: '#a8ceff', a: rnd(.2, .45) };
      case 'snowy': return { k: 'snow', x: rnd(-20, w + 20), y: -10, vx: rnd(-10, 10), vy: rnd(28, 60), sway: rnd(10, 30), ph: rnd(0, TAU), l: 0, m: 30, s: rnd(1.2, 3.6), c: '#ffffff', a: rnd(.5, .95) };
      case 'sand': return { k: 'dot', x: -10, y: rnd(0, h), vx: rnd(260, 520), vy: rnd(-25, 25), l: 0, m: 4, s: rnd(.6, 1.8), c: pick(['#e8b878', '#d09048', '#ffd8a0']), a: rnd(.3, .7) };
      case 'starfall': { const x = rnd(w * .2, w * 1.3); return { k: 'meteor', x, y: rnd(-40, h * .3), vx: -rnd(500, 750), vy: rnd(250, 380), l: 0, m: 1.6, len: rnd(80, 160), c: pick(['#ffe9a8', '#ffffff', '#ffb06a', '#a8d8ff']), a: 1 }; }
      case 'hell': return { k: 'ember', x: rnd(0, w), y: h + 10, vx: rnd(-20, 20), vy: -rnd(60, 150), sway: rnd(10, 40), ph: rnd(0, TAU), l: 0, m: rnd(3, 6), s: rnd(1, 2.8), c: pick(['#ff7a2a', '#ffb02a', '#ff3a1a']), a: 1 };
      case 'sakura': return { k: 'petal', x: rnd(-40, w), y: -10, vx: rnd(20, 60), vy: rnd(30, 70), sway: rnd(20, 50), ph: rnd(0, TAU), l: 0, m: 30, rot: rnd(0, TAU), vr: rnd(-3, 3), s: rnd(3, 6), c: pick(['#ffc8e0', '#ffb0d4', '#ffffff', '#ff8ab8']), a: rnd(.6, 1) };
      case 'glitch': return { k: 'bit', x: rnd(0, w), y: -10, vx: 0, vy: rnd(40, 110), l: 0, m: 20, ch: pick(['0', '1', '#', '?', '/', '_']), c: pick(['#2affd0', '#ff2a6d', '#8fa0ff']), a: rnd(.3, .8), s: rnd(9, 14) };
      case 'void': return { k: 'in', a: rnd(0, TAU), r0: Math.max(w, h) * rnd(.55, .8), r: 0, x: 0, y: 0, l: 0, m: rnd(2.5, 4.5), s: rnd(.6, 1.8), c: pick(['#8a5cff', '#c8a8ff', '#ff5ad8', '#ffffff']), a: .9 };
      case 'eclipse': return { k: 'ember', x: rnd(0, w), y: h + 10, vx: rnd(-10, 10), vy: -rnd(30, 80), sway: rnd(10, 30), ph: rnd(0, TAU), l: 0, m: rnd(4, 7), s: rnd(.8, 2), c: pick(['#c084fc', '#f0abfc', '#7c3aed', '#ffffff']), a: .8 };
      case 'deep': return { k: 'bub', x: rnd(0, w), y: h + 10, vx: 0, vy: -rnd(40, 110), sway: rnd(8, 24), ph: rnd(0, TAU), l: 0, m: 20, s: rnd(1.5, 5), c: '#a7f3d0', a: rnd(.3, .7) };
      case 'garden': return { k: 'petal', x: rnd(-40, w), y: -10, vx: rnd(10, 40), vy: rnd(20, 50), sway: rnd(20, 50), ph: rnd(0, TAU), l: 0, m: 30, rot: rnd(0, TAU), vr: rnd(-3, 3), s: rnd(2.5, 5), c: pick(['#ffe08a', '#ffb0e0', '#fff6d0', '#c8a8ff']), a: rnd(.6, 1) };
      case 'dusk': return { k: 'fly', x: rnd(0, w), y: rnd(h * .35, h * .95), vx: rnd(-15, 15), vy: rnd(-12, 4), sway: rnd(10, 30), ph: rnd(0, TAU), l: 0, m: rnd(5, 9), s: rnd(1.2, 2.4), c: pick(['#e8ff8a', '#ffd36a']), a: 1 };
      case 'beach': return { k: 'tw', x: rnd(0, w), y: rnd(h * .5, h * .64), l: 0, m: rnd(.4, 1.1), s: rnd(1, 2.4) };
      default: return { k: 'mote', x: rnd(0, w), y: h + 10, vx: rnd(-6, 6), vy: -rnd(10, 26), sway: rnd(4, 14), ph: rnd(0, TAU), l: 0, m: 40, s: rnd(.8, 2.2), c: pick(['#b9a8ff', '#8ad8ff', '#ffffff']), a: rnd(.3, .7) };
    }
  }
  skyCols(b) { const B = BIOMES[b], k = B.night ? .15 * this.nk : this.nk * .62; return B.sky.map(c => mix(c, '#04051c', k)); }
  sky(ctx, w, h, b, al) {
    const c = this.skyCols(b), g = ctx.createLinearGradient(0, 0, 0, h * .75);
    g.addColorStop(0, c[0]); g.addColorStop(.55, c[1]); g.addColorStop(1, c[2]);
    ctx.globalAlpha = al; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  island(ctx, x, y, s, top, side, rim, t) {
    ctx.save(); ctx.translate(x, y + Math.sin(t * .6 + x) * 4 * s); ctx.scale(s, s);
    ctx.fillStyle = side; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.quadraticCurveTo(-50, 30, -24, 46); ctx.lineTo(-8, 78); ctx.lineTo(4, 50); ctx.lineTo(18, 64); ctx.lineTo(30, 34); ctx.quadraticCurveTo(52, 22, 60, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = top; ctx.beginPath(); ctx.ellipse(0, 0, 62, 13, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = rim; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 0, 62, 13, 0, Math.PI * .05, Math.PI * .95); ctx.stroke();
    ctx.fillStyle = side; for (const [px, ph] of [[-30, 22], [-18, 30], [22, 26]]) { ctx.beginPath(); ctx.moveTo(px - 6, -2); ctx.lineTo(px, -ph); ctx.lineTo(px + 6, -2); ctx.fill(); }
    ctx.restore();
  }
  drawBack(ctx, w, h, t) {
    ctx.save(); ctx.globalCompositeOperation = 'source-over';
    if (this.prev && this.mix < 1) this.sky(ctx, w, h, this.prev, 1);
    this.sky(ctx, w, h, this.cur, this.prev && this.mix < 1 ? this.mix : 1);
    const B = BIOMES[this.cur], b = this.cur, sk = this.skyCols(b), nk = this.nk;
    const starA = Math.min(1, (B.night ? 1 : 0) + nk * .9);
    if (starA > .02) { ctx.fillStyle = '#ffffff'; for (const s of this.stars) { ctx.globalAlpha = starA * (.35 + .35 * Math.sin(t * 1.5 + s.ph)); ctx.fillRect(s.x * w, s.y * h * .8, s.s, s.s); } }
    ctx.globalCompositeOperation = 'lighter';
    const mx = w * .82, my = b === 'dusk' ? h * .44 : b === 'beach' ? h * .4 : h * .2;
    if (b === 'eclipse') {
      glow(ctx, '#c084fc', mx, my, w * .7, .45); glow(ctx, '#ffe0ff', mx, my, 70, .7);
      ctx.globalAlpha = .55; ctx.strokeStyle = '#f5d0fe'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < 24; i++) { const an = i / 24 * TAU + t * .05, l = 30 + 16 * (.5 + .5 * Math.sin(t * 1.3 + i * 1.7)); ctx.moveTo(mx + Math.cos(an) * 25, my + Math.sin(an) * 25); ctx.lineTo(mx + Math.cos(an) * l, my + Math.sin(an) * l); }
      ctx.stroke(); ctx.globalAlpha = 1; ctx.strokeStyle = '#fff6ff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(mx, my, 24, 0, TAU); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#07020f'; ctx.beginPath(); ctx.arc(mx, my, 22.5, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'lighter';
    } else if (b === 'deep') {
      for (let i = 0; i < 6; i++) { const x = w * (.08 + i * .18) + Math.sin(t * .3 + i * 1.3) * 24, g = ctx.createLinearGradient(0, 0, 0, h * .75); g.addColorStop(0, 'rgba(160,255,220,.16)'); g.addColorStop(1, 'rgba(160,255,220,0)'); ctx.globalAlpha = .6 + .4 * Math.sin(t * .7 + i); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 14, 0); ctx.lineTo(x + 14, 0); ctx.lineTo(x + 70, h * .75); ctx.lineTo(x + 10, h * .75); ctx.closePath(); ctx.fill(); }
      glow(ctx, '#34d399', w / 2, -h * .05, w * .8, .3);
    } else if (b === 'void') { for (let i = 0; i < 4; i++) { ctx.globalAlpha = 1; ctx.strokeStyle = rgba('#8a5cff', .12); ctx.lineWidth = 30 - i * 5; ctx.beginPath(); ctx.ellipse(w / 2, h * .38, w * (.3 + i * .14), w * (.12 + i * .06), t * .1 + i, 0, Math.PI * 1.3); ctx.stroke(); } }
    else if (b === 'glitch') { glow(ctx, '#ff2a6d', w * .2, h * .2, w * .5, .25); glow(ctx, '#2affd0', w * .8, h * .35, w * .5, .2); }
    else {
      // 햇살 (낮)
      const day = 1 - nk;
      if (day > .05 && b !== 'rainy') {
        glow(ctx, b === 'hell' ? '#ff7a30' : b === 'sand' ? '#ffd080' : b === 'dusk' ? '#ff9a40' : b === 'beach' ? '#ffc890' : '#fff4d0', mx, my, w * (b === 'dusk' || b === 'beach' ? .8 : .55), .45 * day);
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, h * .9); g.addColorStop(0, `rgba(255,248,220,${.16 * day})`); g.addColorStop(1, 'rgba(255,248,220,0)');
        ctx.fillStyle = g; ctx.globalAlpha = 1; ctx.beginPath();
        for (let i = 0; i < 7; i++) { const an = Math.PI * .55 + i * .16 + Math.sin(t * .15 + i) * .03, wd = .035 + (i % 3) * .015; ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(an - wd) * h, my + Math.sin(an - wd) * h); ctx.lineTo(mx + Math.cos(an + wd) * h, my + Math.sin(an + wd) * h); ctx.closePath(); }
        ctx.fill();
        ctx.globalAlpha = day; ctx.fillStyle = b === 'hell' ? '#ffb07a' : '#fffbe8'; ctx.beginPath(); ctx.arc(mx, my, 18, 0, TAU); ctx.fill();
      }
      if (nk > .05) { glow(ctx, '#dfe6ff', mx, my, 80, .35 * nk); ctx.globalAlpha = nk * .95; ctx.fillStyle = '#f0f4ff'; ctx.beginPath(); ctx.arc(mx, my, 16, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = nk * .95; ctx.fillStyle = sk[0]; ctx.beginPath(); ctx.arc(mx + 7, my - 4, 14, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; }
      if (b === 'hell') glow(ctx, '#ff3a10', w / 2, h * 1.05, w * .9, .5);
      if (b === 'sakura') glow(ctx, '#ffb0d4', w * .4, h * .3, w * .7, .25);
      if (b === 'garden') { glow(ctx, '#ffb0e0', w * .25, h * .25, w * .6, .22); glow(ctx, '#ffe08a', w * .7, h * .38, w * .5, .2); }
      if (b === 'dusk') glow(ctx, '#ff6a2a', w * .5, h * .55, w * .9, .25);
    }
    // 구름
    ctx.globalCompositeOperation = 'source-over';
    const cc = b === 'rainy' ? '#6a7a94' : b === 'hell' ? '#5a1a1a' : mix(sk[2], '#ffffff', .45);
    for (const c of this.clouds) {
      const cx = c.x * w, cy = c.y * h * .9, r = 46 * c.s * (w / 400);
      ctx.globalAlpha = b === 'void' || b === 'glitch' || b === 'deep' || b === 'eclipse' ? .06 : (b === 'rainy' ? .5 : .32) * (1 - nk * .5);
      ctx.fillStyle = cc; ctx.beginPath();
      for (const [ox, oy, rr] of [[-1, .2, .55], [-.45, -.15, .7], [.2, -.3, .8], [.8, .05, .6], [0, .25, .7]]) { ctx.moveTo(cx + ox * r + rr * r, cy + oy * r); ctx.arc(cx + ox * r, cy + oy * r, rr * r, 0, TAU); }
      ctx.fill();
    }
    // 떠 있는 섬
    const isT = mix(B.ground, sk[1], .45), isS = mix(B.ground, sk[0], .35), rim = mix(B.grass || '#ffffff', sk[2], .3);
    const sc = w / 400;
    this.island(ctx, w * .13, h * .37, .55 * sc, isT, isS, rim, t);
    this.island(ctx, w * .88, h * .3, .42 * sc, isT, isS, rim, t + 2);
    this.island(ctx, w * .72, h * .5, .3 * sc, isT, isS, rim, t + 4);
    if (b === 'beach') { // 바다
      const sy = h * .5, g = ctx.createLinearGradient(0, sy, 0, h * .7); g.addColorStop(0, '#5ad0f0'); g.addColorStop(1, '#1a6aa8');
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, sy, w, h * .2);
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 16; i++) { const yy = sy + 4 + (i * 13.7 % (h * .16)), xx = (i * 97 + t * (14 + i % 4 * 6)) % (w + 80) - 40, ln = 16 + i % 5 * 8; ctx.globalAlpha = .18 + .14 * Math.sin(t * 2 + i); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + ln, yy); ctx.stroke(); }
      glow(ctx, '#ffd88a', mx, sy + 6, w * .35, .35); ctx.globalCompositeOperation = 'source-over';
    }
    // 언덕
    for (let i = 0; i < 2; i++) {
      ctx.globalAlpha = 1; ctx.fillStyle = mix(B.ground, sk[2], .6 - i * .25);
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w + 20; x += 16) { let y = h * (.6 + i * .05); for (const [f, ph, amp] of this.hills[i]) y += Math.sin(x * f + ph) * amp; ctx.lineTo(x, y); }
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  drawFront(ctx, w, h, t) {
    ctx.save(); const b = this.cur;
    for (const p of this.P) {
      const al = (p.a || 1) * Math.min(1, p.l / .3) * (p.m < 10 ? 1 - Math.pow(p.l / p.m, 3) : 1) * clamp((p.m - p.l) / .6, 0, 1);
      ctx.globalAlpha = al;
      switch (p.k) {
        case 'streak': case 'rain': case 'meteor': {
          ctx.globalCompositeOperation = p.k === 'meteor' ? 'lighter' : 'source-over';
          const vl = Math.hypot(p.vx, p.vy), g = ctx.createLinearGradient(p.x, p.y, p.x - p.vx / vl * p.len, p.y - p.vy / vl * p.len);
          g.addColorStop(0, p.c); g.addColorStop(1, rgba(p.c, 0)); ctx.strokeStyle = g; ctx.lineWidth = p.k === 'meteor' ? 2.4 : p.k === 'rain' ? 1.2 : 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx / vl * p.len, p.y - p.vy / vl * p.len); ctx.stroke();
          if (p.k === 'meteor') glow(ctx, p.c, p.x, p.y, 10, .9);
          break;
        }
        case 'petal': ctx.globalCompositeOperation = 'source-over'; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * .55, 0, 0, TAU); ctx.fill(); ctx.restore(); break;
        case 'bub': ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = p.c; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(p.x - p.s * .45, p.y - p.s * .5, p.s * .35, p.s * .35); break;
        case 'fly': { ctx.globalCompositeOperation = 'lighter'; const bl = .25 + .75 * Math.max(0, Math.sin(t * 2.6 + p.ph)); glow(ctx, p.c, p.x, p.y, p.s * 7, al * bl); ctx.globalAlpha = al * bl; ctx.fillStyle = '#ffffe8'; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); break; }
        case 'leaf': ctx.globalCompositeOperation = 'source-over'; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c || '#7ad89a'; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * .45, 0, 0, TAU); ctx.fill(); ctx.restore(); break;
        case 'tw': ctx.globalCompositeOperation = 'lighter'; glow(ctx, '#fff6d0', p.x, p.y, p.s * 4, Math.sin(p.l / p.m * Math.PI)); break;
        case 'bit': ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = p.c; ctx.font = `${p.s}px monospace`; ctx.fillText(p.ch, p.x, p.y); break;
        case 'ember': case 'in': ctx.globalCompositeOperation = 'lighter'; glow(ctx, p.c, p.x, p.y, p.s * 4, al); ctx.fillStyle = p.c; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); break;
        case 'mote': ctx.globalCompositeOperation = 'lighter'; glow(ctx, p.c, p.x, p.y, p.s * 3, al); break;
        default: ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    if (b === 'sand') { ctx.globalAlpha = .12 + .05 * Math.sin(t); ctx.fillStyle = '#d88a40'; ctx.fillRect(0, 0, w, h); }
    if (b === 'rainy') { ctx.globalAlpha = .12; ctx.fillStyle = '#000814'; ctx.fillRect(0, 0, w, h); }
    if (b === 'deep') { ctx.globalAlpha = .16; ctx.fillStyle = '#00302a'; ctx.fillRect(0, 0, w, h); }
    if (b === 'eclipse') { ctx.globalAlpha = .1; ctx.fillStyle = '#1a0630'; ctx.fillRect(0, 0, w, h); }
    if (b === 'dusk') { ctx.globalAlpha = .07; ctx.fillStyle = '#ff7030'; ctx.fillRect(0, 0, w, h); }
    if (this.flash > 0) { ctx.globalAlpha = this.flash * .35; ctx.fillStyle = '#dfe8ff'; ctx.fillRect(0, 0, w, h); }
    if (b === 'glitch') {
      for (const g of this.glit) { ctx.globalAlpha = .55; ctx.fillStyle = g.c; ctx.fillRect(g.x - g.w / 2, g.y, g.w, g.h); }
      ctx.globalAlpha = .07; ctx.fillStyle = '#000'; for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
    }
    const vg = ctx.createRadialGradient(w / 2, h * .42, Math.min(w, h) * .4, w / 2, h * .5, Math.max(w, h) * .8);
    vg.addColorStop(0, 'rgba(0,0,10,0)'); vg.addColorStop(1, `rgba(0,0,10,${.28 + this.nk * .2})`); ctx.globalAlpha = 1; ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  draw(ctx, w, h, t) { this.drawBack(ctx, w, h, t); this.drawFront(ctx, w, h, t); }
}

/* ── 무대(발판 섬) ── */
function drawStage(ctx, w, h, cx, gy, R, biome, a, t, spin, nk = 0) {
  const B = BIOMES[biome], gc = mix(B.grass || '#8a7aff', '#04051c', nk * .45), ground = mix(B.ground, '#04051c', nk * .4);
  ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  const rx = Math.max(w * .75, R * 6), ry = R * .95, ey = gy + R * .25;
  // 절벽
  let g = ctx.createLinearGradient(0, ey, 0, h);
  g.addColorStop(0, mix(ground, '#000000', .1)); g.addColorStop(1, mix(ground, '#000000', .65));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - rx, ey); ctx.lineTo(cx - rx, h); ctx.lineTo(cx + rx, h); ctx.lineTo(cx + rx, ey); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba('#000000', .18); ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) { const x = cx + (i - 3) * rx * .3; ctx.beginPath(); ctx.moveTo(x, ey + ry * .6); ctx.lineTo(x + 10, ey + ry * 2.2); ctx.lineTo(x - 6, ey + ry * 3.4); ctx.stroke(); }
  // 윗면
  g = ctx.createLinearGradient(0, ey - ry, 0, ey + ry);
  g.addColorStop(0, mix(gc, '#ffffff', .1)); g.addColorStop(1, mix(gc, ground, .55));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, ey, rx, ry, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = mix(gc, '#ffffff', .45); ctx.lineWidth = 3; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse(cx, ey, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  // 풀잎
  ctx.globalAlpha = .55; ctx.strokeStyle = mix(gc, '#ffffff', .3); ctx.lineWidth = 1.5;
  for (let i = 0; i < 26; i++) { const an = i / 26 * TAU, x = cx + Math.cos(an) * rx * .86, y = ey + Math.sin(an) * ry * .8; if (Math.abs(x - cx) < R * 1.5 && Math.sin(an) < .3) continue; const sw = Math.sin(t * 2 + i) * 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw - 2, y - 7); ctx.moveTo(x + 3, y); ctx.lineTo(x + 3 + sw, y - 9); ctx.stroke(); }
  // 소품
  ctx.globalAlpha = 1;
  const props = [[-.62, -.15, 1], [-.8, .25, .8], [.6, -.2, 1.05], [.8, .2, .75], [-.4, .45, .55], [.42, .5, .6]];
  for (const [px, py, s] of props) drawProp(ctx, cx + px * Math.min(rx, w * .5), ey + py * ry, R * .5 * s, B.prop || 'crystal', gc, t + px * 3, nk);
  // 소환진
  const c = a ? a.c : '#a89cff';
  ctx.save(); ctx.translate(cx, gy); ctx.scale(1, .3); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = .35 + spin * .5; ctx.strokeStyle = c; ctx.lineWidth = R * .05;
  ctx.beginPath(); ctx.arc(0, 0, R * 1.5, 0, TAU); ctx.stroke();
  ctx.save(); ctx.rotate(t * (.4 + spin * 5));
  ctx.lineWidth = R * .03; ctx.beginPath(); ctx.arc(0, 0, R * 1.2, 0, TAU); ctx.stroke();
  ctx.beginPath(); for (let i = 0; i <= 5; i++) { const an = i * TAU / 5 * 2 - Math.PI / 2; ctx.lineTo(Math.cos(an) * R * 1.2, Math.sin(an) * R * 1.2); } ctx.stroke();
  ctx.fillStyle = c; for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * TAU / 12); ctx.fillRect(-R * .04, -R * 1.44, R * .08, R * .14); ctx.restore(); }
  ctx.restore();
  glow(ctx, c, 0, 0, R * (1.6 + spin), .25 + spin * .4);
  ctx.restore();
  ctx.restore();
}
function drawProp(ctx, x, y, s, kind, gc, t, nk) {
  ctx.save(); ctx.translate(x, y);
  ctx.globalAlpha = .35; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, s * .1, s * .9, s * .25, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  switch (kind) {
    case 'crystal': case 'void': case 'glitch': {
      const col = kind === 'void' ? '#8a5cff' : kind === 'glitch' ? (Math.sin(t * 7) > .6 ? '#ff2a6d' : '#2affd0') : mix(gc, '#ffffff', .2);
      for (const [ox, h2, rot] of [[0, 1.8, 0], [-.45, 1.1, -.35], [.42, 1.2, .3]]) {
        ctx.save(); ctx.translate(ox * s, 0); ctx.rotate(rot);
        const g = ctx.createLinearGradient(-s * .25, 0, s * .25, 0); g.addColorStop(0, mix(col, '#ffffff', .5)); g.addColorStop(1, mix(col, '#000000', .35));
        ctx.fillStyle = kind === 'void' ? '#1a0e3a' : g; ctx.beginPath(); ctx.moveTo(-s * .22, 0); ctx.lineTo(-s * .22, -h2 * s * .7); ctx.lineTo(0, -h2 * s); ctx.lineTo(s * .22, -h2 * s * .7); ctx.lineTo(s * .22, 0); ctx.fill();
        if (kind === 'void') { ctx.fillStyle = col; ctx.fillRect(-s * .05, -h2 * s * .6, s * .1, s * .1); }
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'lighter'; glow(ctx, col, 0, -s * .8, s * 1.6, .35 + .15 * Math.sin(t * 2)); break;
    }
    case 'tree': case 'sakura': {
      ctx.fillStyle = '#5a3a2a'; ctx.fillRect(-s * .1, -s * 1.2, s * .2, s * 1.2);
      const cc = kind === 'sakura' ? '#ffb0d4' : mix(gc, '#000000', .15), sw = Math.sin(t * 1.5) * s * .05;
      for (const [ox, oy, r] of [[0, -1.7, .7], [-.45, -1.35, .5], [.45, -1.4, .55], [0, -2.15, .45]]) { ctx.fillStyle = mix(cc, '#ffffff', oy < -2 ? .25 : .08); ctx.beginPath(); ctx.arc(ox * s + sw, oy * s, r * s, 0, TAU); ctx.fill(); }
      break;
    }
    case 'pine': {
      ctx.fillStyle = '#4a3a2a'; ctx.fillRect(-s * .08, -s * .5, s * .16, s * .5);
      for (let i = 0; i < 3; i++) { const yy = -s * (.4 + i * .55), ww = s * (.75 - i * .18); ctx.fillStyle = '#2f6a6a'; ctx.beginPath(); ctx.moveTo(-ww, yy); ctx.lineTo(0, yy - s * .8); ctx.lineTo(ww, yy); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-ww * .5, yy - s * .4); ctx.lineTo(0, yy - s * .8); ctx.lineTo(ww * .5, yy - s * .4); ctx.fill(); }
      break;
    }
    case 'cactus': {
      ctx.fillStyle = '#5a9a4a'; ctx.strokeStyle = '#3a6a2a'; ctx.lineWidth = s * .05;
      const rr = (x0, y0, w0, h0) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x0, y0, w0, h0, w0 / 2) : ctx.rect(x0, y0, w0, h0); ctx.fill(); ctx.stroke(); };
      rr(-s * .17, -s * 1.6, s * .34, s * 1.6); rr(-s * .55, -s * 1.15, s * .24, s * .6); rr(s * .3, -s * 1.3, s * .24, s * .7);
      break;
    }
    case 'coral': {
      const col = mix(gc, '#ff7aa8', .55); ctx.strokeStyle = col; ctx.lineCap = 'round';
      const br = (x0, y0, an, len, wd, d) => { if (d > 3) return; const sw = Math.sin(t * 1.2 + d * .8) * .08, x1 = x0 + Math.cos(an + sw) * len, y1 = y0 + Math.sin(an + sw) * len; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); br(x1, y1, an - .5, len * .7, wd * .7, d + 1); br(x1, y1, an + .45, len * .66, wd * .7, d + 1); };
      br(0, 0, -Math.PI / 2, s * .7, s * .2, 0);
      ctx.strokeStyle = '#2f9a7a'; ctx.lineWidth = s * .07; ctx.beginPath(); ctx.moveTo(s * .55, 0); for (let i = 1; i <= 6; i++) ctx.lineTo(s * .55 + Math.sin(t * 1.6 + i) * s * .1, -i * s * .28); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; glow(ctx, '#5ef0c8', 0, -s * .9, s * 1.4, .25 + .1 * Math.sin(t * 2)); break;
    }
    case 'flower': {
      const sw = Math.sin(t * 1.4) * s * .08, fx = sw * 1.5, fy = -s * 1.2, pc = mix(gc, '#ffb0e0', .35);
      ctx.strokeStyle = '#5a9a6a'; ctx.lineWidth = s * .08; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sw, -s * .6, fx, fy); ctx.stroke();
      ctx.fillStyle = '#5a9a6a'; ctx.beginPath(); ctx.ellipse(sw * .6 + s * .16, -s * .5, s * .16, s * .07, -.5, 0, TAU); ctx.fill();
      ctx.fillStyle = pc; for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(fx, fy); ctx.rotate(i * TAU / 5 + t * .3); ctx.beginPath(); ctx.ellipse(0, -s * .22, s * .12, s * .24, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(fx, fy, s * .1, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; glow(ctx, pc, fx, fy, s * 1.3, .35 + .15 * Math.sin(t * 2.5)); break;
    }
    case 'palm': {
      ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = s * .16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * .3, -s, s * .15, -s * 1.9); ctx.stroke();
      const tx = s * .15, ty = -s * 1.9, sw = Math.sin(t * 1.3) * .08; ctx.strokeStyle = '#3a9a5a'; ctx.lineWidth = s * .1;
      for (const an of [-2.9, -2.3, -1.6, -.9, -.3]) { ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(an + sw) * s * .7, ty + Math.sin(an + sw) * s * .5 - s * .2, tx + Math.cos(an + sw) * s * 1.1, ty + Math.sin(an + sw) * s * .6 + s * .3); ctx.stroke(); }
      ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.arc(tx - s * .06, ty + s * .1, s * .09, 0, TAU); ctx.arc(tx + s * .08, ty + s * .12, s * .09, 0, TAU); ctx.fill(); break;
    }
    case 'lava': {
      ctx.fillStyle = '#2a1414'; ctx.beginPath(); ctx.moveTo(-s * .8, 0); ctx.lineTo(-s * .5, -s * .9); ctx.lineTo(s * .1, -s * 1.2); ctx.lineTo(s * .7, -s * .6); ctx.lineTo(s * .8, 0); ctx.fill();
      ctx.strokeStyle = '#ff6a1a'; ctx.lineWidth = s * .08; ctx.beginPath(); ctx.moveTo(-s * .3, -s * .7); ctx.lineTo(0, -s * .4); ctx.lineTo(s * .3, -s * .8); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; glow(ctx, '#ff5a1a', 0, -s * .5, s * 1.4, .35 + .2 * Math.sin(t * 3)); break;
    }
  }
  ctx.restore();
}

/* ── 주인공 ── */
function drawHero(ctx, cx, cy, R, a, t, st = {}) {
  const raise = st.raise || 0, joy = st.joy || 0, c = a ? a.c : '#9aa4ff', c2 = a ? a.c2 : '#3a3a6a';
  const cloak = mix(mix(c2, '#22204a', .55), '#000000', .1), cloakL = mix(cloak, '#ffffff', .18), trim = mix(c, '#ffffff', .25);
  const bob = Math.sin(t * 2.2) * R * .04 - joy * R * .12 * Math.abs(Math.sin(t * 9));
  const y0 = cy + bob, wind = Math.sin(t * 1.7) * .5 + Math.sin(t * 3.1) * .25;
  ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // 그림자
  ctx.globalAlpha = .4; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(cx, cy + R * 1.45, R * .75, R * .16, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  // 망토 뒷자락
  ctx.fillStyle = mix(cloak, '#000000', .3);
  ctx.beginPath(); ctx.moveTo(cx - R * .45, y0 - R * .45);
  ctx.quadraticCurveTo(cx - R * (1 + wind * .2), y0 + R * .5, cx - R * (.95 + wind * .25), y0 + R * 1.25);
  for (let i = 0; i <= 6; i++) { const x = cx - R * .95 + i * R * .32, y = y0 + R * (1.22 + Math.sin(t * 4 + i) * .05); ctx.lineTo(x + wind * R * .1, y); }
  ctx.quadraticCurveTo(cx + R * (1 + wind * .1), y0 + R * .5, cx + R * .45, y0 - R * .45); ctx.closePath(); ctx.fill();
  // 다리
  ctx.strokeStyle = '#1c1a34'; ctx.lineWidth = R * .22;
  ctx.beginPath(); ctx.moveTo(cx - R * .2, y0 + R * .8); ctx.lineTo(cx - R * .22, cy + R * 1.32); ctx.moveTo(cx + R * .2, y0 + R * .8); ctx.lineTo(cx + R * .22, cy + R * 1.32); ctx.stroke();
  ctx.fillStyle = '#2a2440'; ctx.beginPath(); ctx.ellipse(cx - R * .26, cy + R * 1.38, R * .17, R * .09, 0, 0, TAU); ctx.ellipse(cx + R * .26, cy + R * 1.38, R * .17, R * .09, 0, 0, TAU); ctx.fill();
  // 로브
  let g = ctx.createLinearGradient(0, y0 - R * .6, 0, y0 + R * 1.05); g.addColorStop(0, cloakL); g.addColorStop(1, cloak);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - R * .42, y0 - R * .55);
  ctx.quadraticCurveTo(cx - R * .55, y0 + R * .3, cx - R * .72, y0 + R * .98);
  for (let i = 0; i <= 8; i++) { const x = cx - R * .72 + i * R * .18, y = y0 + R * (.98 + Math.sin(t * 5 + i * 1.3) * .035 + (i % 2) * .03); ctx.lineTo(x, y); }
  ctx.quadraticCurveTo(cx + R * .55, y0 + R * .3, cx + R * .42, y0 - R * .55); ctx.closePath(); ctx.fill();
  // 앞섶·장식
  ctx.strokeStyle = trim; ctx.lineWidth = R * .045; ctx.globalAlpha = .9;
  ctx.beginPath(); ctx.moveTo(cx, y0 - R * .45); ctx.lineTo(cx, y0 + R * .98); ctx.stroke();
  ctx.beginPath(); for (let i = 0; i <= 8; i++) { const x = cx - R * .7 + i * R * .175, y = y0 + R * (.93 + Math.sin(t * 5 + i * 1.3) * .035); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  ctx.globalAlpha = 1; ctx.fillStyle = '#2a2448'; ctx.fillRect(cx - R * .5, y0 + R * .12, R, R * .12);
  ctx.globalCompositeOperation = 'lighter'; glow(ctx, c, cx, y0 + R * .18, R * .35, .9); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = mix(c, '#ffffff', .4); ctx.beginPath(); ctx.moveTo(cx, y0 + R * .06); ctx.lineTo(cx + R * .08, y0 + R * .18); ctx.lineTo(cx, y0 + R * .3); ctx.lineTo(cx - R * .08, y0 + R * .18); ctx.fill();
  // 팔
  const arm = (sd) => {
    const sx = cx + sd * R * .42, sy = y0 - R * .38;
    const ang = (Math.PI / 2 - sd * (.35 + Math.sin(t * 2 + sd) * .05)) * (1 - raise) + (-Math.PI / 2 + sd * .45) * raise;
    const ex = sx + Math.cos(ang) * R * .4 * (sd > 0 ? 1 : 1), ey = sy + Math.sin(ang) * R * .4;
    const ang2 = ang + sd * (raise ? -.3 : .2), hx = ex + Math.cos(ang2) * R * .36, hy = ey + Math.sin(ang2) * R * .36;
    ctx.strokeStyle = cloakL; ctx.lineWidth = R * .2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = trim; ctx.lineWidth = R * .06; ctx.beginPath(); ctx.moveTo(ex + Math.cos(ang2) * R * .22, ey + Math.sin(ang2) * R * .22); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = '#ffe2cc'; ctx.beginPath(); ctx.arc(hx, hy, R * .1, 0, TAU); ctx.fill();
    if (raise > .1) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, c, hx, hy, R * .45 * raise, .8 * raise); ctx.globalCompositeOperation = 'source-over'; }
    return [hx, hy];
  };
  const hL = arm(-1), hR = arm(1);
  // 목도리
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx, y0 - R * .52, R * .4, R * .13, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = mix(c, '#000000', .15); ctx.lineWidth = R * .14;
  ctx.beginPath(); ctx.moveTo(cx + R * .22, y0 - R * .5); ctx.bezierCurveTo(cx + R * .6, y0 - R * .45 + wind * R * .2, cx + R * .8, y0 - R * .2 - wind * R * .2, cx + R * (1 + wind * .3), y0 - R * .3 + Math.sin(t * 5) * R * .1); ctx.stroke();
  // 머리
  const hy = y0 - R * 1.02;
  ctx.fillStyle = mix(cloak, '#ffffff', .1);
  ctx.beginPath(); ctx.moveTo(cx - R * .55, hy + R * .25); ctx.quadraticCurveTo(cx - R * .62, hy - R * .55, cx, hy - R * .6);
  const tip = wind * R * .25; ctx.quadraticCurveTo(cx + R * .45, hy - R * .62, cx + R * (.7 + .2 * wind), hy - R * .85 + tip * .3); ctx.quadraticCurveTo(cx + R * .6, hy - R * .3, cx + R * .55, hy + R * .25); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe6d4'; ctx.beginPath(); ctx.ellipse(cx, hy + R * .05, R * .4, R * .38, 0, 0, TAU); ctx.fill();
  const hair = mix(c, '#f4eeff', .55); ctx.fillStyle = hair;
  ctx.beginPath(); ctx.moveTo(cx - R * .42, hy - R * .02); ctx.quadraticCurveTo(cx - R * .3, hy - R * .42, cx, hy - R * .38); ctx.quadraticCurveTo(cx + R * .32, hy - R * .42, cx + R * .43, hy);
  ctx.lineTo(cx + R * .28, hy - R * .12); ctx.lineTo(cx + R * .16, hy - R * .02); ctx.lineTo(cx + R * .05, hy - R * .16); ctx.lineTo(cx - R * .1, hy - R * .04); ctx.lineTo(cx - R * .2, hy - R * .16); ctx.lineTo(cx - R * .32, hy - R * .03); ctx.closePath(); ctx.fill();
  ctx.fillStyle = mix(cloak, '#ffffff', .1); ctx.beginPath(); ctx.moveTo(cx - R * .55, hy + R * .25); ctx.quadraticCurveTo(cx - R * .5, hy - R * .1, cx - R * .42, hy - R * .05); ctx.lineTo(cx - R * .38, hy + R * .32); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + R * .55, hy + R * .25); ctx.quadraticCurveTo(cx + R * .5, hy - R * .1, cx + R * .43, hy - R * .03); ctx.lineTo(cx + R * .38, hy + R * .32); ctx.fill();
  // 눈
  const blink = (t % 4.3) < .12 ? .15 : 1, eyeC = a ? mix(c, '#ffffff', .2) : '#3a3466';
  for (const sd of [-1, 1]) {
    const ex = cx + sd * R * .16, ey = hy + R * .1;
    if (joy > .3) { ctx.strokeStyle = '#3a2a4a'; ctx.lineWidth = R * .05; ctx.beginPath(); ctx.arc(ex, ey + R * .03, R * .07, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); continue; }
    ctx.fillStyle = '#2a2040'; ctx.beginPath(); ctx.ellipse(ex, ey, R * .075, R * .11 * blink, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = eyeC; ctx.beginPath(); ctx.ellipse(ex, ey + R * .025, R * .055, R * .07 * blink, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex - R * .025, ey - R * .04 * blink, R * .025, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = .5; ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.ellipse(cx - R * .27, hy + R * .22, R * .07, R * .04, 0, 0, TAU); ctx.ellipse(cx + R * .27, hy + R * .22, R * .07, R * .04, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  ctx.strokeStyle = '#8a4a5a'; ctx.lineWidth = R * .03; ctx.beginPath();
  if (joy > .3 || raise > .5) ctx.arc(cx, hy + R * .22, R * .07, .1, Math.PI - .1); else { ctx.moveTo(cx - R * .04, hy + R * .26); ctx.quadraticCurveTo(cx, hy + R * .29, cx + R * .04, hy + R * .26); }
  ctx.stroke();
  ctx.restore();
  return { hL, hR, head: [cx, hy] };
}

/* ── 컷신 ── */
const CUT_SHAPE = { sakura: 'petal', windy: 'streak', rainy: 'rain', snowy: 'flake', sand: 'dot', starfall: 'star', hell: 'ember', glitch: 'sq', void: 'dot', eclipse: 'ember', deep: 'dot', garden: 'petal', dusk: 'ember', beach: 'dot' };
const calmFX = () => typeof S !== 'undefined' && S && S.set && S.set.motion;
class Cutscene {
  constructor(cv) { this.cv = cv; this.ctx = cv.getContext('2d'); this.on = false; }
  start(a, opt) {
    this.a = a; this.opt = opt; this.on = true; this.t = 0;
    this.tier = tierOf(a.r); this.ex = opt.env || a.biome || (a.summer || a.summerRoll ? 'beach' : a.night ? 'starfall' : a.day ? 'sand' : null);
    const base = [.9, .9, .9, .9, 1.4, 1.9, 2.4, 2.9, 3.6][Math.min(this.tier, 8)] + Math.max(0, this.tier - 8) * .35 + (a.id === 'voidroll' || a.id === 'worldend' ? .8 : 0);
    this.T1 = base; this.T2 = base + .45;
    this.P = []; this.warp = []; this.waves = []; this.shards = []; this.cracks = []; this.sparks = []; this.shake = 0; this.flash = 0; this.boomed = false; this.fakes = 0;
    this.fx = new AuraFX(); this.fx.hero = true; this.fx.set(a, !!opt.shiny);
    this.env = null;
    if (this.ex) { this.env = new BiomeFX(); this.env.cur = this.ex; this.env.prev = null; this.env.mix = 1; this.env.nk = a.night ? 1 : 0; this.env.forceNight = a.night ? 1 : a.day ? 0 : null; }
    this.cv.classList.remove('hide');
    this.closeAt = opt.auto ? this.T2 + 2.8 : Infinity;
  }
  canClose() { return this.on && this.t > this.T2 + .7; }
  close() { if (!this.on) return; this.on = false; this.cv.classList.add('hide'); const cb = this.opt.done; this.opt = null; cb && cb(); }
  boom(w, h, cx, cy) {
    const tier = this.tier;
    this.boomed = true; this.flash = 1; this.shake = 6 + tier * 3;
    for (let i = 0; i < Math.max(1, tier - 3); i++) this.waves.push({ l: -i * .18 });
    if (tier >= 5) { // 유리 파편
      const rings = [0, .12, .3, .55, .9].map(k => k * Math.max(w, h)), secs = 12;
      for (let r = 0; r < rings.length - 1; r++) for (let sI = 0; sI < secs; sI++) {
        const a0 = sI / secs * TAU + rnd(-.08, .08), a1 = (sI + 1) / secs * TAU + rnd(-.08, .08), r0 = rings[r] * rnd(.9, 1.1), r1 = rings[r + 1] * rnd(.9, 1.1);
        const pts = [[a0, r0], [a1, r0], [a1, r1], [a0, r1]].map(([an, rr]) => [cx + Math.cos(an) * rr, cy + Math.sin(an) * rr]);
        const mx = pts.reduce((q, p) => q + p[0], 0) / 4, my = pts.reduce((q, p) => q + p[1], 0) / 4, an = Math.atan2(my - cy, mx - cx), sp = rnd(300, 900) * (1 + r * .3);
        this.shards.push({ pts: pts.map(([x, y]) => [x - mx, y - my]), x: mx, y: my, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, rot: 0, vr: rnd(-4, 4), l: 0 });
      }
    } else if (tier >= 3) { // 금 간 화면
      for (let i = 0; i < 9; i++) { let an = i / 9 * TAU + rnd(-.2, .2), x = cx, y = cy; const pts = [[x, y]]; for (let j = 0; j < 7; j++) { an += rnd(-.4, .4); const L = rnd(30, 70); x += Math.cos(an) * L; y += Math.sin(an) * L; pts.push([x, y]); } this.cracks.push(pts); }
    }
    for (let i = 0; i < 60 + tier * 20; i++) { const an = rnd(0, TAU), sp = rnd(100, 700); this.sparks.push({ x: cx, y: cy, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 0, m: rnd(.6, 1.6), c: Math.random() < .5 ? this.a.c : Math.random() < .5 ? this.a.c2 : '#ffffff', s: rnd(1, 3) }); }
    this.opt.boom && this.opt.boom();
  }
  update(dt, w, h, dpr) {
    if (!this.on) return;
    this.t += dt; const t = this.t, tier = this.tier, a = this.a, ctx = this.ctx;
    if (t > this.closeAt) { this.close(); return; }
    const cx = w / 2, cy = h * .42;
    if (!this.boomed && t >= this.T2) this.boom(w, h, cx, cy);
    if (tier >= 7 && this.fakes < 2 && t > this.T1 * (.5 + this.fakes * .25)) { this.fakes++; this.flash = .45; this.shake = 4; this.opt.fake && this.opt.fake(); }
    this.flash = Math.max(0, this.flash - dt * (t > this.T2 ? 1.6 : 3));
    this.shake = Math.max(0, this.shake - dt * 10);
    const tease = t < this.T1 ? Math.min(tier, Math.floor(t / this.T1 * (tier + 1))) : tier;
    const tc = t > this.T1 - .25 ? a.c : TIERS[tease].c;
    if (t < this.T1) {
      const n = (40 + tier * 35) * dt * (1 + t / this.T1 * 2);
      for (let i = 0; i < n; i++) { const an = rnd(0, TAU), r = Math.max(w, h) * rnd(.6, .8); this.P.push({ a: an, r, v: rnd(.6, 1.2), col: Math.random() < .3 ? '#ffffff' : tc, s: rnd(1, 3), rot: rnd(0, TAU) }); }
      if (tier >= 6) for (let i = 0; i < 3; i++) this.warp.push({ a: rnd(0, TAU), r: rnd(10, 60), v: rnd(600, 1400), l: 0 });
    }
    const pull = 1 + t / this.T1 * 3;
    for (let i = this.P.length - 1; i >= 0; i--) { const p = this.P[i]; p.r -= p.v * 260 * pull * dt; p.a += dt * (tier >= 8 ? 2.4 : .6); if (p.r < 8) this.P.splice(i, 1); }
    for (let i = this.warp.length - 1; i >= 0; i--) { const p = this.warp[i]; p.r += p.v * dt; p.l += dt; if (p.r > Math.max(w, h)) this.warp.splice(i, 1); }
    for (const wv of this.waves) wv.l += dt;
    for (const sh of this.shards) { sh.l += dt; sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.vy += 500 * dt; sh.rot += sh.vr * dt; }
    for (let i = this.sparks.length - 1; i >= 0; i--) { const p = this.sparks[i]; p.l += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96; if (p.l > p.m) this.sparks.splice(i, 1); }
    if (t > this.T2) this.fx.update(dt, t, 1.3);
    if (this.env) this.env.update(dt, w, h, t);
    // ── 그리기
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const calm = calmFX(), shk = this.shake * (calm ? .15 : 1), sx = (Math.random() - .5) * shk, sy = (Math.random() - .5) * shk;
    ctx.save(); ctx.translate(sx, sy);
    if (this.env) {
      ctx.globalAlpha = 1; this.env.draw(ctx, w, h, t);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = t < this.T2 ? .7 - Math.min(.3, t / this.T1 * .3) : .45; ctx.fillStyle = '#040310'; ctx.fillRect(-20, -20, w + 40, h + 40);
      ctx.globalAlpha = Math.max(0, 1 - t / .35); ctx.fillStyle = '#040310'; ctx.fillRect(-20, -20, w + 40, h + 40);
    } else {
      ctx.globalAlpha = Math.min(1, t / .35); ctx.fillStyle = '#040310'; ctx.fillRect(-20, -20, w + 40, h + 40);
      if (t > this.T2 && tier >= 6) { ctx.globalCompositeOperation = 'lighter'; const k = Math.min(1, (t - this.T2) / 1.5); glow(ctx, a.c, cx - w * .3, cy - h * .1, w * .8, .18 * k); glow(ctx, a.c2, cx + w * .3, cy + h * .15, w * .8, .14 * k); }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.warp) { const L = 40 + p.v * .06; ctx.globalAlpha = Math.min(1, p.l * 3) * .5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(p.a) * p.r, cy + Math.sin(p.a) * p.r); ctx.lineTo(cx + Math.cos(p.a) * (p.r - L), cy + Math.sin(p.a) * (p.r - L)); ctx.stroke(); }
    const shape = this.ex ? CUT_SHAPE[this.ex] : 'dot';
    for (const p of this.P) {
      const x = cx + Math.cos(p.a) * p.r, y = cy + Math.sin(p.a) * p.r * .8; ctx.globalAlpha = .9;
      if (shape === 'flake') { ctx.strokeStyle = p.col; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 3; i++) { const an = p.rot + i * Math.PI / 3; ctx.moveTo(x + Math.cos(an) * p.s * 2, y + Math.sin(an) * p.s * 2); ctx.lineTo(x - Math.cos(an) * p.s * 2, y - Math.sin(an) * p.s * 2); } ctx.stroke(); }
      else if (shape === 'sq') { ctx.fillStyle = p.col; ctx.fillRect(x, y, p.s * 3, p.s * 1.4); }
      else if (shape === 'petal') { ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(x, y, p.s * 2, p.s, p.rot + p.a, 0, TAU); ctx.fill(); }
      else if (shape === 'rain' || shape === 'streak') { ctx.strokeStyle = p.col; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(p.a) * 18, y + Math.sin(p.a) * 14); ctx.stroke(); }
      else { glow(ctx, p.col, x, y, p.s * 4, .7); ctx.globalAlpha = 1; ctx.fillStyle = p.col; ctx.fillRect(x - p.s / 2, y - p.s / 2, p.s, p.s); }
    }
    const Rb = Math.min(w, h) * .12;
    if (t < this.T2) {
      const k = t < this.T1 ? t / this.T1 : 1 - (t - this.T1) / (this.T2 - this.T1);
      const rr = Rb * (.25 + k * 1.1) * (1 + .08 * Math.sin(t * 20));
      glow(ctx, tc, cx, cy, rr * 3, .7); glow(ctx, '#ffffff', cx, cy, rr, .9);
      if (tier >= 5 && t < this.T1) { ctx.strokeStyle = tc; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.globalAlpha = .4; ctx.beginPath(); ctx.arc(cx, cy, rr * (1.6 + i * .5) * (1 + ((t * 2 + i / 3) % 1) * .3), t * (3 + i), t * (3 + i) + 2.4); ctx.stroke(); } }
      if (tier >= 8 && t < this.T1) {
        ctx.globalCompositeOperation = 'source-over';
        for (let i = 0; i < 5; i++) { ctx.strokeStyle = rgba(i % 2 ? a.c2 : a.c, .3); ctx.lineWidth = 6; ctx.beginPath(); for (let j = 0; j < 40; j++) { const r = j * Math.max(w, h) / 70, an = i * TAU / 5 + j * .18 - t * 3; ctx.lineTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r * .8); } ctx.stroke(); }
        ctx.globalCompositeOperation = 'lighter';
      }
    } else {
      const u = t - this.T2, k = Math.min(1, u / .6), R = Rb * (.6 + .4 * ease(k)) * .9;
      if (tier >= 6) { // 배경 마법진
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(u * .15); ctx.globalAlpha = Math.min(.5, u * .6); ctx.strokeStyle = a.c; ctx.lineWidth = 1.5;
        const RR = Math.min(w, h) * .42;
        ctx.beginPath(); ctx.arc(0, 0, RR, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, RR * .86, 0, TAU); ctx.stroke();
        ctx.beginPath(); for (let i = 0; i <= 8; i++) { const an = i * TAU / 8 * 3; ctx.lineTo(Math.cos(an) * RR * .86, Math.sin(an) * RR * .86); } ctx.stroke();
        ctx.fillStyle = a.c; for (let i = 0; i < 24; i++) { ctx.save(); ctx.rotate(i * TAU / 24); ctx.fillRect(-2, -RR * .97, 4, i % 3 ? 6 : 12); ctx.restore(); }
        ctx.restore();
        if (a.sym) { ctx.save(); ctx.globalAlpha = Math.min(.9, u * .8); ctx.fillStyle = mix(a.c, '#ffffff', .5); ctx.shadowColor = a.c; ctx.shadowBlur = 20; ctx.font = `${Math.round(Math.min(w, h) * .09)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a.sym, cx, cy - Math.min(w, h) * .32); ctx.restore(); }
      }
      this.fx.drawBack(ctx, cx, cy, R, t);
      drawHero(ctx, cx, cy, R * 1.15, a, t, { raise: Math.max(0, 1 - u * .6), joy: u > 1.2 ? .5 : 0 });
      this.fx.drawFront(ctx, cx, cy, R, t);
      ctx.globalCompositeOperation = 'lighter';
      for (const wv of this.waves) { if (wv.l < 0) continue; const q = Math.min(1, wv.l / 1.4); ctx.globalAlpha = (1 - q) * .8; ctx.strokeStyle = wv.l < .1 ? '#ffffff' : a.c; ctx.lineWidth = 8 * (1 - q) + 1; ctx.beginPath(); ctx.arc(cx, cy, R + ease(q) * Math.max(w, h) * .7, 0, TAU); ctx.stroke(); }
      for (const p of this.sparks) { const q = 1 - p.l / p.m; glow(ctx, p.c, p.x, p.y, p.s * 4, q * .8); }
      for (const cr of this.cracks) { const q = Math.max(0, 1 - u / 1.2); if (!q) continue; ctx.globalAlpha = q; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath(); cr.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.globalAlpha = q * .4; ctx.strokeStyle = a.c; ctx.lineWidth = 5; ctx.stroke(); }
      ctx.globalCompositeOperation = 'source-over';
      for (const sh of this.shards) { const q = Math.max(0, 1 - sh.l / 1.3); if (!q) continue; ctx.save(); ctx.translate(sh.x, sh.y); ctx.rotate(sh.rot); ctx.beginPath(); sh.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.globalAlpha = q * .22; ctx.fillStyle = '#dfe8ff'; ctx.fill(); ctx.globalAlpha = q * .8; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore(); }
      this.text(ctx, w, h, u);
    }
    if (tier >= 5) { const lb = h * .1 * Math.min(1, t / .5); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(-20, -20, w + 40, lb + 20); ctx.fillRect(-20, h - lb, w + 40, lb + 20); }
    ctx.restore();
    if (this.flash > 0) { ctx.globalCompositeOperation = tier >= 8 && t < this.T2 + .15 && !calm ? 'difference' : 'source-over'; ctx.globalAlpha = this.flash * (calm ? .3 : 1); ctx.fillStyle = t > this.T2 ? mix(a.c, '#ffffff', .6) : '#ffffff'; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over'; }
  }
  text(ctx, w, h, u) {
    const a = this.a, tier = this.tier, cy = h * .66, o = this.opt;
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const big = Math.min(54, w * .12);
    if (o.label) { ctx.globalAlpha = Math.min(1, u * 2); ctx.fillStyle = '#ffe9a8'; ctx.font = `700 ${Math.round(big * .3)}px 'Noto Sans KR', sans-serif`; ctx.fillText(o.label, w / 2, cy - big * 1.05); }
    const n = Math.floor(clamp((u - .15) * 12, 0, a.n.length));
    let name = a.n.slice(0, n);
    if (tier >= 8 && u < 1.2) { const g = '#$%&@!?ΣΨΩ∆◇'; name = a.n.split('').map((ch, i) => i < n && Math.random() > (1.2 - u) ? ch : g[Math.floor(Math.random() * g.length)]).join(''); }
    ctx.font = `900 ${big}px 'Noto Sans KR', sans-serif`;
    ctx.shadowColor = a.c; ctx.shadowBlur = 24; ctx.globalAlpha = 1;
    if (o.shiny) { const g = ctx.createLinearGradient(w * .2, 0, w * .8, 0); for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, hsl(u * 120 + i * 60, 1, .78)); ctx.fillStyle = g; }
    else ctx.fillStyle = mix(a.c, '#ffffff', .35);
    ctx.fillText(name, w / 2, cy);
    ctx.shadowBlur = 0;
    const lk = clamp((u - .35) / .5, 0, 1), lw = Math.min(w * .7, big * 5) * ease(lk);
    const lg = ctx.createLinearGradient(w / 2 - lw / 2, 0, w / 2 + lw / 2, 0); lg.addColorStop(0, rgba(a.c, 0)); lg.addColorStop(.5, rgba(a.c, .9)); lg.addColorStop(1, rgba(a.c, 0));
    ctx.fillStyle = lg; ctx.fillRect(w / 2 - lw / 2, cy + big * .5, lw, 2);
    const k2 = clamp((u - .6) / .5, 0, 1);
    ctx.globalAlpha = k2;
    ctx.font = `700 ${Math.round(big * .3)}px 'Cinzel', serif`; ctx.fillStyle = '#ffffff';
    ctx.fillText(a.en.toUpperCase().split('').join(' '), w / 2, cy + big * .85);
    ctx.font = `700 ${Math.round(big * .34)}px 'Noto Sans KR', sans-serif`; ctx.fillStyle = typeof tierColor === 'function' ? tierColor(a) : TIERS[tier].c;
    ctx.fillText(`${a.fusion ? '융합 · ' : ''}${typeof tierLabel === 'function' ? tierLabel(a) : TIERS[tier].n}  ·  1 / ${Math.round(a.r).toLocaleString('en-US')}`, w / 2, cy + big * 1.5);
    let yy = cy + big * 2.1; ctx.font = `700 ${Math.round(big * .27)}px 'Noto Sans KR', sans-serif`;
    if (a.d && u > .9) { ctx.globalAlpha = clamp((u - .9) / .5, 0, 1) * .85; ctx.fillStyle = '#e8e2ff'; ctx.font = `400 ${Math.round(big * .25)}px 'Noto Sans KR', sans-serif`; ctx.fillText(`“${a.d}”`, w / 2, yy); yy += big * .55; ctx.globalAlpha = k2; ctx.font = `700 ${Math.round(big * .27)}px 'Noto Sans KR', sans-serif`; }
    if (o.shiny) { ctx.fillStyle = hsl(u * 140, 1, .8); ctx.fillText('✦ 빛나는 변이 ✦', w / 2, yy); yy += big * .55; }
    if (a.biome) { ctx.fillStyle = BIOMES[a.biome].c; ctx.fillText(`◆ ${BIOMES[a.biome].n} 한정 ◆`, w / 2, yy); yy += big * .55; }
    else if (a.night || a.day) { ctx.fillStyle = a.night ? '#b8c4ff' : '#ffd88a'; ctx.fillText(a.night ? '☾ 밤 한정 ☾' : '☀ 낮 한정 ☀', w / 2, yy); yy += big * .55; }
    else if (a.summer || a.summerRoll) { ctx.fillStyle = '#55e7ff'; ctx.fillText('☀ 여름 축제 한정 ☀', w / 2, yy); yy += big * .55; }
    else if (a.mg) { ctx.fillStyle = '#ff9ad8'; ctx.fillText('♡ 매지컬 걸 ♡', w / 2, yy); yy += big * .55; }
    if (o.isNew) { ctx.fillStyle = '#ffd36a'; ctx.font = `900 ${Math.round(big * .3)}px 'Noto Sans KR', sans-serif`; ctx.fillText('★ 첫 발견 ★', w / 2, yy); }
    if (this.canClose() && !o.auto) { ctx.globalAlpha = .45 + .3 * Math.sin(u * 4); ctx.fillStyle = '#ffffff'; ctx.font = `400 13px 'Noto Sans KR', sans-serif`; ctx.fillText('화면을 눌러 계속', w / 2, h * .93); }
    ctx.restore();
  }
}

/* ── 메인 화면 결과 폭발 ── */
class Burst {
  constructor() { this.P = []; this.R = []; }
  fire(a, tier, shiny) {
    const n = 8 + tier * 14 + (shiny ? 30 : 0);
    for (let i = 0; i < n; i++) { const an = rnd(0, TAU), sp = rnd(.8, 2.5 + tier * .5); this.P.push({ x: 0, y: 0, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 0, m: rnd(.5, 1.1 + tier * .1), c: shiny ? hsl(rnd(0, 360), 1, .72) : pick([a.c, a.c, a.c2, '#ffffff']), s: rnd(.03, .08) }); }
    for (let i = 0; i < 1 + Math.floor(tier / 3); i++) this.R.push({ l: -i * .12, c: i % 2 ? a.c2 : a.c });
  }
  draw(ctx, cx, cy, R, dt) {
    if (!this.P.length && !this.R.length) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = this.P.length - 1; i >= 0; i--) { const p = this.P[i]; p.l += dt; if (p.l > p.m) { this.P.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .95; p.vy = p.vy * .95 + dt * .6; const q = 1 - p.l / p.m; glow(ctx, p.c, cx + p.x * R, cy + p.y * R, p.s * R * 4, q); }
    for (let i = this.R.length - 1; i >= 0; i--) { const r = this.R[i]; r.l += dt; if (r.l > .8) { this.R.splice(i, 1); continue; } if (r.l < 0) continue; const q = r.l / .8; ctx.globalAlpha = (1 - q) * .8; ctx.strokeStyle = r.c; ctx.lineWidth = R * .08 * (1 - q) + 1; ctx.beginPath(); ctx.arc(cx, cy, R * (1.1 + ease(q) * 2.4), 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
}
