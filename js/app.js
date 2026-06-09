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
      if (btn.dataset.view === 'timeline') openTimeline();
      if (btn.dataset.view === 'gematria') setTimeout(initCalculator, 50);
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

    // Relations — Marginalia Discovery Treatment
    const relEl = document.getElementById('d-relations');
    relEl.innerHTML = '';
    const rels = entity.relationships || [];
    if (!rels.length) {
      relEl.innerHTML = '<p class="marginalia-empty">No cross-traditional relationships recorded in this manuscript.</p>';
    } else {
      const wrap = document.createElement('div');
      wrap.className = 'marginalia-section-wrap';

      const EDGE_GLYPHS = {
        SYNCRETIZED_WITH:'⊕', FUNCTIONAL_PARALLEL:'⊗', DESCENDED_FROM:'↓',
        EMANATED_FROM:'◎', POLEMIC_EQUIVALENT:'⊘', MANIFESTED_AS:'◈',
        FALLEN_FORM_OF:'↯', TAUGHT_BY:'⊛', COMMANDS:'⊞',
        CORRESPONDS_TO:'⋈', CONTESTED_IDENTIFICATION:'⊜'
      };

      rels.forEach(rel => {
        const targetEntity = DB.entities.find(e => e.id === rel.target_id);
        const targetName = targetEntity ? targetEntity.canonical_name : rel.target_id.replace(/-/g,' ');
        const edgeColor = EDGE_COLORS[rel.edge_type] || 'var(--faint)';
        const glyph = EDGE_GLYPHS[rel.edge_type] || '◆';

        const entry = document.createElement('div');
        entry.className = 'marginalia-entry';
        entry.innerHTML = `
          <div class="marginalia-glyph">${glyph}</div>
          <div class="marginalia-rubric">
            <span class="marginalia-rubric-badge edge-${rel.edge_type}"
              style="background:${edgeColor}1a;color:${edgeColor};border:1px solid ${edgeColor}55">
              ${rel.edge_type.replace(/_/g,' ')}
            </span>
          </div>
          <a class="marginalia-target-name" onclick="openDetail('${rel.target_id}')">${targetName}</a>
          <div class="marginalia-source-cite">
            <span class="marginalia-source-label">Attestation</span>
            <span class="marginalia-source-text">${rel.source_text}</span>
          </div>
          ${rel.notes ? `<p class="marginalia-notes">${rel.notes}</p>` : ''}
          <div class="marginalia-tradition">
            <div class="marginalia-trad-dot"></div>
            ${rel.source_tradition || ''}
          </div>
        `;
        wrap.appendChild(entry);
      });

      relEl.appendChild(wrap);
    }

  // Sources
  document.getElementById('d-sources').innerHTML =
    (entity.source_attestations||[]).map(s=>`<li>${s}</li>`).join('');

  // Notes
  document.getElementById('d-notes').textContent = entity.research_notes||'No research notes recorded.';

  // Gematria
  const gemSec = document.getElementById('d-gematria-section');
  const gemEl  = document.getElementById('d-gematria');
  if (entity.gematria) {
    gemSec.style.display = '';
    gemEl.innerHTML = '';
    const g = entity.gematria;
    const wrap = document.createElement('div');
    wrap.className = 'gematria-wrap';

    if (g.hebrew) {
      const h = g.hebrew;
      const block = document.createElement('div');
      block.className = 'gematria-block';
      block.innerHTML = `
        <div class="gematria-block-header">
          <span class="gematria-script-label">Hebrew</span>
          <span class="gematria-script-name">${h.name||''}</span>
          <span class="gematria-transliteration">${h.transliteration||''}</span>
        </div>
        <div class="gematria-value-row">
          <span class="gematria-system-label">Standard (Mispar Hechrachi)</span>
          <span class="gematria-value">${h.standard||'—'}</span>
        </div>
        ${h.breakdown ? `<p class="gematria-breakdown">${h.breakdown}</p>` : ''}
        ${h.notes ? `<p class="gematria-note">${h.notes}</p>` : ''}
      `;
      wrap.appendChild(block);
    }

    if (g.greek) {
      const k = g.greek;
      const block = document.createElement('div');
      block.className = 'gematria-block gematria-block-greek';
      block.innerHTML = `
        <div class="gematria-block-header">
          <span class="gematria-script-label gematria-script-greek">Greek</span>
          <span class="gematria-script-name">${k.name||''}</span>
          <span class="gematria-transliteration">${k.transliteration||''}</span>
        </div>
        <div class="gematria-value-row">
          <span class="gematria-system-label">Isopsephy (Ψῆφος)</span>
          <span class="gematria-value gematria-value-greek">${k.isopsephy||'—'}</span>
        </div>
        ${k.breakdown ? `<p class="gematria-breakdown">${k.breakdown}</p>` : ''}
        ${k.notes ? `<p class="gematria-note">${k.notes}</p>` : ''}
      `;
      wrap.appendChild(block);
    }

    gemEl.appendChild(wrap);
  } else {
    gemSec.style.display = 'none';
  }

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
//  CHRONOLOGICAL TIMELINE
// ══════════════════════════════════════════════════════════════

let timelineBuilt = false;

// First significant textual attestation for each entity (year; negative = BCE)
const ENTITY_DATES = {
  // Theological center
  'jesus-christ':         4,    // Incarnation ~4 BCE (canonical)

  // Mesopotamian pantheon
  'anu':              -3000,    // Early Dynastic Sumerian king-lists
  'enlil':            -2900,    // Nippur temple hymns
  'enki':             -2800,    // Eridu Genesis tablet
  'inanna':           -2800,    // Sumerian love lyrics (Ur III)
  'ereshkigal':       -2100,    // Descent of Inanna (Ur III)
  'marduk':           -1750,    // Enuma Elish composition
  'nanna-sin':        -2800,    // Ur III moon-god hymns
  'ningishzida':      -2500,    // Gudea cylinder inscriptions (Lagash)

  // Egyptian pantheon
  'ra':               -2500,    // Pyramid Texts (Utt. 217)
  'osiris':           -2400,    // Pyramid Texts (Utt. 219)
  'isis':             -2400,    // Pyramid Texts
  'anubis':           -2400,    // Pyramid Texts (Utt. 535)
  'horus':            -2600,    // Early Dynastic Horus falcon serekh
  'thoth':            -2500,    // Pyramid Texts
  'set-egypt':        -2400,    // Pyramid Texts (Set of Nubt)

  // Canaanite
  'dagon':            -1700,    // Eblaite & Mari documents
  'baal':             -1350,    // Ugaritic Baal Cycle (KTU 1.1–6)
  'el-elyon':         -1350,    // Ugaritic El texts

  // Hindu / Vedic
  'varuna':           -1500,    // Rigveda (early Vedic hymns)
  'brahma':           -1000,    // Atharva Veda / early Brahmanas
  'vishnu':           -1000,    // Rigveda (minor, expanded in epics)

  // Greek
  'zeus-jupiter':      -800,    // Hesiod Theogony (~700 BCE)
  'hermes':            -800,    // Homeric Hymn to Hermes
  'hecate':            -700,    // Hesiod Theogony
  'aphrodite-venus':   -800,    // Hesiod Theogony
  'dionysus':         -1200,    // Linear B tablet (Pylos, Mycenaean)
  'saturn-kronos':     -800,    // Hesiod Theogony

  // Roman (assimilation of Greek ~3rd century BCE onward)
  'jupiter':           -600,    // Capitoline triad institution
  'mars':              -600,    // Archaic Roman religion
  'mercury':           -500,    // Roman Mercury cult established

  // Biblical patriarchs (Yahwist source composition)
  'adam':              -950,    // Yahwist source (J)
  'noah':              -950,    // Yahwist source (J)
  'abraham':           -950,    // Yahwist/Elohist sources

  // Biblical angels (Second Temple)
  'michael-archangel': -167,    // Daniel 12:1 (Maccabean composition)
  'gabriel':           -167,    // Daniel 8–9
  'raphael':           -200,    // Book of Tobit
  'uriel':             -200,    // 1 Enoch 20
  'saraqael':          -200,    // 1 Enoch 20

  // Enochian watchers (1 Enoch, Qumran)
  'azazel':            -200,    // 1 Enoch 8–10
  'semjaza':           -200,    // 1 Enoch 6
  'gadreel':           -200,    // 1 Enoch 69
  'kokabiel':          -200,    // 1 Enoch 6
  'penemue':           -200,    // 1 Enoch 69
  'baraqiel':          -200,    // 1 Enoch 6
  'ramiel':            -200,    // 1 Enoch 20
  'tamiel':            -200,    // 1 Enoch 6

  // Enochian patriarch
  'enoch-patriarch':   -300,    // 1 Enoch / Book of Jubilees composition

  // Adversarial & fallen
  'satan-adversary':   -600,    // Book of Job (Babylonian exile period)
  'asmodeus':          -200,    // Book of Tobit
  'belial':            -200,    // Dead Sea Scrolls (1QM, War Scroll)
  'lucifer':            400,    // Jerome Vulgate — Isaiah 14:12
  'lilith':             700,    // Alphabet of Ben-Sira (Geonic)
  'paimon':            1600,    // Lemegeton Clavicula Salomonis
  'astaroth':          1600,    // Lemegeton (Astarte form: -1400)
  'bael':              1600,    // Lemegeton
  'valefor':           1600,    // Lemegeton
  'sitri':             1600,    // Lemegeton

  // Kabbalistic / Merkabah
  'metatron':           500,    // Heikhalot literature / 3 Enoch
  'sandalphon':         900,    // Medieval Kabbalistic tradition
  'samael':             200,    // Talmudic (Babylonian)

  // Gnostic (Nag Hammadi / Valentinian era)
  'sophia':             150,    // Valentinian Exposition / Apocryphon of John
  'yaldabaoth':         150,    // Apocryphon of John
  'abraxas':            130,    // Basilides (attested in Irenaeus, Adv. Haer.)
  'barbelo':            150,    // Apocryphon of John / Trimorphic Protennoia
  'eleleth':            250,    // Hypostasis of the Archons
  'adamas':             200,    // Sethian Gnostic texts (Gospel of Judas)

  // Hermetic
  'hermes-trismegistus': 200,   // Corpus Hermeticum composition

  // Islamic
  'iblis':              632,    // Quran canonization (references throughout)
  'jibrail':            632,    // Quran
  'mikail':             632,    // Quran
  'israfil':            750,    // Hadith literature

  // Thelemic (20th century)
  'nuit':              1904,    // Liber AL vel Legis (Cairo Working, April 1904)
  'hadit':             1904,    // Liber AL vel Legis
};

// Default first-attestation date by primary tradition (fallback)
const TRAD_DEFAULT_DATES = {
  mesopotamian:   -2800,
  egyptian:       -2400,
  canaanite:      -1350,
  hindu:          -1200,
  greek:           -800,
  roman:           -600,
  planetary:       -400,
  biblical_angel:  -200,
  enochian:        -200,
  kabbalistic:      200,
  hermetic:         200,
  gnostic:          150,
  islamic:          650,
  goetic:          1600,
  default:            0,
};

// Era zone definitions
const TL_ERAS = [
  { start: -3500, end: -2000, label: 'Early Sumerian\n& Old Kingdom Egypt',  color: 'rgba(180,110,50,0.09)'  },
  { start: -2000, end:  -800, label: 'Bronze Age\nNear East',                color: 'rgba(50,160,140,0.07)'  },
  { start:  -800, end:  -167, label: 'Classical\nAntiquity',                  color: 'rgba(80,110,200,0.08)'  },
  { start:  -167, end:   200, label: 'Second Temple\n& Early CE',             color: 'rgba(150,110,220,0.09)' },
  { start:   200, end:   700, label: 'Late\nAntiquity',                       color: 'rgba(200,155,40,0.08)'  },
  { start:   700, end:  1400, label: 'Medieval\nPeriod',                      color: 'rgba(60,90,70,0.08)'    },
  { start:  1400, end:  1950, label: 'Early Modern\n& Thelema',               color: 'rgba(110,40,50,0.1)'    },
];

const TL_START      = -3500;
const TL_END        = 1950;
const PX_PER_DECADE = 17;        // 17px per 10 years
const TL_PAD_LEFT   = 60;        // space before -3500
const TL_PAD_RIGHT  = 60;
const BADGE_W       = 94;        // badge width in px
const BADGE_H       = 24;        // badge height
const LANE_H        = 30;        // vertical lane pitch
const SPINE_GAP     = 12;        // gap between spine and lane 0

function yearToPx(year) {
  return TL_PAD_LEFT + ((year - TL_START) / 10) * PX_PER_DECADE;
}

function buildTimeline() {
  if (timelineBuilt) return;
  timelineBuilt = true;

  const canvas = document.getElementById('tl-canvas');
  canvas.innerHTML = '';

  // ── 1. Compute dates for all entities ──────────────────────
  const items = DB.entities.map(e => {
    const trad = getPrimaryTradition(e);
    const date  = ENTITY_DATES[e.id] ?? TRAD_DEFAULT_DATES[trad] ?? 0;
    return { entity: e, date, trad, color: NODE_COLORS[trad] || NODE_COLORS.default };
  }).sort((a, b) => a.date - b.date);

  // ── 2. Lane assignment (greedy, badges stack above spine) ──
  // laneEnd[n] = rightmost x occupied in lane n
  const laneEnd = [];
  const BADGE_GAP = 5;
  items.forEach(item => {
    const x = yearToPx(item.date);
    let lane = laneEnd.findIndex(end => end + BADGE_GAP <= x);
    if (lane === -1) lane = laneEnd.length;
    laneEnd[lane] = x + BADGE_W;
    item.lane = lane;
    item.x    = x;
  });

  const maxLanes  = laneEnd.length;
  const spineY    = SPINE_GAP + maxLanes * LANE_H + BADGE_H + 20;
  const totalW    = yearToPx(TL_END) + TL_PAD_RIGHT;
  const totalH    = spineY + 110;   // spine + era-label space below

  canvas.style.width  = totalW + 'px';
  canvas.style.height = totalH + 'px';
  canvas.style.position = 'relative';

  // ── 3. Era background zones ────────────────────────────────
  TL_ERAS.forEach(era => {
    const x  = yearToPx(era.start);
    const w  = yearToPx(era.end) - x;
    const z  = document.createElement('div');
    z.className = 'tl-era-zone';
    z.style.cssText = `left:${x}px;width:${w}px;height:${spineY}px;background:${era.color};`;
    canvas.appendChild(z);

    // Era label below spine
    const lbl = document.createElement('div');
    lbl.className = 'tl-era-label';
    lbl.style.cssText = `left:${x}px;width:${w}px;top:${spineY + 28}px;`;
    lbl.innerHTML = era.label.split('\n').map(l => `<span>${l}</span>`).join('<br>');
    canvas.appendChild(lbl);
  });

  // ── 4. Century ticks & year labels ────────────────────────
  const tickStartCentury = Math.ceil(TL_START / 100) * 100;
  for (let yr = tickStartCentury; yr <= TL_END; yr += 100) {
    const x       = yearToPx(yr);
    const isMajor = yr % 500 === 0;

    const tick = document.createElement('div');
    tick.className = 'tl-tick' + (isMajor ? ' tl-tick-major' : '');
    tick.style.cssText = `left:${x}px;top:${spineY - (isMajor ? 10 : 6)}px;height:${isMajor ? 20 : 12}px;`;
    canvas.appendChild(tick);

    if (isMajor) {
      const lbl = document.createElement('div');
      lbl.className = 'tl-year-label';
      lbl.style.cssText = `left:${x}px;top:${spineY + 10}px;`;
      const absYr = Math.abs(yr);
      lbl.textContent = yr === 0 ? '0' : absYr + (yr < 0 ? ' BCE' : ' CE');
      canvas.appendChild(lbl);
    }
  }

  // ── 5. Spine ───────────────────────────────────────────────
  const spine = document.createElement('div');
  spine.className = 'tl-spine';
  spine.style.cssText = `top:${spineY}px;width:${totalW}px;`;
  canvas.appendChild(spine);

  // ── 6. Entity badges ───────────────────────────────────────
  items.forEach(item => {
    const badgeTop = spineY - SPINE_GAP - BADGE_H - item.lane * LANE_H;
    const badge    = document.createElement('div');
    badge.className = 'tl-badge';
    badge.dataset.entityId = item.entity.id;
    badge.style.cssText = `
      left:${item.x}px;
      top:${badgeTop}px;
      width:${BADGE_W}px;
      --trad-color:${item.color};
    `;

    const shortName = item.entity.canonical_name
      .split(' / ')[0].split(' (')[0].split(',')[0];

    badge.innerHTML = `<span class="tl-badge-name">${shortName}</span>`;
    badge.title     = `${item.entity.canonical_name} — ${Math.abs(item.date)} ${item.date < 0 ? 'BCE' : 'CE'}`;

    badge.onclick = () => openDetail(item.entity.id);
    canvas.appendChild(badge);

    // Connector line from badge bottom to spine
    const lineH = spineY - (badgeTop + BADGE_H);
    if (lineH > 2) {
      const line = document.createElement('div');
      line.className = 'tl-connector';
      line.style.cssText = `
        left:${item.x + BADGE_W / 2 - 1}px;
        top:${badgeTop + BADGE_H}px;
        height:${lineH}px;
        background:${item.color};
      `;
      canvas.appendChild(line);
    }
  });

  // ── 7. "Now" marker ───────────────────────────────────────
  const nowX = yearToPx(1950);
  const nowM = document.createElement('div');
  nowM.className = 'tl-now-marker';
  nowM.style.cssText = `left:${nowX}px;top:0;height:${spineY}px;`;
  canvas.appendChild(nowM);

  // ── 8. Legend ──────────────────────────────────────────────
  const legendEl = document.getElementById('tl-legend');
  if (legendEl) {
    legendEl.innerHTML = Object.entries(NODE_COLORS)
      .filter(([k]) => k !== 'default')
      .map(([k, c]) => `<div class="tl-legend-item"><div class="tl-legend-dot" style="background:${c}"></div>${TRADITION_LABELS[k]||k}</div>`)
      .join('');
  }
}

function openTimeline() {
  if (!timelineBuilt) {
    // Small delay so the view is visible before build
    requestAnimationFrame(() => buildTimeline());
  }
}

// ══════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
//  GEMATRIA CALCULATOR
// ══════════════════════════════════════════════════════════════

// ── BASE LETTER MAP — accent-strip lookup ────────────────────────────────────
// Greek isopsephy (Milesian numeral system: α=1 … ω=800, including archaic)
// Accented chars: normalize by stripping combining diacritics via NFD then
// mapping the base character.
const GREEK_BASE = {
  'α':1,'β':2,'γ':3,'δ':4,'ε':5,'ζ':7,'η':8,'θ':9,
  'ι':10,'κ':20,'λ':30,'μ':40,'ν':50,'ξ':60,'ο':70,'π':80,
  'ρ':100,'σ':200,'ς':200,'τ':300,'υ':400,'φ':500,'χ':600,'ψ':700,'ω':800,
};

// Build GREEK_VALUES: lowercase + uppercase + every accented / polytonic variant
const GREEK_VALUES = (() => {
  const map = {};
  for (const [base, val] of Object.entries(GREEK_BASE)) {
    map[base] = val;
    map[base.toUpperCase()] = val;
  }
  // All polytonic / accented Greek letters — mapped to their base letter value
  // Lowercase accented
  const acc = [
    'ά','ὰ','ᾶ','ᾱ','ᾰ',   // alpha variants → 1
    'έ','ὲ',                  // epsilon → 5
    'ή','ὴ','ῆ',              // eta → 8
    'ί','ὶ','ῖ','ΐ','ϊ','ἰ','ἱ','ἲ','ἳ','ἴ','ἵ','ἶ','ἷ', // iota → 10
    'ό','ὸ',                  // omicron → 70
    'ύ','ὺ','ῦ','ΰ','ϋ','ὐ','ὑ','ὒ','ὓ','ὔ','ὕ','ὖ','ὗ', // upsilon → 400
    'ώ','ὼ','ῶ',              // omega → 800
  ];
  const baseMap = {
    'ά':1,'ὰ':1,'ᾶ':1,'ᾱ':1,'ᾰ':1,
    'έ':5,'ὲ':5,
    'ή':8,'ὴ':8,'ῆ':8,
    'ί':10,'ὶ':10,'ῖ':10,'ΐ':10,'ϊ':10,'ἰ':10,'ἱ':10,'ἲ':10,'ἳ':10,'ἴ':10,'ἵ':10,'ἶ':10,'ἷ':10,
    'ό':70,'ὸ':70,
    'ύ':400,'ὺ':400,'ῦ':400,'ΰ':400,'ϋ':400,'ὐ':400,'ὑ':400,'ὒ':400,'ὓ':400,'ὔ':400,'ὕ':400,'ὖ':400,'ὗ':400,
    'ώ':800,'ὼ':800,'ῶ':800,
    // uppercase accented
    'Ά':1,'Ὰ':1,'Ᾱ':1,'Ᾰ':1,
    'Έ':5,'Ὲ':5,
    'Ή':8,'Ὴ':8,
    'Ί':10,'Ὶ':10,'Ϊ':10,
    'Ό':70,'Ὸ':70,
    'Ύ':400,'Ὺ':400,'Ϋ':400,
    'Ώ':800,'Ὼ':800,
    // breathing marks on alpha (with spiritus)
    'ἀ':1,'ἁ':1,'ἂ':1,'ἃ':1,'ἄ':1,'ἅ':1,'ἆ':1,'ἇ':1,
    'Ἀ':1,'Ἁ':1,'Ἂ':1,'Ἃ':1,'Ἄ':1,'Ἅ':1,'Ἆ':1,'Ἇ':1,
    'ἐ':5,'ἑ':5,'ἒ':5,'ἓ':5,'ἔ':5,'ἕ':5,
    'Ἐ':5,'Ἑ':5,'Ἒ':5,'Ἓ':5,'Ἔ':5,'Ἕ':5,
    'ἠ':8,'ἡ':8,'ἢ':8,'ἣ':8,'ἤ':8,'ἥ':8,'ἦ':8,'ἧ':8,
    'Ἠ':8,'Ἡ':8,'Ἢ':8,'Ἣ':8,'Ἤ':8,'Ἥ':8,'Ἦ':8,'Ἧ':8,
    'ὀ':70,'ὁ':70,'ὂ':70,'ὃ':70,'ὄ':70,'ὅ':70,
    'Ὀ':70,'Ὁ':70,'Ὂ':70,'Ὃ':70,'Ὄ':70,'Ὅ':70,
    'ὠ':800,'ὡ':800,'ὢ':800,'ὣ':800,'ὤ':800,'ὥ':800,'ὦ':800,'ὧ':800,
    'Ὠ':800,'Ὡ':800,'Ὢ':800,'Ὣ':800,'Ὤ':800,'Ὥ':800,'Ὦ':800,'Ὧ':800,
  };
  for (const [ch, val] of Object.entries(baseMap)) map[ch] = val;
  return map;
})();

// Hebrew — standard Mispar Hechrachi
const HEBREW_VALUES = {
  'א':1,'ב':2,'ג':3,'ד':4,'ה':5,'ו':6,'ז':7,'ח':8,'ט':9,
  'י':10,'כ':20,'ל':30,'מ':40,'נ':50,'ס':60,'ע':70,'פ':80,'צ':90,
  'ק':100,'ר':200,'ש':300,'ת':400,
  'ך':20,'ם':40,'ן':50,'ף':80,'ץ':90, // final forms = standard value
};

// ── English → Greek transliteration ─────────────────────────────────────────
const EN_TO_GREEK = [
  // Multi-char first
  ['ph','φ'],['th','θ'],['ch','χ'],['kh','χ'],['ps','ψ'],['ks','ξ'],
  ['ou','ου'],['oo','ω'],['ee','η'],['ai','αι'],['ei','ει'],['oi','οι'],
  ['au','αυ'],['eu','ευ'],['ng','γγ'],
  // Single chars
  ['a','α'],['b','β'],['g','γ'],['d','δ'],['e','ε'],['z','ζ'],['h','η'],
  ['i','ι'],['k','κ'],['c','κ'],['l','λ'],['m','μ'],['n','ν'],['x','ξ'],
  ['o','ο'],['p','π'],['r','ρ'],['s','σ'],['t','τ'],['u','υ'],['y','υ'],
  ['f','φ'],['q','κ'],['v','β'],['w','ω'],
];

// English → Hebrew transliteration
const EN_TO_HEBREW = [
  // Multi-char first
  ['sh','ש'],['th','ת'],['ch','ח'],['tz','צ'],['ts','צ'],['ph','פ'],
  // Single chars
  ['a','א'],['b','ב'],['g','ג'],['d','ד'],['h','ה'],['v','ו'],['w','ו'],
  ['z','ז'],['i','י'],['y','י'],['k','כ'],['c','כ'],['l','ל'],['m','מ'],
  ['n','נ'],['s','ס'],['p','פ'],['f','פ'],['r','ר'],['t','ט'],['u','ו'],
  ['e','ה'],['o','ו'],['q','ק'],['x','ס'],
];

function transliterateToGreek(text) {
  let result = '';
  let i = 0;
  const lower = text.toLowerCase();
  while (i < lower.length) {
    let matched = false;
    for (const [en, gr] of EN_TO_GREEK) {
      if (lower.startsWith(en, i)) {
        result += gr;
        i += en.length;
        matched = true;
        break;
      }
    }
    if (!matched) { result += lower[i]; i++; }
  }
  return result;
}

function transliterateToHebrew(text) {
  let result = '';
  let i = 0;
  const lower = text.toLowerCase();
  while (i < lower.length) {
    let matched = false;
    for (const [en, hb] of EN_TO_HEBREW) {
      if (lower.startsWith(en, i)) {
        result += hb;
        i += en.length;
        matched = true;
        break;
      }
    }
    if (!matched) { result += lower[i]; i++; }
  }
  return result;
}

// ── Notable values ────────────────────────────────────────────────────────────
const HEBREW_NOTABLE = {
  1:'Aleph — divine unity; the undivided',
  7:'Zayin — the seventh day; covenant',
  10:'Yod — the smallest letter; seed of divine power',
  13:'Echad (אחד, "One"); Ahavah (אהבה, "Love") — both = 13',
  18:'Chai (חי) — "Life"; basis of Jewish charitable gifts in multiples of 18',
  26:'YHWH (יהוה) — the Tetragrammaton, the ineffable divine Name',
  32:'Lev (לב, "Heart"); 32 paths of Wisdom in Sefer Yetzirah',
  36:'36 Lamed-Vavniks — the hidden righteous who sustain the world',
  50:'Nun — 50 Gates of Understanding (Binah); the Jubilee',
  65:'Adonai (אדני) — "My Lord"; the spoken substitute for YHWH',
  72:'The 72 Names of God; 72 Goetic spirits of Solomon',
  86:'Elohim (אלהים) — "God"; also the numerical value of Nature (הטבע)',
  101:'Michael (מיכאל) — "Who is like God?"',
  114:'Din (דין) — divine judgment; Samech+Mem = the Samael-Lilith union in some texts',
  131:'Samael (סמאל) — poison of God; the adversarial prince',
  136:'Mammon (ממון) — wealth-demon; T(16) the 16th triangular number',
  142:'Belial (בליעל) — "worthless/without worth"',
  248:'Uriel; Abraham (אברהם); 248 positive commandments (Mitzvot Aseh)',
  314:'Metatron (מטטרון); Shaddai (שדי) — both = 314 ≈ 100π',
  359:'Satan (שטן) — "the adversary/accuser"',
  386:'Yeshua (ישוע) — Hebrew form of Jesus',
  480:'Lilith (לילית); also years from Exodus to Solomon\'s Temple (1 Kings 6:1)',
  496:'Leviathan (לויתן); Malkuth (מלכות) — both = 496, the third perfect number',
  666:'Sorath (סורת) — the solar demon of the Beast (666 = ס60+ו6+ר200+ת400); Nero Caesar in Hebrew',
};

const GREEK_NOTABLE = {
  54:'Azazel (Αζαζηλ) — the scapegoat demon, Lord of the Desert',
  82:'Lamia (Λαμια) — Greek parallel of Lilith, the child-killing night-woman',
  108:'Leviathan / Lebiathan (Λεβιαθαν) in the LXX Septuagint; sacred number of the Hindu cosmos (108 mala beads, 108 Upanishads)',
  146:'Gabriel (Γαβριηλ)',
  148:'Beliar (Βελιαρ) — NT Greek form of Belial (2 Corinthians 6:15)',
  153:'The 153 fish (John 21:11); triangle of 17; ΝΙΖ; the Pythagorean "fish" vesica',
  246:'Logos in a variant form; Gabriel in Hebrew',
  280:'Samael (Σαμαηλ) — the angel of death in Greek transmission',
  284:'Theos (ΘΕΟΣ) — "God"',
  365:'Abraxas (ΑΒΡΑΣΑΞ) — lord of 365 heavens; the solar year',
  373:'Logos (ΛΟΓΟΣ) — "The Word" (John 1:1); Christ as divine reason',
  556:'Beelzeboul (Βεελζεβουλ) — "Lord of the Royal Palace" (NT Greek)',
  596:'Asmodaios (Ασμοδαιος) — the NT/LXX form of Asmodeus',
  618:'Uriel (Ουριηλ) in Greek polytonic transliteration',
  666:'Number of the Beast (Revelation 13:18 — ΧΞΣ); Νευραλινκ (Neuralink); ΤΟΜΕΓΑΘΗΡΙΟΝ (Crowley\'s title "To Mega Therion"); LATEINOS (Λατεινος — "the Roman man"); Nero Caesar in Hebrew gematria (נרון קסר=666)',
  681:'Michael (Μιχαηλ) — commander of the heavenly host',
  689:'Michael (Μιχαήλ) with eta — the archangel of divine warfare',
  777:'ΠΑΝΤΑ (Panta, "All Things"); also used in Crowley\'s Liber 777 as symbol of divine perfection',
  800:'Kyrios (ΚΥΡΙΟΣ) — "Lord"; also the letter Omega alone = 800',
  862:'Abaddon (Αβαδδων) — the Destroyer, king of the bottomless pit (Revelation 9:11)',
  866:'Metatron (Μετατρον) — the great angel in Greek',
  888:'Iesous (ΙΗΣΟΥΣ) — Jesus; 8×111; 8 = resurrection and the Ogdoad',
  1132:'Mammon (Μαμωνας) — the NT Greek form of the wealth-demon',
  1480:'Christos (ΧΡΙΣΤΟΣ) — "The Anointed One"; 8×185',
};

// ── Core calculation ──────────────────────────────────────────────────────────
function normalizeGreekChar(ch) {
  // NFD decomposition strips combining diacritical marks, leaving base letter
  const decomposed = ch.normalize('NFD');
  const base = decomposed[0];
  return GREEK_VALUES[base] !== undefined ? base : ch;
}

function calcGematria(text, lang) {
  const values = lang === 'hebrew' ? HEBREW_VALUES : GREEK_VALUES;
  const chars = [...text];
  let total = 0;
  const breakdown = [];
  for (let ch of chars) {
    if (ch.trim() === '') continue;
    // Try direct lookup (handles precomposed accented Greek with our extended map)
    if (values[ch] !== undefined) {
      total += values[ch];
      breakdown.push({ char: ch, val: values[ch] });
    } else if (lang === 'greek') {
      // Try NFD base-char decomposition as fallback
      const base = ch.normalize('NFD')[0];
      if (GREEK_VALUES[base] !== undefined) {
        total += GREEK_VALUES[base];
        breakdown.push({ char: ch, val: GREEK_VALUES[base] });
      } else {
        breakdown.push({ char: ch, val: null });
      }
    } else {
      breakdown.push({ char: ch, val: null });
    }
  }
  return { total, breakdown };
}

// ── Cross-entity gematria index ────────────────────────────────────────────
let GEM_INDEX = null; // { hebrew: { value: [entityId,...] }, greek: {...} }

function buildGemIndex() {
  if (GEM_INDEX || !DB) return;
  GEM_INDEX = { hebrew: {}, greek: {} };
  for (const entity of DB.entities) {
    if (!entity.gematria) continue;
    const g = entity.gematria;
    if (g.hebrew?.standard) {
      const v = g.hebrew.standard;
      (GEM_INDEX.hebrew[v] = GEM_INDEX.hebrew[v] || []).push(entity.id);
    }
    if (g.greek?.isopsephy) {
      const v = g.greek.isopsephy;
      (GEM_INDEX.greek[v] = GEM_INDEX.greek[v] || []).push(entity.id);
    }
  }
}

function findMatchingEntities(total, lang) {
  if (!total || !GEM_INDEX || !DB) return [];
  const idx = lang === 'hebrew' ? GEM_INDEX.hebrew : GEM_INDEX.greek;
  const ids = idx[total] || [];
  return ids.map(id => DB.entities.find(e => e.id === id)).filter(Boolean);
}

// ── Calculator render ──────────────────────────────────────────────────────
let _calcInitialized = false;

function renderCalculator() {
  const inputEl = document.getElementById('gem-calc-input');
  const langEl  = document.getElementById('gem-calc-lang');
  if (!inputEl || !langEl) return;

  const rawInput = inputEl.value;
  const lang = langEl.value;

  // Auto-detect if input looks like ASCII (Latin letters) → offer/auto-transliterate
  const isLatin = rawInput.length > 0 && /^[\x20-\x7E]+$/.test(rawInput);
  const transBtn = document.getElementById('gem-translit-btn');
  if (transBtn) transBtn.style.display = (isLatin && rawInput.trim()) ? '' : 'none';

  const { total, breakdown } = calcGematria(rawInput, lang);

  const bdEl = document.getElementById('gem-breakdown');
  if (!breakdown.length) {
    bdEl.innerHTML = '<span class="gem-calc-empty">Type a word in Hebrew, Greek, or English (then press Transliterate).</span>';
    document.getElementById('gem-total').textContent = '—';
    const nEl = document.getElementById('gem-notable'); nEl.textContent = ''; nEl.style.display = 'none';
    const mEl = document.getElementById('gem-matches'); if (mEl) mEl.innerHTML = '';
    return;
  }

  bdEl.innerHTML = breakdown.map(b =>
    b.val !== null
      ? `<span class="gem-char-chip"><span class="gem-char-letter">${b.char}</span><span class="gem-char-val">${b.val}</span></span>`
      : `<span class="gem-char-chip gem-char-unknown"><span class="gem-char-letter">${b.char}</span><span class="gem-char-val">?</span></span>`
  ).join('<span class="gem-plus">+</span>');

  document.getElementById('gem-total').textContent = total || '—';

  // Notable value lookup
  const notable = lang === 'hebrew' ? HEBREW_NOTABLE : GREEK_NOTABLE;
  const noteEl = document.getElementById('gem-notable');
  if (total && notable[total]) {
    noteEl.innerHTML = `<strong>◆ ${total}</strong> — ${notable[total]}`;
    noteEl.style.display = '';
  } else {
    noteEl.textContent = '';
    noteEl.style.display = 'none';
  }

  // Cross-entity matches
  buildGemIndex();
  const matches = findMatchingEntities(total, lang);
  const mEl = document.getElementById('gem-matches');
  if (mEl) {
    if (matches.length) {
      mEl.innerHTML = `
        <p class="gem-matches-label">◈ Entities in the database with this ${lang === 'hebrew' ? 'Hebrew' : 'Greek'} value (${total}):</p>
        <div class="gem-matches-grid">
          ${matches.map(e => `
            <button class="gem-match-card" onclick="openDetail('${e.id}')">
              <span class="gem-match-name">${e.canonical_name.split(' / ')[0]}</span>
              <span class="gem-match-val">${lang === 'hebrew' ? e.gematria.hebrew?.name || '' : e.gematria.greek?.name || ''}</span>
            </button>
          `).join('')}
        </div>
      `;
    } else {
      mEl.innerHTML = '';
    }
  }
}

function doTransliterate() {
  const inputEl = document.getElementById('gem-calc-input');
  const lang = document.getElementById('gem-calc-lang').value;
  if (!inputEl) return;
  const raw = inputEl.value;
  inputEl.value = lang === 'greek' ? transliterateToGreek(raw) : transliterateToHebrew(raw);
  renderCalculator();
}

function initCalculator() {
  if (_calcInitialized) { renderCalculator(); return; }
  const input = document.getElementById('gem-calc-input');
  const lang  = document.getElementById('gem-calc-lang');
  if (!input || !lang) return;
  _calcInitialized = true;
  input.addEventListener('input', renderCalculator);
  lang.addEventListener('change', () => { input.value = ''; _calcInitialized = true; renderCalculator(); });
  buildGemIndex();
  renderCalculator();
}
