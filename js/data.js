'use strict';
/* ===== VOIDROLL : RENEWAL — 데이터 ===== */

const TIERS = [
  { k: 'common',       n: '커먼',       min: 1,   c: '#b9bfcc' },
  { k: 'uncommon',     n: '언커먼',     min: 10,  c: '#7be08a' },
  { k: 'rare',         n: '레어',       min: 100, c: '#5aa8ff' },
  { k: 'epic',         n: '에픽',       min: 1e3, c: '#b57bff' },
  { k: 'legendary',    n: '레전더리',   min: 1e4, c: '#ffb340' },
  { k: 'mythic',       n: '미식',       min: 1e5, c: '#ff4f8b' },
  { k: 'exalted',      n: '엑절티드',   min: 1e6, c: '#3ff0e0' },
  { k: 'glorious',     n: '글로리어스', min: 1e7, c: '#fff27a' },
  { k: 'transcendent', n: '초월',       min: 1e8, c: '#ffffff' },
];
function tierOf(r) { let t = 0; for (let i = 0; i < TIERS.length; i++) if (r >= TIERS[i].min) t = i; return t; }

const BIOMES = {
  normal:   { n: '평온',      en: 'CALM',      c: '#8c7cff', w: 0,   dur: [150, 240], mat: 'glim',     sky: ['#24206e', '#5a4cc0', '#b8a4f0'], ground: '#2c2470', grass: '#7a6cf0', prop: 'crystal',
              d: '고요한 기본 하늘. 날씨 한정 오라는 나오지 않아요.' },
  windy:    { n: '질풍',      en: 'WINDY',     c: '#7fe8d6', w: 30,  dur: [90, 150],  mat: 'feather',  sky: ['#1e6a8a', '#58b8c8', '#d0f6ea'], ground: '#1f5a50', grass: '#6ae0b0', prop: 'tree',
              d: '바람의 오라가 3~4배 잘 나와요. 회오리·하늘군주 출현.' },
  rainy:    { n: '호우',      en: 'RAINY',     c: '#6fa8ff', w: 30,  dur: [90, 150],  mat: 'pearl',    sky: ['#1c2c50', '#3e5c84', '#8aa4c0'], ground: '#1a2c44', grass: '#5a8ab0', prop: 'tree',
              d: '물·번개 오라 확률 증가. 장마·해일 출현.' },
  snowy:    { n: '설원',      en: 'SNOWY',     c: '#d6ecff', w: 22,  dur: [90, 150],  mat: 'frost',    sky: ['#4a7ac0', '#9cc0ee', '#f0f8ff'], ground: '#a8c4e4', grass: '#ffffff', prop: 'pine',
              d: '서리 오라 확률 증가. 눈꽃·빙결여왕 출현.' },
  sand:     { n: '모래폭풍',  en: 'SANDSTORM', c: '#ffb45a', w: 18,  dur: [90, 140],  mat: 'sunglass', sky: ['#8a3a1a', '#e08a40', '#ffd896'], ground: '#a8642a', grass: '#ffc070', prop: 'cactus',
              d: '태양·모래 오라 확률 증가. 신기루·파라오 출현.' },
  starfall: { n: '유성우',    en: 'STARFALL',  c: '#ffe08a', w: 10,  dur: [80, 130],  mat: 'starfrag', sky: ['#08083a', '#2a1a70', '#7040b0'], ground: '#1a1250', grass: '#a88aff', prop: 'crystal', night: 1,
              d: '별 오라 확률 크게 증가. 유성·별의 왕관 출현.' },
  hell:     { n: '지옥',      en: 'HELL',      c: '#ff4a2a', w: 6,   dur: [70, 120],  mat: 'ember',    sky: ['#40060a', '#9a1c12', '#ff7a30'], ground: '#3a0a08', grass: '#ff5a2a', prop: 'lava',
              d: '불·피 오라 확률 증가. 지옥불·악마군주 출현.' },
  sakura:   { n: '벚꽃비',    en: 'BLOSSOM',   c: '#ff9ac8', w: 9,   dur: [80, 130],  mat: 'blossom',  sky: ['#6a4aa8', '#e094c4', '#ffe0ee'], ground: '#7a4a7a', grass: '#ffb0d4', prop: 'sakura',
              d: '꽃잎 오라 확률 증가. 꽃놀이·봄의 여왕 출현.' },
  glitch:   { n: '글리치',    en: 'GLITCHED',  c: '#ff2a6d', w: 1.5, dur: [60, 100],  mat: 'byte',     sky: ['#0a0a22', '#2a0a50', '#0a5050'], ground: '#0a0a1a', grass: '#2affd0', prop: 'glitch', night: 1,
              d: '모든 날씨가 한꺼번에 열려요. 모든 한정 오라 + 오류 오라 출현.' },
  void:     { n: '공허 균열', en: 'VOID RIFT', c: '#8a5cff', w: 1,   dur: [90, 150],  mat: 'voiddust', sky: ['#02000a', '#16062e', '#40207a'], ground: '#0a0418', grass: '#8a5cff', prop: 'void', night: 1,
              d: '공허의 문이 열린 자만 볼 수 있는 하늘. 공허 오라 출현.' },
};

/* fx: 이펙트 성격 · c/c2: 주·보조색 · biome: 해당 날씨 한정 · boost: 해당 날씨에서 확률 x배 */
const AURAS = [
  // ── 커먼
  { id: 'faint',    n: '흐릿함',   en: 'Faint',    r: 2,   c: '#c9ccd6', c2: '#7f859a', fx: 'mist',    d: '아무것도 아닌 듯한, 그러나 분명 존재하는 희미한 기운.' },
  { id: 'dust',     n: '먼지',     en: 'Dust',     r: 4,   c: '#c8b48e', c2: '#7a6a55', fx: 'sand',    boost: { b: 'sand', x: 3 }, d: '오래된 제단 위에 내려앉은 시간의 먼지.' },
  { id: 'sprout',   n: '새싹',     en: 'Sprout',   r: 6,   c: '#8de08a', c2: '#3f9a4f', fx: 'leaf',    boost: { b: 'rainy', x: 2 }, d: '작지만 꺾이지 않는 생명의 첫 숨.' },
  { id: 'firefly',  n: '반딧불',   en: 'Firefly',  r: 9,   c: '#eaf27a', c2: '#9fd14a', fx: 'firefly', d: '밤길을 잃은 자 곁에만 모여드는 작은 빛들.' },
  // ── 언커먼
  { id: 'breeze',   n: '미풍',     en: 'Breeze',   r: 16,  c: '#c4f5ec', c2: '#6cc6b4', fx: 'wind',    boost: { b: 'windy', x: 4 }, d: '스치기만 해도 마음이 가벼워지는 바람.' },
  { id: 'droplet',  n: '물방울',   en: 'Droplet',  r: 24,  c: '#7cc8ff', c2: '#2f6fd0', fx: 'water',   boost: { b: 'rainy', x: 4 }, d: '세상을 거꾸로 비추는 한 방울.' },
  { id: 'cinder',   n: '불씨',     en: 'Cinder',   r: 32,  c: '#ff9a4a', c2: '#d4381a', fx: 'ember',   boost: { b: 'hell', x: 4 }, d: '꺼진 줄 알았던 불이 다시 숨을 쉰다.' },
  { id: 'rime',     n: '서리',     en: 'Rime',     r: 45,  c: '#c4ecff', c2: '#6aa8e0', fx: 'frost',   boost: { b: 'snowy', x: 4 }, d: '새벽 유리창에 핀 차가운 꽃.' },
  { id: 'petal',    n: '꽃잎',     en: 'Petal',    r: 64,  c: '#ffb0d0', c2: '#ff6aa0', fx: 'bloom',   d: '바람이 데려온 어느 봄날의 조각.' },
  { id: 'static',   n: '정전기',   en: 'Static',   r: 80,  c: '#fff27a', c2: '#ffb92a', fx: 'spark',   boost: { b: 'windy', x: 2 }, d: '손끝에서 톡, 하고 튀는 작은 번개.' },
  // ── 레어
  { id: 'ruby',     n: '루비',     en: 'Ruby',     r: 120, c: '#ff3a5c', c2: '#8a0f2a', fx: 'crystal', d: '심장 박동을 따라 빛나는 붉은 결정.' },
  { id: 'sapphire', n: '사파이어', en: 'Sapphire', r: 150, c: '#4a86ff', c2: '#12308a', fx: 'crystal', d: '깊은 바다의 고요를 품은 푸른 결정.' },
  { id: 'emerald',  n: '에메랄드', en: 'Emerald',  r: 200, c: '#38e894', c2: '#0a6a3f', fx: 'crystal', d: '숲의 기억이 굳어 만들어진 초록 결정.' },
  { id: 'shade',    n: '그늘',     en: 'Shade',    r: 300, c: '#8a74c0', c2: '#1a1030', fx: 'shadow',  d: '빛이 있는 곳엔 언제나 그것도 있다.' },
  { id: 'blaze',    n: '화염',     en: 'Blaze',    r: 450, c: '#ff7a24', c2: '#ffd43a', fx: 'flame',   boost: { b: 'hell', x: 3 }, d: '모든 것을 태워 앞으로 나아가는 불길.' },
  { id: 'gale',     n: '돌풍',     en: 'Gale',     r: 600, c: '#a8e0ff', c2: '#ffffff', fx: 'wind',    boost: { b: 'windy', x: 3 }, d: '길을 막는 것을 모두 날려버리는 바람.' },
  { id: 'twinkle',  n: '반짝임',   en: 'Twinkle',  r: 800, c: '#ffeaa8', c2: '#ffffff', fx: 'star',    boost: { b: 'starfall', x: 4 }, d: '누군가의 소원을 들은 작은 별.' },
  // ── 에픽
  { id: 'thunder',  n: '뇌전',     en: 'Thunder',  r: 1200,  c: '#8fd0ff', c2: '#ffffff', fx: 'bolt',    boost: { b: 'rainy', x: 2 }, d: '하늘이 내리친 판결.' },
  { id: 'crimson',  n: '혈월',     en: 'Crimson',  r: 1600,  c: '#ff2246', c2: '#4a0010', fx: 'blood',   boost: { b: 'hell', x: 2 }, d: '붉은 달이 뜨는 밤엔 무언가 깨어난다.' },
  { id: 'glacier',  n: '빙하',     en: 'Glacier',  r: 2200,  c: '#90f2ff', c2: '#2a7aff', fx: 'frost',   boost: { b: 'snowy', x: 3 }, d: '만 년 동안 녹지 않은 침묵.' },
  { id: 'moonlight',n: '월광',     en: 'Moonlight',r: 3000,  c: '#dfe6ff', c2: '#7a8aff', fx: 'lunar',   boost: { b: 'starfall', x: 2 }, d: '달이 오직 한 사람을 위해 비추는 빛.' },
  { id: 'eclipse',  n: '일식',     en: 'Eclipse',  r: 4500,  c: '#ffb347', c2: '#120818', fx: 'eclipse', d: '태양이 눈을 감는 짧은 순간.' },
  { id: 'prism',    n: '프리즘',   en: 'Prism',    r: 6500,  c: '#ff7af0', c2: '#7afcff', fx: 'prism',   d: '하나의 빛이 일곱 개의 이야기로 갈라진다.' },
  { id: 'wraith',   n: '망령',     en: 'Wraith',   r: 8000,  c: '#7affd0', c2: '#0a2a22', fx: 'shadow',  d: '떠나지 못한 자의 서늘한 숨결.' },
  // ── 레전더리
  { id: 'solaris',  n: '태양신',   en: 'Solaris',  r: 12000, c: '#ffcc33', c2: '#ff6a00', fx: 'solar',   boost: { b: 'sand', x: 3 }, d: '정오의 태양을 손바닥 위에.' },
  { id: 'nebula',   n: '성운',     en: 'Nebula',   r: 18000, c: '#c27aff', c2: '#4a8aff', fx: 'cosmic',  boost: { b: 'starfall', x: 3 }, d: '별이 태어나는 요람.' },
  { id: 'seraph',   n: '세라프',   en: 'Seraph',   r: 25000, c: '#fff6d6', c2: '#ffd36a', fx: 'angel',   d: '여섯 날개의 수호자가 내려앉는다.' },
  { id: 'tempest',  n: '폭뢰',     en: 'Tempest',  r: 33000, c: '#6ab8ff', c2: '#e8f6ff', fx: 'storm',   boost: { b: 'rainy', x: 3 }, d: '폭풍의 눈, 그 한가운데.' },
  { id: 'hourglass',n: '시간의 모래', en: 'Hourglass', r: 50000, c: '#ecc47a', c2: '#7a4a1a', fx: 'chrono', d: '흘러내린 시간은 되돌릴 수 없다. 단, 이 오라는 예외.' },
  { id: 'abyssal',  n: '심연',     en: 'Abyssal',  r: 75000, c: '#6a4ad0', c2: '#0a0420', fx: 'abyss',   boost: { b: 'void', x: 3 }, d: '오래 들여다보면, 그것도 너를 본다.' },
  // ── 미식
  { id: 'dragonfire', n: '용염',   en: 'Dragonfire', r: 120000, c: '#ff3a1a', c2: '#ffe04a', fx: 'flame',  boost: { b: 'hell', x: 3 }, d: '고대 용의 마지막 숨결.' },
  { id: 'aurora',   n: '오로라',   en: 'Aurora',   r: 180000, c: '#6affc0', c2: '#a06aff', fx: 'aurora',  boost: { b: 'snowy', x: 3 }, d: '극지의 하늘이 추는 춤.' },
  { id: 'crystalline', n: '수정궁', en: 'Crystalline', r: 250000, c: '#eef9ff', c2: '#9ad8ff', fx: 'crystal', d: '빛이 영원히 갇혀 있는 궁전.' },
  { id: 'chaos',    n: '혼돈',     en: 'Chaos',    r: 400000, c: '#ff2a6d', c2: '#2affd0', fx: 'glitch',  boost: { b: 'glitch', x: 5 }, d: '질서가 만들어지기 전의 세계.' },
  { id: 'startear', n: '유성의 눈물', en: 'Startear', r: 600000, c: '#a8e0ff', c2: '#ffffff', fx: 'star',   boost: { b: 'starfall', x: 4 }, d: '별도 운다. 아주 가끔.' },
  // ── 엑절티드
  { id: 'raijin',   n: '뇌신',     en: 'Raijin',   r: 1.2e6, c: '#c8a8ff', c2: '#ffffff', fx: 'bolt',    boost: { b: 'rainy', x: 2 }, d: '천둥의 북을 울리는 신.' },
  { id: 'eternity', n: '영원',     en: 'Eternity', r: 2e6,   c: '#ffffff', c2: '#ffd36a', fx: 'chrono',  d: '끝이 없는 시계의 바늘.' },
  { id: 'voidbreath', n: '공허의 숨결', en: 'Voidbreath', r: 3.5e6, c: '#7a4cff', c2: '#0a0418', fx: 'void', boost: { b: 'void', x: 4 }, d: '공허가 처음으로 내쉰 숨.' },
  { id: 'divinity', n: '신성',     en: 'Divinity', r: 6e6,   c: '#ffe58a', c2: '#ffffff', fx: 'angel',   d: '신이 남긴 발자국.' },
  // ── 글로리어스
  { id: 'galaxia',  n: '은하',     en: 'Galaxia',  r: 1.2e7, c: '#9a6aff', c2: '#ff6ad8', fx: 'cosmic',  d: '천억 개의 별이 너를 중심으로 돈다.' },
  { id: 'genesis',  n: '창세',     en: 'Genesis',  r: 2.5e7, c: '#ffffff', c2: '#ffd0f0', fx: 'prism',   d: '첫 번째 빛. 모든 것의 시작.' },
  { id: 'apocalypse', n: '종말',   en: 'Apocalypse', r: 5e7, c: '#ff2a1a', c2: '#1a0000', fx: 'abyss',   boost: { b: 'hell', x: 3 }, d: '모든 것의 끝. 그리고 침묵.' },
  // ── 초월
  { id: 'infinity', n: '무한',     en: 'Infinity', r: 1.5e8, c: '#ffffff', c2: '#9adfff', fx: 'infinity', d: '셀 수 없는 것을 세는 오라.' },
  { id: 'voidroll', n: '보이드롤', en: 'VOIDROLL', r: 9.99e8, c: '#8a5cff', c2: '#ff2a9a', fx: 'voidroll', boost: { b: 'void', x: 5 }, d: '이 세계의 이름. 공허가 굴린 단 하나의 주사위.' },

  // ═══ 날씨 한정 ═══
  { id: 'cyclone',   n: '회오리',   en: 'Cyclone',   r: 900,    biome: 'windy',    c: '#c8fff0', c2: '#5ab8a0', fx: 'wind',    d: '질풍 속에서만 태어나는 소용돌이.' },
  { id: 'skylord',   n: '하늘군주', en: 'Skylord',   r: 90000,  biome: 'windy',    c: '#e8fbff', c2: '#6ad0ff', fx: 'storm',   d: '구름 위 왕좌의 주인.' },
  { id: 'monsoon',   n: '장마',     en: 'Monsoon',   r: 700,    biome: 'rainy',    c: '#5aa8ff', c2: '#1a3a8a', fx: 'water',   d: '끝나지 않을 것 같은 빗소리.' },
  { id: 'leviathan', n: '해일',     en: 'Leviathan', r: 150000, biome: 'rainy',    c: '#2a9aff', c2: '#00f0d0', fx: 'water',   d: '바다가 일어서는 날.' },
  { id: 'snowflake', n: '눈꽃',     en: 'Snowflake', r: 500,    biome: 'snowy',    c: '#ffffff', c2: '#a8d8ff', fx: 'frost',   d: '같은 모양은 단 하나도 없다.' },
  { id: 'frostqueen',n: '빙결여왕', en: 'Frostqueen',r: 200000, biome: 'snowy',    c: '#d8f6ff', c2: '#6a9aff', fx: 'frost',   d: '그녀가 지나간 자리엔 겨울만 남는다.' },
  { id: 'mirage',    n: '신기루',   en: 'Mirage',    r: 1500,   biome: 'sand',     c: '#ffd8a0', c2: '#ff9a6a', fx: 'sand',    d: '보이지만 닿지 않는 오아시스.' },
  { id: 'pharaoh',   n: '파라오',   en: 'Pharaoh',   r: 300000, biome: 'sand',     c: '#ffd24a', c2: '#2a6aff', fx: 'solar',   d: '모래 아래 잠든 왕이 눈을 뜬다.' },
  { id: 'meteor',    n: '유성',     en: 'Meteor',    r: 5000,   biome: 'starfall', c: '#ffb06a', c2: '#ffffff', fx: 'star',    d: '떨어지는 순간 가장 밝게 빛난다.' },
  { id: 'starcrown', n: '별의 왕관', en: 'Starcrown', r: 1.5e6, biome: 'starfall', c: '#fff2a8', c2: '#a06aff', fx: 'cosmic',  d: '밤하늘이 직접 씌워주는 왕관.' },
  { id: 'hellfire',  n: '지옥불',   en: 'Hellfire',  r: 10000,  biome: 'hell',     c: '#ff4a1a', c2: '#ff1a5a', fx: 'flame',   d: '꺼지지 않는 저주받은 불.' },
  { id: 'archfiend', n: '악마군주', en: 'Archfiend', r: 4e6,    biome: 'hell',     c: '#ff1a3a', c2: '#2a0008', fx: 'blood',   d: '지옥의 왕좌가 비었다.' },
  { id: 'error',     n: '오류',     en: 'ERR0R',     r: 1000,   biome: 'glitch',   c: '#ff2a6d', c2: '#2affd0', fx: 'glitch',  d: '이 오라는 존재해서는 안 됩니다.' },
  { id: 'notfound',  n: '404',      en: 'NOT FOUND', r: 40000,  biome: 'glitch',   c: '#ffffff', c2: '#4a6aff', fx: 'glitch',  d: '요청하신 오라를 찾을 수 없습니다.' },
  { id: 'bsod',      n: '블루스크린', en: 'FATAL', r: 8e6,    biome: 'glitch',   c: '#3a6aff', c2: '#ffffff', fx: 'glitch',  d: '세계가 치명적인 오류로 멈췄습니다.' },
  { id: 'hollow',    n: '텅 빈 것', en: 'Hollow',    r: 30000,  biome: 'void',     c: '#7a5aff', c2: '#000000', fx: 'void',    d: '아무것도 없는 것이 형태를 가졌다.' },
  { id: 'horizon',   n: '사건의 지평선', en: 'Event Horizon', r: 2e7, biome: 'void', c: '#ffa040', c2: '#2a0a5a', fx: 'void', d: '빛조차 돌아오지 못하는 경계.' },
];

const MATS = {
  glim:     { n: '반짝 가루',   c: '#c8b8ff', ic: 'dust' },
  feather:  { n: '바람 깃털',   c: '#bff0e8', ic: 'feather' },
  pearl:    { n: '빗방울 진주', c: '#7cc8ff', ic: 'pearl' },
  frost:    { n: '서리 결정',   c: '#c4ecff', ic: 'crystal' },
  sunglass: { n: '태양 유리',   c: '#ffcf6a', ic: 'glass' },
  starfrag: { n: '별 조각',     c: '#ffe9a8', ic: 'star' },
  ember:    { n: '지옥 불씨',   c: '#ff6a2a', ic: 'flame' },
  byte:     { n: '오류 바이트', c: '#ff2a6d', ic: 'byte' },
  blossom:  { n: '벚꽃잎',      c: '#ffb0d4', ic: 'petal' },
  voiddust: { n: '공허 가루',   c: '#9a6cff', ic: 'void' },
};

/* '@id' = 오라 소모 */
const POTIONS = {
  lucky:      { n: '행운 물약',   c: '#5df08a', d: '3분간 행운 ×2',            eff: { luck: 2, t: 180 },  cost: { glim: 5, '@faint': 5 } },
  swift:      { n: '신속 물약',   c: '#6fd8ff', d: '3분간 굴림 속도 +40%',     eff: { speed: .4, t: 180 }, cost: { glim: 4, '@breeze': 1 } },
  fortune:    { n: '대행운 물약', c: '#ffd36a', d: '5분간 행운 ×3',            eff: { luck: 3, t: 300 },  cost: { glim: 10, pearl: 3, '@ruby': 1 } },
  haste:      { n: '질주 물약',   c: '#ff8ad8', d: '5분간 굴림 속도 +80%',     eff: { speed: .8, t: 300 }, cost: { feather: 5, '@static': 2 } },
  starlit:    { n: '별빛 영약',   c: '#ffe9a8', d: '다음 1회 굴림 행운 ×300',  eff: { next: 300 },        cost: { starfrag: 4, '@twinkle': 2, '@moonlight': 1 } },
  voidelixir: { n: '공허 비약',   c: '#9a6cff', d: '다음 1회 굴림 행운 ×2500', eff: { next: 2500 },       cost: { voiddust: 15, '@thunder': 1, '@crimson': 1 } },
  compass:    { n: '날씨 나침반', c: '#7fe8d6', d: '즉시 특수 날씨로 바꿈',    eff: { biome: 'random' },  cost: { frost: 2, feather: 2, pearl: 2, sunglass: 2 } },
  glitchkey:  { n: '오류 열쇠',   c: '#ff2a6d', d: '2분간 글리치 날씨 소환',   eff: { biome: 'glitch', t: 120 }, cost: { byte: 6, '@prism': 1 } },
};

const GAUNTLETS = {
  copper:   { n: '구리 팔찌',     c: '#e0925a', luck: .15, speed: 0,   d: '행운 +15%', cost: { glim: 8, '@dust': 5 } },
  galeglove:{ n: '바람 장갑',     c: '#9ff0e0', luck: .3,  speed: .1,  d: '행운 +30% · 속도 +10%', cost: { feather: 6, '@breeze': 3, '@gale': 1 } },
  frostgrip:{ n: '서리 손아귀',   c: '#a8e4ff', luck: .5,  speed: 0,   d: '행운 +50%', cost: { frost: 8, '@rime': 3, '@glacier': 1 } },
  sungrip:  { n: '태양 손목',     c: '#ffcc33', luck: .8,  speed: .15, d: '행운 +80% · 속도 +15%', cost: { sunglass: 8, '@blaze': 2, '@solaris': 1 } },
  starweaver:{ n: '별자리 장갑',  c: '#c8a8ff', luck: 1.2, speed: .1,  tenth: 3, d: '행운 +120% · 10번째 굴림 ×3', cost: { starfrag: 10, '@twinkle': 5, '@nebula': 1 } },
  hellforge:{ n: '지옥 건틀릿',   c: '#ff5a2a', luck: 1.8, speed: .25, d: '행운 +180% · 속도 +25%', cost: { ember: 12, '@hellfire': 1, '@crimson': 2 } },
  glitchhand:{ n: '오류 장갑',    c: '#ff2a6d', luck: 2.5, speed: .2,  dbl: .08, d: '행운 +250% · 8% 확률로 한 번 더 굴림', cost: { byte: 15, '@error': 2, '@notfound': 1 } },
  voidhand: { n: '공허의 손',     c: '#8a5cff', luck: 5,   speed: .35, tenth: 4, d: '행운 +500% · 속도 +35% · 10번째 ×4', cost: { voiddust: 40, '@hollow': 1, '@abyssal': 1 } },
};

const QUESTS = [
  { id: 'r50',   n: '첫 굴림들',     d: '50번 굴리기',         goal: S => [S.rolls, 50],     rw: { pots: { lucky: 2 } } },
  { id: 'r250',  n: '손에 익다',     d: '250번 굴리기',        goal: S => [S.rolls, 250],    rw: { pots: { swift: 2, lucky: 2 } } },
  { id: 'r1000', n: '굴림의 장인',   d: '1,000번 굴리기',      goal: S => [S.rolls, 1000],   rw: { pots: { fortune: 1, starlit: 1 } } },
  { id: 'r5000', n: '운명 수집가',   d: '5,000번 굴리기',      goal: S => [S.rolls, 5000],   rw: { pots: { voidelixir: 1, fortune: 2 } } },
  { id: 'r20k',  n: '끝없는 굴림',   d: '20,000번 굴리기',     goal: S => [S.rolls, 20000],  rw: { pots: { voidelixir: 2 }, mats: { voiddust: 20 } } },
  { id: 'c10',   n: '수집의 시작',   d: '오라 10종 발견',      goal: S => [found(S), 10],    rw: { pots: { compass: 2 } } },
  { id: 'c20',   n: '공허의 부름',   d: '오라 20종 발견 · 공허의 문 개방', goal: S => [found(S), 20], rw: { mats: { voiddust: 10 } } },
  { id: 'c35',   n: '도감 학자',     d: '오라 35종 발견',      goal: S => [found(S), 35],    rw: { pots: { starlit: 3 } } },
  { id: 'c50',   n: '살아있는 기록', d: '오라 50종 발견',      goal: S => [found(S), 50],    rw: { pots: { voidelixir: 3 } } },
  { id: 't3',    n: '보랏빛 행운',   d: '에픽 등급 오라 획득', goal: S => [bestTier(S) >= 3 ? 1 : 0, 1], rw: { pots: { starlit: 1 } } },
  { id: 't4',    n: '전설의 시작',   d: '레전더리 등급 획득',  goal: S => [bestTier(S) >= 4 ? 1 : 0, 1], rw: { pots: { fortune: 2, haste: 1 } } },
  { id: 't5',    n: '신화를 쥐다',   d: '미식 등급 획득',      goal: S => [bestTier(S) >= 5 ? 1 : 0, 1], rw: { pots: { voidelixir: 1 } } },
  { id: 't6',    n: '경지',          d: '엑절티드 등급 획득',  goal: S => [bestTier(S) >= 6 ? 1 : 0, 1], rw: { pots: { voidelixir: 3 } } },
  { id: 'b5',    n: '날씨 관측자',   d: '날씨 5종 경험',       goal: S => [Object.keys(S.seen).length, 5], rw: { pots: { compass: 2 } } },
  { id: 'g1',    n: '첫 장비',       d: '장갑 1개 제작',       goal: S => [Object.keys(S.gaunts).length, 1], rw: { pots: { lucky: 3 } } },
  { id: 'g4',    n: '무기고',        d: '장갑 4개 제작',       goal: S => [Object.keys(S.gaunts).length, 4], rw: { pots: { starlit: 2, fortune: 2 } } },
  { id: 'p10',   n: '연금술 입문',   d: '물약 10개 사용',      goal: S => [S.stats.pots, 10], rw: { mats: { glim: 25 } } },
];
function found(S) { return Object.keys(S.found).length; }
function bestTier(S) { return S.best ? tierOf(AURAS.find(a => a.id === S.best).r) : -1; }

const NPCS = {
  mira:   { n: '미라',       role: '연금술사', lines: ['어머, 운명술사님! 오늘도 행운을 끓여볼까요?', '재료만 있으면 뭐든 끓여드려요. 폭발은… 가끔만 해요.', '별빛 영약은 딱 한 번의 굴림에 모든 걸 걸 때 쓰는 거예요.', '질풍이 불 때 깃털을 모아 오세요. 질주 물약 재료예요!'] },
  bran:   { n: '브란',       role: '대장장이', lines: ['오라를 담을 장갑이 필요한가? 망치를 들어주지.', '좋은 장갑은 운을 부르지. 나쁜 장갑은… 손가락을 부르고.', '공허의 손? 평생 딱 한 번 만들어봤다.', '장갑은 하나만 낄 수 있다. 욕심은 금물이야.'] },
  quill:  { n: '퀼 장로',    role: '기록관',   lines: ['모든 오라는 기록될 가치가 있지. 자네가 찾은 것들을 보여주게.', '빈칸이 많군. 빈칸은 곧 가능성이라네.', '날씨 한정 오라는 그 날씨에만 모습을 드러낸다네.'] },
  stella: { n: '스텔라',     role: '천문학자', lines: ['하늘은 늘 바뀌어요. 지금 이 순간도요.', '글리치 하늘을 본 적 있나요? 모든 하늘이 한꺼번에 열린대요.', '날씨가 바뀌면 굴릴 수 있는 오라도 바뀌어요.'] },
  keeper: { n: '공허지기',   role: '문지기',   lines: ['…바쳐라. 공허는 빛을 먹고 자란다.', '균열을 열겠는가. 그 너머엔 이름 없는 오라들이 있다.', '…너는 이미 많이 굴렸다. 더 깊이 굴려라.'],
            locked: ['…아직이다. 스무 개의 빛을 모아 와라.', '문은 기억하는 자에게만 열린다.'] },
};


/* ════════ 확장 콘텐츠 ════════ */
AURAS.push(
  // 기본 풀 추가
  { id: 'glimmer',  n: '반짝이',   en: 'Glimmer',  r: 12,    c: '#e8e0ff', c2: '#9a8aff', fx: 'star',     d: '눈을 감아도 잔상처럼 남는 작은 반짝임.' },
  { id: 'moss',     n: '이끼',     en: 'Moss',     r: 28,    c: '#9ad86a', c2: '#3a6a2a', fx: 'leaf',     boost: { b: 'rainy', x: 2 }, d: '오래 머문 자리에만 자라나는 초록.' },
  { id: 'bubble',   n: '거품',     en: 'Bubble',   r: 52,    c: '#bff0ff', c2: '#6ab8ff', fx: 'bubble',   boost: { b: 'rainy', x: 3 }, d: '톡 터지기 직전이 가장 아름답다.' },
  { id: 'ash',      n: '잿더미',   en: 'Ash',      r: 95,    c: '#a8a0a8', c2: '#3a3438', fx: 'ash',      boost: { b: 'hell', x: 3 }, d: '모든 것이 타고 남은 고요.' },
  { id: 'amethyst', n: '자수정',   en: 'Amethyst', r: 260,   c: '#c08aff', c2: '#4a1a8a', fx: 'crystal',  d: '취하지 않는 지혜의 보랏빛.' },
  { id: 'topaz',    n: '토파즈',   en: 'Topaz',    r: 380,   c: '#ffc85a', c2: '#a0601a', fx: 'crystal',  boost: { b: 'sand', x: 2 }, d: '태양을 한 조각 떼어낸 듯한 돌.' },
  { id: 'echo',     n: '메아리',   en: 'Echo',     r: 700,   c: '#9ae8ff', c2: '#4a8ac8', fx: 'ripple',   d: '네가 굴린 소리가 아직 울리고 있다.' },
  { id: 'phoenix',  n: '불사조',   en: 'Phoenix',  r: 2800,  c: '#ff8a2a', c2: '#ffe04a', fx: 'phoenix',  boost: { b: 'hell', x: 2 }, d: '재 속에서 다시 날아오르는 날개.' },
  { id: 'tidal',    n: '조수',     en: 'Tidal',    r: 3800,  c: '#3ad0ff', c2: '#0a4a8a', fx: 'water',    boost: { b: 'rainy', x: 2 }, d: '달이 당기고 바다가 따른다.' },
  { id: 'venom',    n: '맹독',     en: 'Venom',    r: 5200,  c: '#9aff3a', c2: '#2a5a0a', fx: 'venom',    d: '한 방울이면 충분하다.' },
  { id: 'sakurastorm', n: '벚꽃폭풍', en: 'Sakura Storm', r: 9000, c: '#ffb0d4', c2: '#ff5a9a', fx: 'bloom', boost: { b: 'sakura', x: 4 }, d: '봄이 한꺼번에 쏟아진다.' },
  { id: 'runic',    n: '고대 룬',  en: 'Runic',    r: 15000, c: '#7af0ff', c2: '#2a6aa0', fx: 'rune',     d: '아무도 읽지 못하는 문자가 빛난다.' },
  { id: 'kitsune',  n: '구미호',   en: 'Kitsune',  r: 22000, c: '#6ad8ff', c2: '#ff8ad8', fx: 'foxfire',  d: '아홉 개의 여우불이 길을 밝힌다.' },
  { id: 'bloodmoon',n: '핏빛 달',  en: 'Blood Moon', r: 60000, c: '#ff3a3a', c2: '#3a0008', fx: 'lunar', boost: { b: 'hell', x: 2 }, d: '이 달이 뜨면 아무도 잠들지 않는다.' },
  { id: 'quasar',   n: '퀘이사',   en: 'Quasar',   r: 140000, c: '#8ad8ff', c2: '#ff8a3a', fx: 'quasar', boost: { b: 'starfall', x: 3 }, d: '우주에서 가장 밝은 심장.' },
  { id: 'yggdrasil',n: '세계수',   en: 'Yggdrasil', r: 320000, c: '#8aff9a', c2: '#ffe08a', fx: 'tree',  d: '아홉 세계를 잇는 나무의 뿌리.' },
  { id: 'oblivion', n: '망각',     en: 'Oblivion', r: 800000, c: '#8a8aa8', c2: '#06040c', fx: 'abyss',   boost: { b: 'void', x: 3 }, d: '기억하는 사람이 없으면 존재하지 않는다.' },
  { id: 'requiem',  n: '진혼곡',   en: 'Requiem',  r: 2.8e6, c: '#d8c8ff', c2: '#4a2a8a', fx: 'notes',    d: '떠난 모든 것을 위한 노래.' },
  { id: 'celestia', n: '천계',     en: 'Celestia', r: 9e6,   c: '#bfe8ff', c2: '#fff6c8', fx: 'angel',    d: '구름 너머, 문이 열린다.' },
  { id: 'nova',     n: '초신성',   en: 'Supernova', r: 1.8e7, c: '#ffe8a8', c2: '#ff4a8a', fx: 'nova',    boost: { b: 'starfall', x: 2 }, d: '별이 죽는 순간, 우주에서 가장 밝다.' },
  { id: 'paradox',  n: '패러독스', en: 'Paradox',  r: 4e7,   c: '#7affd8', c2: '#ff5ad8', fx: 'glitch',   d: '이 오라는 굴리기 전에 이미 나왔다.' },
  { id: 'omega',    n: '오메가',   en: 'Omega',    r: 3e8,   c: '#fff6e0', c2: '#8a5cff', fx: 'cosmic',   d: '마지막 글자. 마지막 오라. 아마도.' },
  // 낮/밤 한정
  { id: 'sunbeam',  n: '햇살',     en: 'Sunbeam',  r: 350,   day: 1,   c: '#ffe08a', c2: '#ffb03a', fx: 'solar',   d: '낮에만 내려오는 따스한 손길.' },
  { id: 'zenith',   n: '정오',     en: 'Zenith',   r: 250000, day: 1,  c: '#fff4c8', c2: '#ffb43a', fx: 'solar',   d: '그림자가 사라지는 단 한 순간.' },
  { id: 'nocturne', n: '야상곡',   en: 'Nocturne', r: 1100,  night: 1, c: '#8a9aff', c2: '#2a2a6a', fx: 'notes',   d: '밤에만 들리는 조용한 선율.' },
  { id: 'dreamer',  n: '꿈결',     en: 'Dreamer',  r: 14000, night: 1, c: '#d8a8ff', c2: '#6ac8ff', fx: 'cosmic',  d: '잠든 자의 꿈이 새어 나온다.' },
  { id: 'moonqueen',n: '달의 여왕', en: 'Moon Queen', r: 700000, night: 1, c: '#e8f0ff', c2: '#8a9aff', fx: 'lunar', d: '밤하늘의 주인이 고개를 숙인다.' },
  // 벚꽃비 한정
  { id: 'hanami',   n: '꽃놀이',   en: 'Hanami',   r: 2000,  biome: 'sakura', c: '#ffc8e0', c2: '#ff7ab0', fx: 'bloom', d: '꽃잎 아래에서 잠시 쉬어 간다.' },
  { id: 'springqueen', n: '봄의 여왕', en: 'Spring Queen', r: 450000, biome: 'sakura', c: '#ffd8ec', c2: '#8aff9a', fx: 'tree', d: '그녀가 웃으면 겨울이 끝난다.' },
  // 융합 전용 (굴림으로는 안 나옴)
  { id: 'stormfire',  n: '폭풍염',    en: 'Stormfire',  r: 5000,   fusion: 1, c: '#ff6a3a', c2: '#6ab8ff', fx: 'storm',    d: '번개를 먹고 자란 불길.' },
  { id: 'frostfire',  n: '빙염',      en: 'Frostfire',  r: 8000,   fusion: 1, c: '#7af0ff', c2: '#ff7a3a', fx: 'flame',    d: '얼어붙은 채로 타오르는 불.' },
  { id: 'prismheart', n: '프리즘 심장', en: 'Prismheart', r: 30000, fusion: 1, c: '#ff8af0', c2: '#8afff0', fx: 'prism',   d: '세 보석의 빛이 하나로 뛴다.' },
  { id: 'twilight',   n: '황혼',      en: 'Twilight',   r: 60000,  fusion: 1, c: '#ffa06a', c2: '#6a5aff', fx: 'eclipse',  d: '낮과 밤이 손을 맞잡는 시간.' },
  { id: 'starforge',  n: '별의 용광로', en: 'Starforge', r: 200000, fusion: 1, c: '#ffb04a', c2: '#a06aff', fx: 'nova',    d: '별을 두드려 만든 오라.' },
  { id: 'voidseraph', n: '공허 세라프', en: 'Void Seraph', r: 2e6, fusion: 1, c: '#a07aff', c2: '#0a0418', fx: 'angel',   d: '빛을 잃고도 날개를 접지 않은 천사.' },
  { id: 'chronoverse',n: '시공',      en: 'Chronoverse', r: 2e7,   fusion: 1, c: '#fff0b0', c2: '#7a5aff', fx: 'chrono',   d: '모든 순간이 동시에 존재한다.' },
  { id: 'worldend',   n: '세계의 끝', en: 'World\'s End', r: 2e9, fusion: 1, c: '#ffffff', c2: '#ff2a6a', fx: 'voidroll', d: '시작과 끝과 무한이 하나로 접힌 곳.' },
);

/* 융합 레시피: 재료 오라는 소모, 장착 중 1개는 보호 */
const FUSIONS = [
  { out: 'stormfire',   cost: { '@blaze': 2, '@thunder': 1, '@gale': 1, coin: 300 } },
  { out: 'frostfire',   cost: { '@blaze': 2, '@glacier': 1, frost: 5, coin: 400 } },
  { out: 'prismheart',  cost: { '@ruby': 3, '@sapphire': 3, '@emerald': 3, '@prism': 1, coin: 800 } },
  { out: 'twilight',    cost: { '@solaris': 1, '@moonlight': 2, '@eclipse': 1, coin: 1500 } },
  { out: 'starforge',   cost: { '@nebula': 1, '@twinkle': 5, '@hellfire': 1, starfrag: 10, coin: 3000 } },
  { out: 'voidseraph',  cost: { '@seraph': 1, '@abyssal': 1, '@hollow': 1, voiddust: 30, coin: 8000 } },
  { out: 'chronoverse', cost: { '@hourglass': 2, '@eternity': 1, coin: 20000 } },
  { out: 'worldend',    cost: { '@apocalypse': 1, '@genesis': 1, '@infinity': 1, voiddust: 100, coin: 99999 } },
];

/* 부적: 2칸 장착 */
const CHARMS = {
  clover:   { n: '네잎 클로버', c: '#7be08a', ic: 'clover', d: '행운 +10%',                   luck: .1,             cost: { glim: 20, '@sprout': 10 } },
  shell:    { n: '소라 부적',   c: '#7cc8ff', ic: 'shell',  d: '호우 날씨에서 행운 ×1.5',     bm: { b: 'rainy', x: 1.5 },  cost: { pearl: 12, '@droplet': 5 } },
  globe:    { n: '스노볼',      c: '#d8f0ff', ic: 'globe',  d: '설원 날씨에서 행운 ×1.5',     bm: { b: 'snowy', x: 1.5 },  cost: { frost: 12, '@rime': 5 } },
  pinwheel: { n: '바람개비',    c: '#9ff0e0', ic: 'pin',    d: '질풍 행운 ×1.5 · 속도 +10%',  bm: { b: 'windy', x: 1.5 }, speed: .1, cost: { feather: 12, '@breeze': 6 } },
  sandglass:{ n: '모래 시계',   c: '#ffcf6a', ic: 'sandglass', d: '굴림 속도 +20%',          speed: .2,            cost: { sunglass: 10, '@dust': 10 } },
  moonstone:{ n: '월장석',      c: '#dfe6ff', ic: 'moon',   d: '밤에 행운 ×1.6',              night: 1.6,           cost: { starfrag: 8, '@moonlight': 1 } },
  sakura:   { n: '벚꽃 머리핀', c: '#ffb0d4', ic: 'petal',  d: '벚꽃비 행운 ×1.5 · 빛나는 확률 2배', bm: { b: 'sakura', x: 1.5 }, shiny: 2, cost: { blossom: 12, '@petal': 4 } },
  magnet:   { n: '재료 자석',   c: '#ff8a9a', ic: 'magnet', d: '재료 획득 확률 ×2',           mat: 2,               cost: { glim: 30, byte: 3 } },
  hellhorn: { n: '악마의 뿔',   c: '#ff5a2a', ic: 'horn',   d: '지옥 행운 ×1.6 · 샤드 +50%',  bm: { b: 'hell', x: 1.6 }, coin: .5, cost: { ember: 15, '@cinder': 8 } },
  voideye:  { n: '공허의 눈',   c: '#9a6cff', ic: 'eye',    d: '배수 보너스가 8번마다',       every: 8,             cost: { voiddust: 25, '@hollow': 1 } },
};

/* 떠돌이 상인 */
const SHOP_POOL = [
  { k: 'pot', id: 'lucky', n: 1, p: 120 }, { k: 'pot', id: 'swift', n: 1, p: 100 }, { k: 'pot', id: 'fortune', n: 1, p: 450 },
  { k: 'pot', id: 'haste', n: 1, p: 380 }, { k: 'pot', id: 'starlit', n: 1, p: 1600 }, { k: 'pot', id: 'compass', n: 1, p: 500 },
  { k: 'pot', id: 'glitchkey', n: 1, p: 2400 }, { k: 'pot', id: 'dice', n: 1, p: 260 }, { k: 'pot', id: 'voidelixir', n: 1, p: 9000 },
  { k: 'mat', id: 'glim', n: 10, p: 90 }, { k: 'mat', id: 'feather', n: 5, p: 140 }, { k: 'mat', id: 'pearl', n: 5, p: 140 },
  { k: 'mat', id: 'frost', n: 5, p: 140 }, { k: 'mat', id: 'sunglass', n: 5, p: 160 }, { k: 'mat', id: 'starfrag', n: 3, p: 260 },
  { k: 'mat', id: 'ember', n: 4, p: 280 }, { k: 'mat', id: 'blossom', n: 4, p: 220 }, { k: 'mat', id: 'byte', n: 2, p: 600 }, { k: 'mat', id: 'voiddust', n: 5, p: 900 },
];
POTIONS.dice = { n: '행운 주사위', c: '#ffffff', d: '다음 1회 굴림 행운 ×25', eff: { next: 25 }, cost: { coin: 200 } };
POTIONS.shinydust = { n: '빛나는 가루', c: '#ffe9ff', d: '3분간 빛나는 확률 ×3', eff: { shiny: 3, t: 180 }, cost: { blossom: 4, starfrag: 2, glim: 10 } };

/* 출석 보상 (7일 주기) */
const DAILY = [
  { coin: 100, pots: { lucky: 1 } }, { coin: 150, pots: { swift: 2 } }, { coin: 200, mats: { glim: 15 } },
  { coin: 300, pots: { fortune: 1 } }, { coin: 400, pots: { compass: 1 } }, { coin: 500, pots: { dice: 3 } },
  { coin: 1000, pots: { starlit: 1, shinydust: 1 } },
];

/* 낮/밤: 12분 주기, 마지막 4분 48초가 밤 */
const DAY_CYCLE = 720;
function dayPhase() { return (Date.now() / 1000 % DAY_CYCLE) / DAY_CYCLE; }
function isNight() { return dayPhase() >= .6; }
function dayLeft() { const p = dayPhase(); return (p < .6 ? .6 - p : 1 - p) * DAY_CYCLE; }

QUESTS.push(
  { id: 'r50k',  n: '공허를 굴리는 자', d: '50,000번 굴리기', goal: S => [S.rolls, 50000], rw: { pots: { voidelixir: 3 }, coin: 20000 } },
  { id: 'sh1',   n: '반짝이는 것',   d: '빛나는 오라 1개 획득', goal: S => [Object.keys(S.shiny).length, 1], rw: { coin: 500, pots: { shinydust: 1 } } },
  { id: 'sh10',  n: '빛의 수집가',   d: '빛나는 오라 10종',     goal: S => [Object.keys(S.shiny).length, 10], rw: { coin: 3000, pots: { starlit: 2 } } },
  { id: 'f1',    n: '첫 융합',       d: '융합 오라 1종 만들기', goal: S => [AURAS.filter(a => a.fusion && S.found[a.id]).length, 1], rw: { coin: 800, pots: { fortune: 2 } } },
  { id: 'f4',    n: '연금의 정점',   d: '융합 오라 4종',        goal: S => [AURAS.filter(a => a.fusion && S.found[a.id]).length, 4], rw: { pots: { voidelixir: 2 } } },
  { id: 'ch2',   n: '부적 두 개',    d: '부적 2개 제작',        goal: S => [Object.keys(S.charms).length, 2], rw: { coin: 600 } },
  { id: 'ev5',   n: '별똥별 사냥꾼', d: '별똥별 5번 잡기',      goal: S => [S.stats.stars, 5], rw: { coin: 400, pots: { dice: 2 } } },
  { id: 'nt1',   n: '밤의 손님',     d: '밤 한정 오라 획득',    goal: S => [AURAS.filter(a => a.night && S.found[a.id]).length, 1], rw: { coin: 600, pots: { starlit: 1 } } },
  { id: 'mer3',  n: '단골손님',      d: '상인에게 3번 구매',    goal: S => [S.stats.buys, 3], rw: { coin: 300 } },
  { id: 'c75',   n: '살아있는 백과', d: '오라 75종 발견',       goal: S => [found(S), 75], rw: { pots: { voidelixir: 4 }, coin: 10000 } },
  { id: 't7',    n: '영광',          d: '글로리어스 등급 획득', goal: S => [bestTier(S) >= 7 ? 1 : 0, 1], rw: { pots: { voidelixir: 5 }, coin: 30000 } },
  { id: 'm1',    n: '첫 통달',       d: '등급 또는 날씨 하나 완성 (마스터리)', goal: S => [masteryList(S).filter(m => m.done).length, 1], rw: { coin: 1000 } },
);

NPCS.jorr = { n: '조르', role: '떠돌이 상인', lines: ['어서 오게! 이번엔 오래 못 있어. 골라, 골라!', '샤드만 있으면 뭐든 팔지. 영혼은 빼고. 아마도.', '다음엔 어디로 갈지 나도 몰라. 바람이 정하지.'] };
NPCS.lumen = { n: '루멘', role: '융합의 정령', lines: ['둘이 하나가 되면, 하나는 더 이상 혼자가 아니야.', '굴려서는 절대 나오지 않는 오라들이 있어. 여기서만.', '재료가 된 오라들은 사라지지 않아. 새 빛 안에 남지.'] };

/* 마스터리: 등급(날씨 한정·융합·낮밤 제외) 또는 날씨 한정을 모두 모으면 영구 행운 +5% */
function masteryList(S) {
  const out = [];
  for (let t = 0; t < TIERS.length; t++) {
    const l = AURAS.filter(a => !a.biome && !a.fusion && !a.day && !a.night && !a.summer && !a.summerRoll && !a.mg && tierOf(a.r) === t);
    if (l.length) out.push({ k: 't' + t, n: TIERS[t].n, c: TIERS[t].c, have: l.filter(a => S.found[a.id]).length, all: l.length });
  }
  for (const b in BIOMES) {
    const l = AURAS.filter(a => a.biome === b); if (!l.length) continue;
    out.push({ k: 'b' + b, n: BIOMES[b].n + ' 한정', c: BIOMES[b].c, have: l.filter(a => S.found[a.id]).length, all: l.length });
  }
  out.forEach(m => m.done = m.have >= m.all);
  return out;
}


/* ════════ 성장 · 보상 ════════ */
const xpNeed = lv => Math.round(25 + lv * 18 + lv * lv * 1.2);
const XP_TIER = [1, 3, 8, 18, 35, 60, 100, 160, 250];
function lvReward(lv) {
  const r = { coin: 40 + lv * 30 };
  if (lv % 3 === 0) r.pots = { lucky: 1 };
  if (lv % 5 === 0) r.pots = Object.assign(r.pots || {}, { fortune: 1, dice: 2 });
  if (lv % 10 === 0) r.pots = Object.assign(r.pots || {}, { starlit: 1 });
  if (lv % 25 === 0) r.pots = Object.assign(r.pots || {}, { voidelixir: 1 });
  return r;
}
const DESTINY_MAX = 100;
const CHEST = {
  wood:   { n: '나무 상자', c: '#c88a4a', c2: '#7a4a1a', glow: '#ffcf8a', w: 75 },
  silver: { n: '은 상자',   c: '#d8e4f0', c2: '#6a7a9a', glow: '#bfe4ff', w: 21 },
  gold:   { n: '황금 상자', c: '#ffd36a', c2: '#a8661a', glow: '#fff0a8', w: 4 },
};
