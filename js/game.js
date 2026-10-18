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
  return { v: 1, rolls: 0, auras: {}, found: {}, shiny: {}, eq: null, eqShiny: false, mats: {}, pots: { lucky: 2, dice: 1 }, gaunts: {}, eqG: null,
    charms: {}, eqC: [], coin: 0, lv: 1, xp: 0, destiny: 0, nick: '', luckBuy: 0, luckBonus: 0, asc: 0, sinceAsc: 0, x10: false, equip: {}, skCd: {}, skb: {}, tc: [], codes: {}, role: 'none', cutOff: {}, ch: {},
    sum: { sun: 25, rolls: 0, rare: 0, total: 0, claimed: {}, bought: {}, tickets: 0, frag: 0, owned: [], lastDaily: '', force: false, rareUntil: 0, rifts: 0, finale: 0 }, active: {}, next: 1, starBoost: 0,
    biome: 'normal', biomeEnd: Date.now() + 150000, seen: { normal: 1 }, quests: {}, best: null, gateOpen: false,
    mer: { next: Date.now() + 180000, until: 0, offers: [] }, daily: { last: '', streak: 0 }, recent: [],
    stats: { pots: 0, crafted: 0, play: 0, cuts: 0, sacr: 0, stars: 0, buys: 0, coins: 0, shinies: 0, chests: 0, maxCombo: 0, skills: 0, mats: 0, maxPity: 0, x10: 0 }, log: [],
    set: { sound: true, music: true, cut: 4, quick: false, low: false, haptic: true, autoEq: true, motion: false, auto10: false } };
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (d && d.v === 1) {
      const df = defState(); S = Object.assign(df, d);
      S.set = Object.assign(defState().set, d.set || {}); S.stats = Object.assign(defState().stats, d.stats || {});
      S.mer = Object.assign(defState().mer, d.mer || {}); S.daily = Object.assign(defState().daily, d.daily || {}); S.sum = Object.assign(defState().sum, d.sum || {});
      return;
    }
  } catch (e) { }
  S = defState();
}
let saveFlash = 0;
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { return; }
  const n = Date.now(); if (n - saveFlash < 9000) return; saveFlash = n;
  const el = document.getElementById('saveInd'); if (el) { el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
}

/* ── 행운 · 속도 ── */
const gnt = () => S.eqG ? GAUNTLETS[S.eqG] : null;
const charmsOn = () => S.eqC.map(id => CHARMS[id]).filter(Boolean);
function activeOn(id) { return S.active[id] && S.active[id] > Date.now(); }
function potEff(key, mul) { let m = mul ? 1 : 0; for (const id in S.active) if (activeOn(id) && POTIONS[id] && POTIONS[id].eff[key]) m = mul ? m * POTIONS[id].eff[key] : m + POTIONS[id].eff[key]; return m; }
function mastery() { return masteryList(S).filter(m => m.done).length; }
function luckParts() {
  const g = gnt(), cs = charmsOn(), parts = [];
  let add = 1;
  if (g) { add += g.luck; parts.push([`장갑 · ${g.n}`, `+${Math.round(g.luck * 100)}%`]); }
  for (const c of cs) if (c.luck) { add += c.luck; parts.push([`부적 · ${c.n}`, `+${Math.round(c.luck * 100)}%`]); }
  const ms = mastery(); if (ms) { add += ms * .05; parts.push([`마스터리 ${ms}개`, `+${ms * 5}%`]); }
  if (S.lv > 1) { add += (S.lv - 1) * .01; parts.push([`레벨 ${S.lv}`, `+${S.lv - 1}%`]); }
  if (S.luckBuy) { add += S.luckBuy * .2; parts.push([`구매한 행운 ${S.luckBuy}회`, `+${fmt(S.luckBuy * 20)}%`]); }
  if (S.luckBonus) { add += S.luckBonus; parts.push(['코드·축제 보너스', `+${fmt(S.luckBonus * 100)}%`]); }
  const el = equipEff().luck; if (el) { add += el; parts.push([`제작 장비 ${Object.keys(S.equip).length}개`, `+${fmt(el * 100)}%`]); }
  const sc = summerCompass(); if (sc) { add += sc; parts.push(['조개 나침반 (여름 오라)', `+${Math.round(sc * 100)}%`]); }
  const sp = (S.sum.bought.glow ? .15 : 0) + (S.sum.bought.charm ? .3 : 0); if (sp) { add += sp; parts.push(['여름 축제 장식', `+${Math.round(sp * 100)}%`]); }
  let mul = 1;
  const pl = potEff('luck', true); if (pl > 1) { mul *= pl; parts.push(['물약', fmtX(pl)]); }
  const sl = skBuff('luck'); if (sl > 1) { mul *= sl; parts.push([`스킬 · ${S.skb.luck.n}`, fmtX(sl)]); }
  if (S.asc) { mul *= ascMult(); parts.push([`초월 ${S.asc}회`, fmtX(ascMult())]); }
  for (const c of cs) { if (c.bm && c.bm.b === S.biome) { mul *= c.bm.x; parts.push([`${c.n} (${BIOMES[c.bm.b].n})`, fmtX(c.bm.x)]); } if (c.night && isNight()) { mul *= c.night; parts.push([`${c.n} (밤)`, fmtX(c.night)]); } }
  if (S.starBoost > Date.now()) { mul *= 1.5; parts.push(['별똥별 축복', '×1.50']); }
  const cb = comboBonus(); if (cb > 0) { mul *= 1 + cb; parts.push([`콤보 ${COMBO.n}`, fmtX(1 + cb)]); }
  return { add, mul, total: add * mul, parts };
}
const COMBO = { n: 0, t: 0 };
function comboBonus() { return COMBO.n >= 3 ? Math.min(.5, COMBO.n * .01) : 0; }
function baseLuck() { return luckParts().total; }
function speed() { const g = gnt(); let s = 1 + (g ? g.speed : 0) + potEff('speed') + equipEff().speed + (skBuff('speed') - 1); for (const c of charmsOn()) s += c.speed || 0; return s; }
function equipEff() { let luck = 0, speed = 0; for (const e of EQUIP) if (S.equip[e.id]) { luck += e.luck || 0; speed += e.speed || 0; } return { luck, speed }; }
function skBuff(k) { const b = S.skb[k]; return b && b.end > Date.now() ? b.v : 1; }
function ascMult() { return 1 + S.asc * .5; }
function rarityMul() { return potEff('rarity', true) * skBuff('rarity') * (S.sum.rareUntil > Date.now() ? 4 : 1); }
function summerCompass() { return S.sum.bought.compass ? S.sum.owned.length * .02 : 0; }
const PITY_MAX = 200;
function bonusEvery() { return charmsOn().some(c => c.every) ? 8 : 10; }
function tenthMult() { const g = gnt(); return g && g.tenth ? g.tenth : 2; }
const isTenth = () => (S.rolls + 1) % bonusEvery() === 0;
function shinyChance() { let x = 1 / 50; for (const c of charmsOn()) if (c.shiny) x *= c.shiny; x *= potEff('shiny', true); return x; }
function coinMul() { let m = 1; for (const c of charmsOn()) m += c.coin || 0; return m; }
function effR(a, b) { let r = a.r; if (a.boost && a.boost.b === b) r /= a.boost.x; const tm = BIOMES[b] && BIOMES[b].tm; if (tm) { const m = tm[tierOf(a.r)]; if (m) r /= m; } return r; }
function eligible(a, b) {
  if (a.fusion || a.summer) return false;
  if (a.summerRoll && !S.sum.bought.aura) return false;
  if (b === 'glitch') return true;
  if (a.biome && a.biome !== b) return false;
  if (a.night && !isNight()) return false;
  if (a.day && isNight()) return false;
  return true;
}
function rollAura(luck, minTier = 0) {
  const b = S.biome, rm = rarityMul();
  for (const a of SORTED) { if (a.id === 'faint' || !eligible(a, b)) continue; if (Math.random() < luck * (a.r >= 1e4 ? rm : 1) / effR(a, b)) return a; }
  if (minTier > 0) { const pool = AURAS.filter(a => eligible(a, b) && tierOf(a.r) === minTier); if (pool.length) return pick(pool); }
  return AMAP.faint;
}
const SHARD_TIER = [1, 2, 5, 12, 30, 80, 200, 500, 800, 1000, 1000, 1000, 1000, 1000];
function avail(id) { return (S.auras[id] || 0) - (S.eq === id ? 1 : 0); }

/* ── 오디오 ── */
const SCALES = { normal: [0, 2, 4, 7, 9], windy: [0, 2, 5, 7, 9], rainy: [0, 3, 5, 7, 10], snowy: [0, 2, 4, 7, 11], sand: [0, 1, 4, 5, 7], starfall: [0, 4, 7, 11, 14], hell: [0, 1, 3, 6, 7], sakura: [0, 2, 5, 7, 9], glitch: [0, 1, 6, 7, 11], void: [0, 3, 6, 9, 10], eclipse: [0, 1, 5, 6, 10], deep: [0, 3, 5, 7, 10], garden: [0, 4, 7, 9, 11], dusk: [0, 2, 3, 7, 9], beach: [0, 2, 4, 7, 9] };
const ROOT = { normal: 220, windy: 233, rainy: 196, snowy: 247, sand: 208, starfall: 262, hell: 165, sakura: 247, glitch: 185, void: 147, eclipse: 175, deep: 147, garden: 294, dusk: 196, beach: 262 };
const AU = {
  c: null, m: null, mus: null, nb: null, mt: 0,
  init() {
    if (this.c) { if (this.c.state === 'suspended') this.c.resume(); return; }
    try {
      this.c = new (window.AudioContext || window.webkitAudioContext)(); this.m = this.c.createGain(); this.m.gain.value = .55; this.m.connect(this.c.destination);
      this.mus = this.c.createGain(); this.mus.gain.value = .22; this.mus.connect(this.m);
      const len = this.c.sampleRate * 2, buf = this.c.createBuffer(1, len, this.c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this.nb = buf;
    } catch (e) { this.c = null; }
  },
  ok() { return this.c && S.set.sound; },
  tone(f, d, type = 'sine', v = .2, f2 = null, delay = 0, out = null, atk = .012) {
    if (!this.ok()) return; const c = this.c, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + atk); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(out || this.m); o.start(t); o.stop(t + d + .05);
  },
  noise(d, v = .2, f0 = 800, f1 = null, delay = 0, type = 'bandpass') {
    if (!this.ok()) return; const c = this.c, t = c.currentTime + delay, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.nb; fl.type = type; fl.frequency.setValueAtTime(f0, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + d); fl.Q.value = 1.2;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + Math.min(.05, d / 3)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(this.m); s.start(t); s.stop(t + d + .05);
  },
  music(dt) { // 날씨별 잔잔한 배경음
    if (!this.ok() || !S.set.music || CUT.on) return;
    this.mt -= dt; if (this.mt > 0) return; this.mt = 4.2;
    const sc = SCALES[S.biome] || SCALES.normal, root = (ROOT[S.biome] || 220) * (isNight() ? .84 : 1), pickN = () => root * Math.pow(2, sc[Math.floor(Math.random() * sc.length)] / 12);
    const wave = S.biome === 'glitch' ? 'square' : S.biome === 'hell' ? 'sawtooth' : 'sine', vol = S.biome === 'glitch' || S.biome === 'hell' ? .025 : .06;
    [0, 2, 4].forEach(i => this.tone(root / 2 * Math.pow(2, sc[i] / 12), 6, wave, vol, null, 0, this.mus, 1.6));
    for (let i = 0; i < 3; i++) if (Math.random() < .7) this.tone(pickN() * 2, 1.6, 'triangle', .045, null, .6 + i * rnd(.5, 1.1), this.mus, .02);
  },
  tick(k) { this.tone(700 + k * 700, .035, 'square', .025); },
  ui() { this.tone(720, .06, 'sine', .06); },
  chime(tier) {
    const base = [392, 440, 523, 587, 659, 740, 784, 880, 988][Math.min(tier, 8)], ivs = [1, 1.26, 1.5, 2, 2.52, 3];
    const n = Math.min(6, 2 + Math.floor(tier / 2));
    for (let i = 0; i < n; i++) this.tone(base * ivs[i], .45 + tier * .12, 'triangle', .07, null, i * .06);
    if (tier >= 3) this.tone(base / 2, 1 + tier * .2, 'sine', .12);
  },
  shiny() { for (let i = 0; i < 6; i++) this.tone(1320 * Math.pow(1.122, i), .3, 'sine', .05, null, i * .05); },
  whoosh(d) { this.noise(d, .18, 200, 4000, 0, 'bandpass'); this.tone(80, d, 'sawtooth', .04, 400); },
  boom() { this.tone(120, 1.4, 'sine', .45, 28); this.noise(1, .4, 1200, 120, 0, 'lowpass'); },
  shatter() { this.noise(.6, .3, 6000, 2000, 0, 'highpass'); for (let i = 0; i < 6; i++) this.tone(rnd(2000, 4000), .2, 'sine', .03, null, i * .03); },
  get() { this.tone(980, .08, 'sine', .06); this.tone(1470, .12, 'sine', .05, null, .05); },
  coin() { this.tone(1568, .08, 'square', .03); this.tone(2093, .14, 'square', .03, null, .06); },
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
    petal: `<path d="M12 3c4 3 6 7 4 12-1 3-3 5-4 6-1-1-3-3-4-6-2-5 0-9 4-12z" fill="${c}"/><path d="M12 6v13" stroke="#fff" stroke-opacity=".5"/>`,
    coin: `<path d="M12 2.5l7.5 7-7.5 12-7.5-12z" fill="#6fd8ff" stroke="#2a5aa8" stroke-width="1.2" stroke-linejoin="round"/><path d="M4.5 9.5h15M9 9.5l3 12 3-12" stroke="#e8fbff" stroke-opacity=".75" fill="none"/><path d="M12 2.5L9 9.5h6z" fill="#fff" opacity=".6"/>`,
    ring: `<circle cx="12" cy="14" r="6.5" fill="none" stroke="${c}" stroke-width="2.6"/><path d="M9 6l3-3 3 3-3 2.4z" fill="#fff" stroke="${c}"/>`,
    bolt: `<path d="M13 2L5 13h6l-2 9 9-12h-6z" fill="${c}" stroke="#fff" stroke-opacity=".5"/>`,
    crown: `<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="${c}"/><rect x="5" y="17" width="14" height="3" rx="1" fill="#fff" opacity=".45"/><circle cx="12" cy="13" r="1.6" fill="#ff5a8a"/>`,
    boot: `<path d="M7 3h6v9l6 3a2 2 0 011 1.8V20H5V3z" fill="${c}"/><path d="M5 17h15" stroke="#fff" stroke-opacity=".45" stroke-width="1.6"/><path d="M2 8h3M1 11h4" stroke="${c}" stroke-width="1.4" opacity=".6"/>`,
    cloak: `<path d="M12 3c-3 0-5 2-5 4L3 21h18L17 7c0-2-2-4-5-4z" fill="${c}"/><path d="M12 3v18" stroke="#fff" stroke-opacity=".35"/><circle cx="12" cy="7" r="1.6" fill="#ffd36a"/>`,
    pendant: `<path d="M5 3q7 9 14 0" fill="none" stroke="${c}" stroke-width="1.6"/><path d="M12 10l4 5-4 7-4-7z" fill="${c}"/><path d="M12 10l4 5H8z" fill="#fff" opacity=".45"/>`,
    infinity: `<path d="M7 8a4 4 0 100 8c3 0 7-8 10-8a4 4 0 110 8c-3 0-7-8-10-8z" fill="none" stroke="${c}" stroke-width="2.6"/>`,
    sun: `<circle cx="12" cy="12" r="5" fill="${c}"/><g stroke="${c}" stroke-width="2" stroke-linecap="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></g>`,
    ticket: `<path d="M3 7h18v3a2 2 0 000 4v3H3v-3a2 2 0 000-4z" fill="${c}"/><path d="M14 7v10" stroke="#fff" stroke-dasharray="2 2" stroke-opacity=".7"/>`,
    potion: `<path d="M9 2h6v2h-1v4.5l5 8.5a3 3 0 01-2.6 4.5H7.6A3 3 0 015 16.5l5-8.5V4H9z" fill="rgba(255,255,255,.12)" stroke="#fff" stroke-opacity=".5"/><path d="M7 14h10l2 3a2 2 0 01-1.8 3H6.8A2 2 0 015 17z" fill="${c}"/><circle cx="10" cy="17" r="1" fill="#fff" opacity=".7"/>`,
    elixir: `<path d="M12 2l3 5v3l4 4v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6l4-4V7z" fill="rgba(255,255,255,.12)" stroke="#fff" stroke-opacity=".5"/><path d="M6 15h12v5a1 1 0 01-1 1H7a1 1 0 01-1-1z" fill="${c}"/><path d="M12 9l1 2 2 .5-2 .5-1 2-1-2-2-.5 2-.5z" fill="${c}"/>`,
    compass: `<circle cx="12" cy="12" r="9" fill="rgba(255,255,255,.08)" stroke="${c}" stroke-width="1.6"/><path d="M12 5l2.5 7-2.5 7-2.5-7z" fill="${c}"/><path d="M12 5l2.5 7h-5z" fill="#fff"/>`,
    key: `<circle cx="8" cy="12" r="4.5" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M12 12h9M18 12v3M21 12v2" stroke="${c}" stroke-width="2.4"/>`,
    dice: `<rect x="4" y="4" width="16" height="16" rx="4" fill="#fff" stroke="#bbb"/><g fill="#5a3cdc"><circle cx="8.5" cy="8.5" r="1.6"/><circle cx="15.5" cy="15.5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="15.5" cy="8.5" r="1.6"/><circle cx="8.5" cy="15.5" r="1.6"/></g>`,
    glove: `<path d="M7 21v-8L5 9a1.4 1.4 0 012.4-1.4L9 10V4a1.3 1.3 0 012.6 0v5V3a1.3 1.3 0 012.6 0v6-4a1.3 1.3 0 012.6 0v5-2a1.3 1.3 0 012.6 0v6c0 4-2 6-4 7v2z" fill="${c}"/><rect x="7" y="18" width="10" height="3.5" rx="1" fill="#fff" opacity=".35"/>`,
    clover: `<g fill="${c}"><circle cx="9" cy="9" r="4"/><circle cx="15" cy="9" r="4"/><circle cx="9" cy="15" r="4"/><circle cx="15" cy="15" r="4"/></g><path d="M12 12q3 6 6 9" stroke="#3a7a3a" stroke-width="1.6" fill="none"/>`,
    shell: `<path d="M3 16C3 8 9 4 12 4s9 4 9 12l-9 4z" fill="${c}"/><path d="M12 4v16M7 7l5 13M17 7l-5 13" stroke="#fff" stroke-opacity=".5"/>`,
    globe: `<circle cx="12" cy="10" r="7" fill="${c}" fill-opacity=".5" stroke="#fff" stroke-opacity=".6"/><path d="M9 12l3-4 3 4z" fill="#fff"/><rect x="6" y="17" width="12" height="4" rx="1" fill="#8a6a4a"/>`,
    pin: `<path d="M12 12L12 3a5 5 0 015 5zM12 12l9 0a5 5 0 01-5 5zM12 12v9a5 5 0 01-5-5zM12 12H3a5 5 0 015-5z" fill="${c}"/><circle cx="12" cy="12" r="1.6" fill="#fff"/>`,
    sandglass: `<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" stroke="${c}" stroke-width="1.8" fill="none"/><path d="M9 19c1-2 5-2 6 0z" fill="${c}"/>`,
    moon: `<path d="M15 3a9 9 0 100 18 7 7 0 010-18z" fill="${c}"/><circle cx="9" cy="12" r="1.2" fill="#fff" opacity=".5"/>`,
    magnet: `<path d="M5 4h4v8a3 3 0 006 0V4h4v8a7 7 0 01-14 0z" fill="${c}"/><rect x="5" y="4" width="4" height="3" fill="#ddd"/><rect x="15" y="4" width="4" height="3" fill="#ddd"/>`,
    horn: `<path d="M5 20C5 12 9 6 18 3c-3 4-4 8-4 12-2 1-5 3-9 5z" fill="${c}"/><path d="M8 15c2-1 4-2 6-2" stroke="#fff" stroke-opacity=".4"/>`,
    eye: `<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="#0a0418" stroke="${c}" stroke-width="1.6"/><circle cx="12" cy="12" r="3.5" fill="${c}"/><circle cx="12" cy="12" r="1.4" fill="#000"/>`,
    cart: `<path d="M3 14h14l2-6H6" fill="none" stroke="${c}" stroke-width="1.8"/><path d="M5 6c3-4 9-4 12 0" fill="${c}" opacity=".6"/><circle cx="7" cy="18" r="2" fill="${c}"/><circle cx="15" cy="18" r="2" fill="${c}"/>`,
    map: `<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 4v14M15 6v14" stroke="currentColor" stroke-width="1.8"/>`,
    book: `<path d="M4 5a2 2 0 012-2h12v15H6a2 2 0 00-2 2z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 20a2 2 0 012-2h12v3H6a2 2 0 01-2-1z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="11" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>`,
    bag: `<path d="M5 8h14l-1 12H6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 016 0v2" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
    quest: `<path d="M6 3h10l3 3v15H6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 10l2 2 4-4M9 16h7" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
    gear: `<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  };
  return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${P[type] || P.dust}</svg>`;
}
const POT_ICON = { lucky: 'potion', swift: 'potion', fortune: 'potion', haste: 'potion', starlit: 'elixir', voidelixir: 'elixir', compass: 'compass', glitchkey: 'key', dice: 'dice', shinydust: 'elixir' };
function potIcon(id, s) { return icon(POT_ICON[id] || 'potion', POTIONS[id].c, s); }
const coinI = (s = 16) => icon('coin', '', s);
function orbCSS(a, sz = 40, shiny = false) {
  const t = tierOf(a.r);
  return `<span class="morb ${shiny ? 'shn' : ''}" style="width:${sz}px;height:${sz}px;background:radial-gradient(circle at 35% 30%,#fff,${a.c} 38%,${a.c2} 78%,#000);box-shadow:0 0 ${4 + t * 3}px ${a.c}${t >= 4 ? `,0 0 ${t * 6}px ${a.c}` : ''}"></span>`;
}

/* ── 화면 / 캔버스 ── */
const cv = $('#scene'), ctx = cv.getContext('2d'), cutCv = $('#cut');
let W = 0, H = 0, DPR = 1, T = 0, started = false;
const bfx = new BiomeFX(), afx = new AuraFX(), CUT = new Cutscene(cutCv), BURST = new Burst();
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, S && S.set.low ? 1 : 2); W = innerWidth; H = innerHeight;
  for (const c of [cv, cutCv]) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); }
}
addEventListener('resize', resize);
const orbPos = () => { const R = Math.min(W * .135, H * .066, 74); return { R, cx: W / 2, by: H * .385 }; };
const CAM = { shake: 0, z: 1, zt: 1, flash: 0, fc: '#ffffff', hit: 0 };
const SHOW = { a: null, sh: false, until: 0, joy: 0 };

/* ── 굴림 ── */
const RS = { on: false, t: 0, dur: 1, res: null, extra: null, nt: 0, isNew: false, auto: false, shiny: false, sus: 0 };
function doRoll() {
  const pity = S.destiny >= PITY_MAX, tk = S.sum.force;
  const tenth = isTenth(), luck = baseLuck() * (tenth ? tenthMult() : 1) * S.next * (pity ? 50 : 1);
  S.next = 1;
  let a = rollAura(luck, pity ? 3 : tk ? 2 : 0);
  if (pity && tierOf(a.r) < 3) a = rollAura(luck, 3);
  if (tk) { S.sum.force = false; if (S.sum.bought.aura && Math.random() < .35) a = AMAP.summerwave; else if (tierOf(a.r) < 2) a = rollAura(luck, 2); }
  const t = tierOf(a.r);
  if (pity || t >= 3) S.destiny = 0; else { S.destiny = Math.min(PITY_MAX, S.destiny + 1); S.stats.maxPity = Math.max(S.stats.maxPity, S.destiny); }
  const shiny = Math.random() < shinyChance();
  S.rolls++; S.sinceAsc++; S.tc[t] = (S.tc[t] || 0) + 1;
  const isNew = !S.found[a.id];
  grant(a, shiny);
  const coins = Math.round(SHARD_TIER[Math.min(t, 13)] * coinMul()); S.coin += coins; S.stats.coins += coins;
  gainXP(XP_TIER[Math.min(t, 8)] * (isNew ? 2 : 1) * (shiny ? 3 : 1));
  sumRoll(t); dropMat(); dropClassic();
  return { a, shiny, isNew, coins, pity, tk };
}
const bestOf = res => res.reduce((m, r) => (r.a.r > m.a.r || (r.a.r === m.a.r && r.shiny)) ? r : m, res[0]);
function startRoll(n = 1) {
  if (RS.on || CUT.on || !started) return;
  if (n === 10 && !S.x10) return unlockX10();
  const now = performance.now() / 1000;
  COMBO.n = now - COMBO.t < 4.5 ? COMBO.n + 1 : 1; COMBO.t = now; if (COMBO.n > S.stats.maxCombo) S.stats.maxCombo = COMBO.n;
  const res = []; for (let i = 0; i < n; i++) res.push(doRoll());
  const pityHit = res.some(r => r.pity), ticket = res.some(r => r.tk);
  if (n === 10) S.stats.x10++;
  const best = bestOf(res);
  const g = gnt(); let extra = null;
  if (g && g.dbl && Math.random() < g.dbl) { extra = rollAura(baseLuck()); grant(extra, false); }
  const a = best.a, tier = tierOf(a.r);
  let dur = (n === 10 ? 2 : 1.5) / speed(); if (S.set.quick && tier < 3 && !best.shiny) dur *= .4; if (tier >= 2) dur = Math.max(dur, .9 + Math.min(tier, 8) * .12); if (pityHit) dur = Math.max(dur, 2);
  Object.assign(RS, { on: true, t: 0, dur: Math.max(.3, dur), res: a, extra, nt: 0, isNew: best.isNew, shiny: best.shiny, sus: 0, destiny: pityHit, tease: null, multi: n === 10 ? res : null, coins: res.reduce((s2, r) => s2 + r.coins, 0) });
  if (pityHit || Math.random() < (n === 10 ? .3 : .045)) spawnChest(pityHit ? 'gold' : null);
  checkQuests(); save(); updHUD();
  $('#rollBtn').classList.add('busy'); $('#rollBtn').classList.remove('destiny');
  if (pityHit) { banner('천장 도달', 'PITY ROLL', '#ffd36a', '행운 ×50 · 에픽 이상 확정!'); AU.tone(392, 1.4, 'triangle', .12, 784); }
  if (ticket) toast(`${icon('ticket', '#55e7ff', 18)} 파도 티켓 발동 · 레어 이상 확정`);
}
function quickRolls(n, label) {
  const res = []; for (let i = 0; i < n; i++) res.push(doRoll());
  const best = bestOf(res), t = tierOf(best.a.r);
  showMulti(res, label); renderRecent(); flyCoins(W / 2, H * .4, 10); AU.chime(Math.min(8, t)); if (best.shiny) AU.shiny();
  if (t >= 3 && !RS.on) { showResult(best.a, best.isNew, best.shiny); BURST.fire(best.a, t, best.shiny); }
  checkQuests(); save(); updHUD();
}
function unlockX10() {
  if (S.coin < 3000) { toast(`×10 굴림 해금에는 샤드 3,000개가 필요해요 (지금 ${fmt(S.coin)})`); AU.tone(200, .15, 'square', .04); return; }
  S.coin -= 3000; S.x10 = true; save(); updHUD(); AU.chime(5); toast('<b>×10 굴림</b> 해금!'); checkQuests();
}
function sumRoll(t) {
  const m = S.sum; m.rolls++;
  if (m.rolls % 10 === 0) { m.sun += 5; m.total += 5; }
  if (t >= 2) m.rare++;
  if (Math.random() < .01) { m.sun += 10; m.total += 10; }
}
function grant(a, shiny) {
  S.auras[a.id] = (S.auras[a.id] || 0) + 1; S.found[a.id] = 1;
  if (shiny) { S.shiny[a.id] = (S.shiny[a.id] || 0) + 1; S.stats.shinies++; }
  if (!S.best || a.r > AMAP[S.best].r) S.best = a.id;
  if (!S.eq) S.eq = a.id;
  else if (S.set.autoEq && a.r > AMAP[S.eq].r) { S.eq = a.id; S.eqShiny = !!shiny; }
  else if (S.set.autoEq && shiny && S.eq === a.id) S.eqShiny = true;
  if (tierOf(a.r) >= 3 || shiny) { S.log.unshift({ id: a.id, at: Date.now(), b: S.biome, n: S.rolls, sh: shiny ? 1 : 0 }); S.log.length = Math.min(S.log.length, 30); }
  S.recent.unshift({ id: a.id, sh: shiny ? 1 : 0 }); S.recent.length = Math.min(S.recent.length, 8);
}
function teasePick(k) {
  const res = RS.res, rt = tierOf(res.r);
  const pool = AURAS.filter(a => eligible(a, S.biome));
  if (k > .82 && rt >= 3 && Math.random() < .5) return pick(pool.filter(a => tierOf(a.r) >= rt - 1));
  if (Math.random() < .7) return pick(pool.filter(a => tierOf(a.r) <= 2));
  return pick(pool);
}
function updRoll(dt) {
  if (!RS.on) return;
  RS.t += dt; const k = RS.t / RS.dur, rt = tierOf(RS.res.r);
  $('#rollBar').style.width = Math.min(100, k * 100) + '%';
  RS.sus = rt >= 2 && k > .5 ? Math.min(1, (k - .5) / .4) * Math.min(1, .35 + (rt - 2) * .16) : 0;
  CAM.zt = 1 + .05 * Math.min(1, k * 2) + RS.sus * .08;
  if (rt >= 4 && k > .6 && !S.set.motion) CAM.shake = Math.max(CAM.shake, (k - .6) * (Math.min(rt, 9) - 2) * 2.2);
  if (k < 1 && RS.t >= RS.nt) {
    const a = teasePick(k); RS.tease = a; setName(a, false); AU.tick(k);
    RS.nt = RS.t + (.05 + .2 * k * k) * clamp(RS.dur / 1.5, .35, 1) * (RS.sus ? 1.5 : 1);
  }
  if (k >= 1) { RS.on = false; RS.sus = 0; finishRoll(); }
}
function gainXP(n) {
  S.xp += n; let ups = 0;
  while (S.xp >= xpNeed(S.lv)) { S.xp -= xpNeed(S.lv); S.lv++; ups++; const rw = lvReward(S.lv); setTimeout(() => levelUp(S.lv, rw), 1900 + ups * 400); giveReward(rw); }
}
function levelUp(lv, rw) {
  const el = $('#lvup'); el.innerHTML = `<small>LEVEL UP</small><b>Lv.${lv}</b><span>${rwText(rw)} · 영구 행운 +1%</span>`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  AU.chime(5); [523, 659, 784, 1046].forEach((f, i) => AU.tone(f, .5, 'triangle', .08, null, i * .09)); SHOW.joy = 1.4; buzz([30, 30, 60]);
  const { cx, by, R } = orbPos(); for (let i = 0; i < 40; i++) BURST.P.push({ x: rnd(-.6, .6), y: rnd(.5, 1.4), vx: rnd(-.6, .6), vy: rnd(-4, -2), l: 0, m: rnd(.8, 1.4), c: pick(['#ffd36a', '#ffffff', '#ffe9a8']), s: .05 });
  updHUD();
}
function finishRoll() {
  const a = RS.res, tier = tierOf(a.r), sh = RS.shiny, multi = RS.multi, calm = S.set.motion;
  $('#rollBar').style.width = '0';
  showResult(a, RS.isNew, sh); renderRecent();
  AU.chime(tier); if (sh) AU.shiny();
  const { cx, by, R } = orbPos(); BURST.fire(a, tier, sh);
  SHOW.a = a; SHOW.sh = sh; SHOW.until = T + 1.8 + tier * .2; SHOW.joy = tier >= 2 || RS.isNew ? 1.3 : 0;
  CAM.hit = tier >= 3 && !calm ? .06 + Math.min(tier, 9) * .015 : 0; CAM.flash = tier >= 1 ? Math.min(.9, .12 + tier * .1) * (calm ? .25 : 1) : 0; CAM.fc = sh ? '#ffffff' : tierColor(a);
  CAM.shake = tier >= 2 && !calm ? 2 + Math.min(tier, 9) * 2.6 : 0; CAM.z = 1 + Math.min(.16, tier * .025); CAM.zt = 1;
  const cutOk = S.set.cut < 99 && tier >= S.set.cut && !S.cutOff[a.id];
  if (!cutOk) { if (multi) showMulti(multi); else popReveal(a, tier, RS.isNew, sh); }
  if (RS.coins >= 5 || tier >= 2) flyCoins(cx, by, Math.min(14, 2 + tier * 2));
  if (tier >= 3 || sh) buzz(tier >= 5 ? [40, 40, 80] : 30);
  if (RS.extra) setTimeout(() => toast(`오류 장갑 발동! 추가 획득 · <b style="color:${RS.extra.c}">${RS.extra.n}</b>`), 300);
  if (sh) setTimeout(() => toast(`✦ <b class="rainbow">빛나는 ${a.n}</b> 획득! (빛나는 확률 1/${fmt(1 / shinyChance())})`), 200);
  if (cutOk) playCut(a, { isNew: RS.isNew, shiny: sh, auto: RS.auto }, () => { if (multi) showMulti(multi); afterRoll(); });
  else afterRoll();
}
function playCut(a, opt, done) {
  const tier = tierOf(a.r); S.stats.cuts++;
  AU.whoosh(1.2 + tier * .4);
  CUT.start(a, Object.assign({ boom: () => { AU.boom(); AU.chime(tier); if (tier >= 5) AU.shatter(); if (opt.shiny) AU.shiny(); buzz(120); }, fake: () => AU.tone(200, .3, 'sine', .2, 60), done }, opt));
}
function afterRoll() {
  $('#rollBtn').classList.remove('busy'); $('#rollBtn').classList.toggle('destiny', S.destiny >= PITY_MAX); updHUD();
  if (RS.auto) setTimeout(() => { if (RS.auto) startRoll(S.set.auto10 && S.x10 ? 10 : 1); }, 120);
}
function setName(a, final) {
  const el = $('#rName'); el.textContent = a.n; el.style.color = mix(a.c, '#ffffff', .25); el.classList.remove('rainbow');
  if (!final) { $('#rEn').textContent = (a.en || '').toUpperCase(); $('#rMeta').innerHTML = '<span class="dim">굴리는 중…</span>'; }
}
function tagHTML(a) {
  if (a.biome) return ` <span class="btag" style="color:${BIOMES[a.biome].c}">◆${BIOMES[a.biome].n}</span>`;
  if (a.night) return ' <span class="btag" style="color:#b8c4ff">☾밤</span>';
  if (a.day) return ' <span class="btag" style="color:#ffd88a">☀낮</span>';
  if (a.fusion) return ' <span class="btag" style="color:#ffe9a8">융합</span>';
  return '';
}
function showResult(a, isNew, shiny) {
  setName(a, true);
  const el = $('#rName'); if (shiny) { el.textContent = '✦ ' + a.n; el.classList.add('rainbow'); }
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  const tier = tierOf(a.r), er = effR(a, S.biome);
  $('#rEn').textContent = (shiny ? 'SHINY ' : '') + a.en.toUpperCase();
  $('#rMeta').innerHTML = `<span class="tierTag" style="color:${tierColor(a)}">${a.sym} ${tierLabel(a)}</span>1 / ${fmt(a.r)}${er < a.r && !a.fusion ? ` <span class="dim">(지금 1/${fmt(er)})</span>` : ''}${tagHTML(a)}${isNew ? ' <span class="newTag">NEW</span>' : ''}`;
}
function showIdle() {
  const a = S.eq ? AMAP[S.eq] : null;
  if (!a) { $('#rName').textContent = 'VOIDROLL'; $('#rName').style.color = '#d9d0ff'; $('#rEn').textContent = 'R E N E W A L'; $('#rMeta').innerHTML = '<span class="dim">ROLL을 눌러 운명을 굴려보세요</span>'; return; }
  showResult(a, false, S.eqShiny && S.shiny[a.id]); $('#rName').classList.remove('pop');
  $('#rMeta').innerHTML = `<span class="dim">장착 중</span> · ` + $('#rMeta').innerHTML;
}
function renderRecent() {
  $('#recent').innerHTML = S.recent.map((r, i) => { const a = AMAP[r.id]; return a ? `<i style="opacity:${1 - i * .09}" title="${a.n}">${orbCSS(a, 16 - Math.min(i, 4), r.sh)}</i>` : ''; }).join('');
}

/* ── 재료 ── */
function dropMat() {
  const b = S.biome; let ch = b === 'normal' ? .11 : .1; for (const c of charmsOn()) if (c.mat) ch *= c.mat;
  if (Math.random() >= ch) return;
  let m = BIOMES[b].mat; if (b === 'glitch' && Math.random() < .5) m = pick(Object.keys(MATS).filter(x => x !== 'voiddust'));
  const n = Math.random() < .15 ? 2 : 1; S.mats[m] = (S.mats[m] || 0) + n;
  floatChip(`${icon(MATS[m].ic, MATS[m].c, 16)} +${n} ${MATS[m].n}`);
}
function dropClassic() {
  for (const id in MATS) { const M = MATS[id]; if (!M.drop || Math.random() >= M.drop) continue; S.mats[id] = (S.mats[id] || 0) + 1; S.stats.mats++; if (M.drop < .05) floatChip(`${icon(M.ic, M.c, 16)} +1 ${M.n}`); }
}
function floatChip(html) {
  const d = document.createElement('div'); d.className = 'float'; d.innerHTML = html; $('#floats').appendChild(d);
  setTimeout(() => d.remove(), 1700);
}

/* ── 날씨 ── */
function pickBiome(exclude) {
  const ent = Object.entries(BIOMES).filter(([k, b]) => k !== exclude && b.w > 0 && (k !== 'void' || S.gateOpen));
  let tot = ent.reduce((s, [, b]) => s + b.w, 0), r = Math.random() * tot;
  for (const [k, b] of ent) { r -= b.w; if (r <= 0) return k; } return ent[0][0];
}
function setBiome(k, durSec, quiet) {
  const B = BIOMES[k]; S.biome = k; S.biomeEnd = Date.now() + (durSec || rnd(B.dur[0], B.dur[1])) * 1000;
  const first = !S.seen[k]; S.seen[k] = 1; bfx.set(k); AU.mt = 0;
  if (!quiet) { banner(B.n, B.en, B.c, `날씨가 바뀌었습니다${first ? ' · 첫 관측!' : ''}`); AU.tone(330, .8, 'sine', .08, 660); }
  updHUD(); checkQuests(); save();
}
function tickBiome() {
  if (Date.now() < S.biomeEnd) return;
  if (S.biome === 'normal') { if (Math.random() < .45) setBiome('normal', null, true); else setBiome(pickBiome('normal')); }
  else setBiome('normal');
}
function banner(name, en, col, sub) {
  const el = $('#banner');
  el.innerHTML = `<small>${sub}</small><b style="color:${col}">${name}</b><span>${en}</span>`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}
let lastNight = null;
function tickDay() {
  const n = isNight();
  if (lastNight !== null && n !== lastNight) { banner(n ? '밤' : '낮', n ? 'NIGHTFALL' : 'DAYBREAK', n ? '#b8c4ff' : '#ffd88a', n ? '밤이 찾아왔습니다 · 밤 한정 오라 출현' : '해가 떴습니다 · 낮 한정 오라 출현'); AU.mt = 0; }
  lastNight = n;
  $('#dayChip').innerHTML = `${n ? '☾' : '☀'} <span>${mmss(dayLeft())}</span>`; $('#dayChip').classList.toggle('night', n);
}

/* ── 상인 ── */
function merOn() { return S.mer.until > Date.now(); }
function tickMerchant() {
  const now = Date.now();
  if (!merOn() && now >= S.mer.next) {
    const pool = [...SHOP_POOL].sort(() => Math.random() - .5).slice(0, 5);
    S.mer.offers = pool.map(o => Object.assign({ sold: 0 }, o)); S.mer.until = now + 180000; S.mer.next = now + 180000 + rnd(360, 540) * 1000;
    toast(`${icon('cart', '#ffcf6a', 18)} <b>떠돌이 상인 조르</b>가 찾아왔어요! (3분)`); AU.coin(); save();
  }
  const b = $('#merBtn'); b.classList.toggle('hide', !merOn());
  if (merOn()) b.querySelector('span').textContent = mmss((S.mer.until - now) / 1000);
}
function buyOffer(i) {
  const o = S.mer.offers[i]; if (!o || o.sold || S.coin < o.p) return;
  S.coin -= o.p; o.sold = 1; S.stats.buys++;
  if (o.k === 'pot') S.pots[o.id] = (S.pots[o.id] || 0) + o.n; else S.mats[o.id] = (S.mats[o.id] || 0) + o.n;
  AU.coin(); save(); checkQuests(); refreshSheet(); updHUD();
}

/* ── 별똥별 이벤트 ── */
let STAR = null, starNext = 60;
function tickStar(dt) {
  if (!started) return;
  if (!STAR) { starNext -= dt; if (starNext <= 0 && !CUT.on) { const fromL = Math.random() < .5; STAR = { x: fromL ? -30 : W + 30, y: H * rnd(.14, .3), vx: (fromL ? 1 : -1) * rnd(55, 85), vy: rnd(8, 22), l: 0, trail: [] }; starNext = rnd(70, 150); } return; }
  STAR.l += dt; STAR.x += STAR.vx * dt; STAR.y += STAR.vy * dt; STAR.trail.unshift([STAR.x, STAR.y]); STAR.trail.length = Math.min(STAR.trail.length, 24);
  if (STAR.x < -60 || STAR.x > W + 60) STAR = null;
}
function drawStar(ctx) {
  if (!STAR) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
  STAR.trail.forEach(([x, y], i) => glow(ctx, i < 4 ? '#ffffff' : '#ffe08a', x, y, 14 - i * .5, (1 - i / 24) * .6));
  const p = 1 + .25 * Math.sin(T * 10); glow(ctx, '#ffe9a8', STAR.x, STAR.y, 44 * p, .9); glow(ctx, '#ffffff', STAR.x, STAR.y, 14, 1);
  ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.beginPath(); for (let j = 0; j < 8; j++) { const a2 = j * Math.PI / 4 + T * 2, r2 = j % 2 ? 4 : 16 * p; ctx.lineTo(STAR.x + Math.cos(a2) * r2, STAR.y + Math.sin(a2) * r2); } ctx.closePath(); ctx.fill();
  ctx.globalAlpha = .7; ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(STAR.x, STAR.y, 24 + (T * 30 % 16), 0, TAU); ctx.stroke();
  ctx.restore();
}
function catchStar() {
  const { x, y } = STAR; STAR = null; S.stats.stars++; AU.shiny(); buzz(40);
  BURST.P.push(...Array.from({ length: 30 }, () => ({ x: 0, y: 0, vx: rnd(-3, 3), vy: rnd(-3, 3), l: 0, m: rnd(.5, 1), c: pick(['#ffe9a8', '#ffffff', '#ffb0d4']), s: .06 })));
  const r = Math.random();
  if (r < .4) { const c = Math.round(rnd(40, 120) * (1 + S.rolls / 2000)); S.coin += c; toast(`별똥별을 잡았다! ${coinI()} <b>+${fmt(c)}</b>`); }
  else if (r < .7) { S.starBoost = Math.max(Date.now(), S.starBoost) + 60000; toast('별똥별의 축복! <b>1분간 행운 ×1.5</b>'); }
  else if (r < .9) { const m = pick(Object.keys(MATS).filter(k => k !== 'voiddust' && k !== 'byte')); S.mats[m] = (S.mats[m] || 0) + 4; toast(`별똥별을 잡았다! ${icon(MATS[m].ic, MATS[m].c, 16)} ${MATS[m].n} +4`); }
  else { S.pots.dice = (S.pots.dice || 0) + 1; toast(`별똥별 안에서 ${potIcon('dice', 16)} <b>행운 주사위</b>를 찾았다!`); }
  floatChip('✦ 별똥별 ✦'); checkQuests(); save(); updHUD();
}
cv.addEventListener('pointerdown', e => {
  if (STAR && Math.hypot(e.clientX - STAR.x, e.clientY - STAR.y) < 48) return catchStar();
  const { R } = orbPos();
  for (const c of CHESTS) if (!c.open && Math.hypot(e.clientX - c.x, e.clientY - (c.y - R * .4)) < R * .9) return openChest(c);
});

/* ── 획득 연출 카드 ── */
function popReveal(a, tier, isNew, sh) {
  if (tier < 1 && !isNew && !sh) return;
  const el = $('#reveal');
  el.style.setProperty('--tc', tierColor(a)); el.style.setProperty('--ac', a.c);
  el.className = 't' + tier + (sh ? ' shiny' : '');
  el.innerHTML = `<div class="rv">${orbCSS(a, 54, sh)}<div><i>${a.fusion ? '융합 · ' : ''}${tierLabel(a)}</i><b class="${sh ? 'rainbow' : ''}">${sh ? '✦ ' : ''}${a.n}</b><small>1 / ${fmt(a.r)}</small></div>${isNew ? '<em>NEW!</em>' : ''}</div>`;
  void el.offsetWidth; el.classList.add('show');
  clearTimeout(popReveal.tm); popReveal.tm = setTimeout(() => el.classList.remove('show'), 1300 + tier * 150);
}

/* ── 날아가는 샤드 ── */
const FLY = [];
function flyCoins(x, y, n) {
  const r = $('#coinVal').getBoundingClientRect(), tx = r.left + 6, ty = r.top + r.height / 2;
  for (let i = 0; i < n; i++) FLY.push({ x: x + rnd(-20, 20), y: y + rnd(-20, 20), sx: x + rnd(-60, 60), sy: y - rnd(40, 120), tx, ty, l: -i * .04, m: rnd(.6, .85) });
}
function drawFly(ctx, dt) {
  for (let i = FLY.length - 1; i >= 0; i--) {
    const f = FLY[i]; f.l += dt; if (f.l < 0) continue; const k = Math.min(1, f.l / f.m), e = k * k;
    const x = (1 - k) * (1 - k) * f.x + 2 * (1 - k) * k * f.sx + k * k * f.tx, y = (1 - k) * (1 - k) * f.y + 2 * (1 - k) * k * f.sy + k * k * f.ty;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, '#6fd8ff', x, y, 12, .8); ctx.restore();
    const fw = 5 * Math.abs(Math.cos(f.l * 12)) + 1; ctx.fillStyle = '#6fd8ff'; ctx.strokeStyle = '#2a5aa8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + fw, y - 1); ctx.lineTo(x, y + 7); ctx.lineTo(x - fw, y - 1); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (k >= 1) { FLY.splice(i, 1); const c = $('#coinBox'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); if (Math.random() < .5) AU.tone(1800 + rnd(0, 400), .05, 'square', .015); }
  }
}

/* ── 보물 상자 ── */
const CHESTS = [];
function spawnChest(type) {
  if (CHESTS.length >= 3) return;
  if (!type) { const r = Math.random() * 100; type = r < CHEST.gold.w ? 'gold' : r < CHEST.gold.w + CHEST.silver.w ? 'silver' : 'wood'; }
  const { cx, by, R } = orbPos(), side = Math.random() < .5 ? -1 : 1;
  const x = cx + side * rnd(R * 1.8, Math.min(W * .36, R * 2.8)), gy = by + R * 1.75 + rnd(-R * .15, R * .35);
  CHESTS.push({ type, x, y: -40, gy, vy: 0, l: 0, open: 0, ot: 0, bounced: 0, life: 0 });
  AU.tone(660, .15, 'triangle', .06, 990);
}
function updChests(dt) {
  for (let i = CHESTS.length - 1; i >= 0; i--) {
    const c = CHESTS[i]; c.l += dt;
    if (c.y < c.gy || c.vy < 0) { c.vy += 1800 * dt; c.y += c.vy * dt; if (c.y >= c.gy) { c.y = c.gy; if (c.bounced < 2) { c.vy = -c.vy * .35; c.bounced++; AU.tone(160, .08, 'sine', .08); } else c.vy = 0; } }
    if (!c.open) { c.life += dt; if ((RS.auto && c.life > 3.5) || c.life > 45) openChest(c); }
    else { c.ot += dt; if (c.ot > 1.4) CHESTS.splice(i, 1); }
  }
}
function drawChest(ctx, c, R) {
  const C = CHEST[c.type], s = R * (c.type === 'gold' ? .78 : .64), x = c.x, y = c.y, t = T;
  ctx.save(); ctx.globalAlpha = c.open ? Math.max(0, 1 - Math.max(0, c.ot - .8) / .6) : 1;
  ctx.globalCompositeOperation = 'lighter'; glow(ctx, C.glow, x, y - s * .5, s * (2.2 + .3 * Math.sin(t * 4)), c.open ? .9 : .45); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, y + s * .05, s * 1.1, s * .25, 0, 0, TAU); ctx.fill();
  const wob = c.open ? 0 : Math.sin(t * 9) * (Math.sin(t * 1.3) > .7 ? .08 : 0);
  ctx.translate(x, y); ctx.rotate(wob);
  let g = ctx.createLinearGradient(0, -s, 0, 0); g.addColorStop(0, C.c); g.addColorStop(1, C.c2);
  ctx.fillStyle = g; ctx.fillRect(-s, -s * .9, s * 2, s * .9); ctx.strokeStyle = 'rgba(30,15,0,.75)'; ctx.lineWidth = 2; ctx.strokeRect(-s, -s * .9, s * 2, s * .9);
  ctx.fillStyle = mix(C.c2, '#000000', .3); ctx.fillRect(-s * .72, -s * .9, s * .16, s * .9); ctx.fillRect(s * .56, -s * .9, s * .16, s * .9);
  // 뚜껑
  ctx.save(); ctx.translate(0, -s * .9); ctx.rotate(-Math.min(1, c.ot * 4) * 1.9 * (c.open ? 1 : 0));
  g = ctx.createLinearGradient(0, -s * .6, 0, 0); g.addColorStop(0, mix(C.c, '#ffffff', .3)); g.addColorStop(1, C.c);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s, -s * .3); ctx.quadraticCurveTo(0, -s * .85, s, -s * .3); ctx.lineTo(s, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(30,15,0,.75)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = mix(C.c2, '#000000', .3); ctx.fillRect(-s * .72, -s * .55, s * .16, s * .55); ctx.fillRect(s * .56, -s * .55, s * .16, s * .55);
  ctx.restore();
  if (!c.open) { ctx.fillStyle = c.type === 'gold' ? '#ff4a8a' : c.type === 'silver' ? '#4ad8ff' : '#ffd36a'; ctx.beginPath(); ctx.arc(0, -s * .85, s * .16, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-s * .05, -s * .9, s * .05, 0, TAU); ctx.fill();
    ctx.globalAlpha = .55 + .45 * Math.sin(t * 5); ctx.fillStyle = '#ffffff'; ctx.font = `900 ${Math.round(s * .55)}px 'Noto Sans KR'`; ctx.textAlign = 'center'; ctx.fillText('TAP!', 0, -s * 2); }
  ctx.restore();
}
function openChest(c) {
  if (c.open) return; c.open = 1; c.ot = 0; S.stats.chests++;
  const out = [], C = CHEST[c.type];
  const coin = Math.round((c.type === 'gold' ? rnd(300, 700) : c.type === 'silver' ? rnd(80, 200) : rnd(20, 60)) * (1 + S.lv * .03));
  S.coin += coin; S.stats.coins += coin; out.push(`${coinI()} ${fmt(coin)}`);
  const mats = Object.keys(MATS).filter(k => k !== 'voiddust' && k !== 'byte');
  const mn = c.type === 'gold' ? 6 : c.type === 'silver' ? 4 : Math.random() < .35 ? 2 : 0;
  if (mn) { const m = c.type === 'gold' ? pick(['starfrag', 'ember', 'blossom', 'sunglass']) : pick(mats); S.mats[m] = (S.mats[m] || 0) + mn; out.push(`${icon(MATS[m].ic, MATS[m].c, 16)} ${MATS[m].n} ×${mn}`); }
  if (c.type === 'gold' || (c.type === 'silver' && Math.random() < .4)) { const pid = c.type === 'gold' ? pick(['fortune', 'starlit', 'haste', 'dice', 'shinydust']) : pick(['lucky', 'swift', 'dice']); S.pots[pid] = (S.pots[pid] || 0) + 1; out.push(`${potIcon(pid, 16)} ${POTIONS[pid].n}`); }
  if (c.type === 'gold' && Math.random() < .3) { S.mats.voiddust = (S.mats.voiddust || 0) + 5; out.push(`${icon('void', '#9a6cff', 16)} 공허 가루 ×5`); }
  toast(`<b style="color:${C.c}">${C.n}</b> · ${out.join(' · ')}`);
  AU.chime(c.type === 'gold' ? 5 : c.type === 'silver' ? 3 : 1); AU.coin(); buzz(25);
  flyCoins(c.x, c.y - 20, c.type === 'gold' ? 16 : c.type === 'silver' ? 10 : 6);
  for (let i = 0; i < (c.type === 'gold' ? 40 : 18); i++) SPARK.push({ x: c.x, y: c.y - 20, vx: rnd(-160, 160), vy: rnd(-380, -120), l: 0, m: rnd(.6, 1.1), c: pick([C.glow, '#ffffff', '#ffd36a']) });
  checkQuests(); save(); updHUD();
}
const SPARK = [];
function drawSparks(ctx, dt) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = SPARK.length - 1; i >= 0; i--) { const p = SPARK[i]; p.l += dt; if (p.l > p.m) { SPARK.splice(i, 1); continue; } p.vy += 600 * dt; p.x += p.vx * dt; p.y += p.vy * dt; glow(ctx, p.c, p.x, p.y, 8, 1 - p.l / p.m); }
  ctx.restore();
}

/* ── 콤보 ── */
function updCombo() {
  const now = performance.now() / 1000, el = $('#combo');
  if (COMBO.n && !RS.on && !CUT.on && now - COMBO.t > 4.5) { if (COMBO.n >= 10) floatChip(`콤보 ${COMBO.n} 종료`); COMBO.n = 0; updHUD(); }
  if (COMBO.n >= 3) {
    el.classList.remove('hide'); const left = Math.max(0, 1 - (now - COMBO.t) / 4.5);
    el.innerHTML = `<b>${COMBO.n}</b><small>COMBO</small><span>행운 +${Math.round(comboBonus() * 100)}%</span><i style="width:${(RS.on || CUT.on ? 1 : left) * 100}%"></i>`;
    el.classList.toggle('hot', COMBO.n >= 25); el.classList.toggle('max', COMBO.n >= 50);
  } else el.classList.add('hide');
}

/* ── HUD ── */
function updHUD() {
  const B = BIOMES[S.biome];
  $('#biomeChip').style.setProperty('--bc', B.c); $('#biomeName').textContent = B.n;
  $('#luckVal').textContent = fmtX(baseLuck()); $('#spdVal').textContent = fmtX(speed()); $('#coinVal').textContent = fmt(S.coin);
  const ev = bonusEvery(), left = ev - (S.rolls % ev);
  $('#tenth').innerHTML = left === 1 ? `<b class="hot">다음 굴림 행운 ×${tenthMult()}!</b>` : `${tenthMult()}배 보너스까지 <b>${left}</b>회`;
  let h = '';
  for (const id in S.active) { const s = (S.active[id] - Date.now()) / 1000; if (s > 0 && POTIONS[id]) h += `<div class="buff">${potIcon(id, 18)}${POTIONS[id].n} <b>${mmss(s)}</b></div>`; }
  if (S.starBoost > Date.now()) h += `<div class="buff hot">✦ 별똥별 축복 <b>${mmss((S.starBoost - Date.now()) / 1000)}</b></div>`;
  if (S.next > 1) h += `<div class="buff hot">${icon('elixir', '#ffe9a8', 18)}다음 굴림 <b>${fmtX(S.next)}</b></div>`;
  if (S.eqG) h += `<div class="buff">${icon('glove', GAUNTLETS[S.eqG].c, 18)}${GAUNTLETS[S.eqG].n}</div>`;
  for (const id of S.eqC) if (CHARMS[id]) h += `<div class="buff">${icon(CHARMS[id].ic, CHARMS[id].c, 18)}${CHARMS[id].n}</div>`;
  const SKL = { luck: '행운', speed: '속도', rarity: '희귀' };
  for (const k in S.skb) { const b = S.skb[k], s2 = (b.end - Date.now()) / 1000; if (s2 > 0) h += `<div class="buff sk">✦ ${b.n} · ${SKL[k]} ${fmtX(b.v)} <b>${mmss(s2)}</b></div>`; }
  if (S.sum.rareUntil > Date.now()) h += `<div class="buff sea">${icon('ticket', '#55e7ff', 18)}파도 티켓 · 희귀 ×4 <b>${mmss((S.sum.rareUntil - Date.now()) / 1000)}</b></div>`;
  if (S.sum.force) h += `<div class="buff sea">${icon('ticket', '#55e7ff', 18)}다음 굴림 레어 이상 확정</div>`;
  $('#buffs').innerHTML = h;
  $('#lvNum').textContent = S.lv; $('#lvBar').style.width = (S.xp / xpNeed(S.lv) * 100) + '%'; $('#lvTxt').textContent = `${fmt(S.xp)} / ${fmt(xpNeed(S.lv))}`;
  const dk = S.destiny / PITY_MAX; $('#dsBar').style.width = (dk * 100) + '%'; $('#dsTxt').textContent = dk >= 1 ? '천장 도달 · 에픽 이상 확정!' : `천장 ${S.destiny}/${PITY_MAX}`; $('#destiny').classList.toggle('full', dk >= 1);
  $('#rollBtn').classList.toggle('destiny', dk >= 1 && !RS.on);
  $('#autoBtn').classList.toggle('on', RS.auto);
  const xb = $('#x10Btn'); xb.classList.toggle('x10on', S.x10); xb.innerHTML = S.x10 ? `×10${RS.auto && S.set.auto10 ? '<small>자동</small>' : ''}` : `×10<small>${coinI(10)}3,000</small>`;
  $('#qdot').style.display = QUESTS.some(q => !S.quests[q.id] && qDone(q)) || CHALLENGES.some(c => !S.ch[c.id] && qDone(c)) ? 'block' : 'none';
  $('#nickTxt').textContent = S.nick; $('#nickTxt').classList.toggle('hide', !S.nick);
  $('#sunVal').textContent = fmt(S.sum.sun); $('#sumBtn').classList.toggle('hot', sumAlert());
  updSkill();
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
  if (rw.coin) { S.coin += rw.coin; S.stats.coins += rw.coin; out.push(`샤드 ${fmt(rw.coin)}`); }
  for (const id in rw.pots || {}) { S.pots[id] = (S.pots[id] || 0) + rw.pots[id]; out.push(`${POTIONS[id].n} ×${rw.pots[id]}`); }
  for (const id in rw.mats || {}) { S.mats[id] = (S.mats[id] || 0) + rw.mats[id]; out.push(`${MATS[id].n} ×${rw.mats[id]}`); }
  return out.join(', ');
}
function rwText(rw) {
  const out = [];
  if (rw.coin) out.push(`${coinI()}${fmt(rw.coin)}`);
  for (const id in rw.pots || {}) out.push(`${potIcon(id, 16)}${POTIONS[id].n} ×${rw.pots[id]}`);
  for (const id in rw.mats || {}) out.push(`${icon(MATS[id].ic, MATS[id].c, 16)}${MATS[id].n} ×${rw.mats[id]}`);
  return out.join(' ');
}

/* ── 비용 ── */
function canPay(cost) { for (const k in cost) { if (k === 'coin') { if (S.coin < cost[k]) return false; } else if (k[0] === '@') { if (avail(k.slice(1)) < cost[k]) return false; } else if ((S.mats[k] || 0) < cost[k]) return false; } return true; }
function pay(cost) { for (const k in cost) { if (k === 'coin') S.coin -= cost[k]; else if (k[0] === '@') S.auras[k.slice(1)] -= cost[k]; else S.mats[k] -= cost[k]; } }
function costHTML(cost) {
  return '<div class="cost">' + Object.entries(cost).map(([k, n]) => {
    if (k === 'coin') return `<span class="cc ${S.coin >= n ? '' : 'no'}">${coinI(14)}샤드 ${fmt(S.coin)}/${fmt(n)}</span>`;
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
  $('#sheet').classList.remove('hide'); $('#shBody').scrollTop = 0;
}
function drawSheet() {
  SH.previews = [];
  $('#shTitle').innerHTML = SH.cur.title; $('#shBack').style.visibility = SH.stack.length ? 'visible' : 'hidden';
  const b = $('#shBody'); b.innerHTML = ''; SH.cur.render(b);
}
function refreshSheet() { if (!$('#sheet').classList.contains('hide') && SH.cur) { const b = $('#shBody'), st = b.scrollTop; drawSheet(); b.scrollTop = st; } }
function closeSheet() { $('#sheet').classList.add('hide'); SH.stack = []; SH.cur = null; SH.previews = []; }
function backSheet() { if (!SH.stack.length) return closeSheet(); SH.cur = SH.stack.pop(); drawSheet(); }
$('#shClose').onclick = () => { AU.ui(); closeSheet(); };
$('#shBack').onclick = () => { AU.ui(); backSheet(); };
$('#sheet').addEventListener('pointerdown', e => { if (e.target.id === 'sheet') closeSheet(); });
function h(html) { const d = document.createElement('div'); d.innerHTML = html; return d; }
function addPreview(host, a, height = 240, shiny = false) {
  const c = document.createElement('canvas'); c.className = 'preview'; c.style.height = height + 'px'; host.appendChild(c);
  const fx = new AuraFX(); fx.set(a, shiny); SH.previews.push({ c, fx, a, ctx: c.getContext('2d') });
}

/* ── 지도 ── */
function mapSVG() {
  const open = S.gateOpen, eqc = S.eq ? AMAP[S.eq].c : '#a5abc0', mer = merOn(), night = isNight();
  let stars = ''; for (let i = 0; i < 70; i++) stars += `<circle cx="${(i * 73 + 11) % 400}" cy="${(i * 131 + 7) % 330}" r="${(i % 3) * .45 + .4}" fill="#fff" opacity="${(.25 + (i % 5) * .12) * (night ? 1.3 : .8)}"/>`;
  const npcMini = (x, y, robe, hat, eye) => `<g transform="translate(${x},${y})" class="bob"><ellipse cy="22" rx="9" ry="3" fill="#000" opacity=".45"/><path d="M-8 21Q-9 5 0 3Q9 5 8 21Z" fill="${robe}"/><circle cy="-3" r="6.5" fill="${eye ? '#05020c' : '#f2c8a8'}"/>${hat}${eye ? `<circle cx="-2.4" cy="-3" r="1.2" fill="${eye}"/><circle cx="2.4" cy="-3" r="1.2" fill="${eye}"/>` : ''}</g>`;
  const label = (t, lock, gold) => `<g transform="translate(0,62)"><rect x="-50" y="-12" width="100" height="24" rx="12" fill="rgba(8,6,26,.85)" stroke="${lock ? '#555' : gold ? '#ffcf6a' : '#8a6cff'}" stroke-opacity=".8"/><text text-anchor="middle" y="4.5" font-size="12" font-weight="700" fill="${lock ? '#888' : '#fff'}">${t}</text></g>`;
  return `<svg viewBox="0 0 400 640" class="map" xmlns="http://www.w3.org/2000/svg">
<defs>
 <linearGradient id="msky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night ? '#02020f' : '#04031a'}"/><stop offset=".55" stop-color="${night ? '#0d0a34' : '#17104a'}"/><stop offset="1" stop-color="#2b1b62"/></linearGradient>
 <linearGradient id="isl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#28366e"/><stop offset="1" stop-color="#151a46"/></linearGradient>
 <linearGradient id="rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1f58"/><stop offset="1" stop-color="#0a0820" stop-opacity="0"/></linearGradient>
 <radialGradient id="portal"><stop offset="0" stop-color="#000"/><stop offset=".55" stop-color="#2a0a5a"/><stop offset="1" stop-color="#a07aff"/></radialGradient>
 <radialGradient id="gl"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
 <radialGradient id="orbm"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="${eqc}"/><stop offset="1" stop-color="${eqc}" stop-opacity=".2"/></radialGradient>
 <radialGradient id="fus"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#ffe9a8"/><stop offset="1" stop-color="#ff8ad8" stop-opacity="0"/></radialGradient>
</defs>
<rect width="400" height="640" fill="url(#msky)"/>${stars}
${night ? '<circle cx="330" cy="60" r="26" fill="#f0f4ff" opacity=".95"/><circle cx="342" cy="52" r="24" fill="#0a0828"/>' : '<circle cx="330" cy="62" r="40" fill="#ffd88a" opacity=".12"/><circle cx="330" cy="62" r="20" fill="#ffe6a8" opacity=".85"/>'}
<path d="M18 200C40 150 360 150 384 200C398 300 396 470 370 540C330 590 260 606 200 608C140 606 70 590 30 540C4 470 2 300 18 200Z" fill="url(#rock)" transform="translate(0,26)"/>
<path d="M60 600l20 30 14-26 18 34 16-34 22 30 14-28 20 26 16-30 18 26 22-26 18 32 14-30 22 24 18-30" fill="none" stroke="#2a1f58" stroke-width="10" opacity=".7"/>
<path d="M18 200C40 150 360 150 384 200C398 300 396 470 370 540C330 590 260 606 200 608C140 606 70 590 30 540C4 470 2 300 18 200Z" fill="url(#isl)" stroke="#5a6ad0" stroke-opacity=".5" stroke-width="2"/>
<g fill="#3a5aa0" opacity=".5"><ellipse cx="60" cy="300" rx="18" ry="6"/><ellipse cx="350" cy="320" rx="14" ry="5"/><ellipse cx="140" cy="470" rx="20" ry="6"/><ellipse cx="270" cy="480" rx="16" ry="5"/></g>
<g class="deco">${[[46, 330], [64, 350], [352, 350], [336, 372], [120, 560], [176, 590], [230, 590], [32, 420], [372, 430]].map(([x, y], i) => `<g transform="translate(${x},${y})"><ellipse cy="12" rx="9" ry="3" fill="#000" opacity=".35"/><path d="M0 -18L10 6H-10Z" fill="${i % 2 ? '#2a5a6e' : '#2f4f86'}"/><path d="M0 -26L8 -4H-8Z" fill="${i % 2 ? '#367a8a' : '#3d63a6'}"/></g>`).join('')}${[[110, 330], [300, 330], [60, 470], [346, 470], [150, 420], [252, 420]].map(([x, y]) => `<g transform="translate(${x},${y})" class="tw"><rect x="-1" y="-4" width="2" height="6" fill="#c8b8ff"/><ellipse cy="-5" rx="5" ry="3" fill="#ff7ad8"/><circle cy="-5" r="8" fill="#ff7ad8" opacity=".15"/></g>`).join('')}</g>
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
<g class="loc" data-loc="fusion" transform="translate(200,330)">
 <circle r="56" fill="url(#fus)" opacity=".35" class="tw"/><ellipse cy="30" rx="44" ry="10" fill="#000" opacity=".4"/>
 <path d="M-34 30L-26 0H26L34 30Z" fill="#3a3270"/><path d="M-26 0L-20 -8H20L26 0Z" fill="#5a4ea6"/>
 <rect x="-40" y="-40" width="8" height="70" rx="3" fill="#4a3c8a"/><rect x="32" y="-40" width="8" height="70" rx="3" fill="#4a3c8a"/>
 <circle cx="-36" cy="-44" r="6" fill="#ff8ad8" class="flick"/><circle cx="36" cy="-44" r="6" fill="#8ad8ff" class="flick"/>
 <g class="spin"><circle cx="-12" cy="-26" r="7" fill="#ff8ad8"/><circle cx="12" cy="-26" r="7" fill="#8ad8ff"/></g>
 <circle cy="-26" r="9" fill="url(#fus)" class="bob"/>
 ${npcMini(54, 6, '#f0e0ff', '<circle cy="-3" r="7" fill="#fff6c8" opacity=".6"/>', '#ff8ad8')}
 <g transform="translate(0,-12)">${label('융합의 제단', false, true)}</g>
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
${mer ? `<g class="loc" data-loc="merchant" transform="translate(316,548)">
 <circle r="46" fill="url(#gl)" opacity=".16" class="tw"/><ellipse cy="22" rx="40" ry="8" fill="#000" opacity=".45"/>
 <path d="M-34 10h56v-26h-56z" fill="#7a4a2a"/><path d="M-38 -16Q-6 -46 26 -16Z" fill="#c84a4a"/><path d="M-30 -18Q-6 -40 18 -18" stroke="#ffcf6a" stroke-width="3" fill="none"/>
 <circle cx="-22" cy="14" r="8" fill="#3a2a1a" stroke="#c89a5a" stroke-width="2"/><circle cx="12" cy="14" r="8" fill="#3a2a1a" stroke="#c89a5a" stroke-width="2"/>
 <g fill="#ffcf6a" class="bob"><circle cx="-12" cy="-4" r="4"/><circle cx="0" cy="-2" r="3"/></g>
 ${npcMini(40, 0, '#4a6a3a', '<path d="M-10 -5h20l-4-8h-12z" fill="#7a5a2a"/>')}
 <g transform="translate(0,-18)">${label('떠돌이 상인', false, true)}</g>
</g>` : ''}
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
    case 'jorr': return base('#2e2a14', '#4a6a3a', '#e8b890', `<path d="M20 26h40l-6-14H26z" fill="#7a5a2a"/><rect x="20" y="24" width="40" height="5" fill="#c84a4a"/>${eyes()}<path d="M30 42Q40 50 50 42" stroke="#5a3a1a" stroke-width="3" fill="none"/><path d="M33 44Q40 48 47 44" stroke="#fff" stroke-width="1.4" fill="none"/><circle cx="58" cy="62" r="6" fill="#ffcf4a" stroke="#a8761a" stroke-width="1.5"/>`);
    case 'marina': return base('#0e3a5a', '#2a8ad8', '#f6d2bc', `<path d="M22 40Q18 18 40 16Q62 18 58 40Q60 58 54 66Q52 40 40 30Q28 40 26 66Q20 58 22 40Z" fill="#ffb454"/><path d="M18 26Q40 6 62 26L58 28Q40 14 22 28Z" fill="#fff1d6"/><circle cx="56" cy="22" r="4" fill="#ff8fc7"/>${eyes('#1a4a7a')}<path d="M36 43Q40 47 44 43" stroke="#c05a6a" stroke-width="1.6" fill="none"/><path d="M14 74q8-6 16 0t16 0 16 0" stroke="#55e7ff" stroke-width="3" fill="none"/>`);
    case 'lumen': return base('#2a1a40', '#f0e0ff', '#fff6e8', `<circle cx="40" cy="35" r="22" fill="#ffe9a8" opacity=".25"/><path d="M22 30Q40 6 58 30Q50 18 40 18Q30 18 22 30Z" fill="#ff8ad8"/><circle cx="34" cy="36" r="2.4" fill="#8ad8ff"/><circle cx="46" cy="36" r="2.4" fill="#ff8ad8"/><path d="M36 43Q40 46 44 43" stroke="#c05a8a" stroke-width="1.6" fill="none"/><g fill="#fff"><circle cx="16" cy="20" r="2"/><circle cx="64" cy="22" r="1.6"/><circle cx="62" cy="58" r="1.4"/></g>`);
  }
}
const LOC = {
  altar: { n: '제단 광장' }, alchemy: { n: '연금술 공방', npc: 'mira' }, forge: { n: '대장간', npc: 'bran' },
  archive: { n: '기록 보관소', npc: 'quill' }, observatory: { n: '천문대', npc: 'stella' }, gate: { n: '공허의 문', npc: 'keeper' },
  fusion: { n: '융합의 제단', npc: 'lumen' }, merchant: { n: '떠돌이 상인', npc: 'jorr' },
};
function pMap() {
  openSheet('세계 지도', b => {
    b.appendChild(h(`<div class="mapwrap">${mapSVG()}</div><p class="hint">건물을 눌러 들어가세요${merOn() ? ' · 지금 상인이 와 있어요!' : ''}</p>`));
    b.querySelectorAll('.loc').forEach(g => g.addEventListener('click', () => { AU.ui(); const id = g.dataset.loc; if (id === 'altar') return closeSheet(); pLoc(id); }));
  });
}
function npcHead(id, lockedLine) {
  const N = NPCS[id], line = lockedLine ? pick(N.locked) : pick(N.lines);
  return `<div class="npc">${npcSVG(id)}<div><b>${N.n}</b><small>${N.role}</small><p>“${line}”</p></div></div>`;
}
function pLoc(id, push = true) {
  const L = LOC[id];
  if (id === 'archive') return pIndex(true);
  openSheet(L.n, b => {
    ({ alchemy: renderAlchemy, forge: renderForge, observatory: renderObs, gate: renderGate, fusion: renderFusion, merchant: renderMerchant })[id](b);
  }, push);
}

/* 탭 공통 */
function tabsEl(list, cur, set) {
  const el = h(`<div class="tabs">${list.map(([k, n]) => `<button data-t="${k}" class="${k === cur ? 'on' : ''}">${n}</button>`).join('')}</div>`).firstChild;
  el.querySelectorAll('button').forEach(x => x.onclick = () => { set(x.dataset.t); AU.ui(); refreshSheet(); });
  return el;
}
/* 연금술 */
let alcTab = 'make';
function renderAlchemy(b) {
  b.appendChild(h(npcHead('mira')));
  b.appendChild(tabsEl([['make', '제조'], ['shop', '샤드 상점']], alcTab, t => alcTab = t));
  if (alcTab === 'shop') b.appendChild(h(`<div class="merbar"><span>${coinI(18)} 샤드 <b>${fmt(S.coin)}</b></span><span class="dim">원작 물약 · 효과는 다른 물약과 곱해져요</span></div>`));
  for (const id in POTIONS) {
    const P = POTIONS[id], shop = !!P.shop; if (shop !== (alcTab === 'shop')) continue;
    const ok = canPay(P.cost);
    const d = h(`<div class="card"><div class="crow">${potIcon(id, 36)}<div class="cmain"><b style="color:${P.c}">${P.n}</b><small>${P.d}</small></div><span class="own">보유 ${S.pots[id] || 0}</span></div>${costHTML(P.cost)}<button class="btn ${shop ? 'gold' : ''} ${ok ? '' : 'off'}">${ok ? (shop ? '구매하기' : '제조하기') : shop ? '샤드 부족' : '재료 부족'}</button></div>`);
    d.querySelector('button').onclick = () => {
      if (!canPay(P.cost)) { AU.tone(200, .15, 'square', .04); return; }
      pay(P.cost); S.pots[id] = (S.pots[id] || 0) + 1; if (shop) { S.stats.buys++; AU.coin(); } else S.stats.crafted++; AU.get(); toast(`${potIcon(id, 18)} <b>${P.n}</b> ${shop ? '구매' : '제조 완료'} · 가방에서 사용하세요`); save(); refreshSheet(); updHUD();
    };
    b.appendChild(d);
  }
}
/* 대장간 */
let forgeTab = 'g';
function renderForge(b) {
  b.appendChild(h(npcHead('bran')));
  b.appendChild(tabsEl([['g', '장갑'], ['c', `부적 <small>${S.eqC.length}/2</small>`], ['e', `장비 <small>${Object.keys(S.equip).length}/${EQUIP.length}</small>`]], forgeTab, t => forgeTab = t));
  if (forgeTab === 'g') for (const id in GAUNTLETS) {
    const G = GAUNTLETS[id], own = S.gaunts[id], eq = S.eqG === id, ok = canPay(G.cost);
    const d = h(`<div class="card ${eq ? 'eqd' : ''}"><div class="crow">${icon('glove', G.c, 36)}<div class="cmain"><b style="color:${G.c}">${G.n}</b><small>${G.d}</small></div>${eq ? '<span class="own on">장착 중</span>' : own ? '<span class="own">보유</span>' : ''}</div>${own ? '' : costHTML(G.cost)}<button class="btn ${own ? (eq ? 'ghost' : '') : ok ? '' : 'off'}">${own ? (eq ? '해제' : '장착') : ok ? '제작하기' : '재료 부족'}</button></div>`);
    d.querySelector('button').onclick = () => {
      if (own) { S.eqG = eq ? null : id; AU.ui(); }
      else { if (!canPay(G.cost)) { AU.tone(200, .15, 'square', .04); return; } pay(G.cost); S.gaunts[id] = 1; S.eqG = id; AU.get(); AU.tone(220, .3, 'square', .05); toast(`${icon('glove', G.c, 18)} <b>${G.n}</b> 제작 · 장착`); }
      save(); checkQuests(); refreshSheet(); updHUD();
    };
    b.appendChild(d);
  }
  else if (forgeTab === 'c') for (const id in CHARMS) b.appendChild(charmCard(id, true));
  else renderEquip(b);
}
function renderEquip(b) {
  const ee = equipEff();
  b.appendChild(h(`<div class="card now" style="--bc:#ffd36a"><small>원작 제작소 · 영구 장비</small><b>행운 +${fmt(ee.luck * 100)}% · 속도 +${fmt(ee.speed * 100)}%</b><p class="dim">한 번 만들면 영구히 적용되고 모두 겹쳐요. 재료는 날씨와 상관없이 굴릴 때마다 떨어져요.</p><div class="cost">${['o_dust', 'o_frag', 'o_core', 'o_star', 'o_void'].map(k => `<span class="cc">${icon(MATS[k].ic, MATS[k].c, 14)}${MATS[k].n} ${S.mats[k] || 0} <i class="dim">${MATS[k].drop * 100}%</i></span>`).join('')}</div></div>`));
  for (const e of EQUIP) {
    const own = S.equip[e.id], lock = e.req && !S.equip[e.req], ok = !own && !lock && canPay(e.cost);
    const eff = e.luck ? `영구 행운 +${fmt(e.luck * 100)}%` : `영구 속도 +${fmt(e.speed * 100)}%`;
    const req = lock ? `<small style="color:#ff9aaa">먼저 「${EQUIP.find(x => x.id === e.req).n}」 필요</small>` : '';
    const d = h(`<div class="card ${own ? 'eqd' : ''} ${lock ? 'locked' : ''}"><div class="crow">${icon(e.ic, lock ? '#555a70' : e.c, 36)}<div class="cmain"><b style="color:${lock ? '#888' : e.c}">${e.n}</b><small>${eff}</small>${req}</div>${own ? '<span class="own on">제작 완료</span>' : ''}</div>${own ? '' : costHTML(e.cost)}${own ? '' : `<button class="btn ${ok ? '' : 'off'}">${lock ? '잠김' : ok ? '제작하기' : '재료 부족'}</button>`}</div>`);
    const bt = d.querySelector('button');
    if (bt) bt.onclick = () => {
      if (S.equip[e.id] || (e.req && !S.equip[e.req]) || !canPay(e.cost)) { AU.tone(200, .15, 'square', .04); return; }
      pay(e.cost); S.equip[e.id] = 1; AU.get(); AU.tone(220, .3, 'square', .05); AU.chime(4); toast(`${icon(e.ic, e.c, 18)} <b>${e.n}</b> 제작 · ${eff}`); save(); checkQuests(); refreshSheet(); updHUD();
    };
    b.appendChild(d);
  }
}
function charmCard(id, craft) {
  const C = CHARMS[id], own = S.charms[id], eq = S.eqC.includes(id), ok = canPay(C.cost);
  const d = h(`<div class="card ${eq ? 'eqd' : ''}"><div class="crow">${icon(C.ic, C.c, 36)}<div class="cmain"><b style="color:${C.c}">${C.n}</b><small>${C.d}</small></div>${eq ? '<span class="own on">장착 중</span>' : own ? '<span class="own">보유</span>' : ''}</div>${own || !craft ? '' : costHTML(C.cost)}<button class="btn ${own ? (eq ? 'ghost' : '') : ok ? '' : 'off'}">${own ? (eq ? '해제' : '장착') : ok ? '제작하기' : '재료 부족'}</button></div>`);
  d.querySelector('button').onclick = () => {
    if (own) { if (eq) S.eqC = S.eqC.filter(x => x !== id); else { S.eqC.push(id); if (S.eqC.length > 2) { const o = S.eqC.shift(); toast(`${CHARMS[o].n} 해제 (부적은 2개까지)`); } } AU.ui(); }
    else { if (!canPay(C.cost)) { AU.tone(200, .15, 'square', .04); return; } pay(C.cost); S.charms[id] = 1; if (S.eqC.length < 2) S.eqC.push(id); AU.get(); toast(`${icon(C.ic, C.c, 18)} <b>${C.n}</b> 제작`); }
    save(); checkQuests(); refreshSheet(); updHUD();
  };
  return d;
}
/* 천문대 */
function renderObs(b) {
  b.appendChild(h(npcHead('stella')));
  const B = BIOMES[S.biome], n = isNight();
  b.appendChild(h(`<div class="card now" style="--bc:${B.c}"><small>지금 하늘</small><b style="color:${B.c}">${B.n} <span class="en">${B.en}</span></b><p>${B.d}</p><p class="dim">남은 시간 <b id="obsT">${mmss((S.biomeEnd - Date.now()) / 1000)}</b> · ${n ? '☾ 밤' : '☀ 낮'} ${mmss(dayLeft())} 남음</p></div>`));
  const ent = Object.entries(BIOMES).filter(([k, x]) => x.w > 0 && (k !== 'void' || S.gateOpen)), tot = ent.reduce((s, [, x]) => s + x.w, 0);
  let list = '<h3 class="sub">날씨 도감</h3>';
  for (const [k, x] of Object.entries(BIOMES)) {
    if (k === 'void' && !S.gateOpen) { list += `<div class="brow lock"><i style="background:#333"></i><div><b>???</b><small>공허의 문을 열어야 관측할 수 있어요</small></div></div>`; continue; }
    const ex = AURAS.filter(a => a.biome === k), chance = x.w ? (x.w / tot * 55).toFixed(1) + '%' : k === 'beach' ? '여름 균열' : '기본';
    list += `<div class="brow ${S.seen[k] ? '' : 'lock'}"><i style="background:${x.c};box-shadow:0 0 8px ${x.c}"></i><div><b>${S.seen[k] ? x.n : '미관측'} <span class="dim">· 전환 시 ${chance}</span></b><small>${x.d}</small>${ex.length ? `<div class="exl">${ex.map(a => `<span>${S.found[a.id] ? orbCSS(a, 12) + a.n : '??? '}<i>1/${fmt(a.r)}</i></span>`).join('')}</div>` : ''}</div></div>`;
  }
  const nd = AURAS.filter(a => a.night || a.day);
  list += `<div class="brow"><i style="background:#b8c4ff"></i><div><b>낮과 밤 <span class="dim">· 12분 주기 (밤 약 5분)</span></b><small>날씨와 상관없이 낮·밤에만 나오는 오라가 있어요.</small><div class="exl">${nd.map(a => `<span>${a.night ? '☾' : '☀'} ${S.found[a.id] ? orbCSS(a, 12) + a.n : '???'}<i>1/${fmt(a.r)}</i></span>`).join('')}</div></div></div>`;
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
    for (const a of AURAS) { if (tierOf(a.r) > 1) continue; const n = Math.max(0, avail(a.id) - 1); if (n > 0) { S.auras[a.id] -= n; gain += n * SAC[Math.min(tierOf(a.r), 8)]; cnt += n; } }
    if (!cnt) { toast('바칠 중복 오라가 없어요'); return; }
    S.mats.voiddust = (S.mats.voiddust || 0) + gain; S.stats.sacr += cnt; AU.boom(); toast(`${cnt}개를 바쳐 ${icon('void', '#9a6cff', 16)} 공허 가루 +${gain}`); save(); refreshSheet();
  };
  const sl = bulk.querySelector('.sacl');
  for (const a of SORTED) {
    const n = avail(a.id); if (n <= 1) continue; const tr = tierOf(a.r);
    const row = h(`<div class="srow">${orbCSS(a, 22)}<b style="color:${a.c}">${a.n}</b><span class="dim">×${S.auras[a.id]}</span><button class="mini">+${SAC[Math.min(tr, 8)]} 바치기</button></div>`).firstChild;
    row.querySelector('button').onclick = () => { if (avail(a.id) <= 1) return; S.auras[a.id]--; S.mats.voiddust = (S.mats.voiddust || 0) + SAC[Math.min(tr, 8)]; S.stats.sacr++; AU.tone(160, .4, 'sine', .15, 60); save(); refreshSheet(); };
    sl.appendChild(row);
  }
  if (!sl.children.length) sl.appendChild(h('<p class="dim">2개 이상 가진 오라가 아직 없어요.</p>'));
  b.appendChild(bulk);
}
/* 융합의 제단 */
function renderFusion(b) {
  b.appendChild(h(npcHead('lumen') + '<p class="hint">융합 오라는 굴려서는 절대 나오지 않아요. 재료 오라는 사라지고, 장착 중인 1개는 보호돼요.</p>'));
  for (const f of FUSIONS) {
    const a = AMAP[f.out], fd = S.found[a.id], ok = canPay(f.cost), tier = tierOf(a.r);
    const d = h(`<div class="card fus ${fd ? 'done' : ''}"><div class="crow">${fd ? orbCSS(a, 40) : '<span class="morb q">?</span>'}<div class="cmain"><b style="color:${fd ? a.c : '#ddd'}">${fd ? a.n : '??? (미발견)'}</b><small><span style="color:${TIERS[tier].c}">${TIERS[tier].n}급</span> · ${fd ? a.d : '어떤 빛이 태어날까?'}</small></div>${fd ? `<span class="own">보유 ${S.auras[a.id] || 0}</span>` : ''}</div>${costHTML(f.cost)}<button class="btn gold ${ok ? '' : 'off'}">${ok ? '융합하기' : '재료 부족'}</button></div>`);
    d.querySelector('button').onclick = () => {
      if (!canPay(f.cost)) { AU.tone(200, .15, 'square', .04); return; }
      const isNew = !S.found[a.id]; pay(f.cost); grant(a, false); S.stats.crafted++; save(); checkQuests(); updHUD(); closeSheet();
      playCut(a, { isNew, label: '✦ 융합 성공 ✦', auto: false }, () => { showResult(a, isNew, false); renderRecent(); });
    };
    b.appendChild(d);
  }
}
/* 떠돌이 상인 */
function renderMerchant(b) {
  if (!merOn()) { b.appendChild(h(`<div class="empty">상인이 떠났어요.<br>다음 방문까지 약 ${mmss((S.mer.next - Date.now()) / 1000)}</div>`)); return; }
  b.appendChild(h(npcHead('jorr') + `<div class="merbar"><span>${coinI(18)} <b>${fmt(S.coin)}</b></span><span class="dim">떠나기까지 <b id="merT">${mmss((S.mer.until - Date.now()) / 1000)}</b></span></div>`));
  S.mer.offers.forEach((o, i) => {
    const P = o.k === 'pot' ? POTIONS[o.id] : MATS[o.id], ic = o.k === 'pot' ? potIcon(o.id, 36) : icon(MATS[o.id].ic, MATS[o.id].c, 36), ok = !o.sold && S.coin >= o.p;
    const d = h(`<div class="card ${o.sold ? 'sold' : ''}"><div class="crow">${ic}<div class="cmain"><b style="color:${P.c}">${P.n} ×${o.n}</b><small>${o.k === 'pot' ? P.d : '재료'}</small></div><button class="btn sm gold ${ok ? '' : 'off'}">${o.sold ? '품절' : `${coinI(14)} ${fmt(o.p)}`}</button></div></div>`);
    d.querySelector('button').onclick = () => { if (o.sold) return; if (S.coin < o.p) { toast('샤드가 부족해요'); return; } buyOffer(i); toast(`${P.n} ×${o.n} 구매`); };
    b.appendChild(d);
  });
}

/* ── 도감 ── */
let idxF = 'all';
const isSpecial = a => a.biome || a.fusion || a.night || a.day || a.mg || a.summer || a.summerRoll;
function pIndex(push) {
  openSheet(`오라 도감 <span class="cnt">${found(S)} / ${AURAS.length}</span>`, b => {
    if (push) b.appendChild(h(npcHead('quill')));
    const best = S.best ? AMAP[S.best] : null, ml = masteryList(S), md = ml.filter(m => m.done).length;
    b.appendChild(h(`<div class="pbar big"><i style="width:${found(S) / AURAS.length * 100}%"></i></div>${best ? `<p class="dim center">최고 기록 · <b style="color:${best.c}">${best.n}</b> (1/${fmt(best.r)}) · 빛나는 ${Object.keys(S.shiny).length}종</p>` : ''}
      <details class="mast"><summary>마스터리 <b>${md}/${ml.length}</b> · 영구 행운 <b>+${md * 5}%</b></summary><div class="mlist">${ml.map(m => `<div class="${m.done ? 'done' : ''}"><span style="color:${m.c}">${m.n}</span><i>${m.have}/${m.all}</i>${m.done ? '<em>+5%</em>' : ''}</div>`).join('')}</div><p class="hint">한 등급(일반 오라) 또는 한 날씨의 한정 오라를 모두 모으면 영구 행운 +5%</p></details>`));
    const nOld = AURAS.filter(a => a.src).length;
    const chips = h(`<div class="chips">${[['all', '전체'], ['new', `리뉴얼 ${AURAS.length - nOld}`], ['old', `원작 ${nOld}`], ['miss', '미발견']].map(([k, n]) => `<button data-f="${k}" class="${idxF === k ? 'on' : ''}">${n}</button>`).join('')}</div>`).firstChild;
    chips.querySelectorAll('button').forEach(x => x.onclick = () => { idxF = x.dataset.f; AU.ui(); refreshSheet(); });
    b.appendChild(chips);
    const F = a => idxF === 'all' || (idxF === 'new' && !a.src) || (idxF === 'old' && a.src) || (idxF === 'miss' && !S.found[a.id]);
    const groups = [];
    for (let t = 0; t < TIERS.length; t++) groups.push([`<span style="color:${TIERS[t].c}">${TIERS[t].n}</span>`, AURAS.filter(a => !isSpecial(a) && tierOf(a.r) === t)]);
    groups.push(['<span style="color:#ff9ad8">♡ 매지컬 걸</span>', AURAS.filter(a => a.mg)]);
    groups.push(['<span style="color:#ffd88a">☀ 낮</span> · <span style="color:#b8c4ff">☾ 밤 한정</span>', AURAS.filter(a => a.night || a.day)]);
    groups.push(['<span style="color:#7fe8d6">◆ 날씨 한정</span>', AURAS.filter(a => a.biome)]);
    groups.push(['<span style="color:#55e7ff">≋ 여름 축제</span>', AURAS.filter(a => a.summer || a.summerRoll)]);
    groups.push(['<span style="color:#ffe9a8">✦ 융합 전용</span>', AURAS.filter(a => a.fusion)]);
    let shown = 0;
    for (const [title, all] of groups) {
      const list = all.filter(F); if (!list.length) continue; shown += list.length;
      const fc = all.filter(a => S.found[a.id]).length;
      const sec = h(`<h3 class="sub">${title} <span class="dim">${fc}/${all.length}</span></h3><div class="agrid"></div>`);
      const grid = sec.querySelector('.agrid');
      for (const a of list.sort((x, y) => x.r - y.r)) {
        const fd = S.found[a.id], cnt = S.auras[a.id] || 0, sh = S.shiny[a.id];
        const tag = a.biome ? `<i class="bb" style="color:${BIOMES[a.biome].c}">${BIOMES[a.biome].n}</i>` : a.night ? '<i class="bb" style="color:#b8c4ff">☾밤</i>' : a.day ? '<i class="bb" style="color:#ffd88a">☀낮</i>' : a.summer || a.summerRoll ? '<i class="bb" style="color:#55e7ff">≋여름</i>' : a.src && idxF !== 'old' ? '<i class="bb" style="color:#9a94c4">원작</i>' : '';
        const cell = h(`<button class="acell ${fd ? '' : 'lock'} ${S.eq === a.id ? 'eq' : ''}" style="--tc:${tierColor(a)}">${fd ? orbCSS(a, 38, sh) : '<span class="morb q">?</span>'}<b style="${fd ? `color:${mix(a.c, '#ffffff', .3)}` : ''}">${fd ? a.n : '???'}</b><small>1/${fmt(a.r)}</small>${tag}${fd ? `<em>${sh ? '<s>✦</s>' : ''}×${cnt}</em>` : ''}</button>`).firstChild;
        cell.onclick = () => { AU.ui(); pAura(a.id); };
        grid.appendChild(cell);
      }
      b.appendChild(sec);
    }
    if (!shown) b.appendChild(h('<p class="empty">조건에 맞는 오라가 없어요</p>'));
  }, push);
}
function equipAura(id, shiny) {
  const a = AMAP[id]; S.eq = id; S.eqShiny = !!shiny; save(); if (shiny) AU.shiny(); else AU.get(); showIdle(); updHUD(); refreshSheet();
  toast(shiny ? `<b class="rainbow">✦ 빛나는 ${a.n}</b> 장착 · 스킬 「${a.sk.n}」` : `<b style="color:${a.c}">${a.n}</b> 장착 · 스킬 「${a.sk.n}」`);
}
function pAura(id) {
  const a = AMAP[id], fd = S.found[id];
  openSheet(fd ? a.n : '???', b => {
    const shOwn = !!S.shiny[id], showSh = shOwn && S.eq === id ? S.eqShiny : shOwn;
    if (fd) addPreview(b, a, 250, showSh);
    else b.appendChild(h(`<div class="unk"><span class="morb q big">?</span><p>아직 발견하지 못한 오라입니다</p></div>`));
    const er = effR(a, S.biome), canNow = eligible(a, S.biome);
    const fu = a.fusion ? FUSIONS.find(f => f.out === id) : null;
    b.appendChild(h(`<div class="adet">
      <div class="en">${fd ? a.en.toUpperCase() : '? ? ?'}</div>
      <div><span class="tierTag" style="color:${tierColor(a)}">${a.sym} ${tierLabel(a)}</span><b>1 / ${fmt(a.r)}</b></div>
      ${a.biome ? `<p style="color:${BIOMES[a.biome].c}">◆ ${BIOMES[a.biome].n} 날씨에서만 등장 (글리치 날씨 포함)</p>` : ''}
      ${a.night ? '<p style="color:#b8c4ff">☾ 밤에만 등장 (글리치 날씨 포함)</p>' : a.day ? '<p style="color:#ffd88a">☀ 낮에만 등장 (글리치 날씨 포함)</p>' : ''}
      ${a.summer ? '<p style="color:#55e7ff">≋ 여름 축제 균열에서만 얻을 수 있어요</p>' : a.summerRoll ? `<p style="color:#55e7ff">≋ 여름 상점에서 해금하면 굴림에 섞여 나와요 ${S.sum.bought.aura ? '(해금됨)' : '(미해금)'}</p>` : ''}
      ${a.mg ? '<p style="color:#ff9ad8">♡ 원작의 특별 등급 · 매지컬 걸</p>' : ''}
      ${fu ? '<p style="color:#ffe9a8">✦ 융합의 제단에서만 만들 수 있어요</p>' : ''}
      ${a.boost ? `<p class="dim">${BIOMES[a.boost.b].n} 날씨에서 확률 ${a.boost.x}배</p>` : ''}
      ${fu || a.summer ? '' : `<p class="dim">지금 조건에서: ${canNow ? `1 / ${fmt(er)}` : '등장 안 함'}</p>`}
      ${a.src ? '<p class="dim">원작 VOIDROLL에서 온 오라</p>' : ''}
      ${fd ? `<p class="desc">${a.d}</p><p class="dim">보유 ${S.auras[id] || 0}개${shOwn ? ` · <span class="rainbow">빛나는 ${S.shiny[id]}개</span>` : ''}</p>` : ''}
    </div>`));
    if (fd) {
      const k = a.sk, left = Math.max(0, ((S.skCd[id] || 0) - Date.now()) / 1000);
      b.appendChild(h(`<div class="card skc"><div class="crow"><span class="sksym" style="color:${a.c}">${a.sym}</span><div class="cmain"><b>스킬 · ${k.n}</b><small>${k.d}</small><small>재사용 ${mmss(k.cd)}${left > 0 ? ` · <span style="color:#ffb0c0">남은 시간 ${mmss(left)}</span>` : ''}</small></div></div><p class="dim" style="font-size:12px">오라를 장착하면 화면 왼쪽의 스킬 버튼으로 쓸 수 있어요.</p></div>`));
    }
    if (fd && (S.auras[id] || 0) > 0) {
      const row = h(`<div class="brow2"></div>`).firstChild;
      const btn = h(`<button class="btn big">${S.eq === id && !S.eqShiny ? '장착 중' : '장착하기'}</button>`).firstChild;
      if (S.eq === id && !S.eqShiny) btn.classList.add('ghost');
      btn.onclick = () => equipAura(id, false);
      row.appendChild(btn);
      if (shOwn) {
        const b2 = h(`<button class="btn big shinyb">${S.eq === id && S.eqShiny ? '✦ 빛나는 버전 장착 중' : '✦ 빛나는 버전 장착'}</button>`).firstChild;
        b2.onclick = () => equipAura(id, true);
        row.appendChild(b2);
      }
      b.appendChild(row);
    }
    if (fd) {
      const rp = h(`<div class="brow2"><button class="btn ghost" id="replay">▶ 컷신 다시 보기</button></div><div class="setrow"><span>이 오라 컷신 재생</span><button class="tg ${S.cutOff[id] ? '' : 'on'}" id="cutTg"><i></i></button></div>`);
      rp.querySelector('#replay').onclick = () => { if (RS.on || CUT.on) return; closeSheet(); playCut(a, { isNew: false, shiny: showSh, auto: false, label: '다시 보기' }, () => { }); };
      rp.querySelector('#cutTg').onclick = () => { if (S.cutOff[id]) delete S.cutOff[id]; else S.cutOff[id] = 1; AU.ui(); save(); refreshSheet(); };
      b.appendChild(rp);
    }
    if (fu) { const go = h(`<button class="btn ghost">융합의 제단으로 가기</button>`).firstChild; go.onclick = () => pLoc('fusion'); b.appendChild(go); }
  }, true);
}

/* ── 가방 ── */
let bagTab = 'pots';
function pBag() {
  openSheet('가방', b => {
    b.appendChild(h(`<div class="merbar"><span>${coinI(18)} 샤드 <b>${fmt(S.coin)}</b></span><span class="dim">굴릴 때마다 등급에 따라 쌓여요</span></div>`));
    const tabs = h(`<div class="tabs"><button data-t="pots">물약</button><button data-t="mats">재료</button><button data-t="gl">장갑</button><button data-t="ch">부적</button></div>`).firstChild;
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
      if (!any) b.appendChild(h(`<p class="empty">물약이 없어요. 지도의 <b>연금술 공방</b>에서 만들거나 <b>상인</b>에게 살 수 있어요.</p>`));
    } else if (bagTab === 'mats') {
      let s = '<div class="mgrid">';
      for (const id in MATS) { const M = MATS[id], n = S.mats[id] || 0; s += `<div class="mcell ${n ? '' : 'lock'}">${icon(M.ic, M.c, 30)}<b>${M.n}</b><span>${n}</span></div>`; }
      s += '</div><p class="hint">위쪽 재료는 굴릴 때 약 10% 확률로, 날씨마다 다르게 나와요. 「차원의 먼지」부터는 원작 재료로 날씨와 상관없이 떨어지고 대장간 → 장비 제작에 써요.</p>';
      b.appendChild(h(s));
    } else if (bagTab === 'gl') {
      let any = false;
      for (const id in GAUNTLETS) {
        if (!S.gaunts[id]) continue; any = true; const G = GAUNTLETS[id], eq = S.eqG === id;
        const d = h(`<div class="card ${eq ? 'eqd' : ''}"><div class="crow">${icon('glove', G.c, 36)}<div class="cmain"><b style="color:${G.c}">${G.n}</b><small>${G.d}</small></div><button class="btn sm ${eq ? 'ghost' : ''}">${eq ? '해제' : '장착'}</button></div></div>`);
        d.querySelector('button').onclick = () => { S.eqG = eq ? null : id; AU.ui(); save(); updHUD(); refreshSheet(); };
        b.appendChild(d);
      }
      if (!any) b.appendChild(h(`<p class="empty">장갑이 없어요. 지도의 <b>대장간</b>에서 만들 수 있어요.</p>`));
    } else {
      const own = Object.keys(S.charms);
      if (!own.length) b.appendChild(h(`<p class="empty">부적이 없어요. <b>대장간 → 부적</b>에서 만들 수 있어요. 2개까지 함께 장착돼요.</p>`));
      for (const id of own) b.appendChild(charmCard(id, false));
    }
  });
}
function usePot(id) {
  if (!S.pots[id]) return; const P = POTIONS[id], e = P.eff;
  if (e.biome) {
    if (e.biome === 'random') { const ent = Object.keys(BIOMES).filter(k => k !== 'normal' && k !== 'glitch' && k !== 'void' && k !== 'beach' && k !== S.biome); setBiome(pick(ent)); }
    else setBiome(e.biome, e.t);
  } else if (e.next) { S.next *= e.next; toast(`다음 굴림 행운 <b>${fmtX(S.next)}</b>`); }
  else { const now = Date.now(); S.active[id] = Math.max(now, S.active[id] || 0) + e.t * 1000; toast(`${potIcon(id, 18)} <b>${P.n}</b> 효과 시작`); }
  S.pots[id]--; S.stats.pots++; AU.get(); AU.tone(500, .4, 'sine', .08, 900);
  save(); checkQuests(); updHUD(); refreshSheet();
}

/* ── 퀘스트 ── */
let qTab = 'q';
function pQuest() {
  openSheet('퀘스트', b => {
    const chDone = CHALLENGES.filter(c => S.ch[c.id]).length;
    b.appendChild(tabsEl([['q', '퀘스트'], ['c', `도전 과제 <small>${chDone}/${CHALLENGES.length}</small>`]], qTab, t => qTab = t));
    const isC = qTab === 'c', src = isC ? CHALLENGES : QUESTS, cl = isC ? S.ch : S.quests;
    const list = [...src].sort((x, y) => (cl[x.id] ? 1 : 0) - (cl[y.id] ? 1 : 0) || (qDone(y) ? 1 : 0) - (qDone(x) ? 1 : 0));
    const ready = list.filter(q => !cl[q.id] && qDone(q));
    if (ready.length > 1) { const all = h(`<button class="btn gold">보상 모두 받기 (${ready.length})</button>`).firstChild; all.onclick = () => { ready.forEach(q => { cl[q.id] = 1; giveReward(q.rw); }); AU.chime(5); AU.coin(); toast(`보상 ${ready.length}개 획득`); save(); updHUD(); refreshSheet(); }; b.appendChild(all); }
    if (isC) b.appendChild(h('<p class="hint">원작 VOIDROLL의 도전 과제예요. 보상은 샤드로 받아요.</p>'));
    for (const q of list) {
      const [v, g] = q.goal(S), done = v >= g, c = cl[q.id];
      const diff = q.diff ? `<span class="diff ${q.diff}">${q.diff === 'extreme' ? '극한' : '어려움'}</span>` : '';
      const d = h(`<div class="card q ${c ? 'claimed' : done ? 'ready' : ''}"><div class="crow"><div class="cmain"><b>${q.n}${diff}</b><small>${q.d}</small></div>${c ? '<span class="own">완료</span>' : ''}</div>${c ? '' : `<div class="pbar"><i style="width:${Math.min(100, v / g * 100)}%"></i></div><div class="qmeta"><span class="dim">${fmt(Math.min(v, g))} / ${fmt(g)}</span><span class="rw">${rwText(q.rw)}</span></div>`}${done && !c ? '<button class="btn">보상 받기</button>' : ''}</div>`);
      const btn = d.querySelector('button');
      if (btn) btn.onclick = () => { cl[q.id] = 1; const t = giveReward(q.rw); AU.chime(4); toast(`보상 획득 · ${t}`); save(); updHUD(); refreshSheet(); };
      b.appendChild(d);
    }
  });
}

/* ── 출석 ── */
const dayKey = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
function checkDaily() {
  const today = dayKey(new Date()); if (S.daily.last === today) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const streak = S.daily.last === dayKey(y) ? S.daily.streak + 1 : 1;
  openSheet('출석 보상', b => {
    const idx = (streak - 1) % 7;
    b.appendChild(h(`<p class="center">연속 출석 <b style="color:#ffd36a">${streak}일째</b></p><div class="daily">${DAILY.map((d, i) => `<div class="${i < idx ? 'got' : i === idx ? 'now' : ''}"><small>${i + 1}일</small>${coinI(22)}<b>${fmt(d.coin)}</b><span>${rwText({ pots: d.pots, mats: d.mats })}</span></div>`).join('')}</div>`));
    const btn = h(`<button class="btn big gold">오늘 보상 받기</button>`).firstChild;
    btn.onclick = () => { S.daily = { last: today, streak }; const t = giveReward(DAILY[idx]); AU.chime(5); AU.coin(); toast(`출석 보상 · ${t}`); save(); updHUD(); closeSheet(); };
    b.appendChild(btn);
  });
}

/* ── 행운 상세 · 행운 구매 · 초월 ── */
const ASC_NEED = 300;
const luckCost = () => 50 + S.luckBuy * 12;
function buyLuck() {
  const c = luckCost(); if (S.coin < c) { toast(`샤드가 부족해요 (${fmt(c)} 필요)`); AU.tone(200, .15, 'square', .04); return; }
  S.coin -= c; S.luckBuy++; AU.tone(784, .2, 'triangle', .06); AU.coin(); save(); updHUD(); refreshSheet();
}
function ascend() {
  if (S.sinceAsc < ASC_NEED) return;
  S.asc++; S.sinceAsc = 0; S.coin = 0; S.luckBuy = 0; S.luckBonus = 0; S.destiny = 0;
  save(); closeSheet(); updHUD(); checkQuests();
  banner(`초월 ${S.asc}회`, 'ASCENSION', '#ffffff', `영구 행운 ${fmtX(ascMult())} · 새로운 여정이 시작됩니다`);
  AU.boom(); AU.chime(8); [523, 659, 784, 1047, 1319].forEach((f, i) => AU.tone(f, .8, 'triangle', .07, null, i * .12));
  if (!S.set.motion) { CAM.flash = .9; CAM.fc = '#ffffff'; CAM.shake = 14; } buzz([60, 40, 120]); fireworks(6);
}
function pLuck() {
  openSheet('행운', b => {
    const L = luckParts(), c = luckCost(), ok = S.coin >= c, left = Math.max(0, ASC_NEED - S.sinceAsc);
    b.appendChild(h(`<div class="card now" style="--bc:#8a6cff"><small>현재 행운</small><b>${fmtX(L.total)}</b><p class="dim">기본 1 + 더하기 보너스, 그 위에 곱하기 보너스가 붙어요.</p></div>`));
    const buy = h(`<div class="card"><div class="crow">${icon('clover', '#7be08a', 36)}<div class="cmain"><b>행운 구매</b><small>영구 행운 +20% · 지금까지 ${S.luckBuy}회 (+${fmt(S.luckBuy * 20)}%)</small></div></div><button class="btn gold ${ok ? '' : 'off'}">${coinI(14)} ${fmt(c)} 샤드로 +0.2 행운</button></div>`);
    buy.querySelector('button').onclick = buyLuck; b.appendChild(buy);
    const asc = h(`<div class="card ascc"><div class="crow">${icon('star', '#ffffff', 36)}<div class="cmain"><b>초월 <span class="dim">· ${S.asc}회</span></b><small>지금 ${fmtX(ascMult())} → 초월하면 <b style="display:inline;font-size:12px;color:#fff">${fmtX(1 + (S.asc + 1) * .5)}</b> (곱하기)</small></div></div>
      <div class="pbar"><i style="width:${Math.min(100, S.sinceAsc / ASC_NEED * 100)}%"></i></div>
      <p class="dim" style="font-size:12px">마지막 초월 후 ${fmt(Math.min(S.sinceAsc, ASC_NEED))}/${ASC_NEED}회 굴림 · 초월하면 <b style="color:#ff9aaa">샤드 · 구매한 행운 · 코드 행운 · 천장</b>이 초기화돼요. 오라·도감·장비·물약·레벨은 그대로예요.</p>
      <button class="btn ${left ? 'off' : ''}" id="ascBtn">${left ? `초월까지 ${left}회` : '✦ 초월하기'}</button></div>`);
    asc.querySelector('#ascBtn').onclick = e => {
      if (left) return; const bt = e.currentTarget;
      if (bt.dataset.arm) return ascend();
      bt.dataset.arm = 1; bt.textContent = '한 번 더 누르면 초월해요'; bt.classList.add('gold'); setTimeout(() => { if (bt.isConnected) { delete bt.dataset.arm; bt.textContent = '✦ 초월하기'; bt.classList.remove('gold'); } }, 3000);
    };
    b.appendChild(asc);
    b.appendChild(h(`<h3 class="sub">행운 구성</h3><div class="logl">${L.parts.length ? L.parts.map(([n, v]) => `<div><b>${n}</b><span style="color:#ffd36a;font-size:13px">${v}</span></div>`).join('') : '<p class="dim center">아직 보너스가 없어요</p>'}</div>
      <h3 class="sub">그 밖의 수치</h3><div class="logl">
      <div><b>${bonusEvery()}번째 굴림</b><span>행운 ×${tenthMult()}</span></div>
      <div><b>굴림 속도</b><span>${fmtX(speed())}</span></div>
      <div><b>천장</b><span>${S.destiny}/${PITY_MAX} · 가득 차면 행운 ×50 + 에픽 이상 확정</span></div>
      <div><b>희귀 배율</b><span>레전더리 이상 ${fmtX(rarityMul())}</span></div>
      <div><b>콤보</b><span>연속으로 굴릴 때마다 +1% (최대 +50%)</span></div>
      <div><b>빛나는 변이 확률</b><span>1 / ${fmt(1 / shinyChance())}</span></div>
      <div><b>굴림당 샤드</b><span>커먼 ${fmt(coinMul())} · 레전더리 ${fmt(30 * coinMul())} · 미식 ${fmt(80 * coinMul())}</span></div>
      <div><b>지금 시간</b><span>${isNight() ? '☾ 밤' : '☀ 낮'} · ${mmss(dayLeft())} 남음</span></div></div>`));
  });
}

/* ── 설정 ── */
const ACC_KEY = 'voidroll_renewal_account';
function pSet() {
  openSheet('설정', b => {
    const best = S.best ? AMAP[S.best] : null, pm = Math.floor(S.stats.play / 60), R = ADMIN_ROLES[S.role];
    b.appendChild(h(`<div class="card prof"><div class="crow">${S.eq ? orbCSS(AMAP[S.eq], 40, S.eqShiny) : '<span class="morb q">?</span>'}<div class="cmain"><b>${esc(S.nick || '이름 없음')}</b><small>Lv.${S.lv} · 초월 ${S.asc}회${R ? ` · <span style="color:#ffd36a">${R.n}</span>` : ''}</small></div><button class="btn sm ghost" id="nickBtn">이름 변경</button></div>${R ? '<button class="btn gold" id="admBtn">관리자 콘솔 열기</button>' : ''}</div>`));
    b.appendChild(h(`<div class="stgrid"><div><small>총 굴림</small><b>${fmt(S.rolls)}</b></div><div><small>발견한 오라</small><b>${found(S)}/${AURAS.length}</b></div><div><small>최고 기록</small><b style="color:${best ? best.c : '#fff'}">${best ? best.n : '-'}</b></div><div><small>플레이 시간</small><b>${Math.floor(pm / 60)}시간 ${pm % 60}분</b></div><div><small>빛나는 오라</small><b class="rainbow">${S.stats.shinies}개</b></div><div><small>모은 샤드</small><b>${fmt(S.stats.coins)}</b></div><div><small>스킬 사용</small><b>${fmt(S.stats.skills)}회</b></div><div><small>×10 굴림</small><b>${fmt(S.stats.x10)}회</b></div></div>`));
    if (S.log.length) b.appendChild(h(`<h3 class="sub">최근 희귀 획득</h3><div class="logl">${S.log.slice(0, 10).map(l => { const a = AMAP[l.id]; return a ? `<div>${orbCSS(a, 16, l.sh)}<b style="color:${a.c}">${l.sh ? '✦' : ''}${a.n}</b><span class="dim">1/${fmt(a.r)} · ${fmt(l.n)}번째 · ${(BIOMES[l.b] || BIOMES.normal).n}</span></div>` : ''; }).join('')}</div>`));
    const row = (label, ctl) => `<div class="setrow"><span>${label}</span>${ctl}</div>`;
    const tg = k => `<button class="tg ${S.set[k] ? 'on' : ''}" data-k="${k}"><i></i></button>`;
    b.appendChild(h(`<h3 class="sub">옵션</h3>
      ${row('효과음', tg('sound'))}${row('배경 음악', tg('music'))}${row('진동', tg('haptic'))}
      ${row('더 희귀한 오라 자동 장착', tg('autoEq'))}${row('빠른 굴림 (에픽 미만 연출 단축)', tg('quick'))}${row('자동 굴림을 ×10으로', tg('auto10'))}
      ${row('화면 흔들림·번쩍임 줄이기', tg('motion'))}${row('저사양 모드', tg('low'))}
      ${row('컷신 재생', `<select id="cutSel"><option value="3">에픽 이상</option><option value="4">레전더리 이상</option><option value="5">미식 이상</option><option value="6">엑절티드 이상</option><option value="99">끄기</option></select>`)}
      <p class="hint">오라마다 컷신을 끄려면 도감에서 오라를 눌러 설정하세요.</p>
      <h3 class="sub">코드</h3>
      <div class="coderow"><input id="codeIn" class="tin" placeholder="코드 입력" maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn sm" id="codeBtn">사용</button></div>
      <p class="hint">사용한 코드 ${Object.keys(S.codes).length}개 · 원작 VOIDROLL의 코드를 그대로 쓸 수 있어요.</p>
      <h3 class="sub">저장</h3>
      <div class="brow2"><button class="btn sm" id="expBtn">저장 코드 복사</button><button class="btn sm ghost" id="impBtn">코드로 불러오기</button></div>
      <textarea id="saveTxt" class="hide" spellcheck="false"></textarea>
      <details class="mast cloud"><summary>☁ 계정 전체 세이브 (서버)</summary>
        <p class="dim" style="font-size:12px;line-height:1.6">원작 v25와 같은 방식이에요. 직접 띄운 세이브 서버 주소를 넣고 계정을 만든 뒤 저장하세요. (POST /accounts · PUT·GET /accounts/:id, Bearer 토큰)</p>
        <input id="cEp" class="tin sm" placeholder="https://내-서버/api" spellcheck="false"><input id="cId" class="tin sm" placeholder="계정 ID" spellcheck="false"><input id="cTk" class="tin sm" placeholder="보안 토큰" spellcheck="false" type="password">
        <button class="btn sm ghost wide" id="cNew">새 계정 만들기</button>
        <div class="brow2"><button class="btn sm" id="cSave">서버에 저장</button><button class="btn sm ghost" id="cLoad">서버에서 불러오기</button></div>
      </details>
      <div class="brow2"><button class="btn sm ghost" id="linkBtn">게임 링크 복사</button><button class="btn sm ghost" id="pwaBtn">홈 화면에 설치</button></div>
      <button class="btn danger" id="resetBtn">처음부터 다시 하기</button>
      <p class="hint">VOIDROLL : RENEWAL · 원작 VOIDROLL의 모든 오라·시스템 포함 · 진행 상황은 이 기기 브라우저에 자동 저장돼요.</p>`));
    b.querySelectorAll('.tg').forEach(x => x.onclick = () => { const k = x.dataset.k; S.set[k] = !S.set[k]; if (k === 'low') resize(); if (k === 'sound' && S.set.sound) AU.init(); save(); AU.ui(); updHUD(); refreshSheet(); });
    const sel = b.querySelector('#cutSel'); sel.value = String(S.set.cut); sel.onchange = () => { S.set.cut = +sel.value; save(); };
    b.querySelector('#nickBtn').onclick = () => pNick(false);
    const ab = b.querySelector('#admBtn'); if (ab) ab.onclick = () => pAdmin();
    const ci = b.querySelector('#codeIn');
    b.querySelector('#codeBtn').onclick = () => { redeem(ci.value); ci.value = ''; };
    ci.addEventListener('keydown', e => { if (e.key === 'Enter') { redeem(ci.value); ci.value = ''; } });
    const ta = b.querySelector('#saveTxt');
    b.querySelector('#expBtn').onclick = () => {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); ta.value = code; ta.classList.remove('hide'); ta.select();
      copyText(code, '저장 코드를 복사했어요', '코드를 길게 눌러 복사하세요');
    };
    b.querySelector('#impBtn').onclick = () => {
      if (ta.classList.contains('hide') || !ta.value.trim()) { ta.value = ''; ta.placeholder = '여기에 저장 코드를 붙여넣고 다시 누르세요'; ta.classList.remove('hide'); ta.focus(); return; }
      try { const d = JSON.parse(decodeURIComponent(escape(atob(ta.value.trim())))); if (d.v !== 1) throw 0; localStorage.setItem(SAVE_KEY, JSON.stringify(d)); location.reload(); }
      catch (e) { toast('올바르지 않은 코드예요'); }
    };
    cloudUI(b);
    b.querySelector('#linkBtn').onclick = () => copyText(gameLink(), '게임 링크를 복사했어요', gameLink());
    const pb = b.querySelector('#pwaBtn');
    pb.onclick = async () => {
      if (PWA.ev) { PWA.ev.prompt(); try { await PWA.ev.userChoice; } catch (e) { } PWA.ev = null; refreshSheet(); }
      else toast(window.matchMedia('(display-mode: standalone)').matches ? '이미 앱으로 실행 중이에요' : '브라우저 메뉴의 <b>홈 화면에 추가</b>를 눌러 설치하세요');
    };
    b.querySelector('#resetBtn').onclick = e => { const bt = e.currentTarget; if (bt.dataset.arm) { try { localStorage.removeItem(SAVE_KEY); } catch (er) { } location.reload(); return; } bt.dataset.arm = 1; bt.textContent = '한 번 더 누르면 모든 진행이 지워져요'; setTimeout(() => { if (bt.isConnected) { delete bt.dataset.arm; bt.textContent = '처음부터 다시 하기'; } }, 3000); };
  });
}
function copyText(t, ok, fail) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(ok), () => toast(fail)); }
function gameLink() { return /^https?:$/.test(location.protocol) && !/claude|anthropic|usercontent/.test(location.hostname) ? location.origin + location.pathname : 'https://github.com/hookite-ops/voidroll'; }
function cloudUI(b) {
  let acc = {}; try { acc = JSON.parse(localStorage.getItem(ACC_KEY) || '{}'); } catch (e) { }
  const ep = b.querySelector('#cEp'), id = b.querySelector('#cId'), tk = b.querySelector('#cTk');
  ep.value = acc.endpoint || ''; id.value = acc.id || ''; tk.value = acc.token || '';
  const A = () => ({ endpoint: ep.value.trim().replace(/\/$/, ''), id: id.value.trim(), token: tk.value.trim() });
  const keep = a => { try { localStorage.setItem(ACC_KEY, JSON.stringify(a)); } catch (e) { } };
  const okEp = a => { if (!/^https?:\/\//.test(a.endpoint)) { toast('서버 주소를 입력하세요 (https://…)'); return false; } return true; };
  b.querySelector('#cNew').onclick = async () => {
    const a = A(); if (!okEp(a)) return;
    try { const r = await fetch(a.endpoint + '/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: S.nick || 'player' }) }); const d = await r.json(); if (!r.ok || !d.accountId) throw 0; id.value = d.accountId; tk.value = d.token; keep(A()); toast('계정을 만들었어요. 토큰은 이 기기에 보관돼요.'); }
    catch (e) { toast('계정 생성 실패 · 서버 주소와 CORS 설정을 확인하세요'); }
  };
  b.querySelector('#cSave').onclick = async () => {
    const a = A(); if (!okEp(a)) return; if (!a.id || !a.token) { toast('먼저 계정을 만들거나 ID·토큰을 입력하세요'); return; }
    try { save(); const r = await fetch(a.endpoint + '/accounts/' + encodeURIComponent(a.id), { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + a.token }, body: JSON.stringify({ game: S, summer: S.sum }) }); if (!r.ok) throw 0; keep(a); toast('☁ 서버에 저장했어요'); }
    catch (e) { toast('저장 실패 · 서버 주소와 토큰을 확인하세요'); }
  };
  b.querySelector('#cLoad').onclick = async () => {
    const a = A(); if (!okEp(a)) return; if (!a.id || !a.token) { toast('계정 ID와 토큰을 입력하세요'); return; }
    try { const r = await fetch(a.endpoint + '/accounts/' + encodeURIComponent(a.id), { headers: { Authorization: 'Bearer ' + a.token } }); const d = await r.json(); if (!r.ok || !d.game || d.game.v !== 1) throw 0; localStorage.setItem(SAVE_KEY, JSON.stringify(d.game)); keep(a); toast('☁ 불러왔어요 · 새로고침할게요'); setTimeout(() => location.reload(), 900); }
    catch (e) { toast('불러오기 실패 · 서버 주소와 토큰을 확인하세요'); }
  };
}
const PWA = { ev: null };
addEventListener('beforeinstallprompt', e => { e.preventDefault(); PWA.ev = e; });

/* ════════ 원작 시스템 ════════ */
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* 스킬 — 원작의 '천장 -N'(천장 감소)은 리뉴얼 천장 게이지에 맞게 '천장 +N'(게이지 충전)으로 */
for (const a of AURAS) {
  const k = a.sk; if (!k || k.fixed) continue; k.fixed = 1;
  k.d = k.d.replace(/천장 -(\d+)/g, '천장 +$1').replace(/천장 리셋/g, '천장 가득 채우기');
  const m1 = k.d.match(/([\d,]+)\s*샤드/) || k.d.match(/샤드 ([\d,]+)개/); k.sh = m1 ? +m1[1].replace(/,/g, '') : 0;
  const m2 = k.d.match(/재료 (?:각 )?\+?(\d+)/); k.mt = m2 ? +m2[1] : 0;
  const m3 = k.d.match(/롤 (\d+)회/); k.qr = m3 ? +m3[1] : 0;
  const m4 = k.d.match(/천장 \+(\d+)/); k.pt = m4 ? +m4[1] : 0;
}
function updSkill() {
  const b = $('#skillBtn'), a = S.eq ? AMAP[S.eq] : null;
  if (!a || !started) { b.classList.add('hide'); return; }
  b.classList.remove('hide');
  const left = Math.max(0, ((S.skCd[a.id] || 0) - Date.now()) / 1000);
  b.style.setProperty('--ac', a.c); b.style.setProperty('--ag', rgba(a.c, .45)); b.style.setProperty('--k', Math.min(1, left / a.sk.cd).toFixed(3));
  b.classList.toggle('ready', left <= 0);
  const html = `<i>${a.sym}</i><small>${left > 0 ? mmss(left) : esc(a.sk.n)}</small>`;
  if (b._h !== html) { b.innerHTML = html; b._h = html; }
}
function useSkill() {
  const a = S.eq ? AMAP[S.eq] : null; if (!a || !started || CUT.on) return;
  const k = a.sk, now = Date.now();
  if ((S.skCd[a.id] || 0) > now) { toast(`<b>${k.n}</b> · ${k.d}<br><span class="dim">다시 쓰려면 ${mmss((S.skCd[a.id] - now) / 1000)}</span>`); AU.tone(200, .12, 'square', .04); return; }
  S.skCd[a.id] = now + k.cd * 1000; S.stats.skills++;
  let weak = false;
  const buff = (key, v, du) => { const c = S.skb[key]; if (c && c.end > now && c.v > v) { weak = true; return; } S.skb[key] = { v, end: now + du * 1000, n: k.n }; };
  const shards = n => { if (n > 0) { S.coin += n; S.stats.coins += n; flyCoins(W / 2, H * .38, Math.min(16, 4 + Math.round(Math.log10(n) * 3))); } };
  const pity = n => { S.destiny = Math.min(PITY_MAX, S.destiny + n); };
  switch (k.ef) {
    case 'speed': buff('speed', 1 + k.v, k.du); break;
    case 'rarity': buff('rarity', k.v, k.du); break;
    case 'god': buff('luck', 1 + k.v, k.du); buff('rarity', 5, k.du); shards(k.sh); break;
    case 'ult': buff('luck', 1 + k.v, k.du); buff('speed', 2, k.du); shards(k.sh); break;
    case 'shards': shards(k.v); break;
    case 'pity': pity(k.pt || k.v); break;
    case 'pityRoll': pity(k.pt); break;
    case 'shardsPity': shards(k.v); pity(k.pt || 30); break;
    case 'pityReset': S.destiny = PITY_MAX; shards(k.sh); break;
    case 'genesis': { const n = k.mt || 5; for (const m of ['o_dust', 'o_frag', 'o_core', 'o_star', 'o_void']) S.mats[m] = (S.mats[m] || 0) + n; S.stats.mats += n * 5; shards(k.sh || 1000); break; }
    default: buff('luck', 1 + k.v, k.du); shards(k.sh);
  }
  // 연출
  const t = Math.min(8, tierOf(a.r)); AU.tone(587, .3, 'sawtooth', .08, 1174); AU.chime(Math.max(2, t)); buzz(30);
  const { cx, by } = orbPos(); SHOW.joy = 1.2; SHOW.until = T + 1.5; SHOW.a = a;
  for (let i = 0; i < 26 + t * 6; i++) SPARK.push({ x: cx, y: by, vx: rnd(-220, 220), vy: rnd(-420, -120), l: 0, m: rnd(.6, 1.2), c: pick([a.c, a.c2 || '#ffffff', '#ffffff']) });
  if (!S.set.motion) { CAM.flash = .25; CAM.fc = a.c; }
  floatChip(`${a.sym} ${k.n}`);
  toast(`✦ 스킬 <b style="color:${mix(a.c, '#ffffff', .3)}">${k.n}</b> · ${k.d}${weak ? '<br><span class="dim">더 강한 같은 효과가 이미 켜져 있어 일부는 적용되지 않았어요</span>' : ''}`);
  if (k.ef === 'pityRoll') setTimeout(() => quickRolls(k.qr || 3, `${k.n} · 즉시 ${k.qr || 3}회`), 350);
  checkQuests(); save(); updHUD();
}

/* ×10 결과 */
function showMulti(res, title = '×10 굴림') {
  const el = $('#multi'), top = Math.max(...res.map(r => tierOf(r.a.r)));
  el.innerHTML = `<div class="mh"><b>${title}</b><span>${coinI(13)} +${fmt(res.reduce((q, r) => q + r.coins, 0))}${res.some(r => r.isNew) ? ` · <i class="newTag">NEW ${res.filter(r => r.isNew).length}</i>` : ''}</span></div><div class="mg">${res.map((r, i) => `<div class="mc" style="--tc:${tierColor(r.a)};animation-delay:${i * .045}s">${orbCSS(r.a, 24, r.shiny)}<b style="color:${mix(r.a.c, '#ffffff', .35)}">${r.shiny ? '✦' : ''}${r.a.n}</b><small>${tierLabel(r.a)}</small>${r.isNew ? '<em>NEW</em>' : ''}</div>`).join('')}</div>`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(showMulti.tm); showMulti.tm = setTimeout(() => el.classList.remove('show'), 2800 + Math.min(top, 8) * 220);
}

/* 불꽃놀이 */
function fireworks(n = 10) {
  for (let i = 0; i < n; i++) setTimeout(() => {
    const x = rnd(W * .15, W * .85), y = rnd(H * .12, H * .4), c = pick(['#ffd65a', '#55e7ff', '#ff8fc7', '#7affb0', '#c8a8ff']);
    for (let j = 0; j < 44; j++) { const an = j / 44 * TAU, sp = rnd(150, 290); SPARK.push({ x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 80, l: 0, m: rnd(.9, 1.5), c: j % 3 ? c : '#ffffff' }); }
    AU.tone(rnd(500, 900), .5, 'triangle', .05, rnd(1200, 1800)); AU.noise(.4, .1, 3000, 400, 0, 'lowpass'); buzz(12);
  }, i * 380);
}

/* 여름 축제 (원작 SEASON 01 · ETERNAL TIDE FESTIVAL) */
const SUM_AURAS = AURAS.filter(a => a.summer);
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const sumMissionVal = m => ({ rolls: S.sum.rolls, rare: S.sum.rare, total: S.sum.total, owned: S.sum.owned.length })[m.key] || 0;
function sumAlert() { const m = S.sum; return m.lastDaily !== todayKey() || m.sun >= 45 && m.owned.length < SUM_AURAS.length || SUMMER_MISSIONS.some(x => !m.claimed[x.id] && sumMissionVal(x) >= x.target); }
function sumGain(n) { S.sum.sun += n; S.sum.total += n; }
function pSummer() {
  openSheet('여름 축제', b => {
    const m = S.sum, today = todayKey(), own = m.owned.length;
    b.appendChild(h(npcHead('marina')));
    b.appendChild(h(`<div class="sumhead"><small>SEASON 01 · ETERNAL TIDE FESTIVAL</small><b>☀ ${fmt(m.sun)} SUN</b><p>굴림 10회마다 +5 SUN · 굴릴 때 1% 확률로 +10 SUN</p><div class="pbar sea"><i style="width:${m.rolls % 10 * 10}%"></i></div><p class="dim">파도 ${m.rolls % 10}/10 · 티켓 ${m.tickets}장 · 별조각 ${m.frag}개 · 여름 아우라 ${own}/${SUM_AURAS.length}</p></div>`));
    const acts = h(`<div class="sumacts"></div>`).firstChild;
    const add = (html, cls, fn, off) => { const x = h(`<button class="btn ${cls} ${off ? 'off' : ''}">${html}</button>`).firstChild; x.onclick = fn; acts.appendChild(x); };
    if (m.lastDaily !== today) add('☀ 일일 보너스 +25 SUN 받기', 'gold', () => { m.lastDaily = today; sumGain(25); AU.coin(); AU.chime(3); toast('☀ 일일 보너스 +25 SUN'); save(); updHUD(); refreshSheet(); });
    add(`≋ 여름 균열 열기 <small>45 SUN · 새 여름 아우라 확정</small>`, 'sea', sumRift, m.sun < 45 || own >= SUM_AURAS.length);
    add(`${icon('ticket', '#2a1600', 16)} 파도 티켓 사용 <small>${m.tickets}장 · 다음 굴림 레어 이상 + 45초 희귀 ×4</small>`, 'gold', sumTicket, !m.tickets);
    if (m.frag >= 3) add('⭐ 별조각 3개 → 40 SUN 교환', 'ghost', () => { m.frag -= 3; sumGain(40); AU.coin(); toast('⭐ 별조각 3개 → ☀ +40 SUN'); save(); updHUD(); refreshSheet(); });
    if (!m.bought.compass) add(`${icon('compass', '#7fe8d6', 16)} 조개 나침반 켜기 <small>여름 아우라 1종당 영구 행운 +2%</small>`, 'ghost', () => { if (!own) { toast('먼저 여름 아우라를 얻으세요'); return; } m.bought.compass = 1; AU.chime(4); toast(`조개 나침반 · 행운 +${own * 2}% (아우라가 늘면 함께 올라요)`); save(); updHUD(); refreshSheet(); }, !own);
    add(own >= 4 ? '🎇 불꽃 해변 피날레' : `🎇 피날레 <small>여름 아우라 ${4 - own}종 더 필요</small>`, 'ghost', () => {
      if (own < 4) return; closeSheet(); setBiome('beach', 60, true); banner('불꽃 해변 피날레', 'SUMMER FINALE', '#ffd65a', `여름 아우라 ${own}종과 함께`); fireworks(14); AU.chime(7);
      if (!m.finale) { m.finale = 1; sumGain(50); setTimeout(() => toast('첫 피날레 기념 · ☀ +50 SUN'), 1200); save(); updHUD(); }
    }, own < 4);
    b.appendChild(acts);
    b.appendChild(h(`<h3 class="sub">여름 아우라 <span class="dim">${own}/${SUM_AURAS.length}</span></h3><div class="sumgrid">${SUM_AURAS.map(a => { const o = m.owned.includes(a.id) || S.found[a.id]; return `<div class="${o ? '' : 'lock'}">${o ? orbCSS(a, 26) : '<span class="morb q" style="width:26px;height:26px;line-height:24px">?</span>'}<span>${o ? a.n : '???'}</span></div>`; }).join('')}</div>`));
    b.appendChild(h('<h3 class="sub">축제 미션</h3>'));
    for (const x of SUMMER_MISSIONS) {
      const v = sumMissionVal(x), done = v >= x.target, c = m.claimed[x.id];
      const d = h(`<div class="card q ${c ? 'claimed' : done ? 'ready' : ''}"><div class="crow"><div class="cmain"><b>${x.n}</b><small>${x.d}</small></div>${c ? '<span class="own">완료</span>' : `<span class="own sun">☀ ${x.rw}</span>`}</div>${c ? '' : `<div class="pbar sea"><i style="width:${Math.min(100, v / x.target * 100)}%"></i></div><div class="qmeta"><span class="dim">${fmt(Math.min(v, x.target))} / ${fmt(x.target)}</span></div>`}${done && !c ? '<button class="btn sea">SUN 받기</button>' : ''}</div>`);
      const bt = d.querySelector('button'); if (bt) bt.onclick = () => { m.claimed[x.id] = 1; m.sun += x.rw; AU.chime(4); AU.coin(); toast(`☀ +${x.rw} SUN`); save(); updHUD(); refreshSheet(); };
      b.appendChild(d);
    }
    b.appendChild(h('<h3 class="sub">축제 상점</h3>'));
    for (const it of SUMMER_SHOP) {
      const got = !it.repeat && m.bought[it.id], ok = !got && m.sun >= it.p;
      const d = h(`<div class="card ${got ? 'eqd' : ''}"><div class="crow">${icon(it.id.startsWith('ticket') ? 'ticket' : it.id === 'aura' ? 'sun' : it.id === 'frag' ? 'star' : it.id === 'charm' ? 'shell' : 'sun', it.id === 'glow' ? '#ff9a6a' : '#55e7ff', 34)}<div class="cmain"><b>${it.n}</b><small>${it.d}</small></div>${got ? '<span class="own on">보유</span>' : ''}</div>${got ? '' : `<button class="btn sea ${ok ? '' : 'off'}">☀ ${it.p} SUN</button>`}</div>`);
      const bt = d.querySelector('button'); if (bt) bt.onclick = () => sumBuy(it);
      b.appendChild(d);
    }
  });
}
function sumRift() {
  const m = S.sum; if (m.sun < 45) { toast('☀ SUN이 45개 필요해요'); AU.tone(200, .15, 'square', .04); return; }
  const pool = SUM_AURAS.filter(a => !m.owned.includes(a.id)); if (!pool.length) { toast('모든 여름 아우라를 모았어요!'); return; }
  if (RS.on || CUT.on) return;
  m.sun -= 45; m.rifts++; const a = pick(pool); m.owned.push(a.id);
  const isNew = !S.found[a.id]; grant(a, false); save(); checkQuests(); updHUD(); closeSheet();
  setBiome('beach', 60, true);
  playCut(a, { isNew, label: '≋ 여름 균열 ≋', env: 'beach', auto: false }, () => { showResult(a, isNew, false); renderRecent(); banner('여름 해변', 'SUMMER BEACH', '#55e7ff', '1분 동안 해변이 열려요'); });
}
function sumTicket() {
  const m = S.sum; if (!m.tickets) { toast('티켓이 없어요 · 축제 상점에서 살 수 있어요'); return; }
  m.tickets--; m.force = true; m.rareUntil = Date.now() + 45000; AU.chime(4); AU.tone(660, .4, 'sine', .08, 1320);
  toast(`${icon('ticket', '#55e7ff', 18)} 파도 티켓 · 다음 굴림 레어 이상 확정 · 45초간 희귀 ×4`); save(); updHUD(); refreshSheet();
}
function sumBuy(it) {
  const m = S.sum; if (!it.repeat && m.bought[it.id]) return;
  if (m.sun < it.p) { toast('SUN이 부족해요'); AU.tone(200, .15, 'square', .04); return; }
  m.sun -= it.p;
  if (it.id === 'ticket' || it.id === 'ticket5') m.tickets += it.qty; else if (it.id === 'frag') m.frag++; else m.bought[it.id] = 1;
  AU.coin(); AU.get(); toast(`☀ <b>${it.n}</b> 구매`); save(); updHUD(); refreshSheet();
}

/* 코드 · 관리자 */
function redeem(raw) {
  const c = String(raw || '').trim().toUpperCase(); if (!c) return;
  const role = Object.entries(ADMIN_ROLES).find(([, r]) => r.code === c);
  if (role) { S.role = role[0]; save(); AU.chime(5); toast(`권한 확인 · <b>${role[1].n}</b>`); refreshSheet(); return; }
  const C = CODES[c]; if (!C) { toast('존재하지 않는 코드예요'); AU.tone(200, .15, 'square', .04); return; }
  if (S.codes[c]) { toast('이미 사용한 코드예요'); return; }
  S.codes[c] = 1;
  if (C.shards) { S.coin += C.shards; S.stats.coins += C.shards; }
  if (C.luck) S.luckBonus += C.luck;
  for (const m in C.mats || {}) { S.mats[m] = (S.mats[m] || 0) + C.mats[m]; S.stats.mats += C.mats[m]; }
  if (C.admin && (!ADMIN_ROLES[S.role] || ADMIN_ROLES[S.role].lv < ADMIN_ROLES[C.admin].lv)) S.role = C.admin;
  AU.chime(4); AU.coin(); toast(`코드 사용 · <b>${C.msg}</b>`); save(); checkQuests(); updHUD(); refreshSheet();
}
const roleLv = () => (ADMIN_ROLES[S.role] || { lv: 0 }).lv;
const ADMIN_TOOLS = [
  [1, '샤드 +1,000', () => { S.coin += 1000; }],
  [1, '천장 가득 채우기', () => { S.destiny = PITY_MAX; }],
  [1, '스킬 쿨타임 초기화', () => { S.skCd = {}; }],
  [2, '여름 SUN +100', () => sumGain(100)],
  [2, '파도 티켓 +5', () => { S.sum.tickets += 5; }],
  [2, '별똥별 부르기', () => { starNext = 0; }],
  [2, '떠돌이 상인 부르기', () => { S.mer.until = 0; S.mer.next = 0; tickMerchant(); }],
  [2, '황금 상자 소환', () => spawnChest('gold')],
  [3, '영구 행운 +10', () => { S.luckBonus += 10; }],
  [3, '원작 재료 각 +20', () => { for (const m of ['o_dust', 'o_frag', 'o_core', 'o_star', 'o_void']) S.mats[m] = (S.mats[m] || 0) + 20; }],
  [3, '모든 날씨 재료 +20', () => { for (const m in MATS) if (!m.startsWith('o_')) S.mats[m] = (S.mats[m] || 0) + 20; }],
  [3, '×10 굴림 해금', () => { S.x10 = true; }],
  [4, '샤드 +100,000', () => { S.coin += 100000; }],
  [4, '초월 +1', () => { S.asc++; }],
  [4, '상점 물약 모두 +3', () => { for (const id in POTIONS) if (POTIONS[id].shop) S.pots[id] = (S.pots[id] || 0) + 3; }],
  [5, '원작 장비 모두 지급', () => { for (const e of EQUIP) S.equip[e.id] = 1; }],
  [5, '모든 오라 1개씩 발견', () => { for (const a of AURAS) if (!S.found[a.id]) { S.found[a.id] = 1; S.auras[a.id] = (S.auras[a.id] || 0) + 1; } }],
];
function pAdmin() {
  const lv = roleLv(); if (!lv) return;
  openSheet('관리자 콘솔', b => {
    const R = ADMIN_ROLES[S.role];
    b.appendChild(h(`<div class="npc"><div class="adico">⚙</div><div><b>${R.n}</b><small>권한 Lv.${R.lv}</small><p>“${pick(NPCS.admin.lines)}” 등급이 높을수록 더 많은 도구를 쓸 수 있어요.</p></div></div>`));
    const g = h('<div class="adm"></div>').firstChild;
    for (const [need, n, fn] of ADMIN_TOOLS) {
      const x = h(`<button class="btn ${lv >= need ? '' : 'off'}">${n}<small>Lv.${need}+</small></button>`).firstChild;
      x.onclick = () => { if (lv < need) { toast(`Lv.${need} 이상 권한이 필요해요`); return; } fn(); AU.get(); toast(`관리자 · ${n}`); save(); checkQuests(); updHUD(); refreshSheet(); };
      g.appendChild(x);
    }
    b.appendChild(g);
    const wx = h(`<h3 class="sub">날씨 바꾸기 <span class="dim">Lv.1+</span></h3><div class="coderow"><select id="admB" class="grow">${Object.entries(BIOMES).map(([k, x]) => `<option value="${k}">${x.n}</option>`).join('')}</select><button class="btn sm">적용</button></div>`);
    wx.querySelector('select').value = S.biome;
    wx.querySelector('button').onclick = () => { const k = wx.querySelector('select').value; if (k === 'void') S.gateOpen = true; setBiome(k, k === 'beach' ? 60 : null); closeSheet(); };
    b.appendChild(wx);
    if (lv >= 4) {
      const ax = h(`<h3 class="sub">오라 지급 <span class="dim">Lv.4+</span></h3><div class="coderow"><select id="admA" class="grow">${SORTED.map(a => `<option value="${a.id}">${a.n} · ${tierLabel(a)} · 1/${fmt(a.r)}</option>`).join('')}</select><button class="btn sm">지급</button></div>`);
      ax.querySelector('button').onclick = () => { const a = AMAP[ax.querySelector('select').value]; const isNew = !S.found[a.id]; grant(a, false); save(); updHUD(); closeSheet(); playCut(a, { isNew, label: '관리자 지급', auto: false }, () => { showResult(a, isNew, false); renderRecent(); }); };
      b.appendChild(ax);
    }
    const off = h('<button class="btn danger">권한 해제</button>').firstChild; off.onclick = () => { S.role = 'none'; save(); closeSheet(); toast('관리자 권한을 해제했어요'); }; b.appendChild(off);
  }, true);
}

/* 닉네임 */
function pNick(first) {
  openSheet(first ? '이름을 정해주세요' : '이름 변경', b => {
    b.appendChild(h(`${first ? npcHead('quill') : ''}<p class="center dim">2~12자 · 도감과 기록에 남는 이름이에요</p><input id="nickIn" class="tin big" maxlength="12" value="${esc(S.nick)}" placeholder="운명술사" autocomplete="off" spellcheck="false"><button class="btn big" id="nickOk">확인</button>${first ? '<button class="btn ghost" id="nickSkip">나중에 정할게요</button>' : ''}`));
    const inp = b.querySelector('#nickIn'), ok = () => {
      const v = inp.value.replace(/\s+/g, ' ').trim();
      if (v.length < 2 || v.length > 12) { toast('이름은 2~12자로 정해주세요'); AU.tone(200, .15, 'square', .04); return; }
      S.nick = v; save(); updHUD(); AU.chime(3); closeSheet(); toast(`반가워요, <b>${esc(v)}</b>님!`); if (first) setTimeout(checkDaily, 500);
    };
    b.querySelector('#nickOk').onclick = ok; inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
    const sk = b.querySelector('#nickSkip'); if (sk) sk.onclick = () => { closeSheet(); setTimeout(checkDaily, 400); };
    setTimeout(() => { try { inp.focus(); } catch (e) { } }, 300);
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
$('#autoBtn').onclick = () => { AU.init(); AU.ui(); RS.auto = !RS.auto; updHUD(); if (RS.auto) { wake(); startRoll(S.set.auto10 && S.x10 ? 10 : 1); } else unwake(); };
$('#x10Btn').onclick = () => { AU.init(); AU.ui(); startRoll(10); };
$('#skillBtn').onclick = () => { AU.init(); useSkill(); };
$('#sumBtn').onclick = () => { AU.init(); AU.ui(); pSummer(); };
$('#merBtn').onclick = () => { AU.ui(); pLoc('merchant', false); };
$('#luckBox').onclick = () => { AU.ui(); pLuck(); };
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
const HTEASE = new AuraFX(); HTEASE.hero = true; afx.hero = true;
function frame(now) {
  try { frameBody(now); } catch (e) { if (!frame.err) { frame.err = 1; console.error(e); } try { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; } catch (e2) { } }
  requestAnimationFrame(frame);
}
function frameBody(now) {
  let dt = Math.min(.05, (now - last) / 1000); last = now;
  const rdt = dt; if (CAM.hit > 0) { CAM.hit -= dt; dt *= .05; }
  T += dt;
  const q = S.set.low ? .5 : 1;
  const { R, cx, by } = orbPos(), cy = by;
  // 카메라
  CAM.z += (CAM.zt - CAM.z) * Math.min(1, rdt * (RS.on ? 3 : 6)); CAM.shake = Math.max(0, CAM.shake - rdt * 18);
  const sx = (Math.random() - .5) * CAM.shake, sy = (Math.random() - .5) * CAM.shake;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  bfx.update(dt, W, H, T); bfx.drawBack(ctx, W, H, T);
  ctx.save(); ctx.translate(cx + sx, cy + sy); ctx.scale(CAM.z, CAM.z); ctx.translate(-cx, -cy);
  drawStar(ctx);
  // 보이는 오라: 굴리는 중 → 미리보기, 직후 → 결과, 평소 → 장착
  const eqA = S.eq ? AMAP[S.eq] : null;
  let shownA = eqA, shownSh = !!(eqA && S.eqShiny && S.shiny[eqA.id]), fx = afx;
  if (RS.on && RS.tease) { shownA = RS.tease; shownSh = false; fx = HTEASE; }
  else if (SHOW.a && T < SHOW.until) { shownA = SHOW.a; shownSh = SHOW.sh; }
  fx.set(shownA, shownSh);
  const k = RS.on ? RS.t / RS.dur : 0, rt = RS.on ? tierOf(RS.res.r) : 0;
  if (RS.sus > 0) { // 희귀 직전: 어둠 + 등급색 빛기둥
    const tc = rt >= 7 ? hsl(T * 200, 1, .65) : TIERS[rt].c;
    ctx.save(); ctx.fillStyle = `rgba(0,0,10,${.7 * RS.sus})`; ctx.fillRect(cx - W, cy - H, W * 2, H * 2);
    ctx.globalCompositeOperation = 'lighter';
    const bw = R * (.6 + RS.sus * 1.1 + Math.sin(T * 25) * .08), g = ctx.createLinearGradient(cx - bw, 0, cx + bw, 0);
    g.addColorStop(0, rgba(tc, 0)); g.addColorStop(.5, rgba(tc, .55 * RS.sus)); g.addColorStop(1, rgba(tc, 0)); ctx.fillStyle = g; ctx.fillRect(cx - bw, cy - H, bw * 2, H + R * 1.6);
    glow(ctx, tc, cx, cy, R * (2.5 + RS.sus * 2.5), .55 * RS.sus);
    if (rt >= 4 && Math.random() < RS.sus * .35) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.globalAlpha = .9; ctx.beginPath(); let lx = cx + rnd(-W * .4, W * .4), ly = cy - H * .5; ctx.moveTo(lx, ly); for (let i = 0; i < 8; i++) { lx += rnd(-30, 30); ly += H * .07; ctx.lineTo(lx, ly); } ctx.stroke(); }
    ctx.restore();
  }
  drawStage(ctx, W, H, cx, cy + R * 1.45, R, bfx.cur, shownA, T, RS.on ? .3 + k * .7 : 0, bfx.nk);
  if (shownA) { fx.update(dt, T, q); fx.drawBack(ctx, cx, cy, R, T); }
  if (RS.on) { // 소환 고리
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const col = RS.tease ? RS.tease.c : '#ffffff';
    for (let i = 0; i < 3; i++) { ctx.globalAlpha = .55; ctx.strokeStyle = col; ctx.lineWidth = R * .05; const sp = T * (7 - i) * (1 - k * .4); ctx.beginPath(); ctx.ellipse(cx, cy, R * (1.4 + i * .22), R * (1.4 + i * .22) * .4, 0, sp, sp + 1.8); ctx.stroke(); }
    ctx.restore();
  }
  for (const c of CHESTS) if (c.y < cy + R * 1.4) drawChest(ctx, c, R);
  SHOW.joy = Math.max(0, SHOW.joy - dt);
  const hero = drawHero(ctx, cx, cy, R, shownA, T, { raise: RS.on ? ease(Math.min(1, k * 3)) : Math.max(0, SHOW.joy - .6), joy: Math.min(1, SHOW.joy) });
  if (RS.on && RS.tease) { // 손 위의 주사위 오브
    const ox = cx, oy = cy - R * 2.35 - Math.sin(T * 8) * R * .05, orr = R * (.24 + k * .08);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, RS.tease.c, ox, oy, orr * 4, .8); ctx.restore();
    drawOrb(ctx, ox, oy, orr, RS.tease, T, 1);
  }
  if (shownA) fx.drawFront(ctx, cx, cy, R, T);
  for (const c of CHESTS) if (c.y >= cy + R * 1.4) drawChest(ctx, c, R);
  BURST.draw(ctx, cx, cy, R, dt);
  drawSparks(ctx, dt);
  ctx.restore();
  bfx.drawFront(ctx, W, H, T);
  if (CAM.flash > 0) { ctx.save(); ctx.globalAlpha = CAM.flash; ctx.fillStyle = CAM.fc; ctx.fillRect(0, 0, W, H); ctx.restore(); CAM.flash = Math.max(0, CAM.flash - rdt * 2.4); }
  drawFly(ctx, rdt);
  updRoll(dt); tickStar(dt); updChests(dt); updCombo();
  CUT.update(rdt, W, H, DPR);
  AU.music(rdt);
  for (const p of SH.previews) {
    if (!p.c.isConnected) continue;
    const w = p.c.clientWidth, hh = p.c.clientHeight; if (!w) continue;
    const d = Math.min(DPR, 2); if (p.c.width !== Math.round(w * d)) { p.c.width = Math.round(w * d); p.c.height = Math.round(hh * d); }
    const c2 = p.ctx; c2.setTransform(d, 0, 0, d, 0, 0); c2.clearRect(0, 0, w, hh);
    const g = c2.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#2a2270'); g.addColorStop(1, '#0c0a2a'); c2.fillStyle = g; c2.fillRect(0, 0, w, hh);
    const r = Math.min(hh * .14, 40), pcy = hh * .5; p.fx.hero = true; p.fx.update(rdt, T, q); p.fx.drawBack(c2, w / 2, pcy, r, T); drawHero(c2, w / 2, pcy, r, p.a, T, {}); p.fx.drawFront(c2, w / 2, pcy, r, T);
  }
  secAcc += rdt;
  if (secAcc >= 1) {
    secAcc -= 1; S.stats.play++; tickBiome(); updBiomeTime(); tickDay(); tickMerchant();
    let changed = false; const nw = Date.now();
    for (const id in S.active) if (S.active[id] <= nw) { delete S.active[id]; changed = true; }
    for (const k in S.skb) if (S.skb[k].end <= nw) { delete S.skb[k]; changed = true; }
    if (changed || Object.keys(S.active).length || Object.keys(S.skb).length || S.starBoost > nw - 1500 || S.sum.rareUntil > nw - 1500) updHUD(); else updSkill();
    const o = $('#obsT'); if (o) o.textContent = mmss((S.biomeEnd - Date.now()) / 1000);
    const m = $('#merT'); if (m) m.textContent = mmss((S.mer.until - Date.now()) / 1000);
    if (S.stats.play % 5 === 0) save();
  }
}

/* ── 시작 ── */
load(); resize();
S.eqC = S.eqC.filter(id => CHARMS[id] && S.charms[id]);
if (Date.now() >= S.biomeEnd) setBiome(S.biome === 'normal' ? (Math.random() < .5 ? 'normal' : pickBiome('normal')) : 'normal', null, true);
bfx.set(S.biome); bfx.cur = S.biome; bfx.prev = null; bfx.mix = 1; bfx.nk = isNight() ? 1 : 0;
document.querySelectorAll('#nav button').forEach(x => { x.insertAdjacentHTML('afterbegin', icon(x.dataset.i, 'currentColor', 26)); });
$('#coinIco').innerHTML = coinI(14); $('#merBtn').insertAdjacentHTML('afterbegin', icon('cart', '#ffcf6a', 20));
updHUD(); updBiomeTime(); tickDay(); tickMerchant(); showIdle(); renderRecent();
requestAnimationFrame(frame);
$('#intro').addEventListener('click', () => {
  AU.init(); started = true; $('#intro').classList.add('gone'); setTimeout(() => $('#intro').remove(), 700);
  AU.tone(220, 1.2, 'sine', .15, 440); AU.chime(2);
  if (S.rolls === 0) setTimeout(() => toast('ROLL을 눌러 첫 오라를 굴려보세요. 하늘을 지나가는 <b>별똥별</b>은 눌러서 잡을 수 있어요!'), 700);
  updHUD(); setTimeout(() => S.nick ? checkDaily() : pNick(true), 900);
});
try { if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claude|anthropic|usercontent/.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => { }); } catch (e) { }
addEventListener('pagehide', save);
