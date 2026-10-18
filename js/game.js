'use strict';
/* ===== VOIDROLL : RENEWAL — 게임 ===== */
const $ = s => document.querySelector(s);
const fmt = n => Math.round(n).toLocaleString('en-US');
const fmtX = n => n >= 1000 ? '×' + fmt(n) : '×' + (Math.round(n * 100) / 100).toFixed(2);
const mmss = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const SAVE_KEY = 'voidroll_renewal_v1';
const AMAP = Object.fromEntries(AURAS.map(a => [a.id, a]));
const SORTED = [...AURAS].sort((a, b) => b.r - a.r);

/* ── 상태 ── */
let S;
function defState() {
  return { v: 1, rolls: 0, auras: {}, found: {}, eq: null, mats: {}, pots: { lucky: 2 }, gaunts: {}, eqG: null, active: {}, next: 1,
    biome: 'normal', biomeEnd: Date.now() + 150000, seen: { normal: 1 }, quests: {}, best: null, gateOpen: false,
    stats: { pots: 0, crafted: 0, play: 0, cuts: 0, sacr: 0 }, log: [],
    set: { sound: true, cut: 4, quick: false, low: false, haptic: true } };
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (d && d.v === 1) { const df = defState(); S = Object.assign(df, d); S.set = Object.assign(df.set, d.set || {}); S.stats = Object.assign(defState().stats, d.stats || {}); return; }
  } catch (e) { }
  S = defState();
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }

/* ── 행운 · 속도 ── */
const gnt = () => S.eqG ? GAUNTLETS[S.eqG] : null;
function activeOn(id) { return S.active[id] && S.active[id] > Date.now(); }
function potLuck() { let m = 1; for (const id in S.active) if (activeOn(id) && POTIONS[id].eff.luck) m *= POTIONS[id].eff.luck; return m; }
function potSpeed() { let s = 0; for (const id in S.active) if (activeOn(id) && POTIONS[id].eff.speed) s += POTIONS[id].eff.speed; return s; }
function baseLuck() { const g = gnt(); return (1 + (g ? g.luck : 0)) * potLuck(); }
function speed() { const g = gnt(); return 1 + (g ? g.speed : 0) + potSpeed(); }
function tenthMult() { const g = gnt(); return g && g.tenth ? g.tenth : 2; }
const isTenth = () => (S.rolls + 1) % 10 === 0;
function effR(a, b) { let r = a.r; if (a.boost && a.boost.b === b) r /= a.boost.x; return r; }
function eligible(a, b) { return !a.biome || a.biome === b || b === 'glitch'; }
function rollAura(luck) {
  const b = S.biome;
  for (const a of SORTED) { if (a.id === 'faint' || !eligible(a, b)) continue; if (Math.random() < luck / effR(a, b)) return a; }
  return AMAP.faint;
}
function avail(id) { return (S.auras[id] || 0) - (S.eq === id ? 1 : 0); }

/* ── 오디오 ── */
const AU = {
  c: null, m: null, nb: null,
  init() {
    if (this.c) { if (this.c.state === 'suspended') this.c.resume(); return; }
    try {
      this.c = new (window.AudioContext || window.webkitAudioContext)(); this.m = this.c.createGain(); this.m.gain.value = .55; this.m.connect(this.c.destination);
      const len = this.c.sampleRate * 2, buf = this.c.createBuffer(1, len, this.c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this.nb = buf;
    } catch (e) { this.c = null; }
  },
  ok() { return this.c && S.set.sound; },
  tone(f, d, type = 'sine', v = .2, f2 = null, delay = 0) {
    if (!this.ok()) return; const c = this.c, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.m); o.start(t); o.stop(t + d + .05);
  },
  noise(d, v = .2, f0 = 800, f1 = null, delay = 0, type = 'bandpass') {
    if (!this.ok()) return; const c = this.c, t = c.currentTime + delay, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.nb; fl.type = type; fl.frequency.setValueAtTime(f0, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + d); fl.Q.value = 1.2;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + Math.min(.05, d / 3)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(this.m); s.start(t); s.stop(t + d + .05);
  },
  tick(k) { this.tone(700 + k * 700, .035, 'square', .025); },
  ui() { this.tone(720, .06, 'sine', .06); },
  chime(tier) {
    const base = [392, 440, 523, 587, 659, 740, 784, 880, 988][tier], ivs = [1, 1.26, 1.5, 2, 2.52, 3];
    const n = Math.min(6, 2 + Math.floor(tier / 2));
    for (let i = 0; i < n; i++) this.tone(base * ivs[i], .45 + tier * .12, 'triangle', .07, null, i * .06);
    if (tier >= 3) this.tone(base / 2, 1 + tier * .2, 'sine', .12);
  },
  whoosh(d) { this.noise(d, .18, 200, 4000, 0, 'bandpass'); this.tone(80, d, 'sawtooth', .04, 400); },
  boom() { this.tone(120, 1.4, 'sine', .45, 28); this.noise(1, .4, 1200, 120, 0, 'lowpass'); },
  get() { this.tone(980, .08, 'sine', .06); this.tone(1470, .12, 'sine', .05, null, .05); },
};
function buzz(ms) { if (S.set.haptic && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } }

/* ── 아이콘 ── */
function icon(type, c, s = 22) {
  const P = {
    dust: `<circle cx="8" cy="14" r="2" fill="${c}"/><circle cx="14" cy="9" r="2.6" fill="${c}"/><circle cx="16" cy="16" r="1.6" fill="${c}"/><circle cx="11" cy="18" r="1.2" fill="${c}" opacity=".6"/><path d="M17 4l.8 2 2 .8-2 .8L17 10l-.8-2.4-2-.8 2-.8z" fill="#fff"/>`,
    feather: `<path d="M18 3C10 4 6 10 5 19l2 2c2-6 6-10 11-12-3 0-5 1-7 2 2-3 5-5 7-8z" fill="${c}"/><path d="M5 19L15 7" stroke="#fff" stroke-width="1" opacity=".7"/>`,
    pearl: `<circle cx="12" cy="13" r="7" fill="${c}"/><circle cx="9.5" cy="10.5" r="2.4" fill="#fff" opacity=".7"/><path d="M12 2c2 3 3 4 3 6a3 3 0 01-6 0c0-2 1-3 3-6z" fill="${c}" opacity=".7"/>`,
    crystal: `<path d="M12 2l6 7-6 13-6-13z" fill="${c}"/><path d="M12 2l6 7h-12z" fill="#fff" opacity=".45"/><path d="M12 9v13" stroke="#fff" opacity=".5"/>`,
    glass: `<path d="M5 4h14l-3 16H8z" fill="${c}" opacity=".85"/><path d="M7 6h4l-1 10H8z" fill="#fff" opacity=".45"/><circle cx="12" cy="3" r="2" fill="#fff"/>`,
    star: `<path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" fill="${c}"/>`,
    flame: `<path d="M12 2c1 4 6 6 6 12a6 6 0 01-12 0c0-3 2-5 3-6 0 2 1 3 2 3-1-3 0-6 1-9z" fill="${c}"/><path d="M12 13c1 2 3 3 3 5a3 3 0 01-6 0c0-2 2-3 3-5z" fill="#ffe08a"/>`,
    byte: `<rect x="3" y="5" width="18" height="14" rx="2" fill="${c}"/><text x="12" y="16" font-size="8" font-family="monospace" text-anchor="middle" fill="#000" font-weight="700">01</text>`,
    void: `<circle cx="12" cy="12" r="8" fill="#0a0418" stroke="${c}" stroke-width="2"/><ellipse cx="12" cy="12" rx="11" ry="3.5" fill="none" stroke="${c}" stroke-width="1.2" transform="rotate(-15 12 12)"/>`,
    potion: `<path d="M9 2h6v2h-1v4.5l5 8.5a3 3 0 01-2.6 4.5H7.6A3 3 0 015 16.5l5-8.5V4H9z" fill="rgba(255,255,255,.12)" stroke="#fff" stroke-opacity=".5"/><path d="M7 14h10l2 3a2 2 0 01-1.8 3H6.8A2 2 0 015 17z" fill="${c}"/><circle cx="10" cy="17" r="1" fill="#fff" opacity=".7"/>`,
    elixir: `<path d="M12 2l3 5v3l4 4v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6l4-4V7z" fill="rgba(255,255,255,.12)" stroke="#fff" stroke-opacity=".5"/><path d="M6 15h12v5a1 1 0 01-1 1H7a1 1 0 01-1-1z" fill="${c}"/><path d="M12 9l1 2 2 .5-2 .5-1 2-1-2-2-.5 2-.5z" fill="${c}"/>`,
    compass: `<circle cx="12" cy="12" r="9" fill="rgba(255,255,255,.08)" stroke="${c}" stroke-width="1.6"/><path d="M12 5l2.5 7-2.5 7-2.5-7z" fill="${c}"/><path d="M12 5l2.5 7h-5z" fill="#fff"/>`,
    key: `<circle cx="8" cy="12" r="4.5" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M12 12h9M18 12v3M21 12v2" stroke="${c}" stroke-width="2.4"/>`,
    glove: `<path d="M7 21v-8L5 9a1.4 1.4 0 012.4-1.4L9 10V4a1.3 1.3 0 012.6 0v5V3a1.3 1.3 0 012.6 0v6-4a1.3 1.3 0 012.6 0v5-2a1.3 1.3 0 012.6 0v6c0 4-2 6-4 7v2z" fill="${c}"/><rect x="7" y="18" width="10" height="3.5" rx="1" fill="#fff" opacity=".35"/>`,
    map: `<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 4v14M15 6v14" stroke="currentColor" stroke-width="1.8"/>`,
    book: `<path d="M4 5a2 2 0 012-2h12v15H6a2 2 0 00-2 2z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 20a2 2 0 012-2h12v3H6a2 2 0 01-2-1z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="11" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>`,
    bag: `<path d="M5 8h14l-1 12H6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 016 0v2" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
    quest: `<path d="M6 3h10l3 3v15H6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 10l2 2 4-4M9 16h7" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
    gear: `<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  };
  return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${P[type] || P.dust}</svg>`;
}
const POT_ICON = { lucky: 'potion', swift: 'potion', fortune: 'potion', haste: 'potion', starlit: 'elixir', voidelixir: 'elixir', compass: 'compass', glitchkey: 'key' };
function potIcon(id, s) { return icon(POT_ICON[id], POTIONS[id].c, s); }
function orbCSS(a, sz = 40) {
  const t = tierOf(a.r);
  return `<span class="morb" style="width:${sz}px;height:${sz}px;background:radial-gradient(circle at 35% 30%,#fff,${a.c} 38%,${a.c2} 78%,#000);box-shadow:0 0 ${4 + t * 3}px ${a.c}${t >= 4 ? `,0 0 ${t * 6}px ${a.c}` : ''}"></span>`;
}

/* ── 화면 / 캔버스 ── */
const cv = $('#scene'), ctx = cv.getContext('2d'), cutCv = $('#cut');
let W = 0, H = 0, DPR = 1, T = 0, started = false;
const bfx = new BiomeFX(), afx = new AuraFX(), CUT = new Cutscene(cutCv);
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, S && S.set.low ? 1 : 2); W = innerWidth; H = innerHeight;
  for (const c of [cv, cutCv]) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); }
}
addEventListener('resize', resize);

/* ── 굴림 ── */
const RS = { on: false, t: 0, dur: 1, res: null, extra: null, nt: 0, isNew: false, auto: false };
function startRoll() {
  if (RS.on || CUT.on || !started) return;
  const tenth = isTenth(), usedNext = S.next > 1;
  const luck = baseLuck() * (tenth ? tenthMult() : 1) * S.next;
  S.next = 1;
  const a = rollAura(luck);
  const g = gnt(); let extra = null;
  if (g && g.dbl && Math.random() < g.dbl) extra = rollAura(baseLuck());
  S.rolls++;
  const tier = tierOf(a.r);
  let dur = 1.6 / speed(); if (S.set.quick && tier < 3) dur *= .4; if (tier >= 4) dur = Math.max(dur, 1.1);
  Object.assign(RS, { on: true, t: 0, dur: Math.max(.3, dur), res: a, extra, nt: 0, isNew: !S.found[a.id], tenth, usedNext, luck });
  grant(a); if (extra) grant(extra);
  dropMat(); checkQuests(); save(); updHUD();
  $('#rollBtn').classList.add('busy');
}
function grant(a) {
  S.auras[a.id] = (S.auras[a.id] || 0) + 1; S.found[a.id] = 1;
  if (!S.best || a.r > AMAP[S.best].r) S.best = a.id;
  if (!S.eq) S.eq = a.id;
  if (tierOf(a.r) >= 3) { S.log.unshift({ id: a.id, at: Date.now(), b: S.biome, n: S.rolls }); S.log.length = Math.min(S.log.length, 30); }
}
function teasePick(k) {
  const res = RS.res, rt = tierOf(res.r);
  const pool = AURAS.filter(a => !a.biome || eligible(a, S.biome));
  if (k > .82 && rt >= 3 && Math.random() < .5) return pick(pool.filter(a => tierOf(a.r) >= rt - 1));
  if (Math.random() < .7) return pick(pool.filter(a => tierOf(a.r) <= 2));
  return pick(pool);
}
function updRoll(dt) {
  if (!RS.on) return;
  RS.t += dt; const k = RS.t / RS.dur;
  $('#rollBar').style.width = Math.min(100, k * 100) + '%';
  if (k < 1 && RS.t >= RS.nt) {
    const a = teasePick(k); setName(a, false); AU.tick(k);
    RS.nt = RS.t + (.045 + .22 * k * k) * clamp(RS.dur / 1.6, .35, 1);
  }
  if (k >= 1) { RS.on = false; finishRoll(); }
}
function finishRoll() {
  const a = RS.res, tier = tierOf(a.r);
  $('#rollBar').style.width = '0';
  showResult(a, RS.isNew);
  AU.chime(tier);
  if (tier >= 3) buzz(tier >= 5 ? [40, 40, 80] : 30);
  if (RS.extra) setTimeout(() => toast(`오류 장갑 발동! 추가 획득 · <b style="color:${RS.extra.c}">${RS.extra.n}</b>`), 300);
  const cutOk = S.set.cut < 99 && tier >= S.set.cut;
  if (cutOk) {
    S.stats.cuts++;
    AU.whoosh(1.2 + tier * .4);
    CUT.start(a, { isNew: RS.isNew, auto: RS.auto, boom: () => { AU.boom(); AU.chime(tier); buzz(120); }, fake: () => AU.tone(200, .3, 'sine', .2, 60), done: afterRoll });
  } else afterRoll();
}
function afterRoll() {
  $('#rollBtn').classList.remove('busy'); updHUD();
  if (RS.auto) setTimeout(() => { if (RS.auto) startRoll(); }, 120);
}
function setName(a, final) {
  const el = $('#rName'); el.textContent = a.n; el.style.color = mix(a.c, '#ffffff', .25);
  if (!final) { $('#rEn').textContent = a.en.toUpperCase(); $('#rMeta').innerHTML = '<span class="dim">굴리는 중…</span>'; }
}
function showResult(a, isNew) {
  setName(a, true);
  const el = $('#rName'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  const tier = tierOf(a.r), b = S.biome, er = effR(a, b);
  $('#rEn').textContent = a.en.toUpperCase();
  $('#rMeta').innerHTML = `<span class="tierTag" style="color:${TIERS[tier].c}">${TIERS[tier].n}</span>1 / ${fmt(a.r)}${er < a.r ? ` <span class="dim">(지금 1/${fmt(er)})</span>` : ''}${a.biome ? ` <span class="btag" style="color:${BIOMES[a.biome].c}">◆${BIOMES[a.biome].n}</span>` : ''}${isNew ? ' <span class="newTag">NEW</span>' : ''}`;
}
function showIdle() {
  const a = S.eq ? AMAP[S.eq] : null;
  if (!a) { $('#rName').textContent = 'VOIDROLL'; $('#rName').style.color = '#d9d0ff'; $('#rEn').textContent = 'R E N E W A L'; $('#rMeta').innerHTML = '<span class="dim">ROLL을 눌러 운명을 굴려보세요</span>'; return; }
  showResult(a, false); $('#rName').classList.remove('pop');
  $('#rMeta').innerHTML = `<span class="dim">장착 중</span> · ` + $('#rMeta').innerHTML;
}

/* ── 재료 ── */
function dropMat() {
  const b = S.biome; if (Math.random() >= (b === 'normal' ? .11 : .1)) return;
  let m = BIOMES[b].mat; if (b === 'glitch' && Math.random() < .5) m = pick(Object.keys(MATS).filter(x => x !== 'voiddust'));
  const n = Math.random() < .15 ? 2 : 1; S.mats[m] = (S.mats[m] || 0) + n;
  floatChip(`${icon(MATS[m].ic, MATS[m].c, 16)} +${n} ${MATS[m].n}`);
}
function floatChip(html) {
  const d = document.createElement('div'); d.className = 'float'; d.innerHTML = html; $('#floats').appendChild(d);
  setTimeout(() => d.remove(), 1700);
}

/* ── 날씨 ── */
function pickBiome(exclude, specialOnly = true) {
  const ent = Object.entries(BIOMES).filter(([k, b]) => k !== exclude && b.w > 0 && (k !== 'void' || S.gateOpen));
  let tot = ent.reduce((s, [, b]) => s + b.w, 0), r = Math.random() * tot;
  for (const [k, b] of ent) { r -= b.w; if (r <= 0) return k; } return ent[0][0];
}
function setBiome(k, durSec, quiet) {
  const B = BIOMES[k]; S.biome = k; S.biomeEnd = Date.now() + (durSec || rnd(B.dur[0], B.dur[1])) * 1000;
  const first = !S.seen[k]; S.seen[k] = 1; bfx.set(k);
  if (!quiet) { banner(k, first); AU.tone(330, .8, 'sine', .08, 660); }
  updHUD(); checkQuests(); save();
}
function tickBiome() {
  if (Date.now() < S.biomeEnd) return;
  if (S.biome === 'normal') { if (Math.random() < .45) setBiome('normal', null, true); else setBiome(pickBiome('normal')); }
  else setBiome('normal');
}
function banner(k, first) {
  const B = BIOMES[k], el = $('#banner');
  el.innerHTML = `<small>날씨가 바뀌었습니다${first ? ' · 첫 관측!' : ''}</small><b style="color:${B.c}">${B.n}</b><span>${B.en}</span>`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

/* ── HUD ── */
function updHUD() {
  const B = BIOMES[S.biome];
  $('#biomeChip').style.setProperty('--bc', B.c); $('#biomeName').textContent = B.n;
  $('#luckVal').textContent = fmtX(baseLuck()); $('#spdVal').textContent = fmtX(speed()); $('#rollVal').textContent = fmt(S.rolls);
  const left = 10 - (S.rolls % 10);
  $('#tenth').innerHTML = left === 1 ? `<b class="hot">다음 굴림 행운 ×${tenthMult()}!</b>` : `${tenthMult()}배 보너스까지 <b>${left}</b>회`;
  // 버프
  let h = '';
  for (const id in S.active) { const s = (S.active[id] - Date.now()) / 1000; if (s > 0) h += `<div class="buff">${potIcon(id, 18)}${POTIONS[id].n} <b>${mmss(s)}</b></div>`; }
  if (S.next > 1) h += `<div class="buff hot">${icon('elixir', '#ffe9a8', 18)}다음 굴림 <b>${fmtX(S.next)}</b></div>`;
  if (S.eqG) h += `<div class="buff">${icon('glove', GAUNTLETS[S.eqG].c, 18)}${GAUNTLETS[S.eqG].n}</div>`;
  $('#buffs').innerHTML = h;
  $('#autoBtn').classList.toggle('on', RS.auto); $('#quickBtn').classList.toggle('on', S.set.quick);
  const qn = QUESTS.some(q => !S.quests[q.id] && qDone(q));
  $('#qdot').style.display = qn ? 'block' : 'none';
}
function updBiomeTime() { $('#biomeTime').textContent = mmss((S.biomeEnd - Date.now()) / 1000); }

/* ── 퀘스트 ── */
function qDone(q) { const [v, g] = q.goal(S); return v >= g; }
function checkQuests() {
  if (!S.gateOpen && found(S) >= 20) { S.gateOpen = true; setTimeout(() => toast('<b style="color:#b89cff">공허의 문</b>이 열렸습니다. 지도에서 확인하세요.'), 600); }
  updHUD();
}
function giveReward(rw) {
  const out = [];
  for (const id in rw.pots || {}) { S.pots[id] = (S.pots[id] || 0) + rw.pots[id]; out.push(`${POTIONS[id].n} ×${rw.pots[id]}`); }
  for (const id in rw.mats || {}) { S.mats[id] = (S.mats[id] || 0) + rw.mats[id]; out.push(`${MATS[id].n} ×${rw.mats[id]}`); }
  return out.join(', ');
}
function rwText(rw) {
  const out = [];
  for (const id in rw.pots || {}) out.push(`${potIcon(id, 16)}${POTIONS[id].n} ×${rw.pots[id]}`);
  for (const id in rw.mats || {}) out.push(`${icon(MATS[id].ic, MATS[id].c, 16)}${MATS[id].n} ×${rw.mats[id]}`);
  return out.join(' ');
}

/* ── 비용 ── */
function canPay(cost) { for (const k in cost) { if (k[0] === '@') { if (avail(k.slice(1)) < cost[k]) return false; } else if ((S.mats[k] || 0) < cost[k]) return false; } return true; }
function pay(cost) { for (const k in cost) { if (k[0] === '@') S.auras[k.slice(1)] -= cost[k]; else S.mats[k] -= cost[k]; } }
function costHTML(cost) {
  return '<div class="cost">' + Object.entries(cost).map(([k, n]) => {
    if (k[0] === '@') { const a = AMAP[k.slice(1)], have = Math.max(0, avail(a.id)); const known = S.found[a.id];
      return `<span class="cc ${have >= n ? '' : 'no'}">${orbCSS(a, 14)}${known ? a.n : '???'}<i style="color:${TIERS[tierOf(a.r)].c}">${known ? '' : TIERS[tierOf(a.r)].n}</i> ${have}/${n}</span>`; }
    const m = MATS[k], have = S.mats[k] || 0;
    return `<span class="cc ${have >= n ? '' : 'no'}">${icon(m.ic, m.c, 14)}${m.n} ${have}/${n}</span>`;
  }).join('') + '</div>';
}

/* ── 시트(패널) ── */
const SH = { stack: [], cur: null, previews: [] };
function openSheet(title, render, push = false) {
  if (push && SH.cur) SH.stack.push(SH.cur); else if (!push) SH.stack = [];
  SH.cur = { title, render }; drawSheet();
  $('#sheet').classList.remove('hide');
}
function drawSheet() {
  SH.previews = [];
  $('#shTitle').innerHTML = SH.cur.title; $('#shBack').style.visibility = SH.stack.length ? 'visible' : 'hidden';
  const b = $('#shBody'), st = b.scrollTop; b.innerHTML = ''; SH.cur.render(b); b.dataset.keep && (b.scrollTop = st);
}
function refreshSheet() { if (!$('#sheet').classList.contains('hide') && SH.cur) { const b = $('#shBody'), st = b.scrollTop; drawSheet(); b.scrollTop = st; } }
function closeSheet() { $('#sheet').classList.add('hide'); SH.stack = []; SH.cur = null; SH.previews = []; }
function backSheet() { if (!SH.stack.length) return closeSheet(); SH.cur = SH.stack.pop(); drawSheet(); }
$('#shClose').onclick = () => { AU.ui(); closeSheet(); };
$('#shBack').onclick = () => { AU.ui(); backSheet(); };
$('#sheet').addEventListener('pointerdown', e => { if (e.target.id === 'sheet') closeSheet(); });
function h(html) { const d = document.createElement('div'); d.innerHTML = html; return d; }
function addPreview(host, a, height = 240) {
  const c = document.createElement('canvas'); c.className = 'preview'; c.style.height = height + 'px'; host.appendChild(c);
  const fx = new AuraFX(); fx.set(a); SH.previews.push({ c, fx, a, ctx: c.getContext('2d') });
}

/* ── 지도 ── */
function mapSVG() {
  const open = S.gateOpen, eqc = S.eq ? AMAP[S.eq].c : '#a5abc0';
  let stars = ''; for (let i = 0; i < 70; i++) stars += `<circle cx="${(i * 73 + 11) % 400}" cy="${(i * 131 + 7) % 330}" r="${(i % 3) * .45 + .4}" fill="#fff" opacity="${.25 + (i % 5) * .12}"/>`;
  const npcMini = (x, y, robe, hat, eye) => `<g transform="translate(${x},${y})" class="bob"><ellipse cy="22" rx="9" ry="3" fill="#000" opacity=".45"/><path d="M-8 21Q-9 5 0 3Q9 5 8 21Z" fill="${robe}"/><circle cy="-3" r="6.5" fill="${eye ? '#05020c' : '#f2c8a8'}"/>${hat}${eye ? `<circle cx="-2.4" cy="-3" r="1.2" fill="${eye}"/><circle cx="2.4" cy="-3" r="1.2" fill="${eye}"/>` : ''}</g>`;
  const label = (t, lock) => `<g transform="translate(0,62)"><rect x="-48" y="-12" width="96" height="24" rx="12" fill="rgba(8,6,26,.85)" stroke="${lock ? '#555' : '#8a6cff'}" stroke-opacity=".7"/><text text-anchor="middle" y="4.5" font-size="12" font-weight="700" fill="${lock ? '#888' : '#fff'}">${t}</text></g>`;
  return `<svg viewBox="0 0 400 640" class="map" xmlns="http://www.w3.org/2000/svg">
<defs>
 <linearGradient id="msky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04031a"/><stop offset=".55" stop-color="#17104a"/><stop offset="1" stop-color="#2b1b62"/></linearGradient>
 <linearGradient id="isl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#28366e"/><stop offset="1" stop-color="#151a46"/></linearGradient>
 <linearGradient id="rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1f58"/><stop offset="1" stop-color="#0a0820" stop-opacity="0"/></linearGradient>
 <radialGradient id="portal"><stop offset="0" stop-color="#000"/><stop offset=".55" stop-color="#2a0a5a"/><stop offset="1" stop-color="#a07aff"/></radialGradient>
 <radialGradient id="gl"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
 <radialGradient id="orbm"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="${eqc}"/><stop offset="1" stop-color="${eqc}" stop-opacity=".2"/></radialGradient>
</defs>
<rect width="400" height="640" fill="url(#msky)"/>${stars}
<circle cx="330" cy="60" r="26" fill="#fff6dc" opacity=".9"/><circle cx="342" cy="52" r="24" fill="#120c3a"/>
<path d="M18 200C40 150 360 150 384 200C398 300 396 470 370 540C330 590 260 606 200 608C140 606 70 590 30 540C4 470 2 300 18 200Z" fill="url(#rock)" transform="translate(0,26)"/>
<path d="M60 600l20 30 14-26 18 34 16-34 22 30 14-28 20 26 16-30 18 26 22-26 18 32 14-30 22 24 18-30" fill="none" stroke="#2a1f58" stroke-width="10" opacity=".7"/>
<path d="M18 200C40 150 360 150 384 200C398 300 396 470 370 540C330 590 260 606 200 608C140 606 70 590 30 540C4 470 2 300 18 200Z" fill="url(#isl)" stroke="#5a6ad0" stroke-opacity=".5" stroke-width="2"/>
<g fill="#3a5aa0" opacity=".5"><ellipse cx="60" cy="300" rx="18" ry="6"/><ellipse cx="350" cy="320" rx="14" ry="5"/><ellipse cx="140" cy="470" rx="20" ry="6"/><ellipse cx="270" cy="480" rx="16" ry="5"/></g>
<g class="deco">${[[46,330],[64,350],[352,350],[336,372],[150,300],[256,296],[120,560],[286,566],[176,590],[230,590]].map(([x,y],i)=>`<g transform="translate(${x},${y})"><ellipse cy="12" rx="9" ry="3" fill="#000" opacity=".35"/><path d="M0 -18L10 6H-10Z" fill="${i%2?'#2a5a6e':'#2f4f86'}"/><path d="M0 -26L8 -4H-8Z" fill="${i%2?'#367a8a':'#3d63a6'}"/></g>`).join('')}${[[110,330],[300,330],[60,470],[346,470],[160,420],[244,420]].map(([x,y])=>`<g transform="translate(${x},${y})" class="tw"><rect x="-1" y="-4" width="2" height="6" fill="#c8b8ff"/><ellipse cy="-5" rx="5" ry="3" fill="#ff7ad8"/><circle cy="-5" r="8" fill="#ff7ad8" opacity=".15"/></g>`).join('')}</g>
<g stroke="#c9b8ff" stroke-opacity=".45" stroke-width="2.5" fill="none" class="path" stroke-dasharray="4 8">
 <path d="M200 520Q200 330 200 160"/><path d="M200 520Q120 470 90 410"/><path d="M200 520Q280 470 312 410"/><path d="M90 400Q80 330 92 260"/><path d="M312 400Q326 330 308 260"/>
</g>
<g class="loc ${open ? '' : 'locked'}" data-loc="gate" transform="translate(200,118)">
 <circle r="70" fill="url(#gl)" opacity="${open ? .18 : .05}"/>
 <ellipse cy="42" rx="62" ry="12" fill="#000" opacity=".45"/>
 <rect x="-50" y="-52" width="18" height="94" rx="3" fill="#3a3070"/><rect x="32" y="-52" width="18" height="94" rx="3" fill="#3a3070"/>
 <path d="M-54 -50Q0 -112 54 -50L44 -50Q0 -94 -44 -50Z" fill="#4c3d90"/>
 <g fill="${open ? '#c8a8ff' : '#666'}"><rect x="-44" y="-30" width="6" height="4"/><rect x="-44" y="-12" width="6" height="4"/><rect x="-44" y="6" width="6" height="4"/><rect x="38" y="-30" width="6" height="4"/><rect x="38" y="-12" width="6" height="4"/><rect x="38" y="6" width="6" height="4"/></g>
 <ellipse cy="-6" rx="31" ry="46" fill="${open ? 'url(#portal)' : '#15122a'}"/>
 ${open ? '<g class="spin"><path d="M0 -40A20 40 0 0 1 0 28" stroke="#d8c8ff" stroke-width="2" fill="none" opacity=".6"/><path d="M-18 -10A18 18 0 0 1 18 -10" stroke="#ff7ad8" stroke-width="2" fill="none" opacity=".5"/></g>' : '<g stroke="#888" stroke-width="3"><path d="M-30 -40L30 30M30 -40L-30 30"/></g><rect x="-10" y="-12" width="20" height="16" rx="3" fill="#888"/><path d="M-6 -12v-5a6 6 0 0112 0v5" stroke="#888" stroke-width="3" fill="none"/>'}
 ${npcMini(66, 14, '#1a0e3a', '<path d="M-8 -2Q0 -20 8 -2Z" fill="#1a0e3a"/>', '#c8a8ff')}
 ${label('공허의 문', !open)}
</g>
<g class="loc" data-loc="archive" transform="translate(92,236)">
 <circle r="60" fill="url(#gl)" opacity=".1"/><ellipse cy="40" rx="40" ry="9" fill="#000" opacity=".45"/>
 <rect x="-26" y="-68" width="52" height="108" rx="3" fill="#3b3580"/><rect x="-26" y="-68" width="10" height="108" fill="#2a2566"/>
 <path d="M-34 -68L0 -124L34 -68Z" fill="#5a3ca0"/><path d="M0 -124L34 -68H14Z" fill="#46307e"/><circle cy="-128" r="4" fill="#ffd36a"/>
 <rect x="-8" y="-54" width="16" height="22" rx="8" fill="#ffd36a" class="flick"/><rect x="-8" y="-18" width="16" height="20" rx="8" fill="#ffc24a" opacity=".85"/>
 <path d="M-9 40V24a9 9 0 0118 0v16Z" fill="#1a1440"/>
 <g transform="translate(-44,26)"><rect width="10" height="14" fill="#c84a4a"/><rect x="10" y="2" width="8" height="12" fill="#4a7ac8"/><rect x="18" y="-2" width="9" height="16" fill="#c8a84a"/></g>
 ${npcMini(40, 18, '#3a4aa0', '<path d="M-7 -7Q0 -16 7 -7Z" fill="#3a4aa0"/><path d="M-5 0Q0 10 5 0" fill="#eee"/>')}
 ${label('기록 보관소')}
</g>
<g class="loc" data-loc="observatory" transform="translate(308,236)">
 <circle r="60" fill="url(#gl)" opacity=".1"/><ellipse cy="40" rx="48" ry="9" fill="#000" opacity=".45"/>
 <rect x="-40" y="-18" width="80" height="58" rx="3" fill="#353172"/>
 <path d="M-44 -18A44 44 0 0 1 44 -18Z" fill="#5c5cb0"/><rect x="-5" y="-60" width="10" height="42" fill="#191442"/>
 <rect x="-4" y="-84" width="8" height="40" rx="3" fill="#cfc8ff" transform="rotate(32 0 -44)"/>
 <rect x="-28" y="4" width="14" height="14" rx="2" fill="#8ad8ff" opacity=".8"/><rect x="14" y="4" width="14" height="14" rx="2" fill="#8ad8ff" opacity=".8"/>
 <g fill="#ffe9a8" class="tw"><path d="M28 -78l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M-30 -66l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/></g>
 ${npcMini(-48, 18, '#2a2a7a', '<path d="M-7 -6Q-8 -14 0 -12Q8 -14 7 -6Z" fill="#2a3a8a"/><path d="M4 -12l1.5 3 3 .5-2 2 .5 3-3-1.5" fill="#ffd36a"/>')}
 ${label('천문대')}
</g>
<g class="loc" data-loc="alchemy" transform="translate(88,410)">
 <circle r="60" fill="url(#gl)" opacity=".1"/><ellipse cy="38" rx="50" ry="10" fill="#000" opacity=".45"/>
 <rect x="-36" y="-18" width="72" height="54" rx="3" fill="#443270"/>
 <path d="M-44 -16L0 -58L44 -16Z" fill="#2f7a62"/><path d="M0 -58L44 -16H22Z" fill="#256450"/>
 <rect x="16" y="-62" width="12" height="26" fill="#2a2050"/>
 <g fill="#7affb0" class="smoke"><circle cx="22" cy="-70" r="6" opacity=".55"/><circle cx="28" cy="-84" r="8" opacity=".35"/><circle cx="20" cy="-100" r="10" opacity=".2"/></g>
 <rect x="-24" y="-4" width="16" height="16" rx="8" fill="#7affb0" opacity=".8" class="flick"/><path d="M4 36V16a8 8 0 0116 0v20Z" fill="#1a1440"/>
 <g transform="translate(-50,24)"><ellipse rx="14" ry="10" fill="#1d1830"/><ellipse cy="-6" rx="12" ry="4" fill="#5df08a"/><g fill="#a8ffc8" class="smoke"><circle cx="-3" cy="-12" r="2.6"/><circle cx="4" cy="-18" r="2"/></g></g>
 ${npcMini(54, 14, '#2f8a6a', '<path d="M-9 -6L0 -24L9 -6Z" fill="#2f6a5a"/><path d="M-10 -6h20" stroke="#2f6a5a" stroke-width="3"/><path d="M-7 -4Q-10 6 -8 10M7 -4Q10 6 8 10" stroke="#b06aff" stroke-width="3" fill="none"/>')}
 ${label('연금술 공방')}
</g>
<g class="loc" data-loc="forge" transform="translate(312,410)">
 <circle r="60" fill="url(#gl)" opacity=".1"/><ellipse cy="38" rx="50" ry="10" fill="#000" opacity=".45"/>
 <rect x="-40" y="-22" width="80" height="58" rx="3" fill="#3e3150"/><path d="M-46 -20L-30 -46H30L46 -20Z" fill="#5a3a3a"/>
 <rect x="-34" y="-66" width="14" height="30" fill="#2e2440"/>
 <g fill="#ff9a4a" class="smoke"><circle cx="-27" cy="-74" r="6" opacity=".5"/><circle cx="-22" cy="-88" r="8" opacity=".3"/><circle cx="-30" cy="-104" r="10" opacity=".18"/></g>
 <path d="M-12 36V12a12 12 0 0124 0v24Z" fill="#ff7a2a" class="flick"/><path d="M-8 36V16a8 8 0 0116 0v20Z" fill="#ffd36a" opacity=".7"/>
 <g transform="translate(-56,28)"><path d="M-12 -8h22l-4 6h-10v8h6v4h-18v-4h6v-8z" fill="#5a5a6a"/></g>
 ${npcMini(54, 14, '#6a4a3a', '<path d="M-6 0Q0 14 6 0Z" fill="#ff8a3a"/>')}
 ${label('대장간')}
</g>
<g class="loc" data-loc="altar" transform="translate(200,520)">
 <circle r="66" fill="url(#gl)" opacity=".12"/>
 <ellipse rx="72" ry="24" fill="#24205a" stroke="#8a6cff" stroke-opacity=".6" stroke-width="2"/>
 <ellipse rx="54" ry="17" fill="none" stroke="${eqc}" stroke-width="2" stroke-dasharray="3 6" class="path"/>
 <path d="M-12 0L-9 -22H9L12 0Z" fill="#3a3270"/>
 <circle cy="-36" r="15" fill="url(#orbm)" class="bob"/>
 <g transform="translate(0,-20)">${label('제단 광장')}</g>
</g>
</svg>`;
}
function npcSVG(id) {
  const base = (bg, robe, skin, extra) => `<svg viewBox="0 0 80 80" class="npcp"><circle cx="40" cy="40" r="40" fill="${bg}"/><path d="M8 82Q12 52 40 50Q68 52 72 82Z" fill="${robe}"/><circle cx="40" cy="35" r="16" fill="${skin}"/>${extra}</svg>`;
  const eyes = (c = '#2a1a3a') => `<circle cx="34" cy="36" r="2" fill="${c}"/><circle cx="46" cy="36" r="2" fill="${c}"/>`;
  switch (id) {
    case 'mira': return base('#163e34', '#2f8a6a', '#f2c8a8', `<path d="M24 34Q22 56 28 64M56 34Q58 56 52 64" stroke="#b06aff" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M20 26h40" stroke="#2f6a5a" stroke-width="6" stroke-linecap="round"/><path d="M27 25L42 0L54 25Z" fill="#2f6a5a"/><circle cx="34" cy="22" r="5" fill="#8ad8ff" stroke="#c8a87a" stroke-width="2"/><circle cx="46" cy="22" r="5" fill="#8ad8ff" stroke="#c8a87a" stroke-width="2"/>${eyes()}<path d="M36 43Q40 46 44 43" stroke="#a04a4a" stroke-width="1.6" fill="none"/>`);
    case 'bran': return base('#3e2216', '#6a4a3a', '#e0a07a', `<path d="M26 40Q24 66 40 70Q56 66 54 40Q48 48 40 48Q32 48 26 40Z" fill="#ff8a3a"/><path d="M24 28h32" stroke="#c84a2a" stroke-width="5"/><ellipse cx="36" cy="24" rx="5" ry="2" fill="#fff" opacity=".4"/>${eyes()}<path d="M30 31h8M42 31h8" stroke="#a0603a" stroke-width="2.5"/>`);
    case 'quill': return base('#16244e', '#3a4aa0', '#f2d0b8', `<path d="M28 42Q30 74 40 76Q50 74 52 42Q46 50 40 50Q34 50 28 42Z" fill="#eeeef6"/><path d="M24 26Q40 10 56 26" fill="#3a4aa0"/><circle cx="34" cy="36" r="5" fill="none" stroke="#c8a84a" stroke-width="1.6"/><circle cx="46" cy="36" r="5" fill="none" stroke="#c8a84a" stroke-width="1.6"/>${eyes()}<path d="M29 29h9M42 29h9" stroke="#eee" stroke-width="2.5"/>`);
    case 'stella': return base('#10153e', '#2a2a7a', '#f6d2bc', `<path d="M22 38Q20 18 40 17Q60 18 58 38Q56 26 40 25Q24 26 22 38Z" fill="#2a3a8a"/><circle cx="40" cy="13" r="7" fill="#2a3a8a"/><path d="M52 18l2 4 4.5.6-3.3 3 .8 4.4-4-2.2-4 2.2.8-4.4-3.3-3 4.5-.6z" fill="#ffd36a"/>${eyes('#3a2a6a')}<path d="M36 43Q40 46 44 43" stroke="#c05a6a" stroke-width="1.6" fill="none"/><g fill="#ffe9a8"><circle cx="22" cy="66" r="1.5"/><circle cx="58" cy="70" r="1.5"/><circle cx="30" cy="74" r="1"/></g>`);
    case 'keeper': return base('#07030f', '#1a0e3a', '#05020c', `<path d="M18 60Q16 16 40 12Q64 16 62 60Q56 30 40 28Q24 30 18 60Z" fill="#1a0e3a"/><circle cx="34" cy="38" r="2.6" fill="#c8a8ff"/><circle cx="46" cy="38" r="2.6" fill="#c8a8ff"/><circle cx="34" cy="38" r="6" fill="#c8a8ff" opacity=".25"/><circle cx="46" cy="38" r="6" fill="#c8a8ff" opacity=".25"/>`);
  }
}
const LOC = {
  altar:       { n: '제단 광장' },
  alchemy:     { n: '연금술 공방', npc: 'mira' },
  forge:       { n: '대장간', npc: 'bran' },
  archive:     { n: '기록 보관소', npc: 'quill' },
  observatory: { n: '천문대', npc: 'stella' },
  gate:        { n: '공허의 문', npc: 'keeper' },
};
function pMap() {
  openSheet('세계 지도', b => {
    b.appendChild(h(`<div class="mapwrap">${mapSVG()}</div><p class="hint">건물을 눌러 들어가세요</p>`));
    b.querySelectorAll('.loc').forEach(g => g.addEventListener('click', () => { AU.ui(); const id = g.dataset.loc; if (id === 'altar') return closeSheet(); pLoc(id); }));
  });
}
function npcHead(id, lockedLine) {
  const N = NPCS[id], line = lockedLine ? pick(N.locked) : pick(N.lines);
  return `<div class="npc">${npcSVG(id)}<div><b>${N.n}</b><small>${N.role}</small><p>“${line}”</p></div></div>`;
}
function pLoc(id) {
  const L = LOC[id];
  if (id === 'archive') return pIndex(true);
  openSheet(L.n, b => {
    if (id === 'alchemy') renderAlchemy(b);
    else if (id === 'forge') renderForge(b);
    else if (id === 'observatory') renderObs(b);
    else if (id === 'gate') renderGate(b);
  }, true);
}

/* 연금술 */
function renderAlchemy(b) {
  b.appendChild(h(npcHead('mira')));
  for (const id in POTIONS) {
    const P = POTIONS[id], ok = canPay(P.cost);
    const d = h(`<div class="card"><div class="crow">${potIcon(id, 36)}<div class="cmain"><b style="color:${P.c}">${P.n}</b><small>${P.d}</small></div><span class="own">보유 ${S.pots[id] || 0}</span></div>${costHTML(P.cost)}<button class="btn ${ok ? '' : 'off'}">${ok ? '제조하기' : '재료 부족'}</button></div>`);
    d.querySelector('button').onclick = () => {
      if (!canPay(P.cost)) { AU.tone(200, .15, 'square', .04); return; }
      pay(P.cost); S.pots[id] = (S.pots[id] || 0) + 1; S.stats.crafted++; AU.get(); toast(`${potIcon(id, 18)} <b>${P.n}</b> 제조 완료`); save(); refreshSheet(); updHUD();
    };
    b.appendChild(d);
  }
}
/* 대장간 */
function renderForge(b) {
  b.appendChild(h(npcHead('bran')));
  for (const id in GAUNTLETS) {
    const G = GAUNTLETS[id], own = S.gaunts[id], eq = S.eqG === id, ok = canPay(G.cost);
    const d = h(`<div class="card ${eq ? 'eqd' : ''}"><div class="crow">${icon('glove', G.c, 36)}<div class="cmain"><b style="color:${G.c}">${G.n}</b><small>${G.d}</small></div>${eq ? '<span class="own on">장착 중</span>' : own ? '<span class="own">보유</span>' : ''}</div>${own ? '' : costHTML(G.cost)}<button class="btn ${own ? (eq ? 'ghost' : '') : ok ? '' : 'off'}">${own ? (eq ? '해제' : '장착') : ok ? '제작하기' : '재료 부족'}</button></div>`);
    d.querySelector('button').onclick = () => {
      if (own) { S.eqG = eq ? null : id; AU.ui(); }
      else { if (!canPay(G.cost)) { AU.tone(200, .15, 'square', .04); return; } pay(G.cost); S.gaunts[id] = 1; S.eqG = id; AU.get(); AU.tone(220, .3, 'square', .05); toast(`${icon('glove', G.c, 18)} <b>${G.n}</b> 제작 · 장착`); }
      save(); checkQuests(); refreshSheet(); updHUD();
    };
    b.appendChild(d);
  }
}
/* 천문대 */
function renderObs(b) {
  b.appendChild(h(npcHead('stella')));
  const B = BIOMES[S.biome];
  b.appendChild(h(`<div class="card now" style="--bc:${B.c}"><small>지금 하늘</small><b style="color:${B.c}">${B.n} <span class="en">${B.en}</span></b><p>${B.d}</p><p class="dim">남은 시간 <b id="obsT">${mmss((S.biomeEnd - Date.now()) / 1000)}</b></p></div>`));
  const ent = Object.entries(BIOMES).filter(([k, x]) => x.w > 0 && (k !== 'void' || S.gateOpen)), tot = ent.reduce((s, [, x]) => s + x.w, 0);
  let list = '<h3 class="sub">날씨 도감</h3>';
  for (const [k, x] of Object.entries(BIOMES)) {
    if (k === 'void' && !S.gateOpen) { list += `<div class="brow lock"><i style="background:#333"></i><div><b>???</b><small>공허의 문을 열어야 관측할 수 있어요</small></div></div>`; continue; }
    const ex = AURAS.filter(a => a.biome === k), chance = x.w ? (x.w / tot * 55).toFixed(1) + '%' : '기본';
    list += `<div class="brow ${S.seen[k] ? '' : 'lock'}"><i style="background:${x.c};box-shadow:0 0 8px ${x.c}"></i><div><b>${S.seen[k] ? x.n : '미관측'} <span class="dim">· 전환 시 ${chance}</span></b><small>${x.d}</small>${ex.length ? `<div class="exl">${ex.map(a => `<span>${S.found[a.id] ? orbCSS(a, 12) + a.n : '??? '}<i>1/${fmt(a.r)}</i></span>`).join('')}</div>` : ''}</div></div>`;
  }
  b.appendChild(h(list));
}
/* 공허의 문 */
const SAC = [1, 1, 2, 3, 5, 8, 12, 20, 40];
function renderGate(b) {
  if (!S.gateOpen) { b.appendChild(h(npcHead('keeper', true) + `<div class="card"><b>봉인됨</b><p>오라 <b>20종</b>을 발견하면 열립니다. (현재 ${found(S)}종)</p><div class="pbar"><i style="width:${Math.min(100, found(S) / 20 * 100)}%"></i></div></div>`)); return; }
  b.appendChild(h(npcHead('keeper')));
  const vd = S.mats.voiddust || 0, okR = vd >= 40;
  const r = h(`<div class="card"><div class="crow">${icon('void', '#9a6cff', 36)}<div class="cmain"><b style="color:#c8a8ff">균열 의식</b><small>공허 가루 40개로 2분 30초 동안 「공허 균열」 날씨를 엽니다. 공허 한정 오라가 나와요.</small></div><span class="own">${icon('void', '#9a6cff', 14)} ${vd}</span></div><button class="btn ${okR ? '' : 'off'}">${okR ? '균열 열기' : '공허 가루 부족'}</button></div>`);
  r.querySelector('button').onclick = () => { if ((S.mats.voiddust || 0) < 40) return; S.mats.voiddust -= 40; setBiome('void', 150); AU.boom(); closeSheet(); };
  b.appendChild(r);
  const bulk = h(`<div class="card"><b>공물 바치기</b><p class="dim">중복 오라를 바치면 등급에 따라 공허 가루를 얻어요. (커먼 1 · 레어 2 · 에픽 3 · 레전더리 5 …) 장착 중인 1개는 남겨둬요.</p><button class="btn">커먼·언커먼 중복 모두 바치기 (각 1개 남김)</button><div class="sacl"></div></div>`);
  bulk.querySelector('button').onclick = () => {
    let gain = 0, cnt = 0;
    for (const a of AURAS) { if (tierOf(a.r) > 1) continue; const n = Math.max(0, avail(a.id) - 1); if (n > 0) { S.auras[a.id] -= n; gain += n * SAC[tierOf(a.r)]; cnt += n; } }
    if (!cnt) { toast('바칠 중복 오라가 없어요'); return; }
    S.mats.voiddust = (S.mats.voiddust || 0) + gain; S.stats.sacr += cnt; AU.boom(); toast(`${cnt}개를 바쳐 ${icon('void', '#9a6cff', 16)} 공허 가루 +${gain}`); save(); refreshSheet();
  };
  const sl = bulk.querySelector('.sacl');
  for (const a of SORTED) {
    const n = avail(a.id); if (n <= 1) continue; const tr = tierOf(a.r);
    const row = h(`<div class="srow">${orbCSS(a, 22)}<b style="color:${a.c}">${a.n}</b><span class="dim">×${S.auras[a.id]}</span><button class="mini">+${SAC[tr]} 바치기</button></div>`).firstChild;
    row.querySelector('button').onclick = () => { if (avail(a.id) <= 1) return; S.auras[a.id]--; S.mats.voiddust = (S.mats.voiddust || 0) + SAC[tr]; S.stats.sacr++; AU.tone(160, .4, 'sine', .15, 60); save(); refreshSheet(); };
    sl.appendChild(row);
  }
  if (!sl.children.length) sl.appendChild(h('<p class="dim">2개 이상 가진 오라가 아직 없어요.</p>'));
  b.appendChild(bulk);
}

/* ── 도감 ── */
function pIndex(push) {
  openSheet(`오라 도감 <span class="cnt">${found(S)} / ${AURAS.length}</span>`, b => {
    if (push) b.appendChild(h(npcHead('quill')));
    const best = S.best ? AMAP[S.best] : null;
    b.appendChild(h(`<div class="pbar big"><i style="width:${found(S) / AURAS.length * 100}%"></i></div>${best ? `<p class="dim center">최고 기록 · <b style="color:${best.c}">${best.n}</b> (1/${fmt(best.r)})</p>` : ''}`));
    const groups = [];
    for (let t = 0; t < TIERS.length; t++) groups.push([`<span style="color:${TIERS[t].c}">${TIERS[t].n}</span>`, AURAS.filter(a => !a.biome && tierOf(a.r) === t)]);
    groups.push(['<span style="color:#7fe8d6">◆ 날씨 한정</span>', AURAS.filter(a => a.biome)]);
    for (const [title, list] of groups) {
      if (!list.length) continue;
      const fc = list.filter(a => S.found[a.id]).length;
      const sec = h(`<h3 class="sub">${title} <span class="dim">${fc}/${list.length}</span></h3><div class="agrid"></div>`);
      const grid = sec.querySelector('.agrid');
      for (const a of list.sort((x, y) => x.r - y.r)) {
        const fd = S.found[a.id], cnt = S.auras[a.id] || 0;
        const cell = h(`<button class="acell ${fd ? '' : 'lock'} ${S.eq === a.id ? 'eq' : ''}" style="--tc:${TIERS[tierOf(a.r)].c}">${fd ? orbCSS(a, 38) : '<span class="morb q">?</span>'}<b style="${fd ? `color:${mix(a.c, '#ffffff', .3)}` : ''}">${fd ? a.n : '???'}</b><small>1/${fmt(a.r)}</small>${a.biome ? `<i class="bb" style="color:${BIOMES[a.biome].c}">${BIOMES[a.biome].n}</i>` : ''}${fd ? `<em>×${cnt}</em>` : ''}</button>`).firstChild;
        cell.onclick = () => { AU.ui(); pAura(a.id); };
        grid.appendChild(cell);
      }
      b.appendChild(sec);
    }
  }, push);
}
function pAura(id) {
  const a = AMAP[id], fd = S.found[id], tier = tierOf(a.r);
  openSheet(fd ? a.n : '???', b => {
    if (fd) addPreview(b, a, 250);
    else b.appendChild(h(`<div class="unk"><span class="morb q big">?</span><p>아직 발견하지 못한 오라입니다</p></div>`));
    const er = effR(a, S.biome), canNow = eligible(a, S.biome);
    b.appendChild(h(`<div class="adet">
      <div class="en">${fd ? a.en.toUpperCase() : '? ? ?'}</div>
      <div><span class="tierTag" style="color:${TIERS[tier].c}">${TIERS[tier].n}</span><b>1 / ${fmt(a.r)}</b></div>
      ${a.biome ? `<p style="color:${BIOMES[a.biome].c}">◆ ${BIOMES[a.biome].n} 날씨에서만 등장 (글리치 날씨 포함)</p>` : ''}
      ${a.boost ? `<p class="dim">${BIOMES[a.boost.b].n} 날씨에서 확률 ${a.boost.x}배</p>` : ''}
      <p class="dim">지금 날씨에서: ${canNow ? `1 / ${fmt(er)}` : '등장 안 함'}</p>
      ${fd ? `<p class="desc">${a.d}</p><p class="dim">보유 ${S.auras[id] || 0}개</p>` : ''}
    </div>`));
    if (fd && (S.auras[id] || 0) > 0) {
      const btn = h(`<button class="btn big">${S.eq === id ? '장착 중' : '장착하기'}</button>`).firstChild;
      if (S.eq === id) btn.classList.add('ghost');
      btn.onclick = () => { S.eq = id; save(); AU.get(); showIdle(); refreshSheet(); toast(`<b style="color:${a.c}">${a.n}</b> 장착`); };
      b.appendChild(btn);
    }
  }, true);
}

/* ── 가방 ── */
let bagTab = 'pots';
function pBag() {
  openSheet('가방', b => {
    const tabs = h(`<div class="tabs"><button data-t="pots">물약</button><button data-t="mats">재료</button><button data-t="gl">장갑</button></div>`).firstChild;
    tabs.querySelectorAll('button').forEach(x => { x.classList.toggle('on', x.dataset.t === bagTab); x.onclick = () => { bagTab = x.dataset.t; AU.ui(); refreshSheet(); }; });
    b.appendChild(tabs);
    if (bagTab === 'pots') {
      let any = false;
      for (const id in POTIONS) {
        const n = S.pots[id] || 0; if (!n) continue; any = true; const P = POTIONS[id];
        const d = h(`<div class="card"><div class="crow">${potIcon(id, 36)}<div class="cmain"><b style="color:${P.c}">${P.n} <span class="dim">×${n}</span></b><small>${P.d}</small></div><button class="btn sm">사용</button></div></div>`);
        d.querySelector('button').onclick = () => usePot(id);
        b.appendChild(d);
      }
      if (!any) b.appendChild(h(`<p class="empty">물약이 없어요. 지도의 <b>연금술 공방</b>에서 만들 수 있어요.</p>`));
    } else if (bagTab === 'mats') {
      let s = '<div class="mgrid">';
      for (const id in MATS) { const M = MATS[id], n = S.mats[id] || 0; s += `<div class="mcell ${n ? '' : 'lock'}">${icon(M.ic, M.c, 30)}<b>${M.n}</b><span>${n}</span></div>`; }
      s += '</div><p class="hint">재료는 굴릴 때 약 10% 확률로 나와요. 날씨마다 나오는 재료가 달라요.</p>';
      b.appendChild(h(s));
    } else {
      let any = false;
      for (const id in GAUNTLETS) {
        if (!S.gaunts[id]) continue; any = true; const G = GAUNTLETS[id], eq = S.eqG === id;
        const d = h(`<div class="card ${eq ? 'eqd' : ''}"><div class="crow">${icon('glove', G.c, 36)}<div class="cmain"><b style="color:${G.c}">${G.n}</b><small>${G.d}</small></div><button class="btn sm ${eq ? 'ghost' : ''}">${eq ? '해제' : '장착'}</button></div></div>`);
        d.querySelector('button').onclick = () => { S.eqG = eq ? null : id; AU.ui(); save(); updHUD(); refreshSheet(); };
        b.appendChild(d);
      }
      if (!any) b.appendChild(h(`<p class="empty">장갑이 없어요. 지도의 <b>대장간</b>에서 만들 수 있어요.</p>`));
    }
  });
}
function usePot(id) {
  if (!S.pots[id]) return; const P = POTIONS[id], e = P.eff;
  if (e.biome) {
    if (e.biome === 'random') { const ent = Object.keys(BIOMES).filter(k => k !== 'normal' && k !== 'glitch' && k !== 'void' && k !== S.biome); setBiome(pick(ent)); }
    else setBiome(e.biome, e.t);
  } else if (e.next) { S.next *= e.next; toast(`다음 굴림 행운 <b>${fmtX(S.next)}</b>`); }
  else { const now = Date.now(); S.active[id] = Math.max(now, S.active[id] || 0) + e.t * 1000; toast(`${potIcon(id, 18)} <b>${P.n}</b> 효과 시작`); }
  S.pots[id]--; S.stats.pots++; AU.get(); AU.tone(500, .4, 'sine', .08, 900);
  save(); checkQuests(); updHUD(); refreshSheet();
}

/* ── 퀘스트 ── */
function pQuest() {
  openSheet('퀘스트', b => {
    const list = [...QUESTS].sort((x, y) => (S.quests[x.id] ? 1 : 0) - (S.quests[y.id] ? 1 : 0) || (qDone(y) ? 1 : 0) - (qDone(x) ? 1 : 0));
    for (const q of list) {
      const [v, g] = q.goal(S), done = v >= g, cl = S.quests[q.id];
      const d = h(`<div class="card q ${cl ? 'claimed' : done ? 'ready' : ''}"><div class="crow"><div class="cmain"><b>${q.n}</b><small>${q.d}</small></div>${cl ? '<span class="own">완료</span>' : ''}</div>${cl ? '' : `<div class="pbar"><i style="width:${Math.min(100, v / g * 100)}%"></i></div><div class="qmeta"><span class="dim">${fmt(Math.min(v, g))} / ${fmt(g)}</span><span class="rw">${rwText(q.rw)}</span></div>`}${done && !cl ? '<button class="btn">보상 받기</button>' : ''}</div>`);
      const btn = d.querySelector('button');
      if (btn) btn.onclick = () => { S.quests[q.id] = 1; const t = giveReward(q.rw); AU.chime(4); toast(`보상 획득 · ${t}`); save(); updHUD(); refreshSheet(); };
      b.appendChild(d);
    }
  });
}

/* ── 설정 ── */
function pSet() {
  openSheet('설정', b => {
    const best = S.best ? AMAP[S.best] : null, pm = Math.floor(S.stats.play / 60);
    b.appendChild(h(`<div class="stgrid"><div><small>총 굴림</small><b>${fmt(S.rolls)}</b></div><div><small>발견한 오라</small><b>${found(S)}/${AURAS.length}</b></div><div><small>최고 기록</small><b style="color:${best ? best.c : '#fff'}">${best ? best.n : '-'}</b></div><div><small>플레이 시간</small><b>${Math.floor(pm / 60)}시간 ${pm % 60}분</b></div></div>`));
    if (S.log.length) {
      b.appendChild(h(`<h3 class="sub">최근 희귀 획득</h3><div class="logl">${S.log.slice(0, 8).map(l => { const a = AMAP[l.id]; return `<div>${orbCSS(a, 16)}<b style="color:${a.c}">${a.n}</b><span class="dim">1/${fmt(a.r)} · ${fmt(l.n)}번째 · ${BIOMES[l.b].n}</span></div>`; }).join('')}</div>`));
    }
    const row = (label, ctl) => `<div class="setrow"><span>${label}</span>${ctl}</div>`;
    const tg = (k) => `<button class="tg ${S.set[k] ? 'on' : ''}" data-k="${k}"><i></i></button>`;
    b.appendChild(h(`<h3 class="sub">옵션</h3>
      ${row('사운드', tg('sound'))}
      ${row('진동', tg('haptic'))}
      ${row('빠른 굴림 (에픽 미만 연출 단축)', tg('quick'))}
      ${row('저사양 모드', tg('low'))}
      ${row('컷신 재생', `<select id="cutSel"><option value="3">에픽 이상</option><option value="4">레전더리 이상</option><option value="5">미식 이상</option><option value="6">엑절티드 이상</option><option value="99">끄기</option></select>`)}
      <h3 class="sub">저장</h3>
      <div class="brow2"><button class="btn sm" id="expBtn">저장 코드 복사</button><button class="btn sm ghost" id="impBtn">코드로 불러오기</button></div>
      <textarea id="saveTxt" class="hide" spellcheck="false"></textarea>
      <button class="btn danger" id="resetBtn">처음부터 다시 하기</button>
      <p class="hint">VOIDROLL : RENEWAL · 진행 상황은 이 기기 브라우저에 자동 저장돼요.</p>`));
    b.querySelectorAll('.tg').forEach(x => x.onclick = () => { const k = x.dataset.k; S.set[k] = !S.set[k]; if (k === 'low') resize(); if (k === 'sound' && S.set.sound) AU.init(); save(); AU.ui(); updHUD(); refreshSheet(); });
    const sel = b.querySelector('#cutSel'); sel.value = String(S.set.cut); sel.onchange = () => { S.set.cut = +sel.value; save(); };
    const ta = b.querySelector('#saveTxt');
    b.querySelector('#expBtn').onclick = () => {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); ta.value = code; ta.classList.remove('hide'); ta.select();
      (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => toast('저장 코드를 복사했어요'), () => toast('코드를 길게 눌러 복사하세요'));
    };
    b.querySelector('#impBtn').onclick = () => {
      if (ta.classList.contains('hide') || !ta.value.trim()) { ta.value = ''; ta.placeholder = '여기에 저장 코드를 붙여넣고 다시 누르세요'; ta.classList.remove('hide'); ta.focus(); return; }
      try { const d = JSON.parse(decodeURIComponent(escape(atob(ta.value.trim())))); if (d.v !== 1) throw 0; localStorage.setItem(SAVE_KEY, JSON.stringify(d)); location.reload(); }
      catch (e) { toast('올바르지 않은 코드예요'); }
    };
    b.querySelector('#resetBtn').onclick = () => { if (confirm('정말 모든 진행을 지울까요? 되돌릴 수 없어요.')) { localStorage.removeItem(SAVE_KEY); location.reload(); } };
  });
}

/* ── 토스트 ── */
function toast(html) {
  const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = html; $('#toasts').appendChild(d);
  setTimeout(() => d.classList.add('out'), 2600); setTimeout(() => d.remove(), 3000);
  while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
}

/* ── 입력 ── */
$('#rollBtn').onclick = () => { AU.init(); startRoll(); };
$('#autoBtn').onclick = () => { AU.init(); AU.ui(); RS.auto = !RS.auto; updHUD(); if (RS.auto) { wake(); startRoll(); } else unwake(); };
$('#quickBtn').onclick = () => { AU.ui(); S.set.quick = !S.set.quick; save(); updHUD(); };
document.querySelectorAll('#nav button').forEach(x => x.onclick = () => {
  AU.init(); AU.ui();
  ({ map: pMap, index: () => pIndex(false), bag: pBag, quest: pQuest, set: pSet })[x.dataset.p]();
});
cutCv.addEventListener('pointerdown', () => { if (CUT.canClose()) CUT.close(); });
addEventListener('keydown', e => { if (e.code === 'Space' && started && $('#sheet').classList.contains('hide')) { e.preventDefault(); if (CUT.canClose()) CUT.close(); else startRoll(); } });
let wl = null;
async function wake() { try { if ('wakeLock' in navigator) wl = await navigator.wakeLock.request('screen'); } catch (e) { } }
function unwake() { try { wl && wl.release(); } catch (e) { } wl = null; }
document.addEventListener('visibilitychange', () => { if (!document.hidden && RS.auto) wake(); });

/* ── 루프 ── */
let last = performance.now(), secAcc = 0;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
  const q = S.set.low ? .5 : 1;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  bfx.update(dt, W, H, T); bfx.draw(ctx, W, H, T);
  const R = Math.min(W * .13, H * .068, 72), cx = W / 2, by = H * .37, cy = by + Math.sin(T * 1.4) * R * .07;
  const a = S.eq ? AMAP[S.eq] : null; afx.set(a);
  drawAltar(ctx, cx, by + R * 1.75, R, a, T);
  if (a) { afx.update(dt, T, q); afx.drawBack(ctx, cx, cy, R, T); }
  if (RS.on) { // 굴림 중 링
    const k = RS.t / RS.dur; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { ctx.globalAlpha = .5; ctx.strokeStyle = $('#rName').style.color || '#fff'; ctx.lineWidth = R * .05; ctx.beginPath(); ctx.arc(cx, cy, R * (1.25 + i * .18), T * (6 - i) * (1 - k * .5), T * (6 - i) * (1 - k * .5) + 1.6); ctx.stroke(); }
    ctx.restore();
  }
  drawOrb(ctx, cx, cy, R, a, T, RS.on ? 1 : 0);
  if (a) afx.drawFront(ctx, cx, cy, R, T);
  updRoll(dt);
  CUT.update(dt, W, H, DPR);
  for (const p of SH.previews) {
    if (!p.c.isConnected) continue;
    const w = p.c.clientWidth, hh = p.c.clientHeight; if (!w) continue;
    const d = Math.min(DPR, 2); if (p.c.width !== Math.round(w * d)) { p.c.width = Math.round(w * d); p.c.height = Math.round(hh * d); }
    const c2 = p.ctx; c2.setTransform(d, 0, 0, d, 0, 0); c2.clearRect(0, 0, w, hh);
    const g = c2.createRadialGradient(w / 2, hh / 2, 0, w / 2, hh / 2, w * .7); g.addColorStop(0, '#1a1440'); g.addColorStop(1, '#07061a'); c2.fillStyle = g; c2.fillRect(0, 0, w, hh);
    const r = Math.min(hh * .17, 46); p.fx.update(dt, T, q); p.fx.drawBack(c2, w / 2, hh / 2, r, T); drawOrb(c2, w / 2, hh / 2, r, p.a, T); p.fx.drawFront(c2, w / 2, hh / 2, r, T);
  }
  secAcc += dt;
  if (secAcc >= 1) {
    secAcc -= 1; S.stats.play++; tickBiome(); updBiomeTime();
    let changed = false; for (const id in S.active) if (S.active[id] <= Date.now()) { delete S.active[id]; changed = true; }
    if (changed || Object.keys(S.active).length) updHUD();
    const o = $('#obsT'); if (o) o.textContent = mmss((S.biomeEnd - Date.now()) / 1000);
    if (S.stats.play % 5 === 0) save();
  }
  requestAnimationFrame(frame);
}

/* ── 시작 ── */
load(); resize();
if (Date.now() >= S.biomeEnd) setBiome(S.biome === 'normal' ? (Math.random() < .5 ? 'normal' : pickBiome('normal')) : 'normal', null, true);
bfx.set(S.biome); bfx.cur = S.biome; bfx.prev = null; bfx.mix = 1;
document.querySelectorAll('#nav button').forEach(x => { x.insertAdjacentHTML('afterbegin', icon(x.dataset.i, 'currentColor', 26)); });
updHUD(); updBiomeTime(); showIdle();
requestAnimationFrame(frame);
$('#intro').addEventListener('click', () => {
  AU.init(); started = true; $('#intro').classList.add('gone'); setTimeout(() => $('#intro').remove(), 700);
  AU.tone(220, 1.2, 'sine', .15, 440); AU.chime(2);
  if (S.rolls === 0) setTimeout(() => toast('ROLL을 눌러 첫 오라를 굴려보세요. 아래 <b>지도</b>에서 마을을 둘러볼 수 있어요.'), 700);
});
addEventListener('pagehide', save);
