'use strict';

/* ============================================================
   Ruleset bootstrap — switches between Hong Kong Old Style and Singapore
   ============================================================ */

const VALID_RULESETS = ['hk', 'sg'];
const RULESET_STORAGE = 'mj-ruleset';

function getStoredRuleset() {
  try {
    const v = localStorage.getItem(RULESET_STORAGE);
    if (VALID_RULESETS.includes(v)) return v;
  } catch {}
  return 'hk';
}

const RULESET = getStoredRuleset();
const IS_SG = RULESET === 'sg';
const IS_HK = RULESET === 'hk';
const UNIT = IS_SG ? 'tai' : 'faan';
const UNIT_CAP = IS_SG ? 'Tai' : 'Faan';
const MIN_TO_WIN = IS_SG ? 1 : 3;

function setRuleset(name) {
  if (!VALID_RULESETS.includes(name)) return;
  try { localStorage.setItem(RULESET_STORAGE, name); } catch {}
  location.reload();
}

/* Per-ruleset text shown in the UI (filled by applyRulesetText on boot). */
const RS_TEXT = {
  hk: {
    kicker: 'Hong Kong rules · 香港麻將',
    tilecount: '144',
    min: '3',
    unit: 'faan',
    unitcap: 'Faan',
    variantName: 'Hong Kong Old Style',
    scoringLede: 'Hong Kong counts in <em>faan</em> (番), where each one doubles the payout. You usually need <strong>≥3 faan</strong> before a hand can be declared, and patterns add together — one hand can tick several boxes. Reach about 10 faan and most tables cap it as a "limit" hand.',
    minSentence: 'usually 3 faan. Check first, though — easygoing tables drop it to 1, stricter ones push it to 5.',
    bonusReveal: 'Got a <em>flower</em> or <em>season</em>? Flip it face-up and pull a fresh tile from the tail of the wall (the "dead wall"). Keep going until nobody is holding a bonus tile.',
    bonusNote: 'It works the same mid-game: the moment you draw a flower, show it and replace it from the dead wall.',
  },
  sg: {
    kicker: 'Singapore rules · 新加坡麻將',
    tilecount: '148',
    min: '1',
    unit: 'tai',
    unitcap: 'Tai',
    variantName: 'Singapore Style',
    scoringLede: 'Singapore counts in <em>tai</em> (台), each one doubling the payout. The bar to declare is low — usually just <strong>≥1 tai</strong> — and patterns add up, but the total is normally capped at 5 tai, with anything bigger paying the same. Singapore also throws in <em>animal tiles</em> (cat, rat, rooster, centipede), each good for 1 tai.',
    minSentence: 'usually just 1 tai — Singapore is friendly that way — though winnings are typically capped at 5 tai.',
    bonusReveal: 'Holding a <em>flower</em>, <em>season</em> or <em>animal</em>? Flip it face-up and draw a fresh tile from the tail of the wall (the "dead wall"). Repeat until no one is holding a bonus. Animals behave like flowers — they rest beside your hand and never go into sets.',
    bonusNote: 'Same during play: a flower or animal you draw goes face-up at once and is replaced from the dead wall. Animals pay win or lose, and snagging both halves of a hunter-and-hunted pair (cat–rat or rooster–centipede) settles up immediately.',
  },
};

function applyRulesetText() {
  const t = RS_TEXT[RULESET];
  for (const key in t) {
    document.querySelectorAll(`[data-rs="${key}"]`).forEach(el => {
      el.innerHTML = t[key];
    });
  }
  // Mark the active ruleset button.
  document.querySelectorAll('[data-set-ruleset]').forEach(b => {
    b.classList.toggle('is-active', b.dataset.setRuleset === RULESET);
    b.addEventListener('click', () => setRuleset(b.dataset.setRuleset));
  });
}

/* ============================================================
   Tile data — HKOS standard + Singapore animals when ruleset = sg
   ============================================================ */

const SUIT = {
  DOTS: 'dots', BAM: 'bamboo', CHAR: 'chars',
  WIND: 'wind', DRAGON: 'dragon',
  FLOWER: 'flower', SEASON: 'season',
  ANIMAL: 'animal',
};

const NUM_EN = ['One','Two','Three','Four','Five','Six','Seven','Eight','Nine'];
const NUM_PY = ['yī','èr','sān','sì','wǔ','liù','qī','bā','jiǔ'];

const TILES = (() => {
  const out = [];
  const gDots = ['🀙','🀚','🀛','🀜','🀝','🀞','🀟','🀠','🀡'];
  const gBam  = ['🀐','🀑','🀒','🀓','🀔','🀕','🀖','🀗','🀘'];
  const gChar = ['🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏'];
  for (let i = 1; i <= 9; i++) {
    out.push({ id:'d'+i, suit:SUIT.DOTS, group:'suit', value:i, glyph:gDots[i-1],
      name: NUM_EN[i-1]+' of Dots', zh:i+'筒', pinyin:NUM_PY[i-1]+' tǒng',
      isTerminal: i===1||i===9 });
    out.push({ id:'b'+i, suit:SUIT.BAM, group:'suit', value:i, glyph:gBam[i-1],
      name: NUM_EN[i-1]+' of Bamboo', zh:i+'條', pinyin:NUM_PY[i-1]+' tiáo',
      isTerminal: i===1||i===9 });
    out.push({ id:'c'+i, suit:SUIT.CHAR, group:'suit', value:i, glyph:gChar[i-1],
      name: NUM_EN[i-1]+' of Characters', zh:i+'萬', pinyin:NUM_PY[i-1]+' wàn',
      isTerminal: i===1||i===9 });
  }
  // Winds render as framed Chinese characters (東 南 西 北) rather than the
  // tiny Unicode mahjong-tile glyphs — cleaner and more consistent.
  [['we','East','東','dōng'],
   ['ws','South','南','nán'],
   ['ww','West','西','xī'],
   ['wn','North','北','běi']].forEach(([id,en,zh,py]) => {
    out.push({ id, suit:SUIT.WIND, group:'honor', value:id[1], glyph:zh,
      name: en+' Wind', zh, pinyin:py, isHonor:true });
  });
  // Dragons render as framed Chinese characters (中 發 白) like the winds.
  [['dr','Red Dragon','中','zhōng','r'],
   ['dg','Green Dragon','發','fā','g'],
   ['dw','White Dragon','白','bái','w']].forEach(([id,en,zh,py,col]) => {
    out.push({ id, suit:SUIT.DRAGON, group:'honor', value:id[1], glyph:zh, dragonColor:col,
      name: en, zh, pinyin:py, isHonor:true });
  });
  [['f1','Plum','梅','méi','🀦'],
   ['f2','Orchid','蘭','lán','🀧'],
   ['f3','Chrysanthemum','菊','jú','🀨'],
   ['f4','Bamboo Flower','竹','zhú','🀩']].forEach(([id,en,zh,py,gl]) => {
    out.push({ id, suit:SUIT.FLOWER, group:'bonus', value:+id[1], glyph:gl,
      name:en, zh, pinyin:py, isBonus:true });
  });
  [['s1','Spring','春','chūn','🀢'],
   ['s2','Summer','夏','xià','🀣'],
   ['s3','Autumn','秋','qiū','🀤'],
   ['s4','Winter','冬','dōng','🀥']].forEach(([id,en,zh,py,gl]) => {
    out.push({ id, suit:SUIT.SEASON, group:'bonus', value:+id[1], glyph:gl,
      name:en, zh, pinyin:py, isBonus:true });
  });

  // Singapore-only — four animal bonus tiles.
  // Predator-prey pairs: cat ↔ rat, rooster ↔ centipede.
  if (IS_SG) {
    [['x1','Cat',      '貓',   'māo',   '貓', 'mouse'],
     ['x2','Rat',      '鼠',   'shǔ',   '鼠', 'cat'],
     ['x3','Rooster',  '雞',   'jī',    '雞', 'centipede'],
     ['x4','Centipede','蜈蚣', 'wú gōng','蜈', 'rooster']].forEach(([id,en,zh,py,gl,prey]) => {
      out.push({ id, suit: SUIT.ANIMAL, group: 'animal', value: +id[1], glyph: gl,
        name: en, zh, pinyin: py, isAnimal: true, isBonus: true, pairWith: prey });
    });
  }

  return out;
})();

const TILE_BY_ID = Object.fromEntries(TILES.map(t => [t.id, t]));

/* ============================================================
   Tile rendering — paper card w/ double frame
   ============================================================ */

function renderTile(idOrTile, opts = {}) {
  const t = typeof idOrTile === 'string' ? TILE_BY_ID[idOrTile] : idOrTile;
  if (!t) return document.createTextNode('');
  const el = document.createElement(opts.button === false ? 'span' : 'button');
  if (el.tagName === 'BUTTON') el.type = 'button';
  let cls = 'mj-tile mj-tile--' + t.suit;
  if (t.suit === SUIT.DRAGON) cls += ' mj-tile--dragon-' + t.dragonColor;
  if (opts.size === 'sm') cls += ' mj-tile--sm';
  if (opts.size === 'xs') cls += ' mj-tile--xs';
  if (opts.size === 'lg') cls += ' mj-tile--lg';
  el.className = cls;
  el.setAttribute('aria-label', t.name);
  el.dataset.tileId = t.id;
  // Winds and dragons are drawn as proper SVG tile faces (the number suits
  // come from Unicode tile glyphs); everything else uses its glyph.
  if (t.suit === SUIT.WIND || t.suit === SUIT.DRAGON) {
    el.innerHTML = honorTileSVG(t);
  } else {
    el.innerHTML = `<span class="mj-tile-glyph" aria-hidden="true">${t.glyph}</span>`;
  }
  if (opts.onClick) el.addEventListener('click', () => opts.onClick(t, el));
  if (opts.button === false) el.style.cursor = 'default';
  return el;
}

/* A clean, engraved SVG tile face for the honour tiles (winds + dragons).
   Ivory face + soft top highlight + the character carved in bold, in its
   traditional colour. Fills the .mj-tile container, which supplies the
   shared drop-shadow — so honours read as real tiles, like the number suits. */
const SVG_CJK_FONT = "'Songti SC','Source Han Serif SC','Noto Serif CJK SC','SimSun','Songti TC','MingLiU',serif";
const HONOR_INK = {
  we: '#23302c', ws: '#23302c', ww: '#23302c', wn: '#23302c',  // winds — ink
  dr: '#b23a2c',  // red dragon
  dg: '#2f6e54',  // green dragon
  dw: '#3f6075',  // white dragon — slate blue (nods to the classic blue frame)
};
function honorTileSVG(t) {
  const fill = HONOR_INK[t.id] || '#23302c';
  const ch = t.zh;
  return `<svg class="mj-tile-svg" viewBox="0 0 100 130" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="1.75" y="1.75" width="96.5" height="126.5" rx="13" fill="#fbfaf6" stroke="#cdc8b8" stroke-width="1.5"/>
  <rect x="6" y="6" width="88" height="30" rx="9" fill="#ffffff" opacity="0.45"/>
  <text x="51.5" y="95" text-anchor="middle" font-family="${SVG_CJK_FONT}" font-weight="700" font-size="76" fill="rgba(31,28,24,0.15)">${ch}</text>
  <text x="50" y="93" text-anchor="middle" font-family="${SVG_CJK_FONT}" font-weight="700" font-size="76" fill="${fill}">${ch}</text>
</svg>`;
}

function renderTileRow(tileIds, opts = {}) {
  const wrap = document.createElement('span');
  wrap.style.display = 'inline-flex';
  wrap.style.gap = (opts.gap ?? 3) + 'px';
  tileIds.forEach(id => wrap.appendChild(renderTile(id, { ...opts, button: false })));
  return wrap;
}

/* ============================================================
   Hand logic — winning hand validator
   ============================================================ */

function tileCode(id) {
  // Honors first — dragons (dr/dg/dw) start with 'd' and must NOT fall into
  // the dots branch below. Animals (x1..x4) are bonus tiles → return -1.
  const honors = { we:27, ws:28, ww:29, wn:30, dr:31, dg:32, dw:33 };
  if (id in honors) return honors[id];
  if (id[0] === 'd') return +id.slice(1) - 1;
  if (id[0] === 'b') return 9 + +id.slice(1) - 1;
  if (id[0] === 'c') return 18 + +id.slice(1) - 1;
  return -1;
}
function codeToId(c) {
  if (c < 9)  return 'd'+(c+1);
  if (c < 18) return 'b'+(c-9+1);
  if (c < 27) return 'c'+(c-18+1);
  return ['we','ws','ww','wn','dr','dg','dw'][c-27];
}
function handToCounts(ids) {
  const c = new Array(34).fill(0);
  ids.forEach(id => { const k = tileCode(id); if (k >= 0) c[k]++; });
  return c;
}
function canFormSets(counts, left) {
  if (left === 0) return counts.every(c => c === 0);
  let i = 0; while (i < 34 && counts[i] === 0) i++;
  if (i === 34) return false;
  if (counts[i] >= 3) {
    counts[i] -= 3;
    if (canFormSets(counts, left - 1)) { counts[i] += 3; return true; }
    counts[i] += 3;
  }
  if (i < 27 && (i % 9) <= 6 && counts[i+1] > 0 && counts[i+2] > 0) {
    counts[i]--; counts[i+1]--; counts[i+2]--;
    if (canFormSets(counts, left - 1)) {
      counts[i]++; counts[i+1]++; counts[i+2]++;
      return true;
    }
    counts[i]++; counts[i+1]++; counts[i+2]++;
  }
  return false;
}
function isThirteenOrphans(ids) {
  const required = ['d1','d9','b1','b9','c1','c9','we','ws','ww','wn','dr','dg','dw'];
  if (ids.length !== 14) return false;
  const c = {};
  ids.forEach(id => { c[id] = (c[id]||0)+1; });
  let pair = false;
  for (const r of required) {
    if (!c[r]) return false;
    if (c[r] === 2) { if (pair) return false; pair = true; }
    else if (c[r] !== 1) return false;
  }
  for (const k of Object.keys(c)) if (!required.includes(k)) return false;
  return pair;
}
function isWinningHand(ids) {
  if (ids.length !== 14) return false;
  if (isThirteenOrphans(ids)) return true;
  const c = handToCounts(ids);
  for (let i = 0; i < 34; i++) {
    if (c[i] >= 2) {
      c[i] -= 2;
      if (canFormSets(c.slice(), 4)) { c[i] += 2; return true; }
      c[i] += 2;
    }
  }
  return false;
}
function findWaits(ids) {
  if (ids.length !== 13) return [];
  const waits = [];
  for (let i = 0; i < 34; i++) {
    const id = codeToId(i);
    const inHand = ids.filter(t => t === id).length;
    if (inHand >= 4) continue;
    if (isWinningHand([...ids, id])) waits.push(id);
  }
  return waits;
}

/* Decompose a 14-tile winning hand into its melds + pair, returning tile IDs.
   Shape: { pair: [id, id], sets: [[id,id,id], ...] } or null if it doesn't win.
   Used by computeFaan (scoring) and decomposeWinDisplay (Win-or-not drill). */
function decomposeWin(ids) {
  if (ids.length !== 14) return null;
  const counts = handToCounts(ids);
  for (let p = 0; p < 34; p++) {
    if (counts[p] >= 2) {
      counts[p] -= 2;
      const sets = [];
      if (collectSets(counts.slice(), 4, sets)) {
        return {
          pair: [codeToId(p), codeToId(p)],
          sets: sets.map(set => set.map(codeToId)),
        };
      }
      counts[p] += 2;
    }
  }
  return null;
}

/* Backtracking helper for decomposeWin — records the chosen melds (as codes). */
function collectSets(counts, left, out) {
  if (left === 0) return counts.every(c => c === 0);
  let i = 0; while (i < 34 && counts[i] === 0) i++;
  if (i === 34) return false;
  // pung
  if (counts[i] >= 3) {
    counts[i] -= 3;
    out.push([i, i, i]);
    if (collectSets(counts, left - 1, out)) return true;
    out.pop();
    counts[i] += 3;
  }
  // chow — suit tiles only (i < 27), rank 1..7 within the suit (i % 9 <= 6)
  if (i < 27 && (i % 9) <= 6 && counts[i + 1] > 0 && counts[i + 2] > 0) {
    counts[i]--; counts[i + 1]--; counts[i + 2]--;
    out.push([i, i + 1, i + 2]);
    if (collectSets(counts, left - 1, out)) return true;
    out.pop();
    counts[i]++; counts[i + 1]++; counts[i + 2]++;
  }
  return false;
}

/* ============================================================
   Sidenav active highlight + mobile menu
   (Single theme — no theme switcher. Ruleset switching lives in
   applyRulesetText / setRuleset near the top of the file.)
   ============================================================ */

function initNav() {
  const links = document.querySelectorAll('.mj-nav a, .mj-nav-mobile a');
  links.forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const tgt = document.querySelector(href);
    if (!tgt) return;
    e.preventDefault();
    tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', href);
    const tb = document.querySelector('.mj-topbar-mobile');
    if (tb) tb.classList.remove('is-open');
    updateMenuBtn(a.textContent.trim());
  }));
  const sections = document.querySelectorAll('section[id]');
  const byId = new Map();
  links.forEach(a => {
    const h = a.getAttribute('href');
    if (h && h.startsWith('#')) byId.set(h.slice(1), (byId.get(h.slice(1)) || []).concat(a));
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('is-active'));
        const ls = byId.get(e.target.id) || [];
        ls.forEach(l => l.classList.add('is-active'));
        const first = ls[0];
        if (first) updateMenuBtn(first.textContent.trim());
      }
    });
  }, { rootMargin: '-40% 0% -55% 0%', threshold: 0 });
  sections.forEach(s => io.observe(s));
  // Mobile toggle
  const tb = document.querySelector('.mj-topbar-mobile');
  const btn = document.querySelector('.mj-menu-btn');
  if (btn && tb) btn.addEventListener('click', () => tb.classList.toggle('is-open'));
}
function updateMenuBtn(label) {
  const el = document.querySelector('.mj-menu-btn-label');
  if (el) el.textContent = label;
}

/* ============================================================
   01 — Tile explorer (suit rows + sticky info card + pills filter)
   ============================================================ */

const SUIT_META = {
  [SUIT.DOTS]:    { title:'Dots',       zh:'筒 · tǒng',     desc:'Rings of dots that you simply count, one through nine. They run and pair up just like the other two number suits.', count:'9 unique · 4 of each · 36 total' },
  [SUIT.BAM]:     { title:'Bamboo',     zh:'條 · tiáo',     desc:'Bundles of bamboo sticks. The lone "1" is drawn as a bird — odd at first, but it makes the tile impossible to mistake.', count:'9 unique · 4 of each · 36 total' },
  [SUIT.CHAR]:    { title:'Characters', zh:'萬 · wàn',      desc:'A number stacked over 萬, meaning ten-thousand. The wordiest suit, so it pays to get friendly with one through nine early.', count:'9 unique · 4 of each · 36 total' },
  [SUIT.WIND]:    { title:'Winds',      zh:'風 · fēng',     desc:'East, South, West and North. A triplet of your own seat-wind or the table\'s round-wind earns points; on their own they never make a run.', count:'4 unique · 4 of each · 16 total' },
  [SUIT.DRAGON]:  { title:'Dragons',    zh:'箭 · jiàn',     desc:'Red 中, Green 發 and White 白. Collect three of any one for a scoring triplet — gather all three triplets and you have the famous Great Dragons.', count:'3 unique · 4 of each · 12 total' },
  [SUIT.FLOWER]:  { title:'Flowers',    zh:'花 · huā',      desc:'Plum, Orchid, Chrysanthemum and Bamboo. You never play these — draw one, lay it aside, take a replacement, and pocket a little bonus.', count:'4 unique · 1 of each · 4 total' },
  [SUIT.SEASON]:  { title:'Seasons',    zh:'季 · jì',       desc:'Spring, Summer, Autumn and Winter, tied to the seats (E, S, W, N in turn). The one matching your seat is worth a touch more.', count:'4 unique · 1 of each · 4 total' },
  [SUIT.ANIMAL]:  { title:'Animals',    zh:'動物 · dòngwù', desc:'A Singapore extra: Cat 貓, Rat 鼠, Rooster 雞 and Centipede 蜈蚣. Any animal you hold is worth 1 tai, and catching both halves of a hunter-and-hunted pair (cat–rat or rooster–centipede) pays out on the spot.', count:'4 unique · 1 of each · 4 total' },
};

const FILTER_GROUPS = [
  { id:'all',    label:'All tiles', test:t => true },
  { id:'suit',   label:'Suits',     test:t => t.group === 'suit' },
  { id:'honor',  label:'Honors',    test:t => t.group === 'honor' },
  { id:'bonus',  label:'Bonus',     test:t => t.group === 'bonus' },
  ...(IS_SG ? [{ id:'animal', label:'Animals', test:t => t.group === 'animal' }] : []),
];

function initTileExplorer() {
  const pillHost = document.querySelector('#tile-pills');
  const gridHost = document.querySelector('#tile-grid');
  if (!pillHost || !gridHost) return;

  let active = 'all';

  function render() {
    pillHost.innerHTML = '';
    FILTER_GROUPS.forEach(f => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mj-pill' + (active === f.id ? ' is-active' : '');
      const count = TILES.filter(f.test).length;
      pill.innerHTML = `${f.label}<span class="mj-pill-count">${count}</span>`;
      pill.addEventListener('click', () => { active = f.id; render(); });
      pillHost.appendChild(pill);
    });

    gridHost.innerHTML = '';
    const filter = FILTER_GROUPS.find(f => f.id === active).test;
    const orderedSuits = [SUIT.DOTS, SUIT.BAM, SUIT.CHAR, SUIT.WIND, SUIT.DRAGON, SUIT.FLOWER, SUIT.SEASON, ...(IS_SG ? [SUIT.ANIMAL] : [])];
    orderedSuits.forEach(s => {
      const tiles = TILES.filter(t => t.suit === s && filter(t));
      if (!tiles.length) return;
      const meta = SUIT_META[s];
      const row = document.createElement('div');
      row.className = 'mj-suit-row';
      const isHonor = (s === SUIT.WIND || s === SUIT.DRAGON || s === SUIT.FLOWER || s === SUIT.SEASON);
      row.innerHTML = `
        <div>
          <div class="mj-suit-title">${meta.title}</div>
          <div class="mj-suit-sub">${meta.zh}</div>
          <div class="mj-suit-desc">${meta.desc}</div>
          <div class="mj-suit-count">${meta.count}</div>
        </div>
        <div class="mj-suit-tiles ${isHonor ? 'mj-suit-tiles-honors' : ''}"></div>
      `;
      const tilesHost = row.querySelector('.mj-suit-tiles');
      tiles.forEach(t => tilesHost.appendChild(renderTile(t, { onClick: showTileInfo })));
      gridHost.appendChild(row);
    });
  }

  render();
}

function showTileInfo(tile, btn) {
  document.querySelectorAll('.mj-tile.is-selected').forEach(el => el.classList.remove('is-selected'));
  if (btn) btn.classList.add('is-selected');
  const card = document.querySelector('#tile-info');
  if (!card) return;
  card.innerHTML = `
    <div class="mj-info-big" id="info-big"></div>
    <div class="mj-info-zh">${tile.zh}</div>
    <div class="mj-info-pinyin">${tile.pinyin}</div>
    <div class="mj-info-en">${tile.name}</div>
    <div class="mj-info-meta">${describeTileRole(tile)}</div>
  `;
  card.querySelector('#info-big').appendChild(renderTile(tile.id, { size: 'lg', button: false }));
  wrapTermsIn(card);
}

function describeTileRole(t) {
  const unit = IS_SG ? 'tai' : 'faan';
  if (t.isAnimal) {
    return `Singapore animal tile. Each animal you hold at the end of a round is worth 1 ${unit}. It pairs with ${t.pairWith === 'mouse' ? 'the Rat' : t.pairWith === 'cat' ? 'the Cat' : t.pairWith === 'centipede' ? 'the Centipede' : 'the Rooster'} — when one player holds both halves of a predator-prey pair, an immediate payout triggers from the others.`;
  }
  if (t.isBonus) return 'A bonus tile — it never joins your hand. Draw it, flip it face-up to one side, pull a replacement from the dead wall, and collect a few points at the end.';
  if (t.suit === SUIT.WIND) return `An honour tile. Three of your seat-wind or of the round-wind is worth 1 ${unit} apiece — line up both for 2. It can never sit in a run.`;
  if (t.suit === SUIT.DRAGON) return `An honour tile. Any dragon triplet is worth 1 ${unit}; land all three and you've hit the storied Great Three Dragons. Dragons never form runs.`;
  if (t.isTerminal) return 'A terminal — a 1 or a 9. It can only join a run from one side, but it\'s prized in special hands like the Thirteen Orphans.';
  return 'An ordinary number tile. It slots happily into runs such as ' + t.value + '-' + (t.value+1) + '-' + (t.value+2) + ' or into triplets.';
}

/* ============================================================
   02 — Hand accordion + stage
   ============================================================ */

/* Hand examples. Each entry has both HK (`pts`) and SG (`ptsSG`) values —
   selectHandPts() picks the right one at render time based on the ruleset. */
const HANDS = [
  {
    id:'common', zh:'平糊', name:'Common Hand', pts:'1 faan', ptsSG:'1 tai',
    desc:'The simplest scoring shape. Every set is a chow and the pair is non-scoring (not your seat wind, round wind, or a dragon).',
    sets: [['d2','d3','d4'], ['b3','b4','b5'], ['c6','c7','c8'], ['d7','d8','d9']],
    pair: ['b2','b2'],
    formula:'4 chows · pair'
  },
  {
    id:'allpung', zh:'對對糊', name:'All Pungs', pts:'3 faan', ptsSG:'2 tai',
    desc:'Every set is a pung (or kong). No chows. The most common "real" scoring hand for beginners — the patterns are simpler to spot.',
    sets: [['d3','d3','d3'], ['b6','b6','b6'], ['c2','c2','c2'], ['we','we','we']],
    pair: ['dr','dr'],
    formula:'4 pungs · pair'
  },
  {
    id:'mixed', zh:'混一色', name:'Mixed One Suit', pts:'3 faan', ptsSG:'2 tai',
    desc:'A single number suit plus any honors. Easier to assemble than Pure One Suit — honors give you flexibility.',
    sets: [['b1','b2','b3'], ['b4','b5','b6'], ['b7','b7','b7'], ['we','we','we']],
    pair: ['dr','dr'],
    formula:'1 suit + honors'
  },
  {
    id:'pure', zh:'清一色', name:'Pure One Suit', pts:'7 faan', ptsSG:'4 tai',
    desc:'One suit only. No honors, no other suits. Hard to build — opponents see it coming — but pays big.',
    sets: [['c1','c2','c3'], ['c4','c5','c6'], ['c7','c8','c9'], ['c2','c3','c4']],
    pair: ['c5','c5'],
    formula:'1 suit, no honors'
  },
  {
    id:'small3', zh:'小三元', name:'Small Three Dragons', pts:'3 faan', ptsSG:'2 tai',
    desc:'Pungs of two dragons plus a pair of the third. The pair has to be the dragons — not just any pair.',
    sets: [['dr','dr','dr'], ['dg','dg','dg'], ['d2','d3','d4'], ['b6','b6','b6']],
    pair: ['dw','dw'],
    formula:'2 dragon pungs · dragon pair'
  },
  {
    id:'great3', zh:'大三元', name:'Great Three Dragons', pts:'8 faan', ptsSG:'4 tai',
    desc:'Pungs of all three dragons. The pair is anything else. A showcase hand — Singapore usually treats it as pay-all from the discarder.',
    sets: [['dr','dr','dr'], ['dg','dg','dg'], ['dw','dw','dw'], ['d3','d4','d5']],
    pair: ['b7','b7'],
    formula:'3 dragon pungs · pair'
  },
  {
    id:'honors', zh:'字一色', name:'All Honors', pts:'10 faan', ptsSG:'limit',
    desc:'Every tile is a wind or a dragon. No numbered suit tiles at all. Rare. Pays a limit hand at most tables.',
    sets: [['we','we','we'], ['ws','ws','ws'], ['dr','dr','dr'], ['dg','dg','dg']],
    pair: ['dw','dw'],
    formula:'honors only'
  },
  {
    id:'thirteen', zh:'十三么', name:'Thirteen Orphans', pts:'13 faan', ptsSG:'8 tai',
    desc:'One of every terminal (1 and 9 of each suit) and every honor, plus any one of them as a pair. The famous exception to "4 sets + pair".',
    flat: ['d1','d9','b1','b9','c1','c9','we','ws','ww','wn','dr','dg','dw','dw'],
    formula:'special — see flat layout'
  },
];

function handPts(h) {
  return IS_SG ? (h.ptsSG || h.pts) : h.pts;
}

function initHands() {
  const host = document.querySelector('#hand-accordion');
  const stageHost = document.querySelector('#hand-stage');
  if (!host || !stageHost) return;

  HANDS.forEach((h, idx) => {
    const item = document.createElement('div');
    item.className = 'mj-acc-item' + (idx === 0 ? ' is-open' : '');
    item.dataset.hand = h.id;
    item.innerHTML = `
      <button type="button" class="mj-acc-row">
        <span class="mj-hlist-zh">${h.zh}</span>
        <span class="mj-hlist-name">${h.name}</span>
        <span class="mj-hlist-pts">${handPts(h)}</span>
      </button>
      <div class="mj-acc-body" hidden>
        <div class="mj-acc-body-head">
          <div class="mj-acc-desc">${h.desc}</div>
        </div>
      </div>
    `;
    item.querySelector('.mj-acc-row').addEventListener('click', () => selectHand(h.id));
    host.appendChild(item);
  });
  selectHand(HANDS[0].id);
}

function selectHand(id) {
  const hand = HANDS.find(h => h.id === id);
  if (!hand) return;
  document.querySelectorAll('#hand-accordion .mj-acc-item').forEach(it => {
    const open = it.dataset.hand === id;
    it.classList.toggle('is-open', open);
    const body = it.querySelector('.mj-acc-body');
    if (body) body.hidden = !open;
  });
  renderHandStage(hand);
}

/* Classify a set of tile-ids into chow/pung/kong/invalid */
function classifySet(tiles) {
  if (tiles.length === 4 && tiles.every(t => t === tiles[0])) return 'kong';
  if (tiles.length === 3 && tiles[0] === tiles[1] && tiles[1] === tiles[2]) return 'pung';
  if (tiles.length === 3) {
    const codes = tiles.map(tileCode).sort((a, b) => a - b);
    if (codes[0] >= 0 && codes[0] < 27) {
      const suit = Math.floor(codes[0] / 9);
      const allSame = codes.every(c => Math.floor(c / 9) === suit);
      if (allSame && codes[1] === codes[0] + 1 && codes[2] === codes[0] + 2) return 'chow';
    }
  }
  return 'invalid';
}

const MELD_LABELS = {
  chow: { en: 'Chow', zh: '上' },
  pung: { en: 'Pung', zh: '碰' },
  kong: { en: 'Kong', zh: '槓' },
  pair: { en: 'Pair', zh: '眼' },
};

function renderMeld(tiles, type, opts = {}) {
  const meld = document.createElement('div');
  meld.className = 'mj-meld mj-meld-' + type;
  const tilesEl = document.createElement('div');
  tilesEl.className = 'mj-meld-tiles';
  tiles.forEach(id => tilesEl.appendChild(renderTile(id, { size: opts.size || 'sm', button: false })));
  meld.appendChild(tilesEl);
  const label = document.createElement('div');
  label.className = 'mj-meld-label';
  const info = MELD_LABELS[type] || { en: type, zh: '' };
  label.innerHTML = `<span>${info.en}</span><span class="mj-meld-label-zh">${info.zh}</span>`;
  meld.appendChild(label);
  return meld;
}

function renderHandStage(hand) {
  const host = document.querySelector('#hand-stage');
  if (!host) return;
  host.innerHTML = `
    <div class="mj-stage-header">
      <div>
        <div class="mj-stage-name">${hand.name}<span class="mj-stage-zh"> · ${hand.zh}</span></div>
        <div class="mj-stage-desc">${hand.desc}</div>
      </div>
      <div style="font-family:var(--mono);font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--ink-muted);white-space:nowrap;">${handPts(hand)}</div>
    </div>
    <div class="mj-hand-sets" id="stage-sets"></div>
    <div class="mj-stage-footer">
      <span class="mj-stage-formula"><strong>${hand.formula}</strong></span>
      <span class="mj-stage-pts">${handPts(hand)}</span>
    </div>
  `;
  const sets = host.querySelector('#stage-sets');
  if (hand.flat) {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexWrap = 'wrap';
    wrap.style.gap = '3px';
    wrap.style.justifyContent = 'center';
    hand.flat.forEach(id => wrap.appendChild(renderTile(id, { size: 'sm', button: false })));
    sets.appendChild(wrap);
    wrapTermsIn(host);
    return;
  }
  hand.sets.forEach(s => {
    const type = classifySet(s);
    sets.appendChild(renderMeld(s, type));
  });
  if (hand.pair) sets.appendChild(renderMeld(hand.pair, 'pair'));
  wrapTermsIn(host);
}

/* ============================================================
   04 — Turn actions
   ============================================================ */

const ACTIONS = [
  { zh:'摸牌', py:'mō pái', lit:'"feel for a tile"',
    name:'Draw', desc:'Take one tile from the wall — now you have 14 and must discard one.',
    example:[], timing:'on-turn', when:'Always — starts your turn' },
  { zh:'打牌', py:'dǎ pái', lit:'"strike a tile"',
    name:'Discard', desc:'Place one tile from your hand face-up in front of you. Your turn ends and other players may call it.',
    example:[], timing:'on-turn', when:'Always — ends your turn' },
  { zh:'上', py:'shàng', lit:'"go up"',
    name:'Chow', desc:'Claim the discarded tile to complete a sequence. Reveal the chow face-up.',
    example:['d3','d4','d5'], timing:'out-of-turn', when:'Only from the player on your left' },
  { zh:'碰', py:'pèng', lit:'"to bump"',
    name:'Pung', desc:'Claim a discard to complete a triplet (three of a kind). Reveal the pung face-up.',
    example:['b7','b7','b7'], timing:'out-of-turn', when:'Any player\'s discard' },
  { zh:'槓', py:'gàng', lit:'"to bar"',
    name:'Kong', desc:'Complete a set of four — from a discard, or from your own hand. Draw a replacement tile.',
    example:['c2','c2','c2','c2'], timing:'either', when:'Discard or self-draw' },
  { zh:'糊', py:'hú', lit:'"to win / paste"',
    name:'Mahjong', desc:`Declare the winning tile — either a self-draw or someone's discard — completing 4 sets + pair with enough ${UNIT}.`,
    example:['dr','dr'], timing:'either', when:'Any time the hand becomes complete' },
];

const PRIORITY = [
  { rank:'1', name:'Mahjong (糊)', desc:'A declared win on a discard always beats any other call on that tile.' },
  { rank:'2', name:'Pung / Kong (碰/槓)', desc:'Beats a chow. If two players want to pung, the closer player to the discarder\'s right wins.' },
  { rank:'3', name:'Chow (上)', desc:'Only the player immediately after the discarder may call chow. Cannot interrupt a pung/kong on the same tile.' },
];

function initActions() {
  const host = document.querySelector('#action-list');
  if (host) {
    ACTIONS.forEach(a => {
      const row = document.createElement('div');
      row.className = 'mj-action-row';
      const ex = document.createElement('div');
      ex.className = 'mj-action-example';
      if (a.example.length) {
        a.example.forEach(id => ex.appendChild(renderTile(id, { size: 'xs', button: false })));
      } else {
        ex.innerHTML = '<span style="font-family:var(--sans);font-size:11px;color:var(--ink-faint);font-style:italic;letter-spacing:0.2px;">— no example —</span>';
      }
      row.innerHTML = `
        <div class="mj-action-zh-col">
          <div class="mj-action-zh">${a.zh}</div>
          <div class="mj-action-pinyin">${a.py}</div>
          <div class="mj-action-lit">${a.lit}</div>
        </div>
        <div class="mj-action-main">
          <div class="mj-action-name">${a.name}</div>
          <div class="mj-action-desc">${a.desc}</div>
        </div>
      `;
      row.appendChild(ex);
      const when = document.createElement('div');
      when.className = 'mj-action-when-col';
      when.innerHTML = `<span class="mj-action-timing mj-timing-${a.timing}">${a.timing === 'on-turn' ? 'Your turn' : a.timing === 'out-of-turn' ? 'Out of turn' : 'Either'}</span><span class="mj-action-when-txt">${a.when}</span>`;
      row.appendChild(when);
      host.appendChild(row);
    });
  }
  const phost = document.querySelector('#priority-ladder');
  if (phost) {
    PRIORITY.forEach(p => {
      const r = document.createElement('div');
      r.className = 'mj-prio-row';
      r.innerHTML = `<span class="mj-prio-rank">${p.rank}</span><span class="mj-prio-name">${p.name}</span><span class="mj-prio-desc">${p.desc}</span>`;
      phost.appendChild(r);
    });
  }
}

/* ============================================================
   05 — Faan grid
   ============================================================ */

const FAAN_HK = [
  { name:'Common Hand', zh:'平糊', val:'1 faan', desc:'All chows, valueless pair.' },
  { name:'All Pungs', zh:'對對糊', val:'3 faan', desc:'Every set a pung or kong.' },
  { name:'Mixed One Suit', zh:'混一色', val:'3 faan', desc:'One suit plus any honors.' },
  { name:'Pure One Suit', zh:'清一色', val:'7 faan', desc:'A single suit, nothing else.' },
  { name:'Small Three Dragons', zh:'小三元', val:'3 faan', desc:'Two dragon pungs + dragon pair.' },
  { name:'Great Three Dragons', zh:'大三元', val:'8 faan', desc:'Pungs of all three dragons.' },
  { name:'All Honors', zh:'字一色', val:'10 faan', limit:true, desc:'Only winds and dragons.' },
  { name:'Thirteen Orphans', zh:'十三么', val:'13 faan', limit:true, desc:'One of every terminal + every honor + pair.' },
  { name:'Self-Draw', zh:'自摸', val:'+1 faan', desc:'Won on a self-drawn tile.' },
  { name:'All Concealed', zh:'門前清', val:'+1 faan', desc:'Hand never called pung/chow/kong.' },
  { name:'Dragon Pung', zh:'番牌', val:'+1 faan ea.', desc:'Each dragon pung adds 1 faan.' },
  { name:'Seat / Round Wind', zh:'番牌', val:'+1 faan ea.', desc:'Pung of your seat wind or the round wind.' },
  { name:'Flower of Seat', zh:'花牌', val:'+1 faan', desc:'Flower or season matching your seat (E=1, S=2, W=3, N=4).' },
];

const FAAN_SG = [
  { name:'Chicken / Basic Mahjong', zh:'雞胡', val:'0 tai', desc:'A bare 4-sets-and-a-pair with no scoring elements. Most tables disallow it — need 1 tai minimum.' },
  { name:'All Chow', zh:'平胡', val:'1 tai', desc:'Every set is a chow, non-scoring pair. (4 tai if completely "pure" — no flowers/animals exposed.)' },
  { name:'All Pong', zh:'對對胡', val:'2 tai', desc:'Every set a pung or kong. Easier to spot mid-hand than HK.' },
  { name:'Half Color (Mixed)', zh:'混一色', val:'2 tai', desc:'One number suit plus honors only.' },
  { name:'Half Terminals', zh:'混老頭', val:'2 tai', desc:'Only 1s, 9s, and honors throughout the hand.' },
  { name:'Full Color (Pure)', zh:'清一色', val:'4 tai', desc:'A single suit, no honors.' },
  { name:'All Terminals', zh:'清老頭', val:'9 tai', limit:true, desc:'Only 1s and 9s — no middle tiles, no honors.' },
  { name:'Small Three Dragons', zh:'小三元', val:'2 tai', desc:'Two dragon pungs + dragon pair (the +1 tai dragon-pair counts separately).' },
  { name:'Great Three Dragons', zh:'大三元', val:'4 tai', desc:'Pungs of all three dragons. The discarder of the third dragon usually pays for everyone.' },
  { name:'All Honors', zh:'字一色', val:'10 tai', limit:true, desc:'Only winds and dragons. Limit hand.' },
  { name:'All Winds', zh:'大四喜', val:'limit', limit:true, desc:'Pungs of all four winds + any pair.' },
  { name:'Thirteen Wonders', zh:'十三么', val:'8 tai', desc:'One of every terminal + every honor + a pair.' },
  { name:'Self-Draw', zh:'自摸', val:'+1 tai', desc:'Won on a self-drawn tile.' },
  { name:'Concealed', zh:'門前清', val:'+1 tai', desc:'Hand never called pung/chow/kong.' },
  { name:'Each Dragon Pung', zh:'番牌', val:'+1 tai ea.', desc:'Each pung of dragons.' },
  { name:'Seat / Round Wind', zh:'番牌', val:'+1 tai ea.', desc:'Pung of your seat wind or the round wind.' },
  { name:'Each Animal', zh:'動物', val:'+1 tai ea.', desc:'Each animal tile (cat, rat, rooster, centipede) you hold at the end.' },
  { name:'All Four Animals', zh:'四動物', val:'limit', limit:true, desc:'Collect all four animals — pay-all limit hand.' },
  { name:'Matching Flower / Season', zh:'花牌', val:'+1 tai ea.', desc:'Flower or season matching your seat (E=1, S=2, W=3, N=4).' },
  { name:'Complete Flower Set', zh:'一色花', val:'+1 tai', desc:'All four of either the Flower group or the Season group.' },
  { name:'Seven Flowers / Seasons', zh:'七花', val:'10 tai', limit:true, desc:'Hold any 7 of the 8 bonus tiles and win on the 8th — instant.' },
  { name:'Eight Flowers / Seasons', zh:'八花', val:'limit', limit:true, desc:'Hold all 8 bonus tiles — instant win, pay-all.' },
  { name:'Robbing the Kong', zh:'搶槓', val:'+1 tai', desc:'Win on the tile someone adds to an exposed pung to make a kong.' },
  { name:'Win on Replacement', zh:'槓上開花', val:'+1 tai', desc:'After calling a kong, win on the replacement tile.' },
  { name:'Win on Last Tile', zh:'海底撈月', val:'+1 tai', desc:'Win on the final draw from the wall.' },
];

const FAAN = IS_SG ? FAAN_SG : FAAN_HK;

function initFaan() {
  const host = document.querySelector('#faan-grid');
  if (!host) return;
  FAAN.forEach(p => {
    const row = document.createElement('div');
    row.className = 'mj-score-row' + (p.limit ? ' is-limit' : '');
    row.innerHTML = `
      <div class="mj-score-name">${p.name}<span class="mj-score-zh">${p.zh}</span></div>
      <div class="mj-score-tiles"></div>
      <div class="mj-score-desc">${p.desc}</div>
      <div class="mj-score-val">${p.val}</div>
    `;
    host.appendChild(row);
  });
}

/* ============================================================
   06 — Scenarios
   ============================================================ */

const SCENARIOS = [
  {
    prompt: 'Is this a winning hand?',
    hand: ['d1','d2','d3','b4','b5','b6','c7','c8','c9','we','we','we','dr','dr'],
    options: [
      { label: 'Yes — it splits cleanly into 4 sets + a pair.', correct: true,
        explain: `Three chows (1-2-3 dots, 4-5-6 bamboo, 7-8-9 chars), a pung of East, a pair of Red Dragon. The East pung and Red pair both score ${UNIT}.` },
      { label: 'No — too many tile types.', correct: false,
        explain: 'A winning hand only needs the shape 4 sets + 1 pair. Suits and honors mix freely.' },
    ],
  },
  {
    prompt: 'And is this one?',
    hand: ['d1','d2','d3','b4','b5','b6','c7','c8','c9','we','ws','ww','dr','dr'],
    options: [
      { label: 'Yes.', correct: false,
        explain: 'Look at the winds: East + South + West — three different singles. Honor tiles cannot form a chow, so this leaves three orphan tiles.' },
      { label: 'No — three lone winds don\'t form a set.', correct: true,
        explain: 'Right. Honors only combine as pairs, pungs or kongs. Three distinct winds is just three loose tiles.' },
    ],
  },
  {
    prompt: 'Second turn. You\'ve drawn a 14th tile. Which discard keeps the most options open?',
    hand: ['d2','d3','d4','b5','b6','b7','c3','c3','c4','c5','dr','dr','wn','f1'],
    options: [
      { label: 'Discard the Flower (Plum)', correct: false,
        explain: 'Trick option — flowers aren\'t discarded. They\'re set aside face-up and you draw a replacement.' },
      { label: 'Discard the lone North wind', correct: true,
        explain: 'It\'s isolated, you have just one, and unless North is your seat or the round wind, a pung of it scores nothing extra. Lone honors are the textbook early discard.' },
      { label: 'Discard a 3 of Characters', correct: false,
        explain: 'You already have c3-c3-c4-c5 — a pair plus a 4-5. Throwing a 3 of chars breaks both a potential pung and a chow.' },
      { label: 'Discard a Red Dragon', correct: false,
        explain: `You have a pair of dragons. Hold them — one more makes a pung worth 1 ${UNIT}, plus Dragon Pung value.` },
    ],
  },
  {
    prompt: 'The player to your left discards a 5 of Bamboo. Should you call chow?',
    hand: ['b3','b4','b6','b7','d2','d2','d2','c1','c2','c3','we','we','we','dr'],
    options: [
      { label: 'Yes — claim it for b3-b4-b5.', correct: false,
        explain: `You expose tiles for a 1-${UNIT} chow but forfeit the "All Concealed" +1 ${UNIT}, and the b6-b7 is still floating waiting for b5 or b8.` },
      { label: 'Yes — claim it for b4-b5-b6.', correct: false,
        explain: 'Same problem: you reveal tiles, lose the concealed bonus, and still have a stranded b3 and b7.' },
      { label: 'No — pass and stay concealed.', correct: true,
        explain: `You already have a pung of 2-dots, pung of East, chow 1-2-3 chars, and floating bamboo + a dragon. Stay closed and aim for a concealed win — much higher ${UNIT}.` },
    ],
  },
  {
    prompt: 'You\'re tenpai (ready). Which tile completes the hand?',
    hand: ['d1','d2','d3','d4','d5','d6','d7','d8','d9','b5','b5','b5','c2'],
    options: [
      { label: 'c1', correct: false,
        explain: 'c1 with your single c2 only forms 1-2 — no third tile in hand to extend it.' },
      { label: 'c2 — pair up the lone Two', correct: true,
        explain: 'You have three complete dot chows (1-2-3, 4-5-6, 7-8-9), a pung of 5-bamboo, and a lone c2. Pairing c2 finishes the hand. This is a tanki (pair) wait.' },
      { label: 'c1 or c3', correct: false,
        explain: 'You only have one 2 of chars and no neighbors. It can only pair up — it can\'t join a chow without partners.' },
    ],
  },
  {
    prompt: 'Your opponent just won with this hand. Which pattern scores?',
    hand: ['b1','b2','b3','b4','b5','b6','b7','b8','b9','b3','b3','b3','b5','b5'],
    options: [
      { label: 'Pure One Suit + All Pungs', correct: false,
        explain: 'Look at the sets: 1-2-3, 4-5-6, 7-8-9, 3-3-3, 5-5. Three chows, one pung, a pair — not All Pungs.' },
      { label: 'Pure One Suit (清一色)', correct: true,
        explain: `Every tile is bamboo. ${IS_SG ? 'Full Color (清一色) alone is 4 tai — well past the 1-tai minimum.' : 'Pure One Suit alone is 7 faan — well past the 3-faan minimum.'}` },
      { label: 'Common Hand only', correct: false,
        explain: 'Common Hand requires the pair to be non-scoring AND all sets to be chows. There\'s a pung here.' },
    ],
  },
  {
    prompt: 'Last few turns. The player across has called two pungs of dots and is clearly chasing one suit. Which discard is safest?',
    hand: ['d3','d5','b2','b2','b6','b7','b8','c4','c5','c6','c9','wn','wn','ws'],
    options: [
      { label: 'A 3 of Dots', correct: false,
        explain: 'They\'re collecting dots. Any dot is high-risk feed. Avoid.' },
      { label: 'The lone South wind', correct: false,
        explain: 'Honors are often safe — but if South is their seat or the round, you just gave them a pung. No South has been discarded yet to confirm it\'s safe.' },
      { label: 'A North wind (you already have a pair, and one was discarded earlier)', correct: true,
        explain: 'A tile already present in the discards is genbutsu — proven safe against most hands. Repeating a wind already thrown is the textbook defensive play.' },
    ],
  },
];

function initScenarios() {
  const host = document.querySelector('#scenario');
  if (!host) return;
  let state = { idx: 0, score: 0, answered: false };

  function render() {
    host.innerHTML = '';
    if (state.idx >= SCENARIOS.length) return renderEnd();
    const s = SCENARIOS[state.idx];

    const prog = document.createElement('div');
    prog.className = 'mj-scenario-progress';
    SCENARIOS.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'mj-scenario-dot' + (i === state.idx ? ' is-current' : i < state.idx ? ' is-done' : '');
      prog.appendChild(dot);
    });
    host.appendChild(prog);

    const num = document.createElement('div');
    num.className = 'mj-scenario-num';
    num.textContent = `Scenario ${state.idx + 1} of ${SCENARIOS.length}`;
    host.appendChild(num);

    const p = document.createElement('h3');
    p.className = 'mj-scenario-prompt';
    p.textContent = s.prompt;
    host.appendChild(p);

    const hand = document.createElement('div');
    hand.className = 'mj-scenario-hand';
    s.hand.forEach(id => hand.appendChild(renderTile(id, { size: 'sm', button: false })));
    host.appendChild(hand);

    const opts = document.createElement('div');
    opts.className = 'mj-scenario-options';
    s.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mj-scenario-option';
      b.textContent = opt.label;
      b.addEventListener('click', () => answer(i));
      opts.appendChild(b);
    });
    host.appendChild(opts);

    const fb = document.createElement('div');
    fb.className = 'mj-scenario-feedback';
    fb.hidden = true;
    host.appendChild(fb);

    const nav = document.createElement('div');
    nav.className = 'mj-scenario-nav';
    const score = document.createElement('span');
    score.className = 'mj-scenario-score';
    score.textContent = `Score · ${state.score} / ${SCENARIOS.length}`;
    nav.appendChild(score);
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'mj-btn mj-btn-primary';
    next.textContent = state.idx === SCENARIOS.length - 1 ? 'See your score →' : 'Next scenario →';
    next.disabled = true;
    next.addEventListener('click', () => { state.idx++; state.answered = false; render(); });
    nav.appendChild(next);
    host.appendChild(nav);

    function answer(i) {
      if (state.answered) return;
      state.answered = true;
      const opt = s.options[i];
      if (opt.correct) state.score++;
      Array.from(opts.children).forEach((b, j) => {
        b.disabled = true;
        if (j === i) b.classList.add(opt.correct ? 'is-correct' : 'is-wrong');
        if (s.options[j].correct) b.classList.add('is-answer');
      });
      fb.hidden = false;
      fb.classList.toggle('is-wrong', !opt.correct);
      fb.innerHTML = `<strong>${opt.correct ? 'Correct.' : 'Not quite.'}</strong> ${opt.explain}`;
      next.disabled = false;
      score.textContent = `Score · ${state.score} / ${SCENARIOS.length}`;
      wrapTermsIn(fb);
    }
    wrapTermsIn(host);
  }

  function renderEnd() {
    host.innerHTML = '';
    const end = document.createElement('div');
    end.className = 'mj-scenario-end';
    end.innerHTML = `
      <div class="mj-scenario-end-num">${state.score}</div>
      <div class="mj-scenario-end-of">of ${SCENARIOS.length}</div>
      <h3>${state.score === SCENARIOS.length ? 'Perfect.' : state.score >= SCENARIOS.length - 2 ? 'Solid.' : state.score >= SCENARIOS.length / 2 ? 'Good start.' : 'Worth another pass.'}</h3>
      <p>${endMessage(state.score)}</p>
    `;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mj-btn mj-btn-primary';
    btn.textContent = 'Retake';
    btn.addEventListener('click', () => { state = { idx: 0, score: 0, answered: false }; render(); });
    end.appendChild(btn);
    host.appendChild(end);
  }

  function endMessage(s) {
    if (s === SCENARIOS.length) return 'Find some friends and a tile set — you\'re ready to play.';
    if (s >= SCENARIOS.length - 2) return 'A few more games and these decisions become reflex.';
    if (s >= SCENARIOS.length / 2) return 'Re-read the Hands and Faan sections, then try again — the patterns click fast.';
    return 'These are real table calls. Skim the explanations, sit a few hands at a real table, and you\'ll see the patterns.';
  }

  render();
}

/* ============================================================
   Chinese-term hover tooltips
   ============================================================ */

const TERMS = {
  // Hands (longest first via length sort below)
  '對對糊': { py: 'duì duì hú',   en: 'All Pungs — every set is a triplet' },
  '混一色': { py: 'hùn yī sè',    en: 'Mixed One Suit — one suit + honors' },
  '清一色': { py: 'qīng yī sè',   en: 'Pure One Suit — one suit, nothing else' },
  '小三元': { py: 'xiǎo sān yuán',en: 'Small Three Dragons' },
  '大三元': { py: 'dà sān yuán',  en: 'Great Three Dragons' },
  '字一色': { py: 'zì yī sè',     en: 'All Honors — winds and dragons only' },
  '十三么': { py: 'shí sān yāo',  en: 'Thirteen Orphans — special winning shape' },
  '門前清': { py: 'mén qián qīng',en: 'Concealed — no calls of pung/chow/kong' },
  '香港麻將': { py: 'xiāng gǎng má jiàng', en: 'Hong Kong Mahjong' },
  '新加坡麻將': { py: 'xīn jiā pō má jiàng', en: 'Singapore Mahjong' },
  // Singapore-specific hand and bonus terms
  '對對胡': { py: 'duì duì hú',   en: 'All Pong — every set a triplet (Singapore notation)' },
  '雞胡':   { py: 'jī hú',         en: 'Chicken hand — bare 4-sets-and-pair with no scoring elements' },
  '混老頭': { py: 'hùn lǎo tóu',  en: 'Half Terminals — only 1s, 9s and honors' },
  '清老頭': { py: 'qīng lǎo tóu', en: 'All Terminals — only 1s and 9s' },
  '大四喜': { py: 'dà sì xǐ',     en: 'Big Four Blessings — pungs of all four winds' },
  '搶槓':   { py: 'qiǎng gàng',   en: 'Robbing the Kong — win on the tile someone adds to a pung' },
  '槓上開花': { py: 'gàng shàng kāi huā', en: 'Win on the kong replacement tile' },
  '海底撈月': { py: 'hǎi dǐ lāo yuè', en: 'Win on the very last tile from the wall' },
  '動物': { py: 'dòng wù',        en: 'Animal — Singapore bonus tile (cat, rat, rooster, centipede)' },
  '四動物': { py: 'sì dòng wù',   en: 'All four animals — pay-all limit hand' },
  '一色花': { py: 'yī sè huā',    en: 'Complete flower or season set' },
  '七花': { py: 'qī huā',         en: 'Seven flowers/seasons — limit hand' },
  '八花': { py: 'bā huā',         en: 'Eight flowers/seasons — instant win, pay-all' },
  // Animal tile names
  '蜈蚣': { py: 'wú gōng',        en: 'Centipede — Singapore animal tile' },
  '貓':   { py: 'māo',            en: 'Cat — Singapore animal (pairs with the Rat)' },
  '鼠':   { py: 'shǔ',            en: 'Rat — Singapore animal (pairs with the Cat)' },
  '雞':   { py: 'jī',             en: 'Rooster — Singapore animal (pairs with the Centipede)' },
  '蜈':   { py: 'wú',             en: 'Centipede tile glyph (short form)' },
  '平糊': { py: 'píng hú',        en: 'Common Hand — all chows, valueless pair' },
  '番牌': { py: 'fān pái',        en: 'Value tile — pung that scores faan' },
  '花牌': { py: 'huā pái',        en: 'Bonus tile — flower or season' },
  '自摸': { py: 'zì mō',          en: 'Self-draw — won on a tile you drew yourself' },
  '摸牌': { py: 'mō pái',         en: 'To draw a tile' },
  '打牌': { py: 'dǎ pái',         en: 'To discard a tile' },
  '麻將': { py: 'má jiàng',       en: 'Mahjong' },
  // Single-character game terms
  '番': { py: 'fān',  en: 'Faan — scoring doubling unit' },
  '糊': { py: 'hú',   en: 'To win / complete the hand' },
  '眼': { py: 'yǎn',  en: 'Eyes — the pair' },
  '聽': { py: 'tīng', en: 'Tenpai — one tile from winning' },
  '上': { py: 'shàng',en: 'Chow — claim a sequence' },
  '碰': { py: 'pèng', en: 'Pung — claim a triplet' },
  '槓': { py: 'gàng', en: 'Kong — claim/complete four of a kind' },
  '摸': { py: 'mō',   en: 'To feel / draw a tile' },
  '打': { py: 'dǎ',   en: 'To strike / discard' },
  // Suits
  '筒': { py: 'tǒng', en: 'Dots — the round-pip suit' },
  '條': { py: 'tiáo', en: 'Bamboo — the stick suit' },
  '萬': { py: 'wàn',  en: 'Characters — the "ten thousand" suit' },
  '風': { py: 'fēng', en: 'Wind — honor tiles E/S/W/N' },
  '箭': { py: 'jiàn', en: 'Dragons — the three honor tiles 中/發/白' },
  '花': { py: 'huā',  en: 'Flower' },
  '季': { py: 'jì',   en: 'Season' },
  // Honor characters
  '東': { py: 'dōng', en: 'East — first seat, opening dealer' },
  '南': { py: 'nán',  en: 'South — second seat' },
  '西': { py: 'xī',   en: 'West — third seat' },
  '北': { py: 'běi',  en: 'North — fourth seat' },
  '中': { py: 'zhōng',en: 'Red Dragon' },
  '發': { py: 'fā',   en: 'Green Dragon' },
  '白': { py: 'bái',  en: 'White Dragon (blank tile)' },
};

const TERM_KEYS_SORTED = Object.keys(TERMS).sort((a, b) => b.length - a.length);
const TERM_REGEX = new RegExp('(' + TERM_KEYS_SORTED.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT']);
const SKIP_CLASSES = ['mj-term', 'mj-tile', 'mj-tile-glyph', 'mj-palette-tile', 'mj-kicker'];

function shouldSkipTerm(node) {
  if (!node) return true;
  if (SKIP_TAGS.has(node.tagName)) return true;
  if (!node.classList) return false;
  for (const c of SKIP_CLASSES) if (node.classList.contains(c)) return true;
  return false;
}

function wrapTermsIn(root) {
  if (!root) return;
  if (shouldSkipTerm(root)) return;
  const children = Array.from(root.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.nodeValue;
      if (!text || !TERM_REGEX.test(text)) continue;
      TERM_REGEX.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let m;
      while ((m = TERM_REGEX.exec(text))) {
        if (m.index > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
        const info = TERMS[m[1]];
        const span = document.createElement('span');
        span.className = 'mj-term';
        span.tabIndex = 0;
        span.dataset.tip = info.py + ' · ' + info.en;
        span.textContent = m[1];
        frag.appendChild(span);
        lastIdx = m.index + m[1].length;
      }
      if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      child.parentNode.replaceChild(frag, child);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      wrapTermsIn(child);
    }
  }
}

/* ============================================================
   Section 02 — Valid vs Invalid examples
   ============================================================ */

const VI_EXAMPLES = {
  valid: [
    { tiles: ['d3','d4','d5'], note: '<strong>Chow.</strong> Three consecutive tiles, same suit.' },
    { tiles: ['b7','b7','b7'], note: '<strong>Pung.</strong> Three identical tiles.' },
    { tiles: ['we','we','we','we'], note: '<strong>Kong.</strong> Four identical — draw a replacement tile.' },
    { tiles: ['dr','dr'], note: '<strong>Pair.</strong> The "eyes" — every standard hand needs one.' },
  ],
  invalid: [
    { tiles: ['d3','b4','c5'], note: 'Three different suits. <strong>Chows must share a suit.</strong>' },
    { tiles: ['c2','c4','c6'], note: 'Same suit but not consecutive. <strong>Chows need 1-2-3, not 2-4-6.</strong>' },
    { tiles: ['we','ws','ww'], note: 'Three different winds. <strong>Honors only combine as pairs or pungs</strong>, never chows.' },
    { tiles: ['d5','d5'], note: 'This is just a pair — and a hand can have only <strong>one</strong> pair, not two.' },
  ],
};

function initValidInvalid() {
  const validHost   = document.querySelector('#vi-valid');
  const invalidHost = document.querySelector('#vi-invalid');
  if (!validHost || !invalidHost) return;
  VI_EXAMPLES.valid.forEach(ex => validHost.appendChild(renderViExample(ex)));
  VI_EXAMPLES.invalid.forEach(ex => invalidHost.appendChild(renderViExample(ex)));
}
function renderViExample(ex) {
  const wrap = document.createElement('div');
  wrap.className = 'mj-vi-example';
  const tiles = document.createElement('div');
  tiles.className = 'mj-vi-tiles';
  ex.tiles.forEach(id => tiles.appendChild(renderTile(id, { size: 'sm', button: false })));
  const note = document.createElement('div');
  note.className = 'mj-vi-note';
  note.innerHTML = ex.note;
  wrap.appendChild(tiles); wrap.appendChild(note);
  return wrap;
}

/* ============================================================
   Section 02 — Hand-builder sandbox
   ============================================================ */

const PALETTE_ROWS = [
  ['d1','d2','d3','d4','d5','d6','d7','d8','d9'],
  ['b1','b2','b3','b4','b5','b6','b7','b8','b9'],
  ['c1','c2','c3','c4','c5','c6','c7','c8','c9'],
  ['we','ws','ww','wn','dr','dg','dw'],
];

const SAMPLE_BUILDS = {
  common: {
    label: 'Common Hand',
    slots: [['d2','d3','d4'], ['b3','b4','b5'], ['c6','c7','c8'], ['d7','d8','d9'], ['b2','b2']],
  },
  allpungs: {
    label: 'All Pungs',
    slots: [['d3','d3','d3'], ['b6','b6','b6'], ['c2','c2','c2'], ['we','we','we'], ['dr','dr']],
  },
  pure: {
    label: 'Pure One Suit',
    slots: [['c1','c2','c3'], ['c4','c5','c6'], ['c7','c8','c9'], ['c2','c3','c4'], ['c5','c5']],
  },
};

const SANDBOX = {
  slots: [
    { type: 'set',  tiles: [] },
    { type: 'set',  tiles: [] },
    { type: 'set',  tiles: [] },
    { type: 'set',  tiles: [] },
    { type: 'pair', tiles: [] },
  ],
  active: 0,
};

function initSandbox() {
  const host = document.querySelector('#sandbox');
  if (!host) return;
  host.innerHTML = `
    <div class="mj-sandbox-slots" id="sb-slots"></div>
    <div class="mj-sandbox-palette">
      <div class="mj-sandbox-palette-head">
        <span>Tile palette · click to add to the active slot</span>
        <span class="mj-sandbox-controls">
          <button class="mj-btn" type="button" data-sb-load="common">Try Common Hand</button>
          <button class="mj-btn" type="button" data-sb-load="allpungs">Try All Pungs</button>
          <button class="mj-btn" type="button" data-sb-load="pure">Try Pure One Suit</button>
          <button class="mj-btn" type="button" data-sb-clear>Clear</button>
        </span>
      </div>
      <div id="sb-palette"></div>
    </div>
    <div class="mj-sandbox-verdict" id="sb-verdict"></div>
  `;
  host.querySelectorAll('[data-sb-load]').forEach(b => {
    b.addEventListener('click', () => sandboxLoadSample(b.dataset.sbLoad));
  });
  host.querySelector('[data-sb-clear]').addEventListener('click', sandboxClear);

  renderSandboxPalette();
  renderSandbox();
}

function renderSandboxPalette() {
  const host = document.querySelector('#sb-palette');
  if (!host) return;
  host.innerHTML = '';
  PALETTE_ROWS.forEach(row => {
    const r = document.createElement('div');
    r.className = 'mj-sandbox-palette-row';
    row.forEach(id => {
      const wrap = document.createElement('span');
      wrap.className = 'mj-palette-tile';
      const tile = renderTile(id, {
        size: 'sm',
        onClick: t => sandboxAddTile(t.id),
      });
      wrap.appendChild(tile);
      r.appendChild(wrap);
    });
    host.appendChild(r);
  });
}

function sandboxTileCount(id) {
  let total = 0;
  for (const slot of SANDBOX.slots) {
    for (const t of slot.tiles) if (t === id) total++;
  }
  return total;
}

function sandboxAddTile(id) {
  // refuse if 4 already used
  if (sandboxTileCount(id) >= 4) return;
  // active slot full? advance
  let slot = SANDBOX.slots[SANDBOX.active];
  if (slot.tiles.length >= (slot.type === 'pair' ? 2 : 4)) {
    advanceActive();
    slot = SANDBOX.slots[SANDBOX.active];
  }
  // pair caps at 2; set caps at 4 (allow kong)
  const cap = slot.type === 'pair' ? 2 : 4;
  if (slot.tiles.length < cap) {
    slot.tiles.push(id);
    // auto-advance: pair → after 2; set → after 3 (advance, but allow user to come back and add a 4th for kong)
    const advanceAt = slot.type === 'pair' ? 2 : 3;
    if (slot.tiles.length === advanceAt) {
      // find next empty slot
      for (let i = SANDBOX.active + 1; i < SANDBOX.slots.length; i++) {
        if (SANDBOX.slots[i].tiles.length === 0) { SANDBOX.active = i; break; }
      }
    }
  }
  renderSandbox();
}

function advanceActive() {
  for (let i = SANDBOX.active + 1; i < SANDBOX.slots.length; i++) {
    if (SANDBOX.slots[i].tiles.length < (SANDBOX.slots[i].type === 'pair' ? 2 : 4)) {
      SANDBOX.active = i; return;
    }
  }
}

function sandboxRemoveFromSlot(slotIdx, tileIdx) {
  SANDBOX.slots[slotIdx].tiles.splice(tileIdx, 1);
  SANDBOX.active = slotIdx;
  renderSandbox();
}

function sandboxSelectSlot(idx) {
  SANDBOX.active = idx;
  renderSandbox();
}

function sandboxClear() {
  SANDBOX.slots.forEach(s => s.tiles = []);
  SANDBOX.active = 0;
  renderSandbox();
}

function sandboxLoadSample(key) {
  const sample = SAMPLE_BUILDS[key];
  if (!sample) return;
  SANDBOX.slots.forEach((s, i) => s.tiles = (sample.slots[i] || []).slice());
  SANDBOX.active = 0;
  renderSandbox();
}

function classifySlot(slot) {
  if (slot.type === 'pair') {
    if (slot.tiles.length === 0) return { state: 'empty', label: 'Empty', status: 'Tap a tile' };
    if (slot.tiles.length === 1) return { state: 'partial', label: 'Pair', status: 'Need 1 more' };
    if (slot.tiles[0] === slot.tiles[1]) return { state: 'valid', label: 'Pair', status: '✓ Pair (眼)' };
    return { state: 'invalid', label: 'Pair', status: 'Not identical' };
  }
  if (slot.tiles.length === 0) return { state: 'empty', label: 'Set', status: 'Tap a tile' };
  if (slot.tiles.length < 3) return { state: 'partial', label: 'Set', status: `Need ${3 - slot.tiles.length} more` };
  const kind = classifySet(slot.tiles);
  if (kind === 'chow') return { state: 'valid', label: 'Chow', status: '✓ Chow (上)' };
  if (kind === 'pung') return { state: 'valid', label: 'Pung', status: '✓ Pung (碰)' };
  if (kind === 'kong') return { state: 'valid', label: 'Kong', status: '✓ Kong (槓)' };
  return { state: 'invalid', label: 'Set', status: 'Not a valid set' };
}

function renderSandbox() {
  const slotsHost = document.querySelector('#sb-slots');
  if (!slotsHost) return;
  slotsHost.innerHTML = '';
  SANDBOX.slots.forEach((slot, i) => {
    const cls = classifySlot(slot);
    const div = document.createElement('div');
    div.className = 'mj-slot is-' + cls.state;
    if (i === SANDBOX.active) div.classList.add('is-active');
    div.addEventListener('click', e => {
      if (e.target.closest('.mj-tile')) return;
      sandboxSelectSlot(i);
    });
    const label = slot.type === 'pair' ? 'Pair' : 'Set';
    const num = slot.type === 'pair' ? '5 / pair' : (i + 1) + ' / 4';
    div.innerHTML = `
      <div class="mj-slot-head">
        <span>${cls.label}</span>
        <span class="mj-slot-head-num">${num}</span>
      </div>
      <div class="mj-slot-tiles"></div>
      <div class="mj-slot-status">${cls.status}</div>
    `;
    const tilesHost = div.querySelector('.mj-slot-tiles');
    if (slot.tiles.length === 0) {
      tilesHost.innerHTML = '<span class="mj-slot-placeholder">— ' + label.toLowerCase() + ' —</span>';
    } else {
      slot.tiles.forEach((id, ti) => {
        const t = renderTile(id, { size: 'xs', onClick: () => sandboxRemoveFromSlot(i, ti) });
        t.title = 'Click to remove';
        tilesHost.appendChild(t);
      });
    }
    slotsHost.appendChild(div);
  });

  // palette: dim exhausted tiles
  document.querySelectorAll('.mj-palette-tile').forEach(p => {
    const t = p.querySelector('.mj-tile');
    if (!t) return;
    const exhausted = sandboxTileCount(t.dataset.tileId) >= 4;
    p.classList.toggle('is-exhausted', exhausted);
  });

  renderVerdict();
  // re-wrap newly-injected Chinese in slot statuses + verdict
  wrapTermsIn(slotsHost);
  const v = document.querySelector('#sb-verdict');
  if (v) wrapTermsIn(v);
}

function renderVerdict() {
  const host = document.querySelector('#sb-verdict');
  if (!host) return;
  const all = SANDBOX.slots.flatMap(s => s.tiles);
  // any over-used tile?
  const counts = {};
  for (const id of all) counts[id] = (counts[id] || 0) + 1;
  for (const k of Object.keys(counts)) {
    if (counts[k] > 4) {
      host.className = 'mj-sandbox-verdict is-fail';
      host.innerHTML = `<span><strong>Too many copies.</strong> A real set has only 4 of each tile — you have ${counts[k]} of ${TILE_BY_ID[k].name}.</span>`;
      return;
    }
  }
  // all slots valid?
  const states = SANDBOX.slots.map(classifySlot);
  const allValid = states.every(s => s.state === 'valid');
  if (!allValid) {
    const remaining = SANDBOX.slots.reduce((acc, s) => {
      const need = s.type === 'pair' ? 2 - s.tiles.length : 3 - s.tiles.length;
      return acc + Math.max(0, need);
    }, 0);
    if (remaining === 0) {
      host.className = 'mj-sandbox-verdict is-fail';
      host.innerHTML = `<span><strong>Hand has ${all.length} tiles, but at least one set isn't valid.</strong> Check the red slot above.</span>`;
    } else {
      host.className = 'mj-sandbox-verdict';
      host.innerHTML = `<span>Add <strong>${remaining}</strong> more tile${remaining === 1 ? '' : 's'} to complete the hand. Click a slot above to choose where they go.</span>`;
    }
    return;
  }
  // every slot valid — check it's actually a winning hand
  if (isWinningHand(all)) {
    const pattern = identifyPattern(all, SANDBOX.slots);
    host.className = 'mj-sandbox-verdict is-win';
    host.innerHTML = `
      <span><strong>✓ Valid winning hand.</strong> 4 sets and a pair — you could declare on this.</span>
      ${pattern ? `<span class="mj-sandbox-verdict-pattern">${pattern}</span>` : ''}
    `;
  } else {
    host.className = 'mj-sandbox-verdict is-fail';
    host.innerHTML = `<span><strong>Sets look fine, but the overall hand doesn't validate.</strong> Check tile counts (max 4 of each across the whole hand).</span>`;
  }
}

function identifyPattern(allTiles, slots) {
  const u = IS_SG ? 'tai' : 'faan';
  const v = {
    thirteen:   IS_SG ? '8 tai'  : '13 faan',
    honors:     IS_SG ? '10 tai' : '10 faan',
    great3:     IS_SG ? '4 tai'  : '8 faan',
    small3:     IS_SG ? '2 tai'  : '3 faan',
    pure:       IS_SG ? '4 tai'  : '7 faan',
    mixed:      IS_SG ? '2 tai'  : '3 faan',
    allpong:    IS_SG ? '2 tai'  : '3 faan',
    common:     IS_SG ? '1 tai'  : '1 faan',
  };

  if (isThirteenOrphans(allTiles)) return `Thirteen Orphans · 十三么 · ${v.thirteen}`;
  const setSlots = slots.slice(0, 4);
  const pairSlot = slots[4];
  let chows = 0, pungs = 0;
  for (const s of setSlots) {
    const k = classifySet(s.tiles);
    if (k === 'chow') chows++;
    else if (k === 'pung' || k === 'kong') pungs++;
  }
  const suits = new Set();
  let hasHonor = false;
  for (const id of allTiles) {
    const c = tileCode(id);
    if (c >= 27) hasHonor = true;
    else suits.add(Math.floor(c / 9));
  }
  const dragonPungs = setSlots.filter(s => {
    const k = classifySet(s.tiles);
    return (k === 'pung' || k === 'kong') && ['dr','dg','dw'].includes(s.tiles[0]);
  }).length;
  const dragonPair = ['dr','dg','dw'].includes(pairSlot.tiles[0]);

  if (!suits.size && hasHonor) return `All Honors · 字一色 · ${v.honors}`;
  if (dragonPungs === 3) return `Great Three Dragons · 大三元 · ${v.great3}`;
  if (dragonPungs === 2 && dragonPair) return `Small Three Dragons · 小三元 · ${v.small3}`;
  if (suits.size === 1 && !hasHonor) return `${IS_SG ? 'Full Color' : 'Pure One Suit'} · 清一色 · ${v.pure}`;
  if (suits.size === 1 && hasHonor) return `${IS_SG ? 'Half Color' : 'Mixed One Suit'} · 混一色 · ${v.mixed}`;
  if (pungs === 4) return `${IS_SG ? 'All Pong' : 'All Pungs'} · 對對胡 · ${v.allpong}`;
  if (chows === 4) {
    const pt = TILE_BY_ID[pairSlot.tiles[0]];
    if (pt && !pt.isHonor) return `${IS_SG ? 'All Chow' : 'Common Hand'} · 平胡 · ${v.common}`;
  }
  return null;
}

/* ============================================================
   Section 07 — Random drills (Phase A simulator primitives)
   ============================================================ */

function shuffleArr(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* Animals and flowers are bonus tiles — they sit on the side and don't enter
   the playable wall. The 136-tile play wall is identical in both rulesets. */
const PLAYABLE_TILE_IDS = TILES.filter(t => t.group !== 'bonus' && t.group !== 'animal').map(t => t.id);

/* Build a winning hand by randomly assembling 4 sets + a pair, retrying until
   no tile exceeds 4 copies and the validator confirms a win. */
function randomWinningHand() {
  for (let attempt = 0; attempt < 200; attempt++) {
    const tiles = [];
    const counts = {};
    let ok = true;
    const add = id => {
      counts[id] = (counts[id] || 0) + 1;
      if (counts[id] > 4) { ok = false; return; }
      tiles.push(id);
    };
    for (let i = 0; i < 4 && ok; i++) {
      if (Math.random() < 0.55) {
        // chow
        const suit = ['d','b','c'][Math.floor(Math.random() * 3)];
        const start = 1 + Math.floor(Math.random() * 7);
        add(suit + start); add(suit + (start + 1)); add(suit + (start + 2));
      } else {
        // pung
        const id = PLAYABLE_TILE_IDS[Math.floor(Math.random() * PLAYABLE_TILE_IDS.length)];
        add(id); add(id); add(id);
      }
    }
    if (ok) {
      const pid = PLAYABLE_TILE_IDS[Math.floor(Math.random() * PLAYABLE_TILE_IDS.length)];
      add(pid); add(pid);
    }
    if (ok && tiles.length === 14 && isWinningHand(tiles)) return tiles;
  }
  return ['d1','d2','d3','b4','b5','b6','c7','c8','c9','we','we','we','dr','dr'];
}

function randomTenpaiHand() {
  // Take a winning hand and drop a random tile.
  // Then verify findWaits is non-empty (occasionally the dropped position is
  // covered by an alternate decomposition the validator finds first, giving
  // multiple waits — that's fine and educational).
  for (let attempt = 0; attempt < 10; attempt++) {
    const win = randomWinningHand();
    const idx = Math.floor(Math.random() * win.length);
    const hand = [...win.slice(0, idx), ...win.slice(idx + 1)];
    const waits = findWaits(hand);
    if (waits.length > 0) return { hand: sortHand(hand), waits };
  }
  // Fallback to a known tenpai
  return { hand: ['d1','d2','d3','d4','d5','d6','d7','d8','d9','b5','b5','b5','c2'], waits: ['c2'] };
}

function random14Tiles() {
  const wall = [];
  PLAYABLE_TILE_IDS.forEach(id => { for (let i = 0; i < 4; i++) wall.push(id); });
  shuffleArr(wall);
  return sortHand(wall.slice(0, 14));
}

/* Sort a hand for consistent display: dots, bamboo, chars by value, then winds, then dragons. */
function sortHand(ids) {
  const order = { d: 0, b: 1, c: 2, w: 3, d_dragon: 4 };
  return ids.slice().sort((a, b) => {
    const ca = tileCode(a), cb = tileCode(b);
    if (ca < 0 && cb < 0) return a.localeCompare(b);
    if (ca < 0) return 1;
    if (cb < 0) return -1;
    return ca - cb;
  });
}

/* Discard heuristic: score each tile, suggest lowest-scoring. */
function discardSuggestion(tiles) {
  const counts = {};
  tiles.forEach(t => counts[t] = (counts[t] || 0) + 1);

  const scored = tiles.map(id => {
    const t = TILE_BY_ID[id];
    if (!t) return { id, score: 0, reason: 'unknown tile' };
    let score = 0;
    const c = counts[id];
    if (c >= 4) score += 12;       // kong already
    else if (c >= 3) score += 9;   // pung already
    else if (c >= 2) score += 5;   // pair

    if (t.isHonor) {
      if (c === 1) {
        return { id, score: -10,
          reason: `Lone ${t.name}. Honors only combine as pairs/pungs, never chows — a single honor with no partners is the textbook early discard.` };
      }
      // pair/pung of honors: very valuable, especially dragons
      if (t.suit === 'dragon') score += 4;
      return { id, score, reason: c >= 3 ? `Already a pung of ${t.name} — keep it.` : `Pair of ${t.name} — one more makes a scoring pung.` };
    }

    // Suit tile: check for in-hand neighbours
    const v = t.value;
    const prefix = id[0];
    let neighbours = 0;
    for (let off = -2; off <= 2; off++) {
      if (off === 0) continue;
      const nv = v + off;
      if (nv < 1 || nv > 9) continue;
      if (counts[prefix + nv]) neighbours += (3 - Math.abs(off));
    }
    score += neighbours;
    if (t.isTerminal && c === 1 && neighbours === 0) {
      return { id, score: -7,
        reason: `Lone ${t.name} (a terminal). Terminals can only join chows from one side and you have no neighbours — limited use.` };
    }
    if (neighbours === 0 && c === 1) {
      return { id, score: -5,
        reason: `Stranded ${t.name}. No nearby tiles to form a chow and no copies to pair with.` };
    }
    return { id, score, reason: `Connected to ${neighbours} neighbour weight in the suit.` };
  });

  scored.sort((a, b) => a.score - b.score);
  return scored[0];
}

/* Section 07 — drill orchestrator */

const DRILL_STATS = {
  waits: { right: 0, total: 0 },
  winornot: { right: 0, total: 0 },
  discard: { played: 0, matchedSuggestion: 0 },
};

let drillState = { active: 'waits', current: null };

function initDrills() {
  const tabs = document.querySelectorAll('.mj-drill-tab');
  if (!tabs.length) return;
  tabs.forEach(t => t.addEventListener('click', () => {
    drillState.active = t.dataset.drill;
    drillState.current = null;
    tabs.forEach(x => x.classList.toggle('is-active', x === t));
    renderDrill();
  }));
  renderDrill();
}

function renderDrill() {
  const host = document.querySelector('#drill');
  if (!host) return;
  host.innerHTML = '';
  if (drillState.active === 'waits') renderWaitsDrill(host);
  else if (drillState.active === 'winornot') renderWinOrNotDrill(host);
  else if (drillState.active === 'discard') renderDiscardDrill(host);
}

function drillHeader(title, sub, stats) {
  const head = document.createElement('div');
  head.className = 'mj-drill-head';
  head.innerHTML = `
    <div>
      <div class="mj-drill-title">${title}</div>
      <div class="mj-drill-sub">${sub}</div>
    </div>
    <div class="mj-drill-stats">${stats}</div>
  `;
  return head;
}

/* ---------- Waits drill ---------- */

function renderWaitsDrill(host) {
  if (!drillState.current || drillState.current.kind !== 'waits') {
    drillState.current = { kind: 'waits', ...randomTenpaiHand(), picks: new Set(), revealed: false };
  }
  const s = drillState.current;

  const stats = DRILL_STATS.waits;
  host.appendChild(drillHeader(
    'Find the wait',
    'A random 13-tile hand, guaranteed one tile from winning. Click the tile or tiles in the palette that would complete it.',
    `${stats.right} / ${stats.total} correct`
  ));

  const hand = document.createElement('div');
  hand.className = 'mj-drill-hand';
  s.hand.forEach(id => hand.appendChild(renderTile(id, { size: 'sm', button: false })));
  host.appendChild(hand);

  const pal = document.createElement('div');
  pal.className = 'mj-drill-palette';
  PALETTE_ROWS.forEach(row => {
    const r = document.createElement('div');
    r.className = 'mj-sandbox-palette-row';
    row.forEach(id => {
      const isPicked = s.picks.has(id);
      const isWait = s.waits.includes(id);
      const wrap = document.createElement('span');
      wrap.className = 'mj-palette-tile';
      if (s.revealed) {
        if (isPicked && isWait)  wrap.classList.add('is-correct');
        if (isPicked && !isWait) wrap.classList.add('is-wrong');
        if (!isPicked && isWait) wrap.classList.add('is-missed');
      } else if (isPicked) {
        wrap.classList.add('is-picked');
      }
      const t = renderTile(id, {
        size: 'sm',
        onClick: () => {
          if (s.revealed) return;
          if (s.picks.has(id)) s.picks.delete(id); else s.picks.add(id);
          renderDrill();
        },
      });
      wrap.appendChild(t);
      r.appendChild(wrap);
    });
    pal.appendChild(r);
  });
  host.appendChild(pal);

  const nav = document.createElement('div');
  nav.className = 'mj-drill-nav';

  if (!s.revealed) {
    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'mj-btn mj-btn-primary';
    submit.textContent = 'Reveal';
    submit.disabled = s.picks.size === 0;
    submit.addEventListener('click', () => {
      s.revealed = true;
      const correct = s.waits.every(w => s.picks.has(w)) && Array.from(s.picks).every(p => s.waits.includes(p));
      DRILL_STATS.waits.total++;
      if (correct) DRILL_STATS.waits.right++;
      renderDrill();
    });
    nav.appendChild(submit);
    const skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'mj-btn';
    skip.textContent = 'Skip';
    skip.addEventListener('click', () => { drillState.current = null; renderDrill(); });
    nav.appendChild(skip);
  } else {
    const fb = document.createElement('div');
    fb.className = 'mj-drill-feedback';
    const correct = s.waits.every(w => s.picks.has(w)) && Array.from(s.picks).every(p => s.waits.includes(p));
    if (correct) {
      fb.classList.add('is-correct');
      fb.innerHTML = `<strong>Correct.</strong> The hand is waiting on <em>${s.waits.map(w => TILE_BY_ID[w].name).join(', ')}</em>.`;
    } else {
      fb.classList.add('is-wrong');
      const actual = s.waits.map(w => TILE_BY_ID[w].name).join(', ');
      fb.innerHTML = `<strong>Not quite.</strong> The hand is waiting on <em>${actual}</em>. Look at the palette — jade tiles are correct, faded jade are ones you missed, red is a tile you picked that doesn't complete the hand.`;
    }
    host.appendChild(fb);
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'mj-btn mj-btn-primary';
    next.textContent = 'New hand →';
    next.addEventListener('click', () => { drillState.current = null; renderDrill(); });
    nav.appendChild(next);
  }
  host.appendChild(nav);
  wrapTermsIn(host);
}

/* ---------- Win-or-not drill ---------- */

function renderWinOrNotDrill(host) {
  if (!drillState.current || drillState.current.kind !== 'winornot') {
    drillState.current = generateWinOrNotDrill();
  }
  const s = drillState.current;
  const stats = DRILL_STATS.winornot;

  host.appendChild(drillHeader(
    'Win or not?',
    '14 tiles. Decide whether the shape — 4 sets + a pair, or Thirteen Orphans — is satisfied. Some are real wins, some are close, some are nowhere near.',
    `${stats.right} / ${stats.total} correct`
  ));

  const hand = document.createElement('div');
  hand.className = 'mj-drill-hand';
  s.hand.forEach(id => hand.appendChild(renderTile(id, { size: 'sm', button: false })));
  host.appendChild(hand);

  const nav = document.createElement('div');
  nav.className = 'mj-drill-yesno';

  if (!s.revealed) {
    ['yes', 'no'].forEach(ans => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mj-drill-bigbtn mj-drill-' + ans;
      b.textContent = ans === 'yes' ? 'Yes — winning hand' : 'No — not a win';
      b.addEventListener('click', () => {
        s.answer = ans;
        s.revealed = true;
        DRILL_STATS.winornot.total++;
        if ((ans === 'yes') === s.isWin) DRILL_STATS.winornot.right++;
        renderDrill();
      });
      nav.appendChild(b);
    });
    host.appendChild(nav);
  } else {
    const correct = (s.answer === 'yes') === s.isWin;
    const fb = document.createElement('div');
    fb.className = 'mj-drill-feedback ' + (correct ? 'is-correct' : 'is-wrong');
    if (s.isWin) {
      const decomp = decomposeWinDisplay(s.hand);
      fb.innerHTML = `<strong>${correct ? 'Right — it wins.' : 'It is a winning hand.'}</strong> ${decomp}`;
    } else {
      fb.innerHTML = `<strong>${correct ? 'Right — it does not win.' : 'It does not win.'}</strong> ${explainNonWin(s.hand)}`;
    }
    host.appendChild(fb);

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'mj-btn mj-btn-primary';
    next.textContent = 'New hand →';
    next.addEventListener('click', () => { drillState.current = null; renderDrill(); });
    nav.appendChild(next);
    host.appendChild(nav);
  }
  wrapTermsIn(host);
}

function generateWinOrNotDrill() {
  // ~50% chance of a real winning hand to keep it interesting
  if (Math.random() < 0.5) {
    return { kind: 'winornot', hand: sortHand(randomWinningHand()), isWin: true, revealed: false };
  }
  // Otherwise: take a winning hand and corrupt one tile to a random different tile
  // (so it looks plausibly close), or just a pure random 14
  if (Math.random() < 0.6) {
    const win = randomWinningHand();
    const idx = Math.floor(Math.random() * win.length);
    let swap;
    do { swap = PLAYABLE_TILE_IDS[Math.floor(Math.random() * PLAYABLE_TILE_IDS.length)]; }
    while (swap === win[idx]);
    const corrupted = [...win];
    corrupted[idx] = swap;
    const counts = {};
    corrupted.forEach(t => counts[t] = (counts[t] || 0) + 1);
    if (Object.values(counts).every(v => v <= 4) && !isWinningHand(corrupted)) {
      return { kind: 'winornot', hand: sortHand(corrupted), isWin: false, revealed: false };
    }
  }
  // Pure random — almost certainly not a win
  const r = random14Tiles();
  return { kind: 'winornot', hand: r, isWin: isWinningHand(r), revealed: false };
}

function decomposeWinDisplay(tiles) {
  if (isThirteenOrphans(tiles)) return 'It is <em>Thirteen Orphans</em> — one of every terminal and honor plus a pair.';
  const d = decomposeWin(tiles);
  if (!d) return 'It decomposes into 4 sets and a pair.';
  const parts = d.sets.map(s => {
    const kind = classifySet(s);
    return `${MELD_LABELS[kind]?.en || 'Set'} ${tilesLabel(s)}`;
  });
  parts.push(`Pair ${tilesLabel(d.pair)}`);
  return parts.join(' · ');
}

function explainNonWin(tiles) {
  // Heuristic explanation: look for the most obvious problem
  const counts = handToCounts(tiles);
  // overflow?
  for (let i = 0; i < 34; i++) if (counts[i] > 4) return 'Tile counts are off — more than four of one kind.';
  // No pair?
  if (!counts.some(c => c >= 2)) return 'No pair anywhere — every standard winning hand needs exactly one pair.';
  // Wrong tile count?
  if (tiles.length !== 14) return `Only ${tiles.length} tiles — a winning hand has exactly 14.`;
  return 'The tiles don\'t split cleanly into 4 sets and a pair. Try the Hand Builder above to see how close you can get.';
}

function tilesLabel(ids) {
  return ids.map(id => TILE_BY_ID[id]?.name.split(' ')[0]).join('-');
}

/* ---------- Best-discard drill ---------- */

function renderDiscardDrill(host) {
  if (!drillState.current || drillState.current.kind !== 'discard') {
    drillState.current = {
      kind: 'discard',
      hand: random14Tiles(),
      pick: null,
      revealed: false,
    };
    drillState.current.suggestion = discardSuggestion(drillState.current.hand);
  }
  const s = drillState.current;
  const stats = DRILL_STATS.discard;

  host.appendChild(drillHeader(
    'Best discard',
    'A random 14-tile hand. Pick the tile you would throw. The app reveals what a basic AI heuristic would discard, with reasoning. Real mahjong rarely has a single "right" answer — but the patterns it explains are real.',
    `${stats.played} hands · ${stats.matchedSuggestion} matched the heuristic`
  ));

  const hand = document.createElement('div');
  hand.className = 'mj-drill-hand mj-drill-hand-pick';
  s.hand.forEach((id, idx) => {
    const wrap = document.createElement('span');
    wrap.className = 'mj-drill-handtile';
    if (s.pick === idx && !s.revealed) wrap.classList.add('is-picked');
    if (s.revealed) {
      // mark the suggested discard
      if (id === s.suggestion.id && !wrap.dataset.suggestionMarked) {
        wrap.classList.add('is-suggested');
        wrap.dataset.suggestionMarked = '1';
      }
      if (s.pick === idx) wrap.classList.add('is-picked');
    }
    const tile = renderTile(id, {
      size: 'sm',
      onClick: () => {
        if (s.revealed) return;
        s.pick = idx;
        renderDrill();
      },
    });
    wrap.appendChild(tile);
    hand.appendChild(wrap);
  });
  host.appendChild(hand);

  const nav = document.createElement('div');
  nav.className = 'mj-drill-nav';

  if (!s.revealed) {
    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'mj-btn mj-btn-primary';
    submit.textContent = 'Reveal suggestion';
    submit.disabled = s.pick === null;
    submit.addEventListener('click', () => {
      s.revealed = true;
      DRILL_STATS.discard.played++;
      if (s.hand[s.pick] === s.suggestion.id) DRILL_STATS.discard.matchedSuggestion++;
      renderDrill();
    });
    nav.appendChild(submit);
    const skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'mj-btn';
    skip.textContent = 'New hand';
    skip.addEventListener('click', () => { drillState.current = null; renderDrill(); });
    nav.appendChild(skip);
  } else {
    const matched = s.hand[s.pick] === s.suggestion.id;
    const fb = document.createElement('div');
    fb.className = 'mj-drill-feedback ' + (matched ? 'is-correct' : 'is-neutral');
    const yourChoice = TILE_BY_ID[s.hand[s.pick]];
    const suggested = TILE_BY_ID[s.suggestion.id];
    if (matched) {
      fb.innerHTML = `<strong>You matched the heuristic.</strong> ${s.suggestion.reason}`;
    } else {
      fb.innerHTML = `<strong>You picked ${yourChoice.name}.</strong> The heuristic would discard <em>${suggested.name}</em> instead — ${s.suggestion.reason} Your choice may well be defensible — discard decisions depend on what you're building toward.`;
    }
    host.appendChild(fb);
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'mj-btn mj-btn-primary';
    next.textContent = 'New hand →';
    next.addEventListener('click', () => { drillState.current = null; renderDrill(); });
    nav.appendChild(next);
  }
  host.appendChild(nav);
  wrapTermsIn(host);
}

/* ============================================================
   Section 08 — Phase B: auto-play viewer
   ============================================================ */

const SEAT_NAMES = ['East', 'South', 'West', 'North'];
const SEAT_ZH    = ['東', '南', '西', '北'];
const DEAD_WALL = 14; // tiles reserved for replacements (not strictly used here, but reserved)

const isSuitTileId = id => /^[dbc]\d$/.test(id);

function makeWall() {
  const tiles = [];
  PLAYABLE_TILE_IDS.forEach(id => { for (let i = 0; i < 4; i++) tiles.push(id); });
  shuffleArr(tiles);
  return { tiles, head: 0 };
}

function wallRemaining(wall) {
  return Math.max(0, wall.tiles.length - DEAD_WALL - wall.head);
}

function drawFromWall(wall) {
  if (wallRemaining(wall) <= 0) return null;
  return wall.tiles[wall.head++];
}

function makePlayer(seatIdx) {
  return {
    seat: SEAT_NAMES[seatIdx],
    seatIdx,
    hand: [],
    melds: [],     // [{type: 'pung'|'chow', tiles: [id,id,id], from: seatIdx}]
    discards: [],
    isDealer: seatIdx === 0,
  };
}

/* Treat melds as plain triplets for win validation (no kongs in Phase B). */
function flatHandForWin(player) {
  const flat = [...player.hand];
  for (const m of player.melds) flat.push(...m.tiles);
  return flat;
}

function newDemoGame() {
  const wall = makeWall();
  const players = [0, 1, 2, 3].map(makePlayer);
  for (let i = 0; i < 13; i++) {
    for (const p of players) p.hand.push(drawFromWall(wall));
  }
  // East gets one extra to start at 14
  players[0].hand.push(drawFromWall(wall));
  players.forEach(p => p.hand = sortHand(p.hand));
  return {
    wall,
    players,
    turn: 0,
    phase: 'east-discard',  // first move: East discards (already has 14)
    lastDiscard: null,
    lastDiscardSeat: null,
    winner: null,
    winSource: null,
    log: [],
    lastEvent: null,
  };
}

function checkChowOptions(handIds, discardId) {
  if (!isSuitTileId(discardId)) return [];
  const prefix = discardId[0];
  const v = parseInt(discardId.slice(1), 10);
  const has = id => handIds.includes(id);
  const options = [];
  if (v >= 3 && has(prefix+(v-2)) && has(prefix+(v-1))) options.push([prefix+(v-2), prefix+(v-1), discardId]);
  if (v >= 2 && v <= 8 && has(prefix+(v-1)) && has(prefix+(v+1))) options.push([prefix+(v-1), discardId, prefix+(v+1)]);
  if (v <= 7 && has(prefix+(v+1)) && has(prefix+(v+2))) options.push([discardId, prefix+(v+1), prefix+(v+2)]);
  return options;
}

/* Decide the best call response to the current discard.
   Priority: win > pung > chow. Equal priority — prefer the player
   closest to the discarder in turn order (offset 1 = next seat). */
function findBestCall(game) {
  const discard = game.lastDiscard;
  const fromSeat = game.lastDiscardSeat;
  let best = null;
  const better = c => !best || c.priority < best.priority ||
    (c.priority === best.priority && c.turnOrder < best.turnOrder);

  for (let offset = 1; offset <= 3; offset++) {
    const i = (fromSeat + offset) % 4;
    const p = game.players[i];

    const winFlat = [...flatHandForWin(p), discard];
    if (winFlat.length === 14 && isWinningHand(winFlat)) {
      const c = { player: i, kind: 'win', priority: 1, turnOrder: offset, tiles: [discard] };
      if (better(c)) best = c;
    }
    if (p.hand.filter(t => t === discard).length >= 2) {
      const c = { player: i, kind: 'pung', priority: 2, turnOrder: offset, tiles: [discard, discard, discard] };
      if (better(c)) best = c;
    }
    if (offset === 1) {
      const opts = checkChowOptions(p.hand, discard);
      if (opts.length > 0) {
        const c = { player: i, kind: 'chow', priority: 3, turnOrder: offset, tiles: opts[0] };
        if (better(c)) best = c;
      }
    }
  }
  return best;
}

/* Execute a call against the current game state. Mutates game and sets lastEvent. */
function executeCall(game, call) {
  const p = game.players[call.player];
  if (call.kind === 'win') {
    game.phase = 'end';
    game.winner = call.player;
    game.winSource = 'discard';
    // Restore the discard pile (we don't remove the called tile from the discarder's pile on a win)
    game.lastEvent = { type: 'win', player: call.player, tile: game.lastDiscard, source: 'discard', from: game.lastDiscardSeat };
    return;
  }
  const tilesNeeded = call.kind === 'pung'
    ? [game.lastDiscard, game.lastDiscard]
    : call.tiles.filter(t => t !== game.lastDiscard);
  for (const need of tilesNeeded) {
    const idx = p.hand.indexOf(need);
    if (idx >= 0) p.hand.splice(idx, 1);
  }
  p.melds.push({ type: call.kind, tiles: call.tiles.slice(), from: game.lastDiscardSeat });
  game.players[game.lastDiscardSeat].discards.pop();
  game.turn = call.player;
  game.phase = 'discard';
  game.lastEvent = { type: 'call', player: call.player, kind: call.kind, tiles: call.tiles, fromSeat: game.lastDiscardSeat, tile: game.lastDiscard };
}

/* Advance the game by exactly one event.
   `humanSeat` (default -1 = no human) pauses the engine via 'awaiting-*' events
   when it would be the human's turn to discard or call. */
function stepGame(game, humanSeat = -1) {
  if (game.phase === 'end') return null;
  if (game.phase === 'draw') {
    const t = drawFromWall(game.wall);
    if (t === null) {
      game.phase = 'end';
      game.lastEvent = { type: 'exhausted' };
      return game.lastEvent;
    }
    const p = game.players[game.turn];
    p.hand.push(t);
    p.hand = sortHand(p.hand);
    if (isWinningHand(flatHandForWin(p))) {
      game.phase = 'end';
      game.winner = game.turn;
      game.winSource = 'self-draw';
      game.winTile = t;
      game.lastEvent = { type: 'win', player: game.turn, tile: t, source: 'self-draw' };
      return game.lastEvent;
    }
    game.phase = 'discard';
    game.lastEvent = { type: 'draw', player: game.turn, tile: t };
    return game.lastEvent;
  }
  if (game.phase === 'east-discard' || game.phase === 'discard') {
    if (game.turn === humanSeat) {
      return { type: 'awaiting-discard', player: humanSeat };
    }
    const p = game.players[game.turn];
    if (p.hand.length === 0) {
      game.phase = 'end';
      game.lastEvent = { type: 'exhausted' };
      return game.lastEvent;
    }
    const sugg = discardSuggestion(p.hand);
    const idx = p.hand.indexOf(sugg.id);
    p.hand.splice(idx, 1);
    p.discards.push(sugg.id);
    game.lastDiscard = sugg.id;
    game.lastDiscardSeat = game.turn;
    game.phase = 'call';
    game.lastEvent = { type: 'discard', player: game.turn, tile: sugg.id, reason: sugg.reason };
    return game.lastEvent;
  }
  if (game.phase === 'call') {
    const call = findBestCall(game);
    if (call && call.player === humanSeat) {
      return { type: 'awaiting-call', player: humanSeat, call };
    }
    if (call) {
      executeCall(game, call);
      if (call.kind === 'win') game.winTile = game.lastDiscard;
      return game.lastEvent;
    }
    game.turn = (game.turn + 1) % 4;
    game.phase = 'draw';
    game.lastEvent = { type: 'pass' };
    return game.lastEvent;
  }
  return null;
}

/* ---------- Demo controller ---------- */

const DEMO = {
  game: null,
  mode: 'idle',    // 'idle' | 'playing' | 'paused' | 'ended'
  speedMs: 700,
  timer: null,
};

function initDemo() {
  const table = document.querySelector('#demo-table');
  if (!table) return;
  document.querySelectorAll('[data-demo]').forEach(el => {
    const action = el.dataset.demo;
    if (action === 'speed') {
      el.addEventListener('change', () => { DEMO.speedMs = parseInt(el.value, 10) || 700; });
      DEMO.speedMs = parseInt(el.value, 10) || 700;
      return;
    }
    el.addEventListener('click', () => demoAction(action));
  });
  renderDemoIdle();
}

function demoAction(action) {
  if (action === 'play') {
    if (DEMO.mode === 'idle' || DEMO.mode === 'ended') {
      DEMO.game = newDemoGame();
      DEMO.mode = 'playing';
      renderDemoFull();
      scheduleNextStep();
    } else if (DEMO.mode === 'paused') {
      DEMO.mode = 'playing';
      updateButtons();
      scheduleNextStep();
    }
  } else if (action === 'pause') {
    pauseDemo();
  } else if (action === 'step') {
    if (DEMO.mode === 'idle' || DEMO.mode === 'ended') {
      DEMO.game = newDemoGame();
      DEMO.mode = 'paused';
      renderDemoFull();
    } else {
      pauseDemo();
      runOneStep();
    }
  } else if (action === 'restart') {
    pauseDemo();
    DEMO.game = null;
    DEMO.mode = 'idle';
    renderDemoIdle();
  }
}

function pauseDemo() {
  if (DEMO.timer) { clearTimeout(DEMO.timer); DEMO.timer = null; }
  if (DEMO.mode === 'playing') DEMO.mode = 'paused';
  updateButtons();
}

function scheduleNextStep() {
  if (DEMO.timer) clearTimeout(DEMO.timer);
  DEMO.timer = setTimeout(() => {
    if (DEMO.mode !== 'playing') return;
    runOneStep();
    if (DEMO.mode === 'playing') scheduleNextStep();
  }, DEMO.speedMs);
}

function runOneStep() {
  const ev = stepGame(DEMO.game);
  if (!ev) return;
  // Skip "pass" events visually — immediately recurse one more step
  if (ev.type === 'pass') {
    runOneStep();
    return;
  }
  renderDemoFull();
  if (ev.type === 'win' || ev.type === 'exhausted') {
    DEMO.mode = 'ended';
    if (DEMO.timer) { clearTimeout(DEMO.timer); DEMO.timer = null; }
    updateButtons();
  }
}

function updateButtons() {
  const playBtn = document.querySelector('[data-demo="play"]');
  const pauseBtn = document.querySelector('[data-demo="pause"]');
  const restartBtn = document.querySelector('[data-demo="restart"]');
  if (!playBtn || !pauseBtn || !restartBtn) return;
  if (DEMO.mode === 'playing') {
    playBtn.hidden = true; pauseBtn.hidden = false; restartBtn.hidden = false;
  } else if (DEMO.mode === 'paused') {
    playBtn.hidden = false; playBtn.textContent = '▶ Resume';
    pauseBtn.hidden = true; restartBtn.hidden = false;
  } else if (DEMO.mode === 'ended') {
    playBtn.hidden = false; playBtn.textContent = '▶ Deal another round';
    pauseBtn.hidden = true; restartBtn.hidden = false;
  } else {
    playBtn.hidden = false; playBtn.textContent = '▶ Deal a round';
    pauseBtn.hidden = true; restartBtn.hidden = true;
  }
}

function renderDemoIdle() {
  const table = document.querySelector('#demo-table');
  const cap = document.querySelector('#demo-caption');
  const status = document.querySelector('#demo-status');
  if (table) {
    table.innerHTML = '';
    // show empty seats teaser
    for (let i = 0; i < 4; i++) {
      const seat = document.createElement('div');
      seat.className = 'mj-demo-seat is-empty';
      seat.innerHTML = `
        <div class="mj-demo-seat-head">
          <span class="mj-demo-seat-wind">${SEAT_NAMES[i]}<span class="mj-demo-seat-zh">${SEAT_ZH[i]}</span></span>
          <span class="mj-demo-seat-label">${i === 0 ? 'dealer' : ''}</span>
        </div>
        <div class="mj-demo-row mj-demo-row-empty">— deal a round to begin —</div>
      `;
      table.appendChild(seat);
    }
  }
  if (cap) cap.innerHTML = 'Press <strong>Deal a round</strong> to begin.';
  if (status) status.innerHTML = '<span>Round <em>East</em></span>';
  updateButtons();
}

function renderDemoFull() {
  const table = document.querySelector('#demo-table');
  if (!table || !DEMO.game) return;
  const g = DEMO.game;
  table.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const p = g.players[i];
    const seat = document.createElement('div');
    seat.className = 'mj-demo-seat';
    if (i === g.turn && DEMO.mode !== 'ended') seat.classList.add('is-active');
    if (g.winner === i) seat.classList.add('is-winner');

    const head = document.createElement('div');
    head.className = 'mj-demo-seat-head';
    head.innerHTML = `
      <span class="mj-demo-seat-wind">${SEAT_NAMES[i]}<span class="mj-demo-seat-zh">${SEAT_ZH[i]}</span></span>
      <span class="mj-demo-seat-label">${p.isDealer ? 'dealer · 莊' : ''}</span>
    `;
    seat.appendChild(head);

    // hand row
    const handRow = document.createElement('div');
    handRow.className = 'mj-demo-row mj-demo-row-hand';
    const handTiles = document.createElement('div');
    handTiles.className = 'mj-demo-tiles';
    p.hand.forEach(id => handTiles.appendChild(renderTile(id, { size: 'xs', button: false })));
    // melds appended in-line after concealed
    p.melds.forEach(m => {
      const meldGroup = document.createElement('span');
      meldGroup.className = 'mj-demo-meld mj-meld-' + m.type;
      m.tiles.forEach(id => meldGroup.appendChild(renderTile(id, { size: 'xs', button: false })));
      handTiles.appendChild(meldGroup);
    });
    handRow.appendChild(handTiles);
    seat.appendChild(handRow);

    // discard row
    const discRow = document.createElement('div');
    discRow.className = 'mj-demo-row mj-demo-row-discards';
    const discLabel = document.createElement('span');
    discLabel.className = 'mj-demo-row-label';
    discLabel.textContent = 'discards';
    discRow.appendChild(discLabel);
    const discTiles = document.createElement('div');
    discTiles.className = 'mj-demo-tiles mj-demo-tiles-discard';
    p.discards.forEach((id, idx) => {
      const t = renderTile(id, { size: 'xs', button: false });
      if (idx === p.discards.length - 1 && g.lastDiscardSeat === i) t.classList.add('is-fresh');
      discTiles.appendChild(t);
    });
    discRow.appendChild(discTiles);
    seat.appendChild(discRow);

    table.appendChild(seat);
  }
  renderDemoCaption();
  renderDemoStatus();
  updateButtons();
  wrapTermsIn(table);
}

function renderDemoCaption() {
  const cap = document.querySelector('#demo-caption');
  if (!cap || !DEMO.game) return;
  const ev = DEMO.game.lastEvent;
  if (!ev) { cap.innerHTML = 'Hands dealt — East to discard.'; return; }
  const name = i => SEAT_NAMES[i];
  const tileName = id => TILE_BY_ID[id]?.name || id;
  switch (ev.type) {
    case 'draw':
      cap.innerHTML = `<strong>${name(ev.player)}</strong> draws <em>${tileName(ev.tile)}</em>.`;
      break;
    case 'discard':
      cap.innerHTML = `<strong>${name(ev.player)}</strong> discards <em>${tileName(ev.tile)}</em>. <span class="mj-demo-reason">${ev.reason}</span>`;
      break;
    case 'call':
      cap.innerHTML = `<strong>${name(ev.player)}</strong> calls <em>${ev.kind === 'pung' ? 'Pung 碰' : 'Chow 上'}</em> on <em>${tileName(ev.tile)}</em> from ${name(ev.fromSeat)}.`;
      break;
    case 'win':
      if (ev.source === 'self-draw') {
        cap.innerHTML = `<strong>${name(ev.player)}</strong> declares <em>Mahjong 糊</em> on a self-drawn <em>${tileName(ev.tile)}</em>. <span class="mj-demo-result">Round over.</span>`;
      } else {
        cap.innerHTML = `<strong>${name(ev.player)}</strong> declares <em>Mahjong 糊</em> on <em>${name(ev.from)}</em>'s discard of <em>${tileName(ev.tile)}</em>. <span class="mj-demo-result">Round over.</span>`;
      }
      break;
    case 'exhausted':
      cap.innerHTML = `<strong>Wall exhausted.</strong> No winner this round — common outcome, even at a real table.`;
      break;
    default:
      cap.textContent = '';
  }
}

function renderDemoStatus() {
  const status = document.querySelector('#demo-status');
  if (!status || !DEMO.game) return;
  const g = DEMO.game;
  const wallLeft = wallRemaining(g.wall);
  status.innerHTML = `
    <span>Round <em>East</em></span>
    <span>Wall <em>${wallLeft}</em> left</span>
    <span>Turn <em>${SEAT_NAMES[g.turn]}</em></span>
  `;
}

/* ============================================================
   Section 09 — Phase C: play a round (you vs three AI)
   ============================================================ */

const WIND_TILE = ['we', 'ws', 'ww', 'wn'];

/* Scoring values per ruleset. SG uses tai (lower numbers, lower minimum, 5-tai cap). */
const SCORE_VALUES = IS_SG ? {
  thirteen: 8,
  honors: 10,
  great3: 4,
  small3: 2,
  pure: 4,
  mixed: 2,
  allpung: 2,
  common: 1,
  selfdraw: 1,
  concealed: 1,
  dragonpung: 1,
  seatwind: 1,
  roundwind: 1,
  cap: 5,   // Singapore typical limit
} : {
  thirteen: 13,
  honors: 10,
  great3: 8,
  small3: 3,
  pure: 7,
  mixed: 3,
  allpung: 3,
  common: 1,
  selfdraw: 1,
  concealed: 1,
  dragonpung: 1,
  seatwind: 1,
  roundwind: 1,
  cap: null, // HK doesn't cap by default in this app
};

const SCORE_UNIT = IS_SG ? 'tai' : 'faan';

const PRIMARY_NAMES = IS_SG ? {
  honors: 'All Honors',
  great3: 'Great Three Dragons',
  pure:   'Full Color (Pure One Suit)',
  small3: 'Small Three Dragons',
  mixed:  'Half Color (Mixed One Suit)',
  allpung:'All Pong',
  common: 'All Chow',
} : {
  honors: 'All Honors',
  great3: 'Great Three Dragons',
  pure:   'Pure One Suit',
  small3: 'Small Three Dragons',
  mixed:  'Mixed One Suit',
  allpung:'All Pungs',
  common: 'Common Hand',
};

function computeFaan(player, game) {
  const allTiles = [...player.hand, ...player.melds.flatMap(m => m.tiles)];
  const patterns = [];

  if (isThirteenOrphans(allTiles)) {
    patterns.push({ name: 'Thirteen Orphans', zh: '十三么', faan: SCORE_VALUES.thirteen });
    return finaliseScore(patterns);
  }

  const d = decomposeWin(allTiles);
  if (!d) return { patterns: [], total: 0 };

  let chows = 0;
  const pungTiles = [];
  for (const s of d.sets) {
    const k = classifySet(s);
    if (k === 'chow') chows++;
    else if (k === 'pung' || k === 'kong') pungTiles.push(s[0]);
  }

  const suits = new Set();
  let hasHonor = false;
  for (const id of allTiles) {
    const c = tileCode(id);
    if (c >= 27) hasHonor = true;
    else suits.add(Math.floor(c / 9));
  }

  const dragonPungs = pungTiles.filter(id => ['dr','dg','dw'].includes(id));
  const dragonPair = ['dr','dg','dw'].includes(d.pair[0]);
  const pairTile = TILE_BY_ID[d.pair[0]];
  const seatWindId = WIND_TILE[player.seatIdx];
  const roundWindId = WIND_TILE[0]; // East round in our demo

  let primary = null;

  if (suits.size === 0 && hasHonor) {
    primary = { name: PRIMARY_NAMES.honors, zh: '字一色', faan: SCORE_VALUES.honors };
  } else if (dragonPungs.length === 3) {
    primary = { name: PRIMARY_NAMES.great3, zh: '大三元', faan: SCORE_VALUES.great3 };
  } else if (suits.size === 1 && !hasHonor) {
    primary = { name: PRIMARY_NAMES.pure, zh: '清一色', faan: SCORE_VALUES.pure };
  } else if (dragonPungs.length === 2 && dragonPair) {
    primary = { name: PRIMARY_NAMES.small3, zh: '小三元', faan: SCORE_VALUES.small3 };
  } else if (suits.size === 1 && hasHonor) {
    primary = { name: PRIMARY_NAMES.mixed, zh: '混一色', faan: SCORE_VALUES.mixed };
  } else if (pungTiles.length === 4) {
    primary = { name: PRIMARY_NAMES.allpung, zh: '對對胡', faan: SCORE_VALUES.allpung };
  } else if (chows === 4 && pairTile && !pairTile.isHonor) {
    const valuePair = ['dr','dg','dw'].includes(d.pair[0]) || d.pair[0] === seatWindId || d.pair[0] === roundWindId;
    if (!valuePair) primary = { name: PRIMARY_NAMES.common, zh: '平胡', faan: SCORE_VALUES.common };
  }
  if (primary) patterns.push(primary);

  if (game.winSource === 'self-draw') patterns.push({ name: 'Self-Draw', zh: '自摸', faan: SCORE_VALUES.selfdraw });
  if (player.melds.length === 0) patterns.push({ name: 'Concealed', zh: '門前清', faan: SCORE_VALUES.concealed });

  if (!primary || (primary.zh !== '大三元' && primary.zh !== '小三元')) {
    for (const dp of dragonPungs) {
      patterns.push({ name: `${TILE_BY_ID[dp].name} Pung`, zh: '番牌', faan: SCORE_VALUES.dragonpung });
    }
  }

  if (pungTiles.includes(seatWindId)) {
    patterns.push({ name: `Seat ${SEAT_NAMES[player.seatIdx]} Pung`, zh: '番牌', faan: SCORE_VALUES.seatwind });
  }
  if (seatWindId !== roundWindId && pungTiles.includes(roundWindId)) {
    patterns.push({ name: 'Round East Pung', zh: '番牌', faan: SCORE_VALUES.roundwind });
  }

  return finaliseScore(patterns);
}

function finaliseScore(patterns) {
  const raw = patterns.reduce((sum, p) => sum + p.faan, 0);
  // Apply Singapore cap (5 tai). Hands above cap still display patterns but
  // total is clamped at cap, with an annotation.
  let total = raw;
  let capped = false;
  if (SCORE_VALUES.cap && raw > SCORE_VALUES.cap) {
    total = SCORE_VALUES.cap;
    capped = true;
  }
  return { patterns, total, raw, capped };
}

/* ---------- Phase C controller ---------- */

const PLAY = {
  game: null,
  mode: 'idle',          // idle / playing / awaiting-discard / awaiting-call / ended
  speedMs: 500,
  timer: null,
  pendingCall: null,
  humanSeat: 0,
  structureBuilt: false, // structural DOM is built once per game
  eventCount: 0,         // safety counter against runaway rounds
  maxEvents: 280,
  stepping: false,       // re-entrancy guard for runPlayStep
};

function initPlay() {
  const table = document.querySelector('#play-table');
  if (!table) return;
  document.querySelectorAll('[data-play]').forEach(el => {
    const action = el.dataset.play;
    if (action === 'speed') {
      el.addEventListener('change', () => { PLAY.speedMs = parseInt(el.value, 10) || 600; });
      PLAY.speedMs = parseInt(el.value, 10) || 600;
      return;
    }
    el.addEventListener('click', () => playAction(action));
  });
  renderPlayIdle();
}

function playAction(action) {
  if (action === 'start' || action === 'newround') {
    if (PLAY.timer) { clearTimeout(PLAY.timer); PLAY.timer = null; }
    PLAY.game = newDemoGame();
    PLAY.mode = 'playing';
    PLAY.pendingCall = null;
    PLAY.eventCount = 0;
    PLAY.structureBuilt = false; // force rebuild on new game
    renderPlayFull();
    schedulePlayStep();
  } else if (action === 'resign') {
    if (PLAY.timer) { clearTimeout(PLAY.timer); PLAY.timer = null; }
    PLAY.game = null;
    PLAY.mode = 'idle';
    PLAY.pendingCall = null;
    PLAY.structureBuilt = false;
    renderPlayIdle();
  }
}

function schedulePlayStep() {
  if (PLAY.timer) clearTimeout(PLAY.timer);
  PLAY.timer = setTimeout(runPlayStep, PLAY.speedMs);
}

/* Advance the engine one event. Robust against:
   - re-entrancy (multiple timers firing on top of each other)
   - runaway rounds (hard cap on total events)
   - chains of 'pass' events (iterative drain, no recursion stack growth) */
function runPlayStep() {
  if (PLAY.mode !== 'playing') return;
  if (PLAY.stepping) return;
  PLAY.stepping = true;
  try {
    // Drain consecutive 'pass' events iteratively. In practice no two passes
    // chain (a pass advances to a draw), but the iterative form is safer.
    let ev = null;
    let drains = 0;
    while (true) {
      if (++PLAY.eventCount > PLAY.maxEvents) {
        if (PLAY.game) {
          PLAY.game.phase = 'end';
          PLAY.game.lastEvent = { type: 'exhausted' };
        }
        PLAY.mode = 'ended';
        renderPlayFull();
        return;
      }
      ev = stepGame(PLAY.game, PLAY.humanSeat);
      if (!ev) return;
      if (ev.type !== 'pass') break;
      if (++drains > 8) break; // belt-and-braces against pathological loops
    }

    if (ev.type === 'awaiting-discard') {
      PLAY.mode = 'awaiting-discard';
      renderPlayFull();
      return;
    }
    if (ev.type === 'awaiting-call') {
      PLAY.mode = 'awaiting-call';
      PLAY.pendingCall = ev.call;
      renderPlayFull();
      return;
    }
    renderPlayFull();
    if (ev.type === 'win' || ev.type === 'exhausted') {
      PLAY.mode = 'ended';
      return;
    }
    schedulePlayStep();
  } finally {
    PLAY.stepping = false;
  }
}

function humanDiscardTile(tileId) {
  if (PLAY.mode !== 'awaiting-discard') return;
  const g = PLAY.game;
  const p = g.players[PLAY.humanSeat];
  const idx = p.hand.indexOf(tileId);
  if (idx < 0) return;
  p.hand.splice(idx, 1);
  p.discards.push(tileId);
  g.lastDiscard = tileId;
  g.lastDiscardSeat = PLAY.humanSeat;
  g.phase = 'call';
  g.lastEvent = { type: 'discard', player: PLAY.humanSeat, tile: tileId, reason: 'You discarded this.' };
  PLAY.mode = 'playing';
  renderPlayFull();
  schedulePlayStep();
}

function humanAcceptCall() {
  if (PLAY.mode !== 'awaiting-call' || !PLAY.pendingCall) return;
  const g = PLAY.game;
  executeCall(g, PLAY.pendingCall);
  if (PLAY.pendingCall.kind === 'win') g.winTile = g.lastDiscard;
  PLAY.pendingCall = null;
  if (g.phase === 'end') {
    PLAY.mode = 'ended';
    renderPlayFull();
    return;
  }
  PLAY.mode = 'awaiting-discard'; // caller (you) must discard now
  renderPlayFull();
}

function humanDeclineCall() {
  if (PLAY.mode !== 'awaiting-call') return;
  const g = PLAY.game;
  g.turn = (g.lastDiscardSeat + 1) % 4;
  g.phase = 'draw';
  g.lastEvent = { type: 'pass' };
  PLAY.pendingCall = null;
  PLAY.mode = 'playing';
  renderPlayFull();
  schedulePlayStep();
}

/* ---------- Phase C renderer ---------- */

function renderPlayIdle() {
  const table = document.querySelector('#play-table');
  const action = document.querySelector('#play-action');
  const status = document.querySelector('#play-status');
  if (!table) return;
  table.innerHTML = `
    <div class="mj-play-welcome">
      <div class="mj-play-welcome-h">Ready when you are.</div>
      <p>You'll sit as <strong>East</strong> — the dealer for this round. The three other seats will be played by the AI you've already met. Your tiles will be face-up; theirs will be hidden, like a real table. Call pung, chow, or mahjong when the right discard appears.</p>
    </div>
  `;
  if (action) action.innerHTML = '<button class="mj-btn mj-btn-primary" data-play="start">▶ Deal me in</button>';
  if (status) { status.innerHTML = ''; delete status.dataset.built; }
  document.querySelectorAll('[data-play="start"]').forEach(b => b.addEventListener('click', () => playAction('start')));
}

/* Build the 4-seat scaffolding ONCE per game. Subsequent updates only swap
   the dynamic children (hand tiles + discards). This removes ~95% of the
   per-event DOM churn that was making long rounds feel like a hang. */
function ensurePlayStructure() {
  const table = document.querySelector('#play-table');
  if (!table || !PLAY.game) return;
  if (PLAY.structureBuilt) return;
  table.innerHTML = '';
  // Visual order: opponents first (South, West, North), then YOU at the bottom.
  const order = [1, 2, 3, PLAY.humanSeat];
  order.forEach(i => {
    const isYou = (i === PLAY.humanSeat);
    const p = PLAY.game.players[i];
    const seat = document.createElement('div');
    seat.className = 'mj-play-seat' + (isYou ? ' is-you' : ' is-opp');
    seat.dataset.seat = String(i);
    seat.innerHTML = `
      <div class="mj-play-seat-head">
        <span class="mj-play-seat-name">${SEAT_NAMES[i]}<span class="mj-play-seat-zh">${SEAT_ZH[i]}</span></span>
        <span class="mj-play-seat-meta">${p.isDealer ? 'dealer 莊' : ''}${isYou ? ' · YOU' : ''}</span>
      </div>
      <div class="mj-play-hand-wrap"><div class="mj-play-hand-tiles" data-role="hand"></div></div>
      <div class="mj-play-discards">
        <span class="mj-play-row-label">${isYou ? 'your discards' : 'discards'}</span>
        <div class="mj-play-disc-tiles" data-role="discards"></div>
      </div>
    `;
    table.appendChild(seat);
  });
  PLAY.structureBuilt = true;
  // One-time wrap of the static Chinese in seat heads. Dynamic captions are
  // handled by wrapTermsIn(bar) inside renderPlayActionBar.
  wrapTermsIn(table);
}

/* Update only the dynamic content of one seat — tiles & discards.
   The seat scaffold and seat-head remain intact across events. */
function updatePlaySeat(seat, i) {
  const g = PLAY.game;
  if (!g) return;
  const p = g.players[i];
  const isYou = (i === PLAY.humanSeat);

  seat.classList.toggle('is-active', i === g.turn && PLAY.mode !== 'ended');
  seat.classList.toggle('is-winner', g.winner === i);

  const handHost = seat.querySelector('[data-role="hand"]');
  if (handHost) {
    // Build new children in a fragment, then swap — single reflow.
    const frag = document.createDocumentFragment();
    if (isYou) {
      const actionable = (PLAY.mode === 'awaiting-discard');
      p.hand.forEach(id => {
        const t = renderTile(id, {
          size: 'sm',
          onClick: () => {
            if (PLAY.mode === 'awaiting-discard') humanDiscardTile(id);
          },
        });
        if (actionable) t.classList.add('is-actionable');
        frag.appendChild(t);
      });
    } else {
      for (let k = 0; k < p.hand.length; k++) {
        const back = document.createElement('span');
        back.className = 'mj-tile-back mj-tile--sm';
        back.setAttribute('aria-label', 'hidden tile');
        frag.appendChild(back);
      }
    }
    if (p.melds.length) {
      const meldsWrap = document.createElement('span');
      meldsWrap.className = 'mj-play-melds';
      p.melds.forEach(m => {
        const meld = document.createElement('span');
        meld.className = 'mj-play-meld mj-meld-' + m.type;
        m.tiles.forEach(id => meld.appendChild(renderTile(id, { size: 'sm', button: false })));
        meldsWrap.appendChild(meld);
      });
      frag.appendChild(meldsWrap);
    }
    handHost.replaceChildren(frag);
  }

  const discHost = seat.querySelector('[data-role="discards"]');
  if (discHost) {
    const frag = document.createDocumentFragment();
    // Cap display at the last 36 tiles to keep rows bounded even on long rounds.
    const showFrom = Math.max(0, p.discards.length - 36);
    const justDiscarded = g.lastEvent && g.lastEvent.type === 'discard' && g.lastDiscardSeat === i;
    for (let k = showFrom; k < p.discards.length; k++) {
      const t = renderTile(p.discards[k], { size: 'xs', button: false });
      if (k === p.discards.length - 1 && justDiscarded) t.classList.add('is-fresh');
      frag.appendChild(t);
    }
    discHost.replaceChildren(frag);
  }
}

function renderPlayFull() {
  if (!PLAY.game) return;
  ensurePlayStructure();
  const seats = document.querySelectorAll('#play-table .mj-play-seat');
  seats.forEach(seat => {
    const i = parseInt(seat.dataset.seat, 10);
    if (!Number.isNaN(i)) updatePlaySeat(seat, i);
  });
  renderPlayActionBar();
  renderPlayStatus();
  if (PLAY.mode === 'ended') renderPlayWinBanner();
}

function renderPlayActionBar() {
  const bar = document.querySelector('#play-action');
  if (!bar) return;
  bar.innerHTML = '';
  if (PLAY.mode === 'awaiting-discard') {
    const msg = document.createElement('div');
    msg.className = 'mj-play-prompt';
    msg.innerHTML = '<strong>Your turn.</strong> Click any tile in your hand to discard it.';
    bar.appendChild(msg);
    return;
  }
  if (PLAY.mode === 'awaiting-call' && PLAY.pendingCall) {
    const c = PLAY.pendingCall;
    const tile = TILE_BY_ID[PLAY.game.lastDiscard];
    const from = SEAT_NAMES[PLAY.game.lastDiscardSeat];
    const kindLabel = c.kind === 'win' ? 'Mahjong 糊' : c.kind === 'pung' ? 'Pung 碰' : 'Chow 上';
    const promptText = c.kind === 'win'
      ? `<strong>You can declare Mahjong</strong> on ${from}'s <em>${tile.name}</em>!`
      : `<strong>${from} discarded ${tile.name}.</strong> You can call <em>${kindLabel}</em>.`;
    const msg = document.createElement('div');
    msg.className = 'mj-play-prompt mj-play-prompt-call';
    msg.innerHTML = promptText;
    bar.appendChild(msg);

    // Show the would-be meld preview
    if (c.kind !== 'win') {
      const preview = document.createElement('div');
      preview.className = 'mj-play-call-preview';
      c.tiles.forEach(id => preview.appendChild(renderTile(id, { size: 'sm', button: false })));
      bar.appendChild(preview);
    }

    const btnRow = document.createElement('div');
    btnRow.className = 'mj-play-prompt-btns';
    const accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'mj-btn mj-btn-primary';
    accept.textContent = c.kind === 'win' ? 'Declare Mahjong' : c.kind === 'pung' ? 'Pung 碰' : 'Chow 上';
    accept.addEventListener('click', humanAcceptCall);
    const decline = document.createElement('button');
    decline.type = 'button';
    decline.className = 'mj-btn';
    decline.textContent = 'Skip';
    decline.addEventListener('click', humanDeclineCall);
    btnRow.appendChild(accept); btnRow.appendChild(decline);
    bar.appendChild(btnRow);
    return;
  }
  if (PLAY.mode === 'ended') {
    bar.innerHTML = `
      <button class="mj-btn mj-btn-primary" data-play="newround">▶ Deal another round</button>
      <button class="mj-btn" data-play="resign">↺ Reset</button>
    `;
    bar.querySelectorAll('[data-play]').forEach(b => b.addEventListener('click', () => playAction(b.dataset.play)));
    return;
  }
  // Playing / AI thinking
  const ev = PLAY.game?.lastEvent;
  if (ev) {
    const msg = document.createElement('div');
    msg.className = 'mj-play-prompt';
    const name = SEAT_NAMES[ev.player ?? PLAY.game.turn];
    if (ev.type === 'draw') {
      msg.innerHTML = `<em>${name} draws.</em>`;
    } else if (ev.type === 'discard') {
      msg.innerHTML = `<em>${name} discarded <strong>${TILE_BY_ID[ev.tile].name}</strong>.</em>`;
    } else if (ev.type === 'call') {
      const kind = ev.kind === 'pung' ? 'Pung 碰' : 'Chow 上';
      msg.innerHTML = `<em>${name} called <strong>${kind}</strong> on ${TILE_BY_ID[ev.tile].name} from ${SEAT_NAMES[ev.fromSeat]}.</em>`;
    } else {
      msg.innerHTML = '<em>…</em>';
    }
    bar.appendChild(msg);
  }
  wrapTermsIn(bar);
}

function renderPlayStatus() {
  const status = document.querySelector('#play-status');
  if (!status || !PLAY.game) return;
  const g = PLAY.game;
  // Build the structure once; subsequent calls only update text values.
  if (!status.dataset.built) {
    status.innerHTML = `
      <span>Round <em data-stat="round">East</em></span>
      <span>Wall <em data-stat="wall">—</em> left</span>
      <span>Turn <em data-stat="turn">—</em></span>
    `;
    status.dataset.built = '1';
  }
  const wallEl = status.querySelector('[data-stat="wall"]');
  const turnEl = status.querySelector('[data-stat="turn"]');
  if (wallEl) wallEl.textContent = String(wallRemaining(g.wall));
  if (turnEl) turnEl.textContent = PLAY.mode === 'ended' ? '—' : SEAT_NAMES[g.turn];
}

function renderPlayWinBanner() {
  const bar = document.querySelector('#play-action');
  if (!bar) return;
  bar.innerHTML = '';
  const g = PLAY.game;
  const banner = document.createElement('div');
  banner.className = 'mj-play-banner';

  if (g.winner === null || g.winner === undefined) {
    banner.classList.add('is-draw');
    banner.innerHTML = `<div class="mj-play-banner-h">Wall exhausted</div><p>No winner this round — common at any table. Deal again.</p>`;
  } else {
    const won = g.winner === PLAY.humanSeat;
    const winner = g.players[g.winner];
    const score = computeFaan(winner, g);
    banner.classList.add(won ? 'is-win' : 'is-loss');
    const winTileName = TILE_BY_ID[g.winTile]?.name || '';
    const headline = won
      ? `🎉 <strong>You won</strong> on ${g.winSource === 'self-draw' ? 'a self-drawn' : SEAT_NAMES[g.lastDiscardSeat] + "'s discarded"} <em>${winTileName}</em>.`
      : `<strong>${SEAT_NAMES[g.winner]} won</strong> on ${g.winSource === 'self-draw' ? 'a self-drawn' : SEAT_NAMES[g.lastDiscardSeat] + "'s discarded"} <em>${winTileName}</em>.`;
    const unit = SCORE_UNIT;
    const minUnit = IS_SG ? 1 : 3;
    const capLine = score.capped
      ? `<p class="mj-play-faan-warn">Singapore caps payout at ${SCORE_VALUES.cap} ${unit} — raw total ${score.raw} ${unit} clamped to ${score.total}.</p>`
      : '';
    const underMinLine = (!score.capped && score.total < minUnit)
      ? `<p class="mj-play-faan-warn">Under ${minUnit} ${unit} — at most tables this hand would not be declarable. We show it for educational purposes.</p>`
      : '';
    const patternsHtml = score.patterns.length
      ? `<table class="mj-play-faan">${score.patterns.map(p => `<tr><td>${p.name}</td><td class="mj-play-faan-zh">${p.zh}</td><td class="mj-play-faan-val">${p.faan} ${unit}</td></tr>`).join('')}<tr class="mj-play-faan-total"><td>Total</td><td></td><td class="mj-play-faan-val">${score.total} ${unit}${score.capped ? ' (cap)' : ''}</td></tr></table>`
      : `<p class="mj-play-faan-none">No scoring patterns — would not actually win under a ${minUnit}-${unit} minimum.</p>`;
    banner.innerHTML = `
      <div class="mj-play-banner-h">${headline}</div>
      ${patternsHtml}
      ${capLine}${underMinLine}
    `;
  }
  bar.appendChild(banner);
  const btnRow = document.createElement('div');
  btnRow.className = 'mj-play-prompt-btns';
  btnRow.innerHTML = `
    <button class="mj-btn mj-btn-primary" data-play="newround">▶ Deal another round</button>
    <button class="mj-btn" data-play="resign">↺ Reset</button>
  `;
  btnRow.querySelectorAll('[data-play]').forEach(b => b.addEventListener('click', () => playAction(b.dataset.play)));
  bar.appendChild(btnRow);
  wrapTermsIn(banner);
}

/* ============================================================
   Boot + self-test
   ============================================================ */

function selfTest() {
  console.assert(isWinningHand(['d1','d2','d3','b4','b5','b6','c7','c8','c9','we','we','we','dr','dr']), 'standard win');
  console.assert(!isWinningHand(['d1','d2','d3','b4','b5','b6','c7','c8','c9','we','ws','ww','dr','dr']), 'lone winds reject');
  console.assert(isThirteenOrphans(['d1','d9','b1','b9','c1','c9','we','ws','ww','wn','dr','dg','dw','dw']), '13 orphans');
  const w = findWaits(['d1','d2','d3','d4','d5','d6','d7','d8','d9','b5','b5','b5','c2']);
  console.assert(w.length === 1 && w[0] === 'c2', 'pair wait: ' + JSON.stringify(w));
}

document.addEventListener('DOMContentLoaded', () => {
  applyRulesetText();          // fills [data-rs="..."] elements + wires ruleset buttons
  initNav();
  initTileExplorer();
  initHands();
  initValidInvalid();
  initSandbox();
  initActions();
  initFaan();
  initScenarios();
  initDrills();
  initDemo();
  initPlay();
  // Wrap Chinese terms in tooltip spans AFTER all dynamic content has rendered.
  wrapTermsIn(document.body);
  selfTest();
});
