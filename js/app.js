// ══════════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════════
let DB = { entities: [] };
let fuse = null;
let cy = null;
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

// Level group color palette — divine to chthonic
const LEVEL_BG = {
  1: 'rgba(180,140,255,0.13)',
  2: 'rgba(100,150,255,0.11)',
  3: 'rgba(60,200,130,0.10)',
  4: 'rgba(220,180,60,0.09)',
  5: 'rgba(220,120,50,0.09)',
  6: 'rgba(200,50,50,0.11)',
  7: 'rgba(100,80,60,0.10)'
};
const LEVEL_BORDER = {
  1:'#a070e0', 2:'#5080c0', 3:'#40a870',
  4:'#c09040', 5:'#c07840', 6:'#b04040', 7:'#706050'
};
const LEVEL_SHORT = {
  1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'VI', 7:'VII'
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

  document.getElementById('graph-edge-select').addEventListener('change', () => updateGraphEdgeVisibility());
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
        <button class="focus-graph-btn" onclick="openGraphFocused('${entity.id}','${tradKey}')">⊛ Focus in Graph</button>
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
//  GRAPH — HIERARCHY TREE (top-down, color-blocked by level)
// ══════════════════════════════════════════════════════════════
function getPrimaryTradition(entity) {
  const tv = entity.tradition_vectors||{};
  for (const k of TRADITION_ORDER) { if (tv[k]) return k; }
  const keys = Object.keys(tv);
  return keys[0] || 'default';
}

function buildGraph() {
  if (cy) return;

  // Register dagre layout if available
  if (typeof cytoscapeDagre !== 'undefined') {
    cytoscape.use(cytoscapeDagre);
  }

  const elements = [];

  // ── Level group compound nodes (one per level, top to bottom) ──
  for (let lvl = 1; lvl <= 7; lvl++) {
    elements.push({
      data: {
        id: `__level_${lvl}`,
        label: `${LEVEL_SHORT[lvl]} · ${LEVEL_LABELS[lvl].split('—')[1].trim()}`,
        isGroup: true,
        groupLevel: lvl
      },
      classes: `level-group lv${lvl}`
    });
  }

  // Hidden ordering edges: force dagre to rank groups top-down by level
  for (let lvl = 1; lvl <= 6; lvl++) {
    elements.push({
      data: { id: `__ord_${lvl}`, source: `__level_${lvl}`, target: `__level_${lvl+1}` },
      classes: 'order-edge'
    });
  }

  // ── Entity nodes — children of their level group ──
  DB.entities.forEach(entity => {
    const trad = getPrimaryTradition(entity);
    const isJesus = entity.id === 'jesus-christ';
    const lvl = entity.hierarchical_level || 5;
    const shortLabel = entity.canonical_name
      .split(' / ')[0].split(' (')[0].split(',')[0];

    elements.push({
      data: {
        id: entity.id,
        parent: `__level_${lvl}`,
        label: shortLabel,
        color: isJesus ? '#f0cc70' : (NODE_COLORS[trad] || NODE_COLORS.default),
        tradition: trad,
        level: lvl,
        isJesus: isJesus ? 1 : 0
      }
    });
  });

  // ── Edges — all relationships stored; hierarchical ones visible by default ──
  const HIER_TYPES = new Set(['COMMANDS','EMANATED_FROM','DESCENDED_FROM','FALLEN_FORM_OF','MANIFESTED_AS','TAUGHT_BY']);
  const addedEdges = new Set();

  DB.entities.forEach(entity => {
    (entity.relationships||[]).forEach(rel => {
      const eid = [entity.id, rel.target_id, rel.edge_type].join('|');
      const rev = [rel.target_id, entity.id, rel.edge_type].join('|');
      if (addedEdges.has(rev)) return;
      if (!DB.entities.find(e => e.id === rel.target_id)) return;
      addedEdges.add(eid);
      const isHier = HIER_TYPES.has(rel.edge_type);
      elements.push({
        data: {
          id: eid,
          source: entity.id,
          target: rel.target_id,
          edgeType: rel.edge_type,
          color: EDGE_COLORS[rel.edge_type] || '#888',
          isHierarchical: isHier ? 1 : 0
        },
        classes: isHier ? 'hier-edge' : 'cross-edge'
      });
    });
  });

  const hasDAGRE = typeof cytoscapeDagre !== 'undefined';

  cy = cytoscape({
    container: document.getElementById('cy-fullscreen'),
    elements,
    style: [
      // ── Level group bands ──
      {
        selector: '.level-group',
        style: {
          'background-color': (el) => LEVEL_BG[el.data('groupLevel')] || 'rgba(100,80,60,0.1)',
          'background-opacity': 1,
          'border-color': (el) => LEVEL_BORDER[el.data('groupLevel')] || '#706050',
          'border-opacity': 0.55,
          'border-width': 1.5,
          'label': 'data(label)',
          'text-valign': 'top',
          'text-halign': 'center',
          'color': (el) => LEVEL_BORDER[el.data('groupLevel')] || '#a89870',
          'font-family': 'Cinzel, serif',
          'font-size': '10px',
          'font-weight': '500',
          'letter-spacing': '1px',
          'text-background-color': '#0c0a07',
          'text-background-opacity': 0.88,
          'text-background-padding': '5px',
          'padding': '22px',
          'shape': 'roundrectangle',
          'compound-sizing-wrt-labels': 'include',
          'min-width': 240
        }
      },
      // ── Entity nodes ──
      {
        selector: 'node:not(.level-group)',
        style: {
          'background-color': 'data(color)',
          'label': 'data(label)',
          'color': '#f0e6cc',
          'font-family': 'Cinzel, serif',
          'font-size': '9px',
          'font-weight': '600',
          'text-background-color': '#0f0d0a',
          'text-background-opacity': 0.88,
          'text-background-padding': '2px',
          'text-valign': 'center',
          'text-halign': 'center',
          'text-outline-color': '#0a0806',
          'text-outline-width': '1px',
          'text-wrap': 'wrap',
          'text-max-width': '78px',
          'width': (el) => el.data('isJesus') ? 54 : Math.max(28, 50 - (el.data('level')||5) * 2),
          'height': (el) => el.data('isJesus') ? 54 : Math.max(28, 50 - (el.data('level')||5) * 2),
          'border-width': (el) => el.data('isJesus') ? 3 : 1.5,
          'border-color': 'data(color)',
          'border-opacity': 0.85,
          'shape': (el) => el.data('isJesus') ? 'star' : 'ellipse',
          'z-index': (el) => el.data('isJesus') ? 999 : 1
        }
      },
      {
        selector: 'node:selected:not(.level-group)',
        style: { 'border-width': 4, 'border-opacity': 1 }
      },
      // ── Hierarchical edges (default visible) ──
      {
        selector: '.hier-edge',
        style: {
          'line-color': 'data(color)',
          'target-arrow-color': 'data(color)',
          'target-arrow-shape': 'triangle',
          'arrow-scale': 0.75,
          'width': 1.5,
          'opacity': 0.72,
          'curve-style': 'taxi',
          'taxi-direction': 'downward'
        }
      },
      // ── Cross-link edges (hidden by default, toggled by filter) ──
      {
        selector: '.cross-edge',
        style: {
          'line-color': 'data(color)',
          'target-arrow-color': 'data(color)',
          'target-arrow-shape': 'triangle',
          'arrow-scale': 0.75,
          'width': 1.2,
          'opacity': 0,
          'curve-style': 'bezier',
          'line-style': 'dashed',
          'line-dash-pattern': [6, 4],
          'events': 'no'
        }
      },
      // ── Ordering edges (invisible skeleton) ──
      { selector: '.order-edge', style: { 'opacity': 0, 'events': 'no', 'width': 0 } },
      // ── Dimming ──
      { selector: 'edge.hidden', style: { 'opacity': 0, 'events': 'no' } },
      { selector: 'node.dimmed:not(.level-group)', style: { 'opacity': 0.08, 'text-opacity': 0 } },
      { selector: '.level-group.dimmed', style: { 'background-opacity': 0.4, 'border-opacity': 0.2 } },
      { selector: 'edge.dimmed:not(.order-edge)', style: { 'opacity': 0.03 } }
    ],
    layout: hasDAGRE ? {
      name: 'dagre',
      rankDir: 'TB',
      align: 'UL',
      nodeSep: 28,
      rankSep: 55,
      edgeSep: 10,
      ranker: 'tight-tree',
      animate: true,
      animationDuration: 800,
      padding: 40,
      fit: true
    } : {
      name: 'breadthfirst',
      directed: true,
      roots: ['jesus-christ'],
      spacingFactor: 1.6,
      padding: 60,
      animate: true,
      animationDuration: 700
    },
    userZoomingEnabled: true,
    userPanningEnabled: true,
    minZoom: 0.04,
    maxZoom: 6,
    wheelSensitivity: 0.07,
    boxSelectionEnabled: false,
    touchTapThreshold: 8,
    desktopTapThreshold: 4,
    autolock: false,
    autoungrabify: false,
    autounselectify: false
  });

  cy.on('tap', 'node:not(.level-group)', evt => {
    const id = evt.target.id();
    cy.nodes(':not(.level-group)').addClass('dimmed');
    cy.nodes('.level-group').addClass('dimmed');
    cy.edges(':not(.order-edge)').addClass('dimmed');
    evt.target.removeClass('dimmed');
    evt.target.connectedEdges(':not(.order-edge)').removeClass('dimmed').connectedNodes(':not(.level-group)').removeClass('dimmed');
    openDetail(id);
  });

  cy.on('tap', '.level-group', evt => {
    cy.elements().removeClass('dimmed');
    const lvl = evt.target.data('groupLevel');
    const children = cy.nodes(`[level = ${lvl}]:not(.level-group)`);
    cy.nodes(':not(.level-group)').addClass('dimmed');
    cy.edges(':not(.order-edge)').addClass('dimmed');
    cy.nodes('.level-group').addClass('dimmed');
    children.removeClass('dimmed');
    evt.target.removeClass('dimmed');
  });

  cy.on('tap', evt => {
    if (evt.target === cy) cy.elements().removeClass('dimmed');
  });

  // Build legend
  const legendEl = document.getElementById('graph-legend');
  legendEl.innerHTML = Object.entries(NODE_COLORS)
    .filter(([k]) => k !== 'default')
    .map(([k, c]) => `<div class="legend-item"><div class="legend-dot" style="background:${c}"></div>${TRADITION_LABELS[k]||k}</div>`)
    .join('');
}

function openGraphFocused(entityId, tradKey) {
  closeDetail();
  openGraphOverlay(entityId);
  if (tradKey) {
    const sel = document.getElementById('graph-trad-select');
    if (sel) { sel.value = tradKey; updateGraphTradVisibility(); }
  }
  if (cy) {
    cy.ready(() => {
      const node = cy.getElementById(entityId);
      if (node && node.length) {
        cy.$(':selected').unselect();
        node.select();
        const neighbors = node.connectedEdges(':not(.order-edge)').connectedNodes().union(node);
        cy.nodes(':not(.level-group)').addClass('dimmed');
        cy.nodes('.level-group').addClass('dimmed');
        cy.edges(':not(.order-edge)').addClass('dimmed');
        node.removeClass('dimmed');
        node.connectedEdges(':not(.order-edge)').removeClass('dimmed').connectedNodes(':not(.level-group)').removeClass('dimmed');
        cy.fit(neighbors.union(node.parent()), 80);
      }
    });
  }
  const entity = DB.entities.find(e => e.id === entityId);
  if (entity) document.getElementById('graph-focus-label').textContent =
    `Focused: ${entity.canonical_name}${tradKey ? ' · ' + (TRADITION_LABELS[tradKey]||tradKey) : ''}`;
}

function openGraphForCurrent() {
  if (currentDetailId) openGraphFocused(currentDetailId, null);
  else openGraphOverlay(null);
}

function openGraphOverlay(focusId) {
  const overlay = document.getElementById('graph-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  if (!cy) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        buildGraph();
        if (cy) {
          cy.resize();
          if (focusId) {
            const node = cy.getElementById(focusId);
            if (node && node.length) cy.fit(node.union(node.connectedEdges(':not(.order-edge)').connectedNodes()), 80);
            else cy.fit(undefined, 40);
          } else {
            cy.fit(undefined, 40);
          }
        }
      });
    });
  } else {
    cy.resize();
    if (focusId) {
      const node = cy.getElementById(focusId);
      if (node && node.length) cy.fit(node.union(node.connectedEdges(':not(.order-edge)').connectedNodes()), 80);
    } else {
      cy.fit(undefined, 40);
    }
  }
}

function closeGraph() {
  document.getElementById('graph-overlay').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('graph-focus-label').textContent = '';
  document.getElementById('graph-edge-select').value = 'hier';
  document.getElementById('graph-trad-select').value = 'all';
  if (cy) {
    cy.elements().removeClass('dimmed hidden');
    updateGraphEdgeVisibility();
  }
}

function resetGraph() {
  if (!cy) return;
  cy.elements().removeClass('dimmed hidden');
  document.getElementById('graph-focus-label').textContent = '';
  document.getElementById('graph-edge-select').value = 'hier';
  document.getElementById('graph-trad-select').value = 'all';
  updateGraphEdgeVisibility();
  updateGraphTradVisibility();
  cy.fit(undefined, 40);
}

function updateGraphEdgeVisibility() {
  if (!cy) return;
  const val = document.getElementById('graph-edge-select').value;

  // Always hide ordering skeleton edges
  cy.edges('.order-edge').style({ opacity: 0, events: 'no' });

  if (val === 'hier') {
    // Default: hierarchical edges only
    cy.edges('.hier-edge').style({ opacity: 0.72, events: 'yes' });
    cy.edges('.cross-edge').style({ opacity: 0, events: 'no' });
  } else if (val === 'all') {
    cy.edges('.hier-edge').style({ opacity: 0.72, events: 'yes' });
    cy.edges('.cross-edge').style({ opacity: 0.55, events: 'yes' });
  } else if (val === 'cross') {
    cy.edges('.hier-edge').style({ opacity: 0.15 });
    cy.edges('.cross-edge').style({ opacity: 0.65, events: 'yes' });
  } else {
    // Specific edge type
    cy.edges(':not(.order-edge)').forEach(e => {
      if (e.data('edgeType') === val) {
        e.style({ opacity: 0.75, events: 'yes' });
      } else {
        e.style({ opacity: 0, events: 'no' });
      }
    });
  }
}

function updateGraphTradVisibility() {
  if (!cy) return;
  const val = document.getElementById('graph-trad-select').value;
  cy.elements().removeClass('dimmed');
  if (val !== 'all') {
    cy.nodes(':not(.level-group)').forEach(n => {
      if (n.data('tradition') !== val) n.addClass('dimmed');
    });
    cy.edges(':not(.order-edge)').forEach(e => {
      const src = cy.getElementById(e.data('source'));
      const tgt = cy.getElementById(e.data('target'));
      if (src.hasClass('dimmed') || tgt.hasClass('dimmed')) e.addClass('dimmed');
    });
    const visible = cy.nodes(':not(.level-group)').filter(n => n.data('tradition') === val);
    if (visible.length) cy.fit(visible, 80);
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
//  BOOT — init() is called by js/data.js after fetching data/entities.json
// ══════════════════════════════════════════════════════════════
