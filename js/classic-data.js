'use strict';
/* ===== 원작 VOIDROLL 시스템 데이터 ===== */

/* 원작 상위 등급 */
TIERS.push(
  { k: 'eternal',  n: '영원', min: 1e9,  c: '#ff69b4' },
  { k: 'absolute', n: '절대', min: 1e10, c: '#00ffff' },
  { k: 'radiant',  n: '광휘', min: 1e11, c: '#ffe68a' },
  { k: 'paragon',  n: '정점', min: 1e12, c: '#a8fff1' },
  { k: 'infinite', n: '무한', min: 1e13, c: '#f3b6ff' },
);
function tierLabel(a) { return a && a.mg ? '매지컬 걸' : TIERS[tierOf(a.r)].n; }
function tierColor(a) { return a && a.mg ? '#ff69b4' : TIERS[tierOf(a.r)].c; }

/* 원작 바이옴: 화산=지옥, 서리=설원, 나머지 4곳은 새로 추가 (tm: 등급별 확률 배수) */
BIOMES.hell.tm = { 3: 2, 4: 2.2, 5: 1.6 };
BIOMES.snowy.tm = { 1: 1.8, 2: 1.6 };
Object.assign(BIOMES, {
  eclipse: { n: '이클립스', en: 'ECLIPSE', c: '#c084fc', w: 6, dur: [80, 130], mat: 'o_core', sky: ['#120622', '#3a1460', '#8a4ab8'], ground: '#1e0c34', grass: '#c084fc', prop: 'crystal', night: 1, tm: { 5: 3, 6: 3 },
             d: '태양이 삼켜진 하늘. 미식·엑절티드 3배. 삼켜진 달·빛과 어둠의 합일 출현.' },
  deep:    { n: '심연', en: 'ABYSS', c: '#10b981', w: 6, dur: [80, 130], mat: 'o_frag', sky: ['#021612', '#064a3a', '#1a8a6a'], ground: '#06261e', grass: '#34d399', prop: 'coral', tm: { 0: .5, 5: 2.5, 7: 1.5 },
             d: '깊은 바다의 고동. 커먼 절반, 미식 2.5배. 깊은 맥박 출현.' },
  garden:  { n: '별의 정원', en: 'STAR GARDEN', c: '#fbbf24', w: 7, dur: [80, 130], mat: 'o_star', sky: ['#14102e', '#4a3470', '#e0a860'], ground: '#2a1e3a', grass: '#ffe08a', prop: 'flower', night: 1, tm: { 4: 1.5, 6: 2 },
             d: '별빛 꽃이 피는 정원. 레전더리 1.5배. 별꽃잎·별의 수호자·성운의 속삭임 출현.' },
  dusk:    { n: '황혼의 숲', en: 'DUSK FOREST', c: '#f59e0b', w: 8, dur: [80, 130], mat: 'o_dust', sky: ['#2a1430', '#a0483a', '#ffb060'], ground: '#3a2014', grass: '#d8a050', prop: 'tree', tm: { 3: 1.8, 4: 2 },
             d: '노을이 내려앉은 숲. 에픽 1.8배·레전더리 2배. 그림자 덩굴·숲의 현자·달빛 사슴 출현.' },
  beach:   { n: '여름 해변', en: 'SUMMER BEACH', c: '#55e7ff', w: 0, dur: [60, 60], mat: 'glim', sky: ['#2a4a9a', '#ff9a8a', '#ffd88a'], ground: '#e8c88a', grass: '#ffe8b0', prop: 'palm',
             d: '여름 축제의 해변. 축제 균열에서만 열려요.' },
});

/* 원작 재료: 날씨와 상관없이 굴릴 때마다 떨어짐 */
Object.assign(MATS, {
  o_dust: { n: '차원의 먼지', c: '#d8d0ff', ic: 'dust', drop: .10 },
  o_frag: { n: '균열의 파편', c: '#7ad8ff', ic: 'crystal', drop: .04 },
  o_core: { n: '응축된 핵', c: '#c08aff', ic: 'pearl', drop: .012 },
  o_star: { n: '별의 정수', c: '#ffe08a', ic: 'star', drop: .003 },
  o_void: { n: '공허의 조각', c: '#8a5cff', ic: 'void', drop: .001 },
});

/* 원작 물약 상점 (샤드로 구매) */
Object.assign(POTIONS, {
  o_luck:     { n: '행운의 비약',   c: '#7be08a', d: '1분간 행운 +50%',                 eff: { luck: 1.5, t: 60 },   cost: { coin: 100 },   shop: 1 },
  o_speed:    { n: '가속의 비약',   c: '#6fd8ff', d: '1분간 굴림 속도 2배',             eff: { speed: 1, t: 60 },    cost: { coin: 80 },    shop: 1 },
  o_rarity:   { n: '희귀도 상승',   c: '#c08aff', d: '30초간 레전더리 이상 3배',        eff: { rarity: 3, t: 30 },   cost: { coin: 200 },   shop: 1 },
  o_ultra:    { n: '울트라 비약',   c: '#ffd36a', d: '1분 30초간 행운 +200%',           eff: { luck: 3, t: 90 },     cost: { coin: 500 },   shop: 1 },
  o_mega:     { n: '메가 행운약',   c: '#ff9ad8', d: '2분간 행운 +500%',                eff: { luck: 6, t: 120 },    cost: { coin: 1000 },  shop: 1 },
  o_hyper:    { n: '하이퍼 가속약', c: '#9ae8ff', d: '1분 30초간 굴림 속도 5배',        eff: { speed: 4, t: 90 },    cost: { coin: 800 },   shop: 1 },
  o_giga:     { n: '기가 행운약',   c: '#fff2a8', d: '2분 30초간 행운 +1000%',          eff: { luck: 11, t: 150 },   cost: { coin: 2000 },  shop: 1 },
  o_urarity:  { n: '울트라 희귀약', c: '#d08aff', d: '45초간 레전더리 이상 10배',       eff: { rarity: 10, t: 45 },  cost: { coin: 1500 },  shop: 1 },
  o_fortune:  { n: '행운 엘릭서',   c: '#7affb0', d: '3분간 행운 +2000%',               eff: { luck: 21, t: 180 },   cost: { coin: 5000 },  shop: 1 },
  o_selixir:  { n: '속도 엘릭서',   c: '#7ad8ff', d: '2분간 굴림 속도 10배',            eff: { speed: 9, t: 120 },   cost: { coin: 4000 },  shop: 1 },
  o_miracle:  { n: '기적의 물약',   c: '#9affff', d: '3분 20초간 행운 +5000% · 속도 5배', eff: { luck: 51, speed: 4, t: 200 }, cost: { coin: 10000 }, shop: 1 },
  o_cosmic:   { n: '우주의 물약',   c: '#b08aff', d: '5분간 행운 +10000%',              eff: { luck: 101, t: 300 },  cost: { coin: 20000 }, shop: 1 },
});

/* 원작 제작소 장비: 영구 효과, 모두 겹쳐 적용 (luck: 더하기, speed: 더하기) */
const EQUIP = [
  { id: 'lucky_charm',   n: '행운 부적',   ic: 'clover',    c: '#7be08a', luck: .25, cost: { o_dust: 10, o_frag: 2 } },
  { id: 'speed_glove',   n: '신속 장갑',   ic: 'glove',     c: '#6fd8ff', speed: .15, cost: { o_dust: 8, o_frag: 2 } },
  { id: 'lucky_ring',    n: '정밀 반지',   ic: 'ring',      c: '#ffd36a', luck: .5, cost: { o_frag: 8, o_core: 2 }, req: 'lucky_charm' },
  { id: 'speed_booster', n: '가속 증폭기', ic: 'bolt',      c: '#9ae8ff', speed: .3, cost: { o_frag: 6, o_core: 2 }, req: 'speed_glove' },
  { id: 'star_amulet',   n: '별의 부적',   ic: 'star',      c: '#ffe08a', luck: 1, cost: { o_star: 3, o_core: 4 }, req: 'lucky_ring' },
  { id: 'void_engine',   n: '공허 엔진',   ic: 'void',      c: '#9a6cff', speed: .5, cost: { o_void: 2, o_star: 2 }, req: 'speed_booster' },
  { id: 'lucky_crown',   n: '행운의 왕관', ic: 'crown',     c: '#ffcf4a', luck: 1.5, cost: { o_star: 5, o_void: 3 }, req: 'star_amulet' },
  { id: 'speed_boots',   n: '질풍 장화',   ic: 'boot',      c: '#7affd8', speed: .7, cost: { o_star: 4, o_void: 2 }, req: 'void_engine' },
  { id: 'fortune_cloak', n: '행운 망토',   ic: 'cloak',     c: '#ff9ad8', luck: 2, cost: { o_star: 8, o_void: 5 }, req: 'lucky_crown' },
  { id: 'chrono_watch',  n: '시간의 시계', ic: 'sandglass', c: '#ffd88a', speed: 1, cost: { o_star: 6, o_void: 4 }, req: 'speed_boots' },
  { id: 'destiny_orb',   n: '운명의 구슬', ic: 'pearl',     c: '#c08aff', luck: 3, cost: { o_star: 10, o_void: 8, o_core: 10 }, req: 'fortune_cloak' },
  { id: 'flash_ring',    n: '섬광의 반지', ic: 'ring',      c: '#ffffff', speed: 1.5, cost: { o_star: 8, o_void: 6, o_core: 8 }, req: 'chrono_watch' },
  { id: 'lucky_pendant', n: '행운 펜던트', ic: 'pendant',   c: '#ff8ab0', luck: 4, cost: { o_star: 12, o_void: 10 }, req: 'destiny_orb' },
  { id: 'speed_wings',   n: '신속 날개',   ic: 'feather',   c: '#bff0e8', speed: 2, cost: { o_star: 10, o_void: 8 }, req: 'flash_ring' },
  { id: 'miracle_stone', n: '기적의 돌',   ic: 'crystal',   c: '#9affff', luck: 5, cost: { o_star: 15, o_void: 12, o_core: 15 }, req: 'lucky_pendant' },
  { id: 'hyper_engine',  n: '초가속 엔진', ic: 'gear',      c: '#d8d0ff', speed: 2.5, cost: { o_star: 12, o_void: 10, o_core: 12 }, req: 'speed_wings' },
  { id: 'infinite_luck', n: '무한 행운',   ic: 'infinity',  c: '#ffe9ff', luck: 7.5, cost: { o_star: 20, o_void: 15 }, req: 'miracle_stone' },
  { id: 'god_speed',     n: '신의 속도',   ic: 'bolt',      c: '#fff27a', speed: 3, cost: { o_star: 18, o_void: 14 }, req: 'hyper_engine' },
  { id: 'ultimate_luck', n: '궁극의 행운', ic: 'star',      c: '#ffd36a', luck: 10, cost: { o_star: 30, o_void: 20, o_core: 25 }, req: 'infinite_luck' },
  { id: 'cosmic_speed',  n: '우주의 속도', ic: 'void',      c: '#8ad8ff', speed: 5, cost: { o_star: 25, o_void: 18, o_core: 20 }, req: 'god_speed' },
];

/* 원작 코드 (한 번씩 사용) — shards → 샤드, luck → 영구 행운, materials → 원작 재료 */
const CODES = {
  VOID100: { shards: 100, msg: '샤드 100개!' }, WELCOME: { shards: 30, msg: '샤드 30개!' }, LUCKYSTAR: { luck: .3, msg: '행운 +0.3!' }, ULTIMATE: { luck: 10, msg: '행운 +10!' },
  ADMIN: { admin: 'developer', msg: '어드민 모드!' }, VOID500: { shards: 500, msg: '샤드 500개!' }, VOID1000: { shards: 1000, msg: '샤드 1000개!' },
  LUCKYBOOST: { luck: .5, msg: '행운 +0.5!' }, SUPERLUCK: { luck: 1, msg: '행운 +1.0!' }, MEGALUCK: { luck: 5, msg: '행운 +5.0!' },
  STARDUST: { mats: { o_star: 5 }, msg: '별의 정수 5개!' }, VOIDSHARD: { mats: { o_void: 3 }, msg: '공허의 조각 3개!' }, CRYSTAL: { mats: { o_core: 10 }, msg: '응축된 핵 10개!' },
  FRAGMENTS: { mats: { o_frag: 20 }, msg: '균열의 파편 20개!' }, DUSTBUNNY: { mats: { o_dust: 50 }, msg: '차원의 먼지 50개!' },
  FULLMATS: { mats: { o_dust: 30, o_frag: 10, o_core: 5, o_star: 2, o_void: 1 }, msg: '모든 재료 세트!' },
  BEGINNER: { shards: 50, luck: .1, msg: '초보자 패키지!' }, EXPERT: { shards: 500, luck: .5, msg: '전문가 패키지!' }, MASTER: { shards: 1000, luck: 2, msg: '마스터 패키지!' },
  GRANDMASTER: { shards: 1000, luck: 5, msg: '그랜드마스터!' }, CELESTIAL1: { luck: 1, shards: 1000, msg: '셀레스티얼 축복!' }, MYTHIC1: { luck: .8, shards: 800, msg: '미식 축복!' },
  LEGENDARY1: { luck: .5, shards: 500, msg: '레전더리 축복!' }, EPIC1: { luck: .3, shards: 300, msg: '에픽 축복!' }, RARE1: { luck: .2, shards: 200, msg: '레어 축복!' },
  SHARDRAIN: { shards: 1000, msg: '샤드 폭우!' }, LUCKSTORM: { luck: 3, msg: '행운 폭풍!' }, GOLDENHOUR: { luck: 2, shards: 1000, msg: '골든 아워!' },
  SILVERMOON: { luck: 1.5, shards: 500, msg: '실버 문!' }, DIAMOND: { luck: 3, shards: 1000, msg: '다이아몬드!' }, PLATINUM: { luck: 4, shards: 1000, msg: '플래티넘!' },
  RUBY: { luck: 2.5, shards: 1000, msg: '루비!' }, SAPPHIRE: { luck: 2, shards: 1000, msg: '사파이어!' }, EMERALD: { luck: 1.8, shards: 1000, msg: '에메랄드!' },
  AMETHYST: { luck: 1.2, shards: 800, msg: '자수정!' }, TOPAZ: { luck: 1, shards: 600, msg: '토파즈!' }, OPAL: { luck: .8, shards: 500, msg: '오팔!' }, JADE: { luck: .6, shards: 400, msg: '비취!' },
  REMKAWAII: { luck: 50, shards: 1000, mats: { o_star: 10, o_void: 5 }, msg: '렘카와이의 축복!' },
};
const ADMIN_ROLES = {
  moderator:  { n: 'MODERATOR · 운영자',          code: 'VR-MOD-7K4P',  lv: 1 },
  event:      { n: 'EVENT ADMIN · 이벤트 관리자',  code: 'VR-EVT-9X2M',  lv: 2 },
  developer:  { n: 'DEVELOPER · 개발자',          code: 'VR-DEV-5Q8R',  lv: 3 },
  superadmin: { n: 'SUPER ADMIN · 최고 관리자',    code: 'VR-SADM-3N7X', lv: 4 },
  owner:      { n: 'OWNER · 소유자',              code: 'VR-OWN-1Z9K',  lv: 5 },
};

/* 원작 도전 과제 80개 (보상: 샤드) */
const CHALLENGES = (() => {
  const tc = t => S => (S.tc && S.tc[t]) || 0;
  const T = [
    ['수집가의 시련', '아무 오라 {T}개 획득', [80, 200, 500, 1200], 'hard', S => S.rolls],
    ['커먼 학살', '커먼 등급 {T}개 획득', [150, 400, 1000], 'hard', tc(0)],
    ['레어 추적', '레어 등급 {T}개 획득', [25, 60, 150], 'hard', tc(2)],
    ['에픽 사냥', '에픽 등급 {T}개 획득', [12, 30, 80], 'extreme', tc(3)],
    ['레전더리 시련', '레전더리 등급 {T}개 획득', [5, 12, 25], 'extreme', tc(4)],
    ['미식 정복', '미식 등급 {T}개 획득', [3, 8, 15], 'extreme', tc(5)],
    ['엑절티드', '엑절티드 등급 {T}개 획득', [2, 5], 'extreme', tc(6)],
    ['글로리어스', '글로리어스 등급 {T}개 획득', [1, 3], 'extreme', tc(7)],
    ['행운의 벽', '행운 ×{T} 달성', [50, 200, 1000, 5000], 'hard', S => Math.floor(baseLuck())],
    ['샤드 광부', '샤드 {T}개 누적 획득', [3000, 15000, 50000], 'hard', S => S.stats.coins],
    ['롤링 중독', '총 {T}회 롤', [300, 1000, 3000, 8000], 'hard', S => S.rolls],
    ['초월의 길', '초월 {T}회 달성', [2, 5, 10], 'extreme', S => S.asc || 0],
    ['도감 완성', '도감 {T}종 발견', [25, 45, 70], 'hard', S => found(S)],
    ['천장 돌파', '천장 {T} 도달', [150, 200], 'extreme', S => S.stats.maxPity || 0],
    ['제작 장인', '장비 {T}개 제작', [5, 12, 20], 'hard', S => Object.keys(S.equip || {}).length],
    ['재료 수집', '원작 재료 총 {T}개 누적', [100, 400, 1000], 'hard', S => S.stats.mats || 0],
  ];
  const out = []; let id = 1;
  for (const [title, desc, targets, diff, goal] of T) for (const tg of targets) {
    if (id > 80) break;
    const base = diff === 'extreme' ? 18 : 12, rw = Math.floor(Math.min(50, Math.max(8, base + Math.log10(Math.max(1, tg)) * 6)));
    out.push({ id: 'c' + String(id).padStart(3, '0'), n: `${title} #${id}`, d: desc.replace('{T}', tg.toLocaleString('en-US')), diff, goal: S => [goal(S), tg], rw: { coin: rw } });
    id++;
  }
  return out;
})();

/* 원작 여름 이벤트 (SEASON 01 · ETERNAL TIDE FESTIVAL) */
const SUMMER_MISSIONS = [
  { id: 'roll20',  n: '파도 첫걸음',     d: '롤 20회',               key: 'rolls', target: 20,   rw: 25 },
  { id: 'roll80',  n: '황금 시간',       d: '롤 80회',               key: 'rolls', target: 80,   rw: 60 },
  { id: 'm1',      n: '파도에 몸을 맡겨', d: '롤 200회',             key: 'rolls', target: 200,  rw: 20 },
  { id: 'm4',      n: '한여름의 전설',   d: '롤 800회',              key: 'rolls', target: 800,  rw: 40 },
  { id: 'm5',      n: '태양의 파도',     d: '롤 2000회',             key: 'rolls', target: 2000, rw: 50 },
  { id: 'rare15',  n: '여름의 발견',     d: '레어 이상 오라 15회',    key: 'rare',  target: 15,   rw: 35 },
  { id: 'm3',      n: '여름의 발견 II',  d: '레어 이상 오라 20회',    key: 'rare',  target: 20,   rw: 35 },
  { id: 'm2',      n: '뜨거운 여름',     d: '누적 SUN 250 획득',      key: 'total', target: 250,  rw: 30 },
  { id: 'event',   n: '한여름의 기록',   d: '누적 SUN 400 획득',      key: 'total', target: 400,  rw: 45 },
  { id: 'auras4',  n: '바다의 수집가',   d: '여름 아우라 4종',        key: 'owned', target: 4,    rw: 80 },
];
const SUMMER_SHOP = [
  { id: 'ticket',  n: '파도 티켓',        d: '사용 시 다음 굴림 레어 이상 확정 + 여름 아우라 확률 상승 · 45초간 희귀 ×4', p: 15, repeat: 1, qty: 1 },
  { id: 'ticket5', n: '파도 티켓 ×5',     d: '티켓 5장 묶음',                        p: 60, repeat: 1, qty: 5 },
  { id: 'glow',    n: '선셋 글로우',      d: '영구 장식 · 행운 +0.15',                p: 40 },
  { id: 'frag',    n: '여름 별조각',      d: '3개 모으면 40 SUN으로 교환',           p: 25, repeat: 1 },
  { id: 'aura',    n: '태양의 파도 해금', d: '여름 한정 오라가 레전더리·미식 굴림에 섞여 나와요', p: 180 },
  { id: 'charm',   n: '조개 부적',        d: '영구 행운 +0.3',                       p: 90 },
];

/* 원작 오라에는 스킬이 있었어요. 리뉴얼 오라에도 성격에 맞는 스킬을 붙여요. */
const FX_SYM = { flame: '♨', frost: '❄', water: '≋', wind: '〰', bolt: 'ϟ', star: '✦', lunar: '☾', solar: '☀', crystal: '◈', prism: '◇', void: '◉', abyss: '◎', cosmic: '✧', angel: '✪', chrono: '⌛', glitch: '▣', bloom: '❀', leaf: '❦', mist: '∴', sand: '⦿', ember: '✺', shadow: '◫', blood: '❋', eclipse: '◐', aurora: '≈', storm: 'ϟ', spark: '✶', firefly: '✧', infinity: '∞', voidroll: '⊛', bubble: '○', ash: '∵', ripple: '◌', phoenix: '♆', venom: '✣', rune: 'ᚱ', foxfire: '❂', quasar: '✹', notes: '♪', nova: '✸', tree: '⚘' };
const FX_SKILL = {
  flame: ['불꽃 분출', 'luck'], frost: ['서리 장막', 'luck'], water: ['물결의 축복', 'luck'], wind: ['순풍', 'speed'], bolt: ['뇌격', 'speed'], star: ['별똥별 소원', 'shards'],
  lunar: ['달빛 가호', 'luck'], solar: ['태양 폭발', 'shards'], crystal: ['결정 공명', 'rarity'], prism: ['분광', 'rarity'], void: ['공허 흡수', 'god'], abyss: ['심연의 손', 'luck'],
  cosmic: ['성운 개화', 'luck'], angel: ['천사의 가호', 'god'], chrono: ['시간 역행', 'pity'], glitch: ['오류 발생', 'rarity'], bloom: ['개화', 'luck'], leaf: ['광합성', 'luck'],
  mist: ['안개 장막', 'luck'], sand: ['모래의 퇴적', 'shards'], ember: ['불티', 'luck'], shadow: ['그림자 분신', 'pity'], blood: ['혈월의 맹세', 'ult'], eclipse: ['일식의 틈', 'rarity'],
  aurora: ['오로라 장막', 'speed'], storm: ['폭풍 소환', 'ult'], spark: ['정전기 방출', 'speed'], firefly: ['반딧불의 춤', 'speed'], infinity: ['무한 회귀', 'god'], voidroll: ['보이드 롤', 'god'],
  bubble: ['거품 방울', 'luck'], ash: ['재의 귀환', 'pity'], ripple: ['메아리 파동', 'luck'], phoenix: ['부활의 날개', 'pityReset'], venom: ['맹독 안개', 'rarity'], rune: ['룬 각인', 'luck'],
  foxfire: ['여우불', 'luck'], quasar: ['퀘이사 제트', 'ult'], notes: ['진혼의 선율', 'luck'], nova: ['초신성 폭발', 'shards'], tree: ['세계수의 축복', 'genesis'],
};
function mkSkill(a) {
  const t = Math.min(tierOf(a.r), 13), [n, ef] = FX_SKILL[a.fx] || ['기운 해방', 'luck'];
  const cd = 30 + t * 35, du = Math.round(5 + t * 9), lv = [.1, .25, .5, 1, 2, 5, 10, 20, 50, 100, 200, 400, 800, 1500][t];
  const sec = s => s >= 60 ? `${Math.floor(s / 60)}분${s % 60 ? ' ' + (s % 60) + '초' : ''}` : `${s}초`;
  switch (ef) {
    case 'speed': { const v = +(.2 + t * .2).toFixed(2); return { n, ef, v, du, cd, d: `${sec(du)}간 굴림 속도 +${Math.round(v * 100)}%` }; }
    case 'rarity': { const v = +(1.5 + t * .5).toFixed(1); return { n, ef, v, du, cd, d: `${sec(du)}간 레전더리 이상 ${v}배` }; }
    case 'shards': { const v = Math.round(20 * Math.pow(t + 1, 2.2)); return { n, ef, v, du: 0, cd, d: `즉시 샤드 ${v.toLocaleString('en-US')}개` }; }
    case 'pity': { const v = 10 + t * 10; return { n, ef, v, du: 0, cd, d: `천장 +${v}` }; }
    case 'pityReset': return { n, ef, v: 0, du: 0, cd: cd + 60, d: `천장 가득 채우기 + 샤드 ${300 * (t + 1)}개` };
    case 'genesis': return { n, ef, v: 0, du: 0, cd: cd + 60, d: '원작 재료 각 5개 + 샤드 1000개' };
    case 'god': return { n, ef, v: lv, du, cd, d: `${sec(du)}간 행운 +${Math.round(lv * 100).toLocaleString('en-US')}% · 희귀 ×5` };
    case 'ult': return { n, ef, v: lv, du, cd, d: `${sec(du)}간 행운 +${Math.round(lv * 100).toLocaleString('en-US')}% · 속도 2배` };
    default: return { n, ef: 'luck', v: lv, du, cd, d: `${sec(du)}간 행운 +${Math.round(lv * 100).toLocaleString('en-US')}%` };
  }
}
const darkHex = (hx, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hx.slice(i, i + 2), 16) * (1 - k)).toString(16).padStart(2, '0')).join('');
for (const a of AURAS) { if (!a.c2) a.c2 = darkHex(a.c, .65); if (!a.sym) a.sym = FX_SYM[a.fx] || '✦'; if (!a.sk) a.sk = mkSkill(a); if (!a.en) a.en = a.mg ? 'MAGICAL GIRL' : (a.summer || a.summerRoll) ? 'SUMMER TIDE' : TIERS[tierOf(a.r)].k.toUpperCase(); }

QUESTS.push(
  { id: 'asc1', n: '첫 초월', d: '초월 1회', goal: S => [S.asc || 0, 1], rw: { coin: 2000, pots: { o_ultra: 1 } } },
  { id: 'x10',  n: '열 번에 한 번', d: '×10 굴림 해금', goal: S => [S.x10 ? 1 : 0, 1], rw: { pots: { o_rarity: 2 } } },
  { id: 'sk20', n: '스킬 숙련', d: '오라 스킬 20번 사용', goal: S => [S.stats.skills || 0, 20], rw: { coin: 800 } },
  { id: 'eq5',  n: '제작소 단골', d: '원작 장비 5개 제작', goal: S => [Object.keys(S.equip || {}).length, 5], rw: { mats: { o_star: 3 } } },
  { id: 'mg1',  n: '반짝반짝', d: '매지컬 걸 오라 획득', goal: S => [AURAS.filter(a => a.mg && S.found[a.id]).length, 1], rw: { pots: { o_cosmic: 1 } } },
);
NPCS.marina = { n: '마리나', role: '여름 축제 안내인', lines: ['여름 축제에 온 걸 환영해! 파도를 굴려서 SUN을 모아 봐.', '균열을 열면 바다가 숨겨둔 오라가 나와. 매번 다른 게 나오지!', '티켓 한 장이면 다음 굴림은 무조건 레어 이상이야.'] };
NPCS.admin = { n: '관리자 콘솔', role: '권한 등급별 도구', lines: ['권한이 확인되었습니다.', '변경 사항은 즉시 저장됩니다.'] };
