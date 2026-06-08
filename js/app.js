// ══════════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════════
let DB = { entities: [] };
let fuse = null;
let graphBuilt = false;
let currentFilter = 'all';
let currentDetailId = null;

const TRADITION_LABELS = {
  greek:'Greek', roman:'Roman', egyptian:'Egyptian', mesopotamian:'Mesopotamian',
  biblical_angel:'Biblical', enochian:'Enochian', kabbalistic:'Kabbalah',
  hermetic:'Hermetic', gnostic:'Gnostic', goetic:'Goetic',
  islamic:'Islamic', planetary:'Planetary',
  canaanite:'Canaanite', hindu:'Hindu'
};

const TRADITION_ORDER = [
  'biblical_angel','enochian','kabbalistic','hermetic','gnostic',
  'greek','roman','egyptian','mesopotamian','canaanite','hindu','goetic','islamic','planetary'
];

const LEVEL_LABELS = {
  1:'Level I — Primordial Source & Supreme Principle',
  2:'Level II — First Emanations / Highest Orders',
  3:'Level III — Sovereign Rulers & Cosmic Archons',
  4:'Level IV — Mediators, Patriarchs & Liminal Figures',
  5:'Level V — Powers of Nature & Domain Deities',
  6:'Level VI — Grimoiric Hierarchy & Named Spirits',
  7:'Level VII — Regional, Chthonic & Folkloric'
};

const LEVEL_SHORT_LABELS = {
  1:'Primordial Source & Supreme Principle',
  2:'First Emanations · Highest Orders',
  3:'Sovereign Rulers · Cosmic Archons',
  4:'Mediators · Patriarchs · Liminal Figures',
  5:'Powers of Nature · Domain Deities',
  6:'Grimoiric Hierarchy · Named Spirits',
  7:'Regional · Chthonic · Folkloric'
};

const LEVEL_ROMAN = ['I','II','III','IV','V','VI','VII'];

const NODE_COLORS = {
  greek:'#d4a832', roman:'#c4703a', egyptian:'#3ab8b8', mesopotamian:'#d9a07a',
  biblical_angel:'#a088d8', enochian:'#c06060', kabbalistic:'#50b870',
  hermetic:'#d4aa30', gnostic:'#9060c0', goetic:'#d04040',
  islamic:'#30a0c0', planetary:'#6088d8', canaanite:'#c8a060',
  hindu:'#e87040', default:'#c9983a'
};

const EDGE_COLORS = {
  SYNCRETIZED_WITH:'#50c878', FUNCTIONAL_PARALLEL:'#80a8d8',
  DESCENDED_FROM:'#c8a040', EMANATED_FROM:'#b880d8',
  POLEMIC_EQUIVALENT:'#d07070', MANIFESTED_AS:'#c8b040',
  FALLEN_FORM_OF:'#c05050', TAUGHT_BY:'#50b0b0',
  COMMANDS:'#b06040', CORRESPONDS_TO:'#7090d0',
  CONTESTED_IDENTIFICATION:'#c09040'
};

// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════
function init(data) {
  DB = data;
  document.getElementById('entity-count-meta').textContent =
    `${DB.entities.length} entities · Schema v${DB.version}`;

  fuse = new Fuse(DB.entities, {
    keys:[
      {name:'canonical_name',weight:2},{name:'aliases',weight:1.5},
      {name:'functional_domains',weight:1},
      {name:'tradition_vectors.greek.name',weight:0.8},
      {name:'tradition_vectors.roman.name',weight:0.8},
      {name:'tradition_vectors.egyptian.name',weight:0.8},
      {name:'tradition_vectors.goetic.name',weight:0.8},
      {name:'tradition_vectors.enochian.name',weight:0.8},
      {name:'tradition_vectors.canaanite.name',weight:0.8},
      {name:'tradition_vectors.hindu.name',weight:0.8},
      {name:'tradition_vectors.kabbalistic.sephira',weight:0.6},
      {name:'tradition_vectors.goetic.rank',weight:0.5},
      {name:'tradition_vectors.greek.epithets',weight:0.5},
      {name:'tradition_vectors.islamic.name_transliterated',weight:0.8},
      {name:'research_notes',weight:0.3}
    ],
    threshold:0.38, includeScore:true
  });

  renderSearch('');
  buildHierarchy();

  document.getElementById('search-input').addEventListener('input', e => renderSearch(e.target.value.trim()));

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderSearch(document.getElementById('search-input').value.trim());
    });
  });

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById('view-' + btn.dataset.view).classList.add('active');
    });
  });

  document.getElementById('detail-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('detail-overlay')) closeDetail();
  });

  document.getElementById('graph-trad-select').addEventListener('change', () => updateGraphTradVisibility());
}

// ══════════════════════════════════════════════════════════════
//  SEARCH RENDER
// ══════════════════════════════════════════════════════════════
function getFilteredEntities() {
  if (currentFilter === 'all') return DB.entities;
  return DB.entities.filter(e => e.tradition_vectors && e.tradition_vectors[currentFilter]);
}

function depthLabel(score) {
  if (score >= 80) return 'primary';
  if (score >= 60) return 'secondary';
  return 'partial';
}
function depthText(score) {
  if (score >= 80) return 'Primary Source';
  if (score >= 60) return 'Secondary Source';
  return 'Partial';
}

function renderSearch(query) {
  const pool = getFilteredEntities();
  let results;
  if (!query) {
    results = [...pool].sort((a,b) => {
      if (a.id === 'jesus-christ') return -1;
      if (b.id === 'jesus-christ') return 1;
      return (a.hierarchical_level||7) - (b.hierarchical_level||7);
    });
  } else {
    const fuseResults = fuse.search(query);
    const ids = new Set(pool.map(e => e.id));
    results = fuseResults.filter(r => ids.has(r.item.id)).map(r => r.item);
  }

  document.getElementById('results-count').textContent =
    `${results.length} ${results.length===1?'entry':'entries'}${query?` matching "${query}"`:''}${currentFilter!=='all'?` · ${TRADITION_LABELS[currentFilter]||currentFilter}`:''}`;

  const grid = document.getElementById('results-grid');
  if (!results.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-glyph">◉</div><p>No entries match. The tradition may not yet be populated.</p></div>`;
    return;
  }

  grid.innerHTML = '';
  results.forEach((entity, i) => {
    const card = document.createElement('div');
    const isJesus = entity.id === 'jesus-christ';
    card.className = 'entity-card' + (isJesus ? ' card-jesus' : '');
    card.style.animationDelay = `${Math.min(i*0.04,0.4)}s`;
    card.onclick = () => openDetail(entity.id);

    const tradKeys = Object.keys(entity.tradition_vectors||{});
    const tradPips = tradKeys.map(k=>`<span class="trad-pip trad-${k}">${TRADITION_LABELS[k]||k}</span>`).join('');
    const domains = (entity.functional_domains||[]).slice(0,3).map(d=>`<span class="domain-tag">${d}</span>`).join('');
    const aliasStr = (entity.aliases||[]).slice(0,2).join(' · ');
    const dl = depthLabel(entity.completeness_score||0);
    const dt = depthText(entity.completeness_score||0);

    card.innerHTML = `
      <p class="card-level">${LEVEL_LABELS[entity.hierarchical_level]||'Level '+(entity.hierarchical_level||7)}</p>
      <h3 class="card-name">${entity.canonical_name}</h3>
      ${aliasStr?`<p class="card-aliases">${aliasStr}</p>`:''}
      <div class="card-domains">${domains}</div>
      <div class="card-traditions">${tradPips}</div>
      <span class="card-depth depth-${dl}">${dt}</span>
    `;
    grid.appendChild(card);
  });
}

// ══════════════════════════════════════════════════════════════
//  DETAIL PANEL
// ══════════════════════════════════════════════════════════════
function openDetail(id) {
  const entity = DB.entities.find(e => e.id === id);
  if (!entity) return;
  currentDetailId = id;

  document.getElementById('d-level').textContent = LEVEL_LABELS[entity.hierarchical_level]||'';
  document.getElementById('d-name').textContent = entity.canonical_name;
  document.getElementById('d-aliases').textContent = (entity.aliases||[]).join(' · ');

  // Theological significance
  const theoSec = document.getElementById('d-theo-section');
  const theoEl = document.getElementById('d-theo');
  if (entity.id === 'jesus-christ') {
    theoSec.style.display = '';
    theoEl.innerHTML = `
      <div class="theo-box">
        <span class="theo-label">Colossians 1:16–17</span>
        <p>"For by him all things were created, in heaven and on earth, visible and invisible, whether thrones or powers or rulers or authorities — all things were created through him and for him. He is before all things, and in him all things hold together."</p>
      </div>
      <div class="theo-box" style="margin-top:0.8rem">
        <span class="theo-label">John 1:1–3</span>
        <p>"In the beginning was the Word, and the Word was with God, and the Word was God. He was with God in the beginning. Through him all things were made; without him nothing was made that has been made."</p>
      </div>
      <p style="font-size:1rem;color:var(--vellum);line-height:1.75;margin-top:1rem">In this concordance, Jesus Christ is the ontological center — the Logos through whom every tradition track, every named figure, every angelic order, and every esoteric system ultimately coheres. The figures documented here — Greek, Egyptian, Enochian, Kabbalistic, Goetic — are mapped against this standard: some as typological anticipations, some as fallen or corrupted reflections, some as polemical reframings by later traditions. None occupies the center; all orbit it.</p>`;
  } else if (entity.tradition_vectors?.biblical_angel || entity.id === 'adam' || entity.id === 'david-king' || entity.id === 'noah' || entity.id === 'abraham') {
    theoSec.style.display = '';
    const tv = entity.tradition_vectors?.biblical_angel;
    if (tv?.canonical_function) {
      theoEl.innerHTML = `<div class="theo-box"><span class="theo-label">Biblical Function</span><p>${tv.canonical_function}</p></div>`;
    } else { theoSec.style.display = 'none'; }
  } else {
    theoSec.style.display = 'none';
  }

  // Genealogy
  const genealogy = entity.genealogy;
  const geneEl = document.getElementById('d-genealogy');
  const geneSec = document.getElementById('d-genealogy-section');
  if (genealogy) {
    geneSec.style.display = '';
    geneEl.innerHTML = '';
    const block = document.createElement('div');
    block.className = 'genealogy-block';
    Object.entries(genealogy).forEach(([k,v]) => {
      const row = document.createElement('p');
      row.className = 'genealogy-line';
      row.innerHTML = `<strong>${k.replace(/_/g,' ')}</strong>${v}`;
      block.appendChild(row);
    });
    geneEl.appendChild(block);
  } else {
    geneSec.style.display = 'none';
  }

  // Domains
  document.getElementById('d-domains').innerHTML =
    (entity.functional_domains||[]).map(d=>`<span class="domain-tag-large">${d}</span>`).join('');

  // Traditions
  const tradEl = document.getElementById('d-traditions');
  tradEl.innerHTML = '';
  const tv = entity.tradition_vectors||{};
  const tradOrder = TRADITION_ORDER.filter(k => tv[k]).concat(Object.keys(tv).filter(k => !TRADITION_ORDER.includes(k) && tv[k]));
  tradOrder.forEach(tradKey => {
    const tradData = tv[tradKey];
    if (!tradData) return;
    const block = document.createElement('div');
    block.className = 'trad-block';
    block.style.borderLeftColor = NODE_COLORS[tradKey]||'var(--gold)';

    const fields = Object.entries(tradData)
      .filter(([k,v]) => v && k !== 'source_texts')
      .map(([k,v]) => {
        const val = Array.isArray(v) ? v.join(', ') : v;
        return `<div class="trad-field"><span class="trad-field-key">${k.replace(/_/g,' ')}</span><span class="trad-field-val">${val}</span></div>`;
      }).join('');

    const srcs = (tradData.source_texts||[])
      .map(s => `<div class="trad-field"><span class="trad-field-key">source</span><span class="trad-field-val">${s}</span></div>`).join('');

    block.innerHTML = `
      <div class="trad-block-header">
        <p class="trad-block-name" style="color:${NODE_COLORS[tradKey]||'#c9983a'}">${TRADITION_LABELS[tradKey]||tradKey}</p>
        <button class="focus-graph-btn" onclick="openGraphFocused('${entity.id}','${tradKey}')">⊛ Show in Cascade</button>
      </div>
      <div class="trad-block-fields">${fields}${srcs}</div>
    `;
    tradEl.appendChild(block);
  });

  // Relations
  const relEl = document.getElementById('d-relations');
  relEl.innerHTML = '';
  if (!(entity.relationships||[]).length) {
    relEl.innerHTML = '<p style="color:var(--dim);font-style:italic;font-size:0.96rem">No cross-traditional relationships recorded yet.</p>';
  } else {
    (entity.relationships||[]).forEach(rel => {
      const targetEntity = DB.entities.find(e => e.id === rel.target_id);
      const targetName = targetEntity ? targetEntity.canonical_name : rel.target_id.replace(/-/g,' ');
      const item = document.createElement('div');
      item.className = 'edge-item';
      item.innerHTML = `
        <span class="edge-type edge-${rel.edge_type}">${rel.edge_type.replace(/_/g,' ')}</span>
        <p class="edge-target">→ <a onclick="openDetail('${rel.target_id}')">${targetName}</a></p>
        <p class="edge-meta"><strong style="color:var(--faint);font-family:var(--font-heading);font-size:0.66rem;letter-spacing:0.1em;text-transform:uppercase">Source: </strong>${rel.source_text}</p>
        ${rel.notes?`<p class="edge-notes">${rel.notes}</p>`:''}
      `;
      relEl.appendChild(item);
    });
  }

  // Sources
  document.getElementById('d-sources').innerHTML =
    (entity.source_attestations||[]).map(s=>`<li>${s}</li>`).join('');

  // Notes
  document.getElementById('d-notes').textContent = entity.research_notes||'No research notes recorded.';

  // Research Depth
  const score = entity.completeness_score||0;
  const pips = document.getElementById('d-depth-pips');
  pips.innerHTML = '';
  const numPips = 8;
  const filled = Math.round(score / (100/numPips));
  for (let i=0; i<numPips; i++) {
    const pip = document.createElement('div');
    pip.className = 'depth-pip' + (i < filled ? ' filled' : '');
    pips.appendChild(pip);
  }
  document.getElementById('d-depth-label').textContent = depthText(score) + ` (${score}% documented)`;
  document.getElementById('d-depth-desc').textContent =
    score>=80 ? 'This entry has extensive primary source documentation across multiple tradition tracks. Relationships are well-sourced and research notes provide scholarly context.' :
    score>=60 ? 'This entry is documented in its primary traditions but some vectors need further sourcing. Core relationships are established.' :
    'This entry has basic identification data. Further research across tradition tracks is needed before this entry can be considered complete.';

  document.getElementById('detail-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  document.getElementById('detail-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ══════════════════════════════════════════════════════════════
//  DIVINE HIERARCHY CASCADE — pure HTML, no graph library
// ══════════════════════════════════════════════════════════════
function getPrimaryTradition(entity) {
  const tv = entity.tradition_vectors||{};
  for (const k of TRADITION_ORDER) { if (tv[k]) return k; }
  const keys = Object.keys(tv);
  return keys[0] || 'default';
}

function buildGraph() {
  if (graphBuilt) return;
  graphBuilt = true;

  const container = document.getElementById('cy-fullscreen');
  container.innerHTML = '';
  container.className = 'cascade-scroll';

  const inner = document.createElement('div');
  inner.className = 'cascade-container';
  container.appendChild(inner);

  // ── Banner ──────────────────────────────────────────────────
  const banner = document.createElement('div');
  banner.className = 'cascade-banner';
  banner.innerHTML = `
    <div class="cascade-banner-sigil">✦ ✧ ✦</div>
    <div class="cascade-banner-title">Divine Hierarchy Cascade</div>
    <div class="cascade-banner-sub">Ontological Descent from Supreme Principle through Successive Ranks of Being</div>
    <div class="cascade-banner-verse">"For by him all things were created — visible and invisible, whether thrones or powers or rulers or authorities."<span class="cascade-banner-cite">— Colossians 1:16</span></div>
  `;
  inner.appendChild(banner);

  // ── Group entities by level, sorted within each level ──────
  const byLevel = {};
  for (let lvl = 1; lvl <= 7; lvl++) byLevel[lvl] = [];
  DB.entities.forEach(e => byLevel[e.hierarchical_level || 5].push(e));

  for (let lvl = 1; lvl <= 7; lvl++) {
    byLevel[lvl].sort((a, b) => {
      if (a.id === 'jesus-christ') return -1;
      if (b.id === 'jesus-christ') return 1;
      const ta = TRADITION_ORDER.indexOf(getPrimaryTradition(a));
      const tb = TRADITION_ORDER.indexOf(getPrimaryTradition(b));
      if (ta !== tb) return ta - tb;
      return a.canonical_name.localeCompare(b.canonical_name);
    });
  }

  // ── Render tiers ────────────────────────────────────────────
  for (let lvl = 1; lvl <= 7; lvl++) {
    const entities = byLevel[lvl];
    if (!entities.length) continue;

    const tier = document.createElement('div');
    tier.className = `cascade-tier cascade-tier-lv${lvl}`;
    tier.dataset.level = lvl;

    // — Tier header
    const header = document.createElement('div');
    header.className = 'cascade-tier-header';
    header.innerHTML = `
      <div class="cascade-rule"></div>
      <div class="cascade-tier-label">
        <span class="cascade-roman">${LEVEL_ROMAN[lvl - 1]}</span>
        <span class="cascade-tier-name">${LEVEL_SHORT_LABELS[lvl]}</span>
      </div>
      <div class="cascade-rule"></div>
    `;
    tier.appendChild(header);

    // — Entity count sub-label
    const countLabel = document.createElement('div');
    countLabel.className = 'cascade-tier-count';
    countLabel.textContent = `${entities.length} ${entities.length === 1 ? 'figure' : 'figures'}`;
    tier.appendChild(countLabel);

    // — Entity cards
    const cardsWrap = document.createElement('div');
    cardsWrap.className = 'cascade-entities';

    entities.forEach(entity => {
      const trad = getPrimaryTradition(entity);
      const color = entity.id === 'jesus-christ' ? '#f0cc70' : (NODE_COLORS[trad] || '#c9983a');
      const isJesus = entity.id === 'jesus-christ';

      const card = document.createElement('div');
      card.className = 'cascade-entity' + (isJesus ? ' cascade-entity-jesus' : '');
      card.dataset.entityId = entity.id;
      card.dataset.tradition = trad;
      card.style.setProperty('--trad-color', color);

      const tradDots = Object.keys(entity.tradition_vectors || {})
        .slice(0, 6)
        .map(k => `<span class="cascade-trad-dot" style="background:${NODE_COLORS[k] || '#888'}" title="${TRADITION_LABELS[k] || k}"></span>`)
        .join('');

      const shortName = entity.canonical_name
        .split(' / ')[0].split(' (')[0].split(',')[0];

      card.innerHTML = `
        <div class="cascade-entity-inner">
          ${isJesus ? '<span class="cascade-jesus-star">✦ ✧ ✦</span>' : ''}
          <span class="cascade-entity-name">${shortName}</span>
          <div class="cascade-trad-pips">${tradDots}</div>
        </div>
      `;
      card.onclick = () => openDetail(entity.id);
      cardsWrap.appendChild(card);
    });

    tier.appendChild(cardsWrap);

    // — Descent connector between tiers (not after last)
    if (lvl < 7) {
      const descent = document.createElement('div');
      descent.className = 'cascade-descent';
      descent.innerHTML = `
        <span class="cascade-descent-line"></span>
        <span class="cascade-descent-glyph">⬡</span>
        <span class="cascade-descent-line"></span>
      `;
      tier.appendChild(descent);
    }

    inner.appendChild(tier);
  }

  // ── Build legend ─────────────────────────────────────────────
  const legendEl = document.getElementById('graph-legend');
  legendEl.innerHTML = Object.entries(NODE_COLORS)
    .filter(([k]) => k !== 'default')
    .map(([k, c]) => `<div class="legend-item"><div class="legend-dot" style="background:${c}"></div>${TRADITION_LABELS[k]||k}</div>`)
    .join('');
}

function openGraphFocused(entityId, tradKey) {
  closeDetail();
  openGraphOverlay();

  if (tradKey) {
    const sel = document.getElementById('graph-trad-select');
    if (sel) { sel.value = tradKey; updateGraphTradVisibility(); }
  }

  // Scroll to + flash the entity card
  const doFocus = () => {
    const card = document.querySelector(`#cy-fullscreen .cascade-entity[data-entity-id="${entityId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('cascade-entity-focused');
      setTimeout(() => card.classList.remove('cascade-entity-focused'), 2400);
    }
  };

  if (graphBuilt) {
    requestAnimationFrame(doFocus);
  } else {
    // Build first, then focus
    requestAnimationFrame(() => {
      buildGraph();
      requestAnimationFrame(doFocus);
    });
  }

  const entity = DB.entities.find(e => e.id === entityId);
  if (entity) {
    document.getElementById('graph-focus-label').textContent =
      `Focused: ${entity.canonical_name}${tradKey ? ' · ' + (TRADITION_LABELS[tradKey]||tradKey) : ''}`;
  }
}

function openGraphForCurrent() {
  if (currentDetailId) openGraphFocused(currentDetailId, null);
  else openGraphOverlay();
}

function openGraphOverlay() {
  const overlay = document.getElementById('graph-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (!graphBuilt) buildGraph();
}

function closeGraph() {
  document.getElementById('graph-overlay').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('graph-focus-label').textContent = '';
  document.getElementById('graph-trad-select').value = 'all';
  // Remove any tradition filtering
  document.querySelectorAll('.cascade-entity').forEach(c => c.classList.remove('cascade-dimmed'));
}

function resetGraph() {
  document.getElementById('graph-focus-label').textContent = '';
  document.getElementById('graph-trad-select').value = 'all';
  document.querySelectorAll('.cascade-entity').forEach(c => c.classList.remove('cascade-dimmed'));
  const container = document.getElementById('cy-fullscreen');
  container.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateGraphTradVisibility() {
  const val = document.getElementById('graph-trad-select').value;
  document.querySelectorAll('.cascade-entity').forEach(card => {
    if (val === 'all' || card.dataset.tradition === val) {
      card.classList.remove('cascade-dimmed');
    } else {
      card.classList.add('cascade-dimmed');
    }
  });
  // Scroll to the first visible card if filtering
  if (val !== 'all') {
    const first = document.querySelector(`.cascade-entity[data-tradition="${val}"]`);
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ══════════════════════════════════════════════════════════════
//  HIERARCHY — PER-TRADITION INTERNAL HIERARCHIES
// ══════════════════════════════════════════════════════════════
function buildHierarchy() {
  const container = document.getElementById('hierarchy-container');
  container.innerHTML = '';

  const intro = document.createElement('p');
  intro.style.cssText = 'font-family:var(--font-body);font-size:1rem;color:var(--dim);font-style:italic;margin-bottom:1.5rem;line-height:1.7';
  intro.textContent = 'Each tradition is organized by its own internal hierarchy — ranked from supreme principle down to regional or specialized figures. Expand a tradition to browse its internal order. Click any entity to open its full profile.';
  container.appendChild(intro);

  const allTrads = [...new Set([
    ...TRADITION_ORDER.filter(trad => DB.entities.some(e => e.tradition_vectors?.[trad])),
    ...DB.entities.flatMap(e => Object.keys(e.tradition_vectors||{}))
  ])];

  allTrads.forEach(trad => {
    const entities = DB.entities.filter(e => e.tradition_vectors?.[trad]);
    if (!entities.length) return;

    entities.sort((a,b) => (a.hierarchical_level||5) - (b.hierarchical_level||5));

    const byLevel = {};
    entities.forEach(e => {
      const lvl = e.hierarchical_level||5;
      if (!byLevel[lvl]) byLevel[lvl] = [];
      byLevel[lvl].push(e);
    });

    const section = document.createElement('div');
    section.className = 'trad-hier-section';

    const header = document.createElement('div');
    header.className = 'trad-hier-header';
    header.innerHTML = `
      <span class="trad-hier-toggle">▶</span>
      <span class="trad-hier-title" style="color:${NODE_COLORS[trad]||'#c9983a'}">${TRADITION_LABELS[trad]||trad}</span>
      <span class="trad-hier-count">${entities.length} entries</span>
    `;

    const body = document.createElement('div');
    body.className = 'trad-hier-body';

    Object.keys(byLevel).sort((a,b) => a-b).forEach(lvl => {
      const grp = document.createElement('div');
      grp.className = 'hier-level-group';
      grp.innerHTML = `<div class="hier-level-label">${LEVEL_LABELS[parseInt(lvl)]||'Level '+lvl}</div>`;
      byLevel[lvl].forEach(entity => {
        const row = document.createElement('div');
        row.className = 'hier-entity-row';
        const primaryDomain = (entity.functional_domains||[])[0]||'';
        row.innerHTML = `
          <span class="hier-trad-dot" style="background:${NODE_COLORS[trad]||'#c9983a'}"></span>
          <span class="hier-entity-name">${entity.canonical_name}</span>
          <span class="hier-entity-domain">${primaryDomain}</span>
        `;
        row.onclick = () => openDetail(entity.id);
        grp.appendChild(row);
      });
      body.appendChild(grp);
    });

    header.addEventListener('click', () => {
      const isOpen = body.classList.contains('open');
      body.classList.toggle('open', !isOpen);
      header.classList.toggle('open', !isOpen);
      header.querySelector('.trad-hier-toggle').textContent = isOpen ? '▶' : '▼';
    });

    section.appendChild(header);
    section.appendChild(body);
    container.appendChild(section);
  });

  const firstBiblical = container.querySelector('.trad-hier-header');
  if (firstBiblical) firstBiblical.click();
}

// ══════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════
