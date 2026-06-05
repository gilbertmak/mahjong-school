import { renderToStaticMarkup } from 'react-dom/server';
import { SUIT, tilesForRuleset, tileByIdForRuleset, PLAYABLE_TILE_IDS, tileCode, codeToId, handToCounts } from './domain/tiles';
import { Tile as TileComponent } from './components/tiles/Tile';
import { TileRow as TileRowComponent } from './components/tiles/TileRow';
import { Meld as MeldComponent } from './components/tiles/Meld';
import { TileInfoCard } from './components/tiles/TileInfoCard';
import { PlayerSeat } from './components/game/PlayerSeat';
import { canFormSets, isThirteenOrphans, isWinningHand, findWaits, decomposeWin, collectSets, classifySet } from './domain/handValidation';
import { HANDS, createActions, PRIORITY, createScenarios, DRILL_STATS } from './content';
import { getFaanCatalog, getScoreValues, computeFaan } from './domain/scoring';
import { createDemoInitialState, demoReducer, shouldScheduleDemo } from './state/demoReducer';
import { createPlayInitialState, playReducer, shouldSchedulePlay } from './state/playReducer';

'use strict';

/* ============================================================
   Ruleset bootstrap — switches between Hong Kong Old Style and Singapore
   ============================================================ */

const VALID_RULESETS = ['hk', 'sg'];
const RULESET_STORAGE = 'mj-ruleset';

function isValidRuleset(value) {
  return VALID_RULESETS.includes(value);
}

function getStoredRuleset() {
  try {
    const v = localStorage.getItem(RULESET_STORAGE);
    if (isValidRuleset(v)) return v;
  } catch {}
  return 'hk';
}

let currentRuleset = getStoredRuleset();
let IS_SG;
let IS_HK;
let UNIT;
let UNIT_CAP;
let MIN_TO_WIN;
let TILES;
let TILE_BY_ID;
let ACTIONS;
let SCENARIOS;
let FAAN;
let SCORE_VALUES;
let SCORE_UNIT;

function updateRulesetDerivatives(ruleset = currentRuleset) {
  currentRuleset = isValidRuleset(ruleset) ? ruleset : 'hk';
  IS_SG = currentRuleset === 'sg';
  IS_HK = currentRuleset === 'hk';
  UNIT = IS_SG ? 'tai' : 'faan';
  UNIT_CAP = IS_SG ? 'Tai' : 'Faan';
  MIN_TO_WIN = IS_SG ? 1 : 3;
  TILES = tilesForRuleset(currentRuleset);
  TILE_BY_ID = tileByIdForRuleset(currentRuleset);
  ACTIONS = createActions(UNIT);
  SCENARIOS = createScenarios(UNIT, IS_SG);
  FAAN = getFaanCatalog(currentRuleset);
  SCORE_VALUES = getScoreValues(currentRuleset);
  SCORE_UNIT = UNIT;
}

updateRulesetDerivatives();

function setRuntimeRuleset(ruleset) {
  if (!isValidRuleset(ruleset) || ruleset === currentRuleset) return;
  updateRulesetDerivatives(ruleset);
  refreshRulesetViews();
}

window.addEventListener('mj-ruleset-change', event => {
  setRuntimeRuleset(event.detail?.ruleset);
});

/* ============================================================
   Tile data — HKOS standard + Singapore animals when ruleset = sg
   ============================================================ */


/* ============================================================
   Tile rendering — paper card w/ double frame
   ============================================================ */

function componentToElement(component) {
  const template = document.createElement('template');
  template.innerHTML = renderToStaticMarkup(component).trim();
  return template.content.firstElementChild || document.createTextNode('');
}

function renderTile(idOrTile, opts = {}) {
  const t = typeof idOrTile === 'string' ? TILE_BY_ID[idOrTile] : idOrTile;
  if (!t) return document.createTextNode('');
  const el = componentToElement(TileComponent({ tile: t, size: opts.size, button: opts.button !== false }));
  if (opts.onClick) el.addEventListener('click', () => opts.onClick(t, el));
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
  return componentToElement(TileRowComponent({ tileIds, tileById: TILE_BY_ID, size: opts.size, gap: opts.gap ?? 3 }));
}


/* ============================================================
   Sidenav active highlight + mobile menu
   (Single theme — no theme switcher. Ruleset switching lives in
   the React ruleset context in src/state/RulesetContext.tsx.)
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

function getFilterGroups() {
  return [
    { id:'all',    label:'All tiles', test:t => true },
    { id:'suit',   label:'Suits',     test:t => t.group === 'suit' },
    { id:'honor',  label:'Honors',    test:t => t.group === 'honor' },
    { id:'bonus',  label:'Bonus',     test:t => t.group === 'bonus' },
    ...(IS_SG ? [{ id:'animal', label:'Animals', test:t => t.group === 'animal' }] : []),
  ];
}

function initTileExplorer() {
  const pillHost = document.querySelector('#tile-pills');
  const gridHost = document.querySelector('#tile-grid');
  if (!pillHost || !gridHost) return;

  let active = 'all';

  function render() {
    pillHost.innerHTML = '';
    const filterGroups = getFilterGroups();
    filterGroups.forEach(f => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mj-pill' + (active === f.id ? ' is-active' : '');
      const count = TILES.filter(f.test).length;
      pill.innerHTML = `${f.label}<span class="mj-pill-count">${count}</span>`;
      pill.addEventListener('click', () => { active = f.id; render(); });
      pillHost.appendChild(pill);
    });

    gridHost.innerHTML = '';
    if (!filterGroups.some(f => f.id === active)) active = 'all';
    const filter = filterGroups.find(f => f.id === active).test;
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
  const nextCard = componentToElement(TileInfoCard({ tile, role: describeTileRole(tile) }));
  card.replaceChildren(...nextCard.childNodes);
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
function handPts(h) {
  return IS_SG ? (h.ptsSG || h.pts) : h.pts;
}

function initHands() {
  const host = document.querySelector('#hand-accordion');
  const stageHost = document.querySelector('#hand-stage');
  if (!host || !stageHost) return;

  host.innerHTML = '';
  stageHost.innerHTML = '';

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

const MELD_LABELS = {
  chow: { en: 'Chow', zh: '上' },
  pung: { en: 'Pung', zh: '碰' },
  kong: { en: 'Kong', zh: '槓' },
  pair: { en: 'Pair', zh: '眼' },
};

function renderMeld(tiles, type, opts = {}) {
  return componentToElement(MeldComponent({ tiles, type, tileById: TILE_BY_ID, size: opts.size || 'sm' }));
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


function initActions() {
  const host = document.querySelector('#action-list');
  if (host) {
    host.innerHTML = '';
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
    phost.innerHTML = '';
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

function initFaan() {
  const host = document.querySelector('#faan-grid');
  if (!host) return;
  host.innerHTML = '';
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

function roundTransitionDeps() {
  return {
    drawFromWall,
    sortHand,
    discardSuggestion,
    isWinningHand,
  };
}

/* ---------- Demo controller ---------- */

let DEMO = createDemoInitialState();
let demoTimer = null;

function dispatchDemo(action) {
  DEMO = demoReducer(DEMO, action);
}

function clearDemoTimer() {
  if (demoTimer) { clearTimeout(demoTimer); demoTimer = null; }
}

function initDemo() {
  const table = document.querySelector('#demo-table');
  if (!table) return;
  document.querySelectorAll('[data-demo]').forEach(el => {
    const action = el.dataset.demo;
    if (action === 'speed') {
      el.addEventListener('change', () => { dispatchDemo({ type: 'set-speed', speedMs: parseInt(el.value, 10) || 700 }); });
      dispatchDemo({ type: 'set-speed', speedMs: parseInt(el.value, 10) || 700 });
      return;
    }
    el.addEventListener('click', () => demoAction(action));
  });
  renderDemoIdle();
}

function demoAction(action) {
  if (action === 'play') {
    dispatchDemo({ type: 'play', game: (DEMO.mode === 'idle' || DEMO.mode === 'ended') ? newDemoGame() : undefined });
    if (DEMO.game) renderDemoFull();
    updateButtons();
    scheduleNextStep();
  } else if (action === 'pause') {
    pauseDemo();
  } else if (action === 'step') {
    clearDemoTimer();
    const wasNewRound = DEMO.mode === 'idle' || DEMO.mode === 'ended';
    dispatchDemo({ type: 'step', game: wasNewRound ? newDemoGame() : undefined, deps: roundTransitionDeps(), pause: true });
    renderDemoFull();
    updateButtons();
  } else if (action === 'restart') {
    clearDemoTimer();
    dispatchDemo({ type: 'restart' });
    renderDemoIdle();
  }
}

function pauseDemo() {
  clearDemoTimer();
  dispatchDemo({ type: 'pause' });
  updateButtons();
}

function scheduleNextStep() {
  clearDemoTimer();
  if (!shouldScheduleDemo(DEMO)) return;
  demoTimer = setTimeout(() => {
    if (!shouldScheduleDemo(DEMO)) return;
    runOneStep();
    scheduleNextStep();
  }, DEMO.speedMs);
}

function runOneStep() {
  dispatchDemo({ type: 'step', deps: roundTransitionDeps() });
  renderDemoFull();
  if (!shouldScheduleDemo(DEMO)) clearDemoTimer();
  updateButtons();
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
      table.appendChild(componentToElement(PlayerSeat({
        seatIndex: i,
        name: SEAT_NAMES[i],
        zh: SEAT_ZH[i],
        hand: [],
        discards: [],
        tileById: TILE_BY_ID,
        variant: 'demo',
        isDealer: i === 0,
        empty: true,
      })));
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
    table.appendChild(componentToElement(PlayerSeat({
      seatIndex: i,
      name: SEAT_NAMES[i],
      zh: SEAT_ZH[i],
      hand: p.hand,
      discards: p.discards,
      melds: p.melds,
      tileById: TILE_BY_ID,
      variant: 'demo',
      isDealer: p.isDealer,
      isActive: i === g.turn && DEMO.mode !== 'ended',
      isWinner: g.winner === i,
      lastDiscardFresh: g.lastDiscardSeat === i,
    })));
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

let PLAY = createPlayInitialState();
let playTimer = null;

function dispatchPlay(action) {
  PLAY = playReducer(PLAY, action);
}

function clearPlayTimer() {
  if (playTimer) { clearTimeout(playTimer); playTimer = null; }
}

function initPlay() {
  const table = document.querySelector('#play-table');
  if (!table) return;
  document.querySelectorAll('[data-play]').forEach(el => {
    const action = el.dataset.play;
    if (action === 'speed') {
      el.addEventListener('change', () => { dispatchPlay({ type: 'set-speed', speedMs: parseInt(el.value, 10) || 600 }); });
      dispatchPlay({ type: 'set-speed', speedMs: parseInt(el.value, 10) || 600 });
      return;
    }
    el.addEventListener('click', () => playAction(action));
  });
  renderPlayIdle();
}

function playAction(action) {
  if (action === 'start' || action === 'newround') {
    clearPlayTimer();
    dispatchPlay({ type: 'start', game: newDemoGame() });
    renderPlayFull();
    schedulePlayStep();
  } else if (action === 'resign') {
    clearPlayTimer();
    dispatchPlay({ type: 'resign' });
    renderPlayIdle();
  }
}

function schedulePlayStep() {
  clearPlayTimer();
  if (!shouldSchedulePlay(PLAY)) return;
  playTimer = setTimeout(runPlayStep, PLAY.speedMs);
}

function runPlayStep() {
  if (!shouldSchedulePlay(PLAY)) return;
  dispatchPlay({ type: 'tick', deps: roundTransitionDeps() });
  renderPlayFull();
  schedulePlayStep();
}

function humanDiscardTile(tileId) {
  dispatchPlay({ type: 'human-discard', tileId });
  renderPlayFull();
  schedulePlayStep();
}

function humanAcceptCall() {
  dispatchPlay({ type: 'human-accept-call' });
  renderPlayFull();
}

function humanDeclineCall() {
  dispatchPlay({ type: 'human-decline-call' });
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
    table.appendChild(componentToElement(PlayerSeat({
      seatIndex: i,
      name: SEAT_NAMES[i],
      zh: SEAT_ZH[i],
      hand: [],
      discards: [],
      melds: [],
      tileById: TILE_BY_ID,
      variant: 'play',
      isYou,
      isDealer: p.isDealer,
      hiddenHand: !isYou,
    })));
  });
  dispatchPlay({ type: 'structure-built' });
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
  const actionable = isYou && PLAY.mode === 'awaiting-discard';
  const justDiscarded = g.lastEvent && g.lastEvent.type === 'discard' && g.lastDiscardSeat === i;
  const nextSeat = componentToElement(PlayerSeat({
    seatIndex: i,
    name: SEAT_NAMES[i],
    zh: SEAT_ZH[i],
    hand: p.hand,
    discards: p.discards,
    melds: p.melds,
    tileById: TILE_BY_ID,
    variant: 'play',
    isYou,
    isDealer: p.isDealer,
    isActive: i === g.turn && PLAY.mode !== 'ended',
    isWinner: g.winner === i,
    hiddenHand: !isYou,
    actionable,
    lastDiscardFresh: justDiscarded,
    discardLimit: 36,
  }));

  seat.className = nextSeat.className;

  const handHost = seat.querySelector('[data-role="hand"]');
  const nextHandHost = nextSeat.querySelector('[data-role="hand"]');
  if (handHost && nextHandHost) {
    handHost.replaceChildren(...nextHandHost.childNodes);
    if (actionable) {
      handHost.querySelectorAll('.mj-tile').forEach(tileEl => {
        tileEl.addEventListener('click', () => humanDiscardTile(tileEl.dataset.tileId));
      });
    }
  }

  const discHost = seat.querySelector('[data-role="discards"]');
  const nextDiscHost = nextSeat.querySelector('[data-role="discards"]');
  if (discHost && nextDiscHost) {
    discHost.replaceChildren(...nextDiscHost.childNodes);
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
    const score = computeFaan(winner, g, currentRuleset, SEAT_NAMES);
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

function refreshRulesetViews() {
  initTileExplorer();
  initHands();
  initSandbox();
  initActions();
  initFaan();
  initScenarios();

  clearDemoTimer();
  DEMO = createDemoInitialState({ speedMs: DEMO.speedMs });
  renderDemoIdle();

  clearPlayTimer();
  PLAY = createPlayInitialState({ speedMs: PLAY.speedMs });
  renderPlayIdle();

  wrapTermsIn(document.body);
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
