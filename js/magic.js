/* ═══════════════════════════════════════════════════════════════
   MAGIC.JS — Enhancement Layer · Pantheon Concordance
   All globals prefixed M_ | Additive only | No existing fn removal
═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── READY GUARD ──────────────────────────────────────────────
function M_whenReady(fn, retries) {
  retries = retries || 0;
  if (window.DB && window.DB.entities && window.DB.entities.length > 0) {
    fn();
  } else if (retries < 120) {
    setTimeout(function() { M_whenReady(fn, retries + 1); }, 100);
  }
}

// ══════════════════════════════════════════════════════════════
//  MODULE 1 — AMBIENT SOUND ENGINE
// ══════════════════════════════════════════════════════════════
var M_audioCtx = null;
var M_masterGain = null;
var M_soundEnabled = false;
var M_droneOsc = null;
var M_droneLfo = null;
var M_noiseSource = null;
var M_chimeIndex = 0;
var M_CHIME_FREQS = [261.63, 329.63, 392, 493.88, 587.33]; // C4 E4 G4 B4 D5

function M_initSound() {
  var header = document.getElementById('header');
  if (!header) return;
  var btn = document.createElement('button');
  btn.id = 'sound-toggle';
  btn.className = 'sound-toggle-btn';
  btn.setAttribute('aria-label', 'Toggle ambient sound');
  btn.textContent = '◉ Sound Off';
  btn.addEventListener('click', M_toggleSound);
  header.appendChild(btn);
}

function M_ensureAudioCtx() {
  if (!M_audioCtx) {
    M_audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    M_masterGain = M_audioCtx.createGain();
    M_masterGain.gain.value = 0;
    M_masterGain.connect(M_audioCtx.destination);
  }
  if (M_audioCtx.state === 'suspended') M_audioCtx.resume();
}

function M_toggleSound() {
  M_ensureAudioCtx();
  M_soundEnabled = !M_soundEnabled;
  var btn = document.getElementById('sound-toggle');
  if (M_soundEnabled) {
    M_masterGain.gain.setTargetAtTime(0.55, M_audioCtx.currentTime, 2.0);
    M_startDrone();
    M_startNoise();
    if (btn) btn.textContent = '◈ Sound On';
    try { localStorage.setItem('pantheon_sound', 'on'); } catch(e) {}
  } else {
    M_masterGain.gain.setTargetAtTime(0, M_audioCtx.currentTime, 1.0);
    if (btn) btn.textContent = '◉ Sound Off';
    try { localStorage.setItem('pantheon_sound', 'off'); } catch(e) {}
  }
}

function M_startDrone() {
  if (M_droneOsc) return;

  var reverb = M_createReverb();
  reverb.connect(M_masterGain);

  var osc = M_audioCtx.createOscillator();
  var droneGain = M_audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 41.2;
  droneGain.gain.value = 0.4;
  osc.connect(droneGain);
  droneGain.connect(reverb);
  osc.start();
  M_droneOsc = osc;

  var lfo = M_audioCtx.createOscillator();
  var lfoGain = M_audioCtx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 0.5;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  lfo.start();
  M_droneLfo = lfo;
}

function M_startNoise() {
  if (M_noiseSource) return;
  var rate = M_audioCtx.sampleRate;
  var len = rate * 4;
  var buf = M_audioCtx.createBuffer(1, len, rate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1);

  var src = M_audioCtx.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  var lpf = M_audioCtx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = 280;
  lpf.Q.value = 0.5;

  var ng = M_audioCtx.createGain();
  ng.gain.value = 0.035;

  src.connect(lpf);
  lpf.connect(ng);
  ng.connect(M_masterGain);
  src.start();
  M_noiseSource = src;
}

function M_createReverb() {
  var convolver = M_audioCtx.createConvolver();
  var rate = M_audioCtx.sampleRate;
  var len = Math.floor(rate * 2.8);
  var irBuf = M_audioCtx.createBuffer(2, len, rate);
  for (var ch = 0; ch < 2; ch++) {
    var d = irBuf.getChannelData(ch);
    for (var i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    }
  }
  convolver.buffer = irBuf;
  return convolver;
}

function M_playChime() {
  if (!M_soundEnabled || !M_audioCtx) return;
  var freq = M_CHIME_FREQS[M_chimeIndex % M_CHIME_FREQS.length];
  M_chimeIndex = (M_chimeIndex + Math.floor(Math.random() * 3) + 1) % M_CHIME_FREQS.length;
  var t = M_audioCtx.currentTime;
  var osc = M_audioCtx.createOscillator();
  var g = M_audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.12, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
  osc.connect(g);
  g.connect(M_masterGain);
  osc.start(t);
  osc.stop(t + 2.2);
}

function M_playBell() {
  if (!M_soundEnabled || !M_audioCtx) return;
  var freqs = [523.25, 659.25, 783.99];
  freqs.forEach(function(freq, i) {
    var t = M_audioCtx.currentTime + i * 0.07;
    var osc = M_audioCtx.createOscillator();
    var g = M_audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 4.0);
    osc.connect(g);
    g.connect(M_masterGain);
    osc.start(t);
    osc.stop(t + 4.0);
  });
}

// ══════════════════════════════════════════════════════════════
//  MODULE 4 — TRADITION HEADER SIGIL
// ══════════════════════════════════════════════════════════════
var M_SIGILS = {
  biblical_angel: '<polygon points="50,14 58,36 82,36 63,50 70,74 50,60 30,74 37,50 18,36 42,36" stroke="var(--gold)" stroke-width="1.2" fill="none" opacity="0.7"/><polygon points="50,86 42,64 18,64 37,50 30,26 50,40 70,26 63,50 82,64 58,64" stroke="var(--gold)" stroke-width="0.8" fill="none" opacity="0.4"/>',
  enochian: '<rect x="22" y="44" width="56" height="12" stroke="var(--gold)" stroke-width="1.2" fill="none" opacity="0.65"/><rect x="44" y="22" width="12" height="56" stroke="var(--gold)" stroke-width="1.2" fill="none" opacity="0.65"/><rect x="12" y="44" width="12" height="12" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.5"/><rect x="76" y="44" width="12" height="12" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.5"/><rect x="44" y="12" width="12" height="12" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.5"/><rect x="44" y="76" width="12" height="12" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.5"/>',
  kabbalistic: '<circle cx="50" cy="10" r="4" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.65"/><circle cx="76" cy="26" r="3.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/><circle cx="24" cy="26" r="3.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/><circle cx="76" cy="46" r="3.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/><circle cx="24" cy="46" r="3.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/><circle cx="50" cy="56" r="4" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.65"/><circle cx="76" cy="68" r="3.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/><circle cx="24" cy="68" r="3.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/><circle cx="50" cy="78" r="3.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/><circle cx="50" cy="92" r="4" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.65"/><line x1="50" y1="10" x2="76" y2="26" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="50" y1="10" x2="24" y2="26" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="76" y1="26" x2="24" y2="26" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="76" y1="26" x2="76" y2="46" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="24" y1="26" x2="24" y2="46" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="76" y1="26" x2="50" y2="56" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="24" y1="26" x2="50" y2="56" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="76" y1="46" x2="24" y2="46" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="76" y1="46" x2="50" y2="56" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="24" y1="46" x2="50" y2="56" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="50" y1="56" x2="76" y2="68" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="50" y1="56" x2="24" y2="68" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="50" y1="56" x2="50" y2="78" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="76" y1="68" x2="24" y2="68" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="76" y1="68" x2="50" y2="78" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="24" y1="68" x2="50" y2="78" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="50" y1="78" x2="50" y2="92" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/>',
  hermetic: '<line x1="50" y1="14" x2="50" y2="88" stroke="var(--gold)" stroke-width="1.5" opacity="0.65"/><path d="M50,30 Q36,38 50,48 Q64,58 50,68 Q36,78 50,86" stroke="var(--gold)" stroke-width="1.3" fill="none" opacity="0.6"/><path d="M50,30 Q64,38 50,48 Q36,58 50,68 Q64,78 50,86" stroke="var(--gold)" stroke-width="1.3" fill="none" opacity="0.6"/><path d="M38,22 Q28,16 24,24 Q28,32 38,28" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.55"/><path d="M62,22 Q72,16 76,24 Q72,32 62,28" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.55"/><circle cx="50" cy="21" r="5.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.55"/>',
  gnostic: '<circle cx="50" cy="50" r="33" stroke="var(--gold)" stroke-width="1.5" fill="none" opacity="0.65"/><path d="M50,17 Q18,28 17,50 Q18,72 50,83 Q54,80 56,77 Q34,68 33,50 Q34,32 56,25 Z" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.4"/><circle cx="56" cy="19" r="3.5" fill="var(--gold)" fill-opacity="0.35" stroke="var(--gold)" stroke-width="0.8" opacity="0.7"/>',
  greek: '<polygon points="50,14 55,38 80,21 62,43 88,50 62,57 80,79 55,62 50,86 45,62 20,79 38,57 12,50 38,43 20,21 45,38" stroke="var(--gold)" stroke-width="1.3" fill="none" opacity="0.65"/>',
  roman: '<ellipse cx="50" cy="50" rx="30" ry="38" stroke="var(--gold)" stroke-width="1.3" fill="none" opacity="0.55"/><path d="M30,30 Q21,27 19,34 Q23,39 31,37" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.55"/><path d="M70,30 Q79,27 81,34 Q77,39 69,37" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.55"/><path d="M30,42 Q21,39 19,46 Q23,51 31,49" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.48"/><path d="M70,42 Q79,39 81,46 Q77,51 69,49" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.48"/><path d="M30,55 Q21,52 19,59 Q23,64 31,62" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.42"/><path d="M70,55 Q79,52 81,59 Q77,64 69,62" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.42"/><path d="M36,66 Q28,63 27,70 Q31,75 38,73" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.38"/><path d="M64,66 Q72,63 73,70 Q69,75 62,73" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.38"/>',
  egyptian: '<circle cx="50" cy="30" r="15" stroke="var(--gold)" stroke-width="1.5" fill="none" opacity="0.65"/><line x1="50" y1="45" x2="50" y2="88" stroke="var(--gold)" stroke-width="1.5" opacity="0.65"/><line x1="32" y1="62" x2="68" y2="62" stroke="var(--gold)" stroke-width="1.5" opacity="0.65"/>',
  mesopotamian: '<polygon points="50,12 57,36 80,21 65,43 90,50 65,57 80,79 57,64 50,88 43,64 20,79 35,57 10,50 35,43 20,21 43,36" stroke="var(--gold)" stroke-width="1.3" fill="none" opacity="0.65"/><circle cx="50" cy="50" r="9" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.4"/>',
  canaanite: '<path d="M24,50 A26,26 0 1,1 50,24 A26,26 0 0,0 24,50" stroke="var(--gold)" stroke-width="1.5" fill="none" opacity="0.65"/><polygon points="74,22 77,32 70,27 80,27 73,32" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/>',
  hindu: '<text x="50" y="68" text-anchor="middle" font-size="54" font-family="serif" fill="none" stroke="var(--gold)" stroke-width="0.9" opacity="0.6">ॐ</text>',
  goetic: '<circle cx="50" cy="50" r="37" stroke="var(--gold)" stroke-width="1.3" fill="none" opacity="0.65"/><polygon points="50,13 83.5,58.5 16.5,58.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.55"/><polygon points="50,87 83.5,41.5 16.5,41.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.4"/>',
  islamic: '<polygon points="50,14 61,36 86,35 68,54 76,78 50,65 24,78 32,54 14,35 39,36" stroke="var(--gold)" stroke-width="1.3" fill="none" opacity="0.65"/><polygon points="50,26 59,42 78,42 64,53 70,70 50,60 30,70 36,53 22,42 41,42" stroke="var(--gold)" stroke-width="0.8" fill="none" opacity="0.38"/>',
  planetary: '<polygon points="50,12 79.7,26.3 87,58.5 66.5,84.2 33.5,84.2 13,58.5 20.3,26.3" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.38"/><polygon points="50,12 66.5,84.2 13,58.5 87,58.5 20.3,26.3 79.7,26.3 33.5,84.2" stroke="var(--gold)" stroke-width="1.3" fill="none" opacity="0.65"/>'
};

var M_currentSigilTrad = 'all';

function M_initSigils() {
  var header = document.getElementById('header');
  if (!header) return;

  var wrap = document.createElement('div');
  wrap.id = 'header-sigil-svg-wrap';
  wrap.innerHTML = '<svg id="header-sigil-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"></svg>';
  header.appendChild(wrap);

  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      M_showSigil(btn.dataset.filter || 'all');
    });
  });
}

function M_showSigil(tradition) {
  var svgEl = document.getElementById('header-sigil-svg');
  if (!svgEl || tradition === M_currentSigilTrad) return;
  M_currentSigilTrad = tradition;
  svgEl.style.opacity = '0';
  setTimeout(function() {
    svgEl.innerHTML = (tradition === 'all' || !M_SIGILS[tradition]) ? '' : M_SIGILS[tradition];
    svgEl.style.opacity = '1';
  }, 200);
}

// ══════════════════════════════════════════════════════════════
//  MODULE 2 — CONSTELLATION RELATIONSHIP MAP
// ══════════════════════════════════════════════════════════════
function M_initConstellation() {
  var _origOpen = window.openDetail;
  window.openDetail = function(id) {
    _origOpen(id);
    M_injectDetailExtras(id);
    M_playBell();
    M_showEntityInsightForId(id);
  };
  var _origClose = window.closeDetail;
  window.closeDetail = function() {
    _origClose();
    M_hideInsightBar();
  };
}

function M_injectDetailExtras(entityId) {
  var oldC = document.getElementById('m-constellation-btn');
  var oldE = document.getElementById('m-export-btn');
  if (oldC) oldC.remove();
  if (oldE) oldE.remove();

  var actions = document.querySelector('.detail-actions');
  if (!actions) return;

  var cBtn = document.createElement('button');
  cBtn.id = 'm-constellation-btn';
  cBtn.className = 'detail-graph-btn';
  cBtn.setAttribute('aria-label', 'Open Constellation Map');
  cBtn.textContent = '⊕ Constellation Map';
  cBtn.addEventListener('click', function() { M_openConstellation(entityId); });

  var eBtn = document.createElement('button');
  eBtn.id = 'm-export-btn';
  eBtn.className = 'detail-graph-btn';
  eBtn.setAttribute('aria-label', 'Export entity data');
  eBtn.textContent = '⊡ Export';
  eBtn.addEventListener('click', function() { M_openExportModal(entityId); });

  var closeBtn = actions.querySelector('.detail-close');
  if (closeBtn) {
    actions.insertBefore(cBtn, closeBtn);
    actions.insertBefore(eBtn, closeBtn);
  } else {
    actions.appendChild(cBtn);
    actions.appendChild(eBtn);
  }
}

function M_openConstellation(entityId) {
  if (!window.DB || !window.DB.entities) return;
  var overlay = document.getElementById('constellation-overlay');
  if (!overlay) return;

  var lbl = overlay.querySelector('.constellation-entity-label');
  if (lbl) {
    var ent = window.DB.entities.find(function(e) { return e.id === entityId; });
    if (ent) lbl.textContent = ent.canonical_name;
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  M_buildConstellationGraph(entityId);
}

function M_closeConstellation() {
  var overlay = document.getElementById('constellation-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  var wrap = document.getElementById('constellation-svg-wrap');
  if (wrap) wrap.innerHTML = '';
  var leg = document.getElementById('constellation-legend');
  if (leg) leg.innerHTML = '';
}

function M_buildConstellationGraph(entityId) {
  var entity = window.DB.entities.find(function(e) { return e.id === entityId; });
  if (!entity) return;

  var wrap = document.getElementById('constellation-svg-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';

  var rels = entity.relationships || [];

  if (!rels.length) {
    wrap.innerHTML = '<div class="constellation-empty"><span class="constellation-empty-glyph">◉</span><p>No cross-traditional relationships recorded for ' + entity.canonical_name + '.</p></div>';
    return;
  }

  if (typeof d3 === 'undefined') {
    wrap.innerHTML = '<div class="constellation-empty"><span class="constellation-empty-glyph">◉</span><p>Graph library not yet loaded. Please try again.</p></div>';
    return;
  }

  var nodes = [{ id: entity.id, name: entity.canonical_name, level: entity.hierarchical_level || 5, focal: true, entity: entity }];
  var links = [];
  var seen = {};
  seen[entity.id] = true;

  rels.forEach(function(rel) {
    var target = window.DB.entities.find(function(e) { return e.id === rel.target_id; });
    if (!seen[rel.target_id]) {
      seen[rel.target_id] = true;
      var lvl = target ? (target.hierarchical_level || 5) : 5;
      nodes.push({ id: rel.target_id, name: target ? target.canonical_name : rel.target_id.replace(/-/g, ' '), level: lvl, focal: false, entity: target });
    }
    links.push({ source: entity.id, target: rel.target_id, type: rel.edge_type });
  });

  var W = wrap.clientWidth || 800;
  var H = wrap.clientHeight || 500;

  var svg = d3.select(wrap).append('svg')
    .attr('width', W).attr('height', H)
    .attr('aria-label', 'Constellation map for ' + entity.canonical_name);

  var defs = svg.append('defs');
  var edgeColors = window.EDGE_COLORS || {};
  Object.keys(edgeColors).forEach(function(type) {
    defs.append('marker')
      .attr('id', 'cst-arrow-' + type)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22).attr('refY', 0)
      .attr('markerWidth', 5).attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', edgeColors[type]);
  });

  var sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(function(d) { return d.id; }).distance(130).strength(0.5))
    .force('charge', d3.forceManyBody().strength(-320))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(44));

  var linkSel = svg.append('g').selectAll('line')
    .data(links).join('line')
    .attr('stroke', function(d) { return edgeColors[d.type] || '#c9983a'; })
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.65)
    .attr('marker-end', function(d) { return edgeColors[d.type] ? 'url(#cst-arrow-' + d.type + ')' : null; });

  var edgeTip = d3.select(wrap).append('div').attr('class', 'm-edge-tooltip').style('display', 'none');
  linkSel
    .on('mouseenter', function(event, d) {
      edgeTip.style('display', 'block')
        .style('left', (event.offsetX + 14) + 'px')
        .style('top', (event.offsetY - 10) + 'px')
        .text(d.type.replace(/_/g, ' '));
    })
    .on('mouseleave', function() { edgeTip.style('display', 'none'); });

  var nodeGrp = svg.append('g').selectAll('g')
    .data(nodes).join('g')
    .attr('class', 'constellation-node')
    .style('cursor', 'pointer')
    .call(d3.drag()
      .on('start', function(event, d) { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', function(event, d) { d.fx = event.x; d.fy = event.y; })
      .on('end', function(event, d) { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
    );

  nodeGrp.each(function(d) {
    var g = d3.select(this);
    var nodeColors = window.NODE_COLORS || {};
    var trad = 'default';
    if (!d.focal && d.entity) {
      var keys = Object.keys(d.entity.tradition_vectors || {});
      if (keys.length) trad = keys[0];
    }
    var color = d.focal ? '#f0cc70' : (nodeColors[trad] || '#c9983a');
    var r = d.focal ? 22 : Math.max(10, 22 - d.level * 1.8);

    if (d.focal) {
      g.append('circle').attr('r', r + 6).attr('fill', 'none')
        .attr('stroke', '#f0cc70').attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '4 3').attr('opacity', 0.65);
    }
    g.append('circle').attr('r', r)
      .attr('fill', color).attr('fill-opacity', d.focal ? 0.22 : 0.16)
      .attr('stroke', color).attr('stroke-width', d.focal ? 2 : 1);

    var shortName = d.name.split(' / ')[0].split(' (')[0];
    if (shortName.length > 16) shortName = shortName.substring(0, 15) + '…';
    g.append('text')
      .attr('text-anchor', 'middle').attr('dy', r + 14)
      .attr('font-family', 'Cinzel, serif').attr('font-size', d.focal ? '10.5px' : '9px')
      .attr('fill', color).attr('fill-opacity', 0.9)
      .text(shortName);

    g.on('click', function() { M_closeConstellation(); window.openDetail(d.id); })
     .on('mouseenter', function() { g.select('circle').attr('fill-opacity', 0.4); })
     .on('mouseleave', function() { g.select('circle').attr('fill-opacity', d.focal ? 0.22 : 0.16); });
  });

  sim.on('tick', function() {
    linkSel
      .attr('x1', function(d) { return Math.max(20, Math.min(W - 20, d.source.x)); })
      .attr('y1', function(d) { return Math.max(20, Math.min(H - 20, d.source.y)); })
      .attr('x2', function(d) { return Math.max(20, Math.min(W - 20, d.target.x)); })
      .attr('y2', function(d) { return Math.max(20, Math.min(H - 20, d.target.y)); });
    nodeGrp.attr('transform', function(d) {
      return 'translate(' + Math.max(30, Math.min(W - 30, d.x)) + ',' + Math.max(30, Math.min(H - 30, d.y)) + ')';
    });
  });

  var legendEl = document.getElementById('constellation-legend');
  if (legendEl) {
    var usedTypes = links.map(function(l) { return l.type; }).filter(function(t, i, a) { return a.indexOf(t) === i; });
    legendEl.innerHTML = usedTypes.map(function(t) {
      var c = edgeColors[t] || '#c9983a';
      return '<div class="legend-item"><div class="legend-dot" style="background:' + c + '"></div>' + t.replace(/_/g, ' ') + '</div>';
    }).join('');
  }
}

// ══════════════════════════════════════════════════════════════
//  MODULE 3 — ENTITY LORE TOOLTIPS
// ══════════════════════════════════════════════════════════════
var M_loreTimer = null;

function M_initLoreTooltips() {
  var grid = document.getElementById('results-grid');
  if (!grid) return;
  var obs = new MutationObserver(function() { M_attachLoreListeners(); });
  obs.observe(grid, { childList: true });
  M_attachLoreListeners();
}

function M_attachLoreListeners() {
  document.querySelectorAll('.entity-card:not([data-lore-ok])').forEach(function(card) {
    card.setAttribute('data-lore-ok', '1');
    card.addEventListener('mouseenter', function() {
      clearTimeout(M_loreTimer);
      M_loreTimer = setTimeout(function() {
        if (document.getElementById('detail-overlay').classList.contains('open')) return;
        if (!window.DB) return;
        var nameEl = card.querySelector('.card-name');
        if (!nameEl) return;
        var name = nameEl.textContent.trim();
        var entity = window.DB.entities.find(function(e) { return e.canonical_name === name; });
        if (entity) M_showLoreTooltip(entity, card);
      }, 1200);
    });
    card.addEventListener('mouseleave', function() {
      clearTimeout(M_loreTimer);
      M_hideLoreTooltip();
    });
    card.addEventListener('click', function() {
      clearTimeout(M_loreTimer);
      M_hideLoreTooltip();
    });
  });
}

function M_getLoreText(entity) {
  var notes = entity.research_notes || '';
  if (notes.length > 15) {
    var s = notes.split(/[.!?]/)[0];
    if (s && s.trim().length > 15) return s.trim() + '.';
  }
  var doms = (entity.functional_domains || []).slice(0, 2);
  if (doms.length) return doms.join(' · ');
  return null;
}

function M_showLoreTooltip(entity, cardEl) {
  var text = M_getLoreText(entity);
  if (!text) return;
  var tooltip = document.getElementById('lore-tooltip');
  if (!tooltip) return;
  tooltip.innerHTML = text;
  tooltip.classList.add('visible');
  var rect = cardEl.getBoundingClientRect();
  var left = Math.min(rect.left, window.innerWidth - 300);
  tooltip.style.left = Math.max(8, left) + 'px';
  tooltip.style.top = (rect.bottom + 8) + 'px';
}

function M_hideLoreTooltip() {
  var tooltip = document.getElementById('lore-tooltip');
  if (tooltip) tooltip.classList.remove('visible');
}

// ══════════════════════════════════════════════════════════════
//  MODULE 5 — SMART SEARCH SUGGESTIONS
// ══════════════════════════════════════════════════════════════
var M_suggActive = -1;

function M_initSearchSuggestions() {
  var input = document.getElementById('search-input');
  if (!input) return;

  var wrap = input.closest('.search-wrap');
  if (!wrap) return;
  var sugg = document.createElement('div');
  sugg.id = 'search-suggestions';
  sugg.setAttribute('role', 'listbox');
  sugg.setAttribute('aria-label', 'Search suggestions');
  wrap.appendChild(sugg);

  input.addEventListener('input', function() {
    var q = input.value.trim();
    if (q.length < 2 || !window.fuse) { M_hideSuggestions(); return; }
    M_renderSuggestions(q);
  });

  input.addEventListener('keydown', function(e) {
    var items = sugg.querySelectorAll('.suggestion-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      M_suggActive = Math.min(M_suggActive + 1, items.length - 1);
      M_highlightSugg(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      M_suggActive = Math.max(M_suggActive - 1, -1);
      M_highlightSugg(items);
    } else if (e.key === 'Enter' && M_suggActive >= 0) {
      e.preventDefault();
      var active = items[M_suggActive];
      if (active) { window.openDetail(active.dataset.entityId); M_hideSuggestions(); input.value = ''; }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      M_hideSuggestions();
    }
  });

  document.addEventListener('click', function(e) {
    if (e.target !== input && !sugg.contains(e.target)) M_hideSuggestions();
  });
}

function M_renderSuggestions(query) {
  if (!window.fuse || !window.DB) return;
  var results = window.fuse.search(query).slice(0, 6);
  M_suggActive = -1;
  var sugg = document.getElementById('search-suggestions');
  if (!sugg) return;
  if (!results.length) { M_hideSuggestions(); return; }

  var nodeColors = window.NODE_COLORS || {};
  var tradLabels = window.TRADITION_LABELS || {};
  var levelRoman = ['I','II','III','IV','V','VI','VII'];

  sugg.innerHTML = results.map(function(r) {
    var e = r.item;
    var trad = Object.keys(e.tradition_vectors || {})[0] || 'default';
    var color = nodeColors[trad] || '#c9983a';
    var domain = (e.functional_domains || [])[0] || '';
    var lvl = e.hierarchical_level || 7;
    return '<div class="suggestion-item" role="option" data-entity-id="' + e.id + '">' +
      '<span class="suggestion-name">' + e.canonical_name + '</span>' +
      '<span class="suggestion-level">' + (levelRoman[lvl - 1] || lvl) + '</span>' +
      '<span class="suggestion-pip" style="background:' + color + '" title="' + (tradLabels[trad] || trad) + '"></span>' +
      (domain ? '<span class="suggestion-domain">' + domain + '</span>' : '') +
      '</div>';
  }).join('');

  sugg.querySelectorAll('.suggestion-item').forEach(function(item) {
    item.addEventListener('click', function() {
      window.openDetail(item.dataset.entityId);
      M_hideSuggestions();
      var inp = document.getElementById('search-input');
      if (inp) inp.value = '';
    });
  });

  sugg.classList.add('visible');
}

function M_hideSuggestions() {
  var sugg = document.getElementById('search-suggestions');
  if (sugg) sugg.classList.remove('visible');
  M_suggActive = -1;
}

function M_highlightSugg(items) {
  items.forEach(function(item, i) { item.classList.toggle('active', i === M_suggActive); });
  if (M_suggActive >= 0 && items[M_suggActive]) {
    items[M_suggActive].scrollIntoView({ block: 'nearest' });
  }
}

// ══════════════════════════════════════════════════════════════
//  MODULE 6 — EDUCATIONAL "DID YOU KNOW" SYSTEM
// ══════════════════════════════════════════════════════════════
function M_initInsightBar() {
  var nav = document.getElementById('nav');
  if (!nav) return;
  var bar = document.createElement('div');
  bar.id = 'insight-bar';
  bar.setAttribute('role', 'status');
  bar.setAttribute('aria-live', 'polite');
  bar.innerHTML = '<span class="insight-text" id="insight-text"></span>' +
    '<button class="insight-dismiss" onclick="M_hideInsightBar()" aria-label="Dismiss">×</button>';
  nav.parentNode.insertBefore(bar, nav.nextSibling);
}

function M_showEntityInsightForId(entityId) {
  if (!window.DB) return;
  var entity = window.DB.entities.find(function(e) { return e.id === entityId; });
  if (!entity) return;

  var text = null;
  var rels = entity.relationships || [];
  if (rels.length) {
    var rel = rels[Math.floor(Math.random() * rels.length)];
    var target = window.DB.entities.find(function(e) { return e.id === rel.target_id; });
    var tName = target ? target.canonical_name : rel.target_id.replace(/-/g, ' ');
    if (rel.notes && rel.notes.length > 20) {
      text = rel.notes;
    } else {
      text = entity.canonical_name + ' shares a ' + rel.edge_type.replace(/_/g, ' ').toLowerCase() + ' connection with ' + tName + '.';
    }
  } else if (entity.research_notes && entity.research_notes.length > 20) {
    text = entity.research_notes.split(/[.!?]/)[0].trim() + '.';
  }

  if (text) M_showInsightBar('Did you know? ' + text);
}

function M_showInsightBar(text) {
  var bar = document.getElementById('insight-bar');
  var textEl = document.getElementById('insight-text');
  if (!bar || !textEl) return;
  textEl.textContent = text;
  bar.classList.add('open');
}

function M_hideInsightBar() {
  var bar = document.getElementById('insight-bar');
  if (bar) bar.classList.remove('open');
}

function M_showPageLoadInsight() {
  if (!window.DB || !window.DB.entities.length) return;
  var pool = window.DB.entities.filter(function(e) { return (e.relationships || []).length > 0; });
  if (!pool.length) return;
  var entity = pool[Math.floor(Math.random() * pool.length)];
  var rels = entity.relationships || [];
  var rel = rels[Math.floor(Math.random() * rels.length)];
  var target = window.DB.entities.find(function(e) { return e.id === rel.target_id; });
  var tName = target ? target.canonical_name : rel.target_id.replace(/-/g, ' ');
  var text;
  if (rel.notes && rel.notes.length > 20) {
    text = rel.notes;
  } else {
    text = entity.canonical_name + ' and ' + tName + ' share a ' + rel.edge_type.replace(/_/g, ' ').toLowerCase() + ' connection across traditions.';
  }

  var banner = document.createElement('div');
  banner.id = 'concordance-insight-banner';
  banner.setAttribute('role', 'status');
  banner.innerHTML = '<span class="cib-sigil">✦</span> <em>Concordance Insight:</em> ' + text +
    ' <button class="cib-close" onclick="this.parentElement.classList.remove(\'visible\');setTimeout(function(){this.parentElement.remove()}.bind(this),600)" aria-label="Dismiss">×</button>';
  document.body.appendChild(banner);

  setTimeout(function() {
    banner.classList.add('visible');
    setTimeout(function() {
      if (banner.parentNode) {
        banner.classList.remove('visible');
        setTimeout(function() { if (banner.parentNode) banner.remove(); }, 600);
      }
    }, 8000);
  }, 3000);
}

// ══════════════════════════════════════════════════════════════
//  MODULE 7 — ENTITY COMPARISON MODE
// ══════════════════════════════════════════════════════════════
var M_compareSet = [];

function M_initCompare() {
  var grid = document.getElementById('results-grid');
  if (!grid) return;
  var obs = new MutationObserver(function() { M_injectCompareButtons(); });
  obs.observe(grid, { childList: true });
}

function M_injectCompareButtons() {
  document.querySelectorAll('.entity-card:not([data-cmp-ok])').forEach(function(card) {
    card.setAttribute('data-cmp-ok', '1');
    var nameEl = card.querySelector('.card-name');
    if (!nameEl || !window.DB) return;
    var name = nameEl.textContent.trim();
    var entity = window.DB.entities.find(function(e) { return e.canonical_name === name; });
    if (!entity) return;
    var entityId = entity.id;

    var btn = document.createElement('button');
    btn.className = 'compare-btn';
    btn.setAttribute('aria-label', 'Add to comparison');
    btn.title = 'Compare';
    btn.textContent = '⊞';
    btn.addEventListener('click', function(e) { e.stopPropagation(); M_addToCompare(entityId); });
    card.appendChild(btn);
  });
}

function M_addToCompare(entityId) {
  if (!window.DB) return;
  if (M_compareSet.indexOf(entityId) >= 0) return;
  if (M_compareSet.length >= 3) M_compareSet.shift();
  M_compareSet.push(entityId);
  M_renderCompareBar();
}

function M_removeFromCompare(entityId) {
  M_compareSet = M_compareSet.filter(function(id) { return id !== entityId; });
  M_renderCompareBar();
  if (M_compareSet.length === 0) M_closeCompareOverlay();
}

function M_clearCompare() {
  M_compareSet = [];
  M_renderCompareBar();
  M_closeCompareOverlay();
}

function M_renderCompareBar() {
  var bar = document.getElementById('compare-bar');
  if (!bar || !window.DB) return;
  if (!M_compareSet.length) { bar.classList.remove('visible'); return; }

  var entities = M_compareSet.map(function(id) { return window.DB.entities.find(function(e) { return e.id === id; }); }).filter(Boolean);
  bar.innerHTML = entities.map(function(e) {
    return '<span class="compare-bar-item">' + e.canonical_name +
      ' <button class="compare-remove" onclick="M_removeFromCompare(\'' + e.id + '\')" aria-label="Remove ' + e.canonical_name + '">×</button></span>';
  }).join('') +
    '<button class="compare-open-btn" onclick="M_openCompareOverlay()">⊞ Open Comparison</button>' +
    '<button class="compare-clear-btn" onclick="M_clearCompare()">Clear All</button>';
  bar.classList.add('visible');
}

function M_openCompareOverlay() {
  if (!M_compareSet.length) return;
  var overlay = document.getElementById('compare-overlay');
  if (!overlay) return;
  M_buildCompareContent();
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function M_closeCompareOverlay() {
  var overlay = document.getElementById('compare-overlay');
  if (overlay) overlay.classList.remove('open');
  if (!document.getElementById('detail-overlay').classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

function M_buildCompareContent() {
  var body = document.getElementById('compare-body');
  if (!body || !window.DB) return;
  var entities = M_compareSet.map(function(id) { return window.DB.entities.find(function(e) { return e.id === id; }); }).filter(Boolean);
  if (!entities.length) return;

  var nodeColors = window.NODE_COLORS || {};
  var tradLabels = window.TRADITION_LABELS || {};
  var levelLabels = window.LEVEL_LABELS || {};

  var allTrads = [];
  entities.forEach(function(e) { Object.keys(e.tradition_vectors || {}).forEach(function(t) { if (allTrads.indexOf(t) < 0) allTrads.push(t); }); });
  var allDoms = [];
  entities.forEach(function(e) { (e.functional_domains || []).forEach(function(d) { if (allDoms.indexOf(d) < 0) allDoms.push(d); }); });

  var sharedTrads = allTrads.filter(function(t) { return entities.every(function(e) { return !!(e.tradition_vectors || {})[t]; }); });
  var sharedDoms = allDoms.filter(function(d) { return entities.filter(function(e) { return (e.functional_domains || []).indexOf(d) >= 0; }).length > 1; });

  var cols = entities.length;

  var html = '<div class="compare-grid" style="grid-template-columns:repeat(' + cols + ',1fr)">';

  // Headers
  entities.forEach(function(e) {
    var trad = Object.keys(e.tradition_vectors || {})[0] || 'default';
    var color = nodeColors[trad] || '#c9983a';
    var tradPips = Object.keys(e.tradition_vectors || {}).map(function(k) {
      return '<span class="compare-trad-tag ' + (sharedTrads.indexOf(k) >= 0 ? 'compare-shared' : '') + '">' + (tradLabels[k] || k) + '</span>';
    }).join('');
    html += '<div class="compare-col-header" style="border-top:3px solid ' + color + '">' +
      '<p class="compare-col-level">' + (levelLabels[e.hierarchical_level] || 'Level ' + e.hierarchical_level) + '</p>' +
      '<h3 class="compare-col-name">' + e.canonical_name + '</h3>' +
      '<div class="compare-col-trads">' + tradPips + '</div>' +
      '</div>';
  });

  // Domains
  html += '<div class="compare-row-label" style="grid-column:1/-1">Functional Domains</div>';
  entities.forEach(function(e) {
    html += '<div class="compare-cell">' + (e.functional_domains || []).map(function(d) {
      return '<span class="domain-tag ' + (sharedDoms.indexOf(d) >= 0 ? 'compare-shared' : '') + '">' + d + '</span>';
    }).join('') + '</div>';
  });

  // Traditions
  html += '<div class="compare-row-label" style="grid-column:1/-1">Tradition Vectors</div>';
  entities.forEach(function(e) {
    html += '<div class="compare-cell">' + Object.keys(e.tradition_vectors || {}).map(function(t) {
      return '<span class="compare-trad-tag ' + (sharedTrads.indexOf(t) >= 0 ? 'compare-shared' : '') + '">' + (tradLabels[t] || t) + '</span>';
    }).join('') + '</div>';
  });

  // Relationships
  html += '<div class="compare-row-label" style="grid-column:1/-1">Relationships</div>';
  entities.forEach(function(e) {
    var rels = e.relationships || [];
    if (!rels.length) { html += '<div class="compare-cell compare-dim">—</div>'; return; }
    html += '<div class="compare-cell">' + rels.slice(0, 4).map(function(r) {
      var tgt = window.DB.entities.find(function(x) { return x.id === r.target_id; });
      var tName = tgt ? tgt.canonical_name : r.target_id.replace(/-/g, ' ');
      return '<div class="compare-rel"><span class="edge-type edge-' + r.edge_type + '" style="font-size:0.62rem">' + r.edge_type.replace(/_/g, ' ') + '</span> ' + tName + '</div>';
    }).join('') + (rels.length > 4 ? '<div class="compare-dim">+' + (rels.length - 4) + ' more</div>' : '') + '</div>';
  });

  // Depth
  html += '<div class="compare-row-label" style="grid-column:1/-1">Research Depth</div>';
  entities.forEach(function(e) {
    var sc = e.completeness_score || 0;
    var dl = sc >= 80 ? 'primary' : sc >= 60 ? 'secondary' : 'partial';
    var dt = sc >= 80 ? 'Primary Source' : sc >= 60 ? 'Secondary Source' : 'Partial';
    html += '<div class="compare-cell"><span class="card-depth depth-' + dl + '">' + dt + ' (' + sc + '%)</span></div>';
  });

  html += '</div>';
  body.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════
//  MODULE 8 — TIMELINE ENHANCEMENTS
// ══════════════════════════════════════════════════════════════
function M_initTimeline() {
  var canvas = document.getElementById('tl-canvas');
  if (!canvas) return;
  var obs = new MutationObserver(function(mutations) {
    var added = mutations.some(function(m) { return m.addedNodes.length > 0; });
    if (added) { M_enhanceTimeline(); obs.disconnect(); }
  });
  obs.observe(canvas, { childList: true });
}

function M_enhanceTimeline() {
  setTimeout(function() {
    M_addTimelineJumpButtons();
    M_addTimelineScrollMomentum();
    M_addTimelineBadgeTooltips();
    M_addEraFigureCounts();
  }, 80);
}

function M_addTimelineJumpButtons() {
  var tlHeader = document.querySelector('.tl-header');
  if (!tlHeader || document.getElementById('tl-jump-strip')) return;

  var ERAS = [
    { label: 'Sumerian', start: -3500 },
    { label: 'Bronze Age', start: -2000 },
    { label: 'Classical', start: -800 },
    { label: '2nd Temple', start: -167 },
    { label: 'Late Antique', start: 200 },
    { label: 'Medieval', start: 700 },
    { label: 'Early Modern', start: 1400 }
  ];
  var PX_PER_DECADE = 17, TL_PAD_LEFT = 60, TL_START = -3500;

  var strip = document.createElement('div');
  strip.id = 'tl-jump-strip';
  ERAS.forEach(function(era) {
    var btn = document.createElement('button');
    btn.className = 'tl-jump-btn';
    btn.textContent = era.label;
    btn.addEventListener('click', function() {
      var scrollWrap = document.getElementById('tl-scroll-wrap');
      if (!scrollWrap) return;
      var x = TL_PAD_LEFT + ((era.start - TL_START) / 10) * PX_PER_DECADE - 80;
      scrollWrap.scrollTo({ left: Math.max(0, x), behavior: 'smooth' });
    });
    strip.appendChild(btn);
  });
  tlHeader.appendChild(strip);
}

function M_addTimelineScrollMomentum() {
  var wrap = document.getElementById('tl-scroll-wrap');
  if (!wrap || wrap.dataset.momentumOk) return;
  wrap.dataset.momentumOk = '1';

  var isDown = false, startX = 0, scrollLeft = 0, lastX = 0, velocity = 0, rafId = null;

  wrap.addEventListener('pointerdown', function(e) {
    isDown = true;
    startX = e.pageX - wrap.offsetLeft;
    scrollLeft = wrap.scrollLeft;
    lastX = e.pageX;
    velocity = 0;
    cancelAnimationFrame(rafId);
    wrap.classList.add('is-grabbing');
    try { wrap.setPointerCapture(e.pointerId); } catch(err) {}
  });

  wrap.addEventListener('pointermove', function(e) {
    if (!isDown) return;
    velocity = e.pageX - lastX;
    lastX = e.pageX;
    var x = e.pageX - wrap.offsetLeft;
    wrap.scrollLeft = scrollLeft - (x - startX);
  });

  var endDrag = function() {
    if (!isDown) return;
    isDown = false;
    wrap.classList.remove('is-grabbing');
    var v = velocity;
    var coast = function() {
      v *= 0.91;
      if (Math.abs(v) < 0.5) return;
      wrap.scrollLeft -= v;
      rafId = requestAnimationFrame(coast);
    };
    rafId = requestAnimationFrame(coast);
  };
  wrap.addEventListener('pointerup', endDrag);
  wrap.addEventListener('pointercancel', endDrag);
}

function M_addTimelineBadgeTooltips() {
  var canvas = document.getElementById('tl-canvas');
  if (!canvas || !window.DB) return;
  canvas.querySelectorAll('.tl-badge:not([data-tl-tip])').forEach(function(badge) {
    badge.setAttribute('data-tl-tip', '1');
    badge.addEventListener('mouseenter', function() {
      var entityId = badge.dataset.entityId;
      if (!entityId) return;
      var entity = window.DB.entities.find(function(e) { return e.id === entityId; });
      if (!entity) return;
      var domain = (entity.functional_domains || [])[0] || '';
      var dateStr = badge.title || '';
      var tooltip = document.getElementById('lore-tooltip');
      if (!tooltip) return;
      tooltip.innerHTML = '<strong style="font-family:var(--font-heading);color:var(--gold-light);font-size:0.78rem">' +
        entity.canonical_name + '</strong><br>' +
        '<span style="color:var(--dim);font-size:0.75rem">' + dateStr + '</span>' +
        (domain ? '<br><em style="color:var(--faint);font-size:0.78rem">' + domain + '</em>' : '');
      tooltip.classList.add('visible');
      var rect = badge.getBoundingClientRect();
      tooltip.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
      tooltip.style.top = (rect.bottom + 8) + 'px';
    });
    badge.addEventListener('mouseleave', function() { M_hideLoreTooltip(); });
  });
}

function M_addEraFigureCounts() {
  var canvas = document.getElementById('tl-canvas');
  if (!canvas) return;
  var badges = canvas.querySelectorAll('.tl-badge');
  var TL_ERAS = [
    { start: -3500, end: -2000 }, { start: -2000, end: -800 },
    { start: -800,  end: -167  }, { start: -167,  end:  200 },
    { start:  200,  end:  700  }, { start:  700,  end: 1400 },
    { start: 1400,  end: 1950  }
  ];
  var PX_PER_DECADE = 17, TL_PAD_LEFT = 60, TL_START = -3500;

  var eraLabels = canvas.querySelectorAll('.tl-era-label');
  eraLabels.forEach(function(lbl, i) {
    var era = TL_ERAS[i];
    if (!era) return;
    var xStart = TL_PAD_LEFT + ((era.start - TL_START) / 10) * PX_PER_DECADE;
    var xEnd   = TL_PAD_LEFT + ((era.end   - TL_START) / 10) * PX_PER_DECADE;
    var count = 0;
    badges.forEach(function(b) {
      var left = parseFloat(b.style.left) || 0;
      if (left >= xStart && left < xEnd) count++;
    });
    if (count > 0) {
      var span = document.createElement('span');
      span.className = 'tl-era-count';
      span.textContent = count + ' ' + (count === 1 ? 'figure' : 'figures');
      lbl.appendChild(span);
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  MODULE 9 — SCRIPTURE SEARCH
// ══════════════════════════════════════════════════════════════
var M_scriptureMode = false;
var M_fuseScripture = null;

function M_initScriptureSearch() {
  var filterBar = document.getElementById('filter-bar');
  if (!filterBar) return;

  var btn = document.createElement('button');
  btn.className = 'filter-btn';
  btn.dataset.filter = 'scripture';
  btn.id = 'scripture-filter-btn';
  btn.setAttribute('aria-label', 'Search by scripture reference');
  btn.textContent = '⊟ Scripture';
  filterBar.appendChild(btn);

  btn.addEventListener('click', function() {
    var wasActive = btn.classList.contains('active');
    document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    if (!wasActive) {
      btn.classList.add('active');
      M_scriptureMode = true;
      M_buildScriptureIndex();
      M_applyScriptureSearch();
    } else {
      M_scriptureMode = false;
      var allBtn = document.querySelector('.filter-btn[data-filter="all"]');
      if (allBtn) { allBtn.classList.add('active'); allBtn.click(); }
    }
  });
}

function M_buildScriptureIndex() {
  if (M_fuseScripture || !window.DB) return;
  var docs = [];
  window.DB.entities.forEach(function(entity) {
    (entity.source_attestations || []).forEach(function(src) {
      docs.push({ entityId: entity.id, name: entity.canonical_name, source: src });
    });
    Object.values(entity.tradition_vectors || {}).forEach(function(tv) {
      (tv.source_texts || []).forEach(function(src) {
        docs.push({ entityId: entity.id, name: entity.canonical_name, source: src });
      });
    });
  });
  M_fuseScripture = new Fuse(docs, {
    keys: [{ name: 'source', weight: 2 }, { name: 'name', weight: 0.5 }],
    threshold: 0.35, includeScore: true
  });
}

function M_applyScriptureSearch() {
  var input = document.getElementById('search-input');
  if (!input) return;
  var q = input.value.trim();
  if (q.length < 2 || !M_fuseScripture) return;

  var results = M_fuseScripture.search(q);
  var entityIds = [];
  results.forEach(function(r) {
    if (entityIds.indexOf(r.item.entityId) < 0) entityIds.push(r.item.entityId);
  });

  var grid = document.getElementById('results-grid');
  if (!grid || !window.DB) return;
  var entities = entityIds.map(function(id) { return window.DB.entities.find(function(e) { return e.id === id; }); }).filter(Boolean);

  var countEl = document.getElementById('results-count');
  if (countEl) countEl.textContent = entities.length + ' ' + (entities.length === 1 ? 'entry' : 'entries') + ' matching scripture "' + q + '"';

  grid.innerHTML = '';
  if (!entities.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-glyph">◉</div><p>No scripture references match. Try a book name (e.g. "Enoch", "Daniel") or citation format.</p></div>';
    return;
  }
  entities.forEach(function(entity, i) {
    var card = document.createElement('div');
    var isJesus = entity.id === 'jesus-christ';
    card.className = 'entity-card' + (isJesus ? ' card-jesus' : '');
    card.style.animationDelay = Math.min(i * 0.04, 0.4) + 's';
    card.addEventListener('click', function() { window.openDetail(entity.id); });

    var tradKeys = Object.keys(entity.tradition_vectors || {});
    var nodeColors = window.NODE_COLORS || {};
    var tradLabels = window.TRADITION_LABELS || {};
    var levelLabels = window.LEVEL_LABELS || {};
    var tradPips = tradKeys.map(function(k) { return '<span class="trad-pip trad-' + k + '">' + (tradLabels[k] || k) + '</span>'; }).join('');
    var domains = (entity.functional_domains || []).slice(0, 3).map(function(d) { return '<span class="domain-tag">' + d + '</span>'; }).join('');
    var sc = entity.completeness_score || 0;
    var dl = sc >= 80 ? 'primary' : sc >= 60 ? 'secondary' : 'partial';
    var dt = sc >= 80 ? 'Primary Source' : sc >= 60 ? 'Secondary Source' : 'Partial';

    card.innerHTML = '<p class="card-level">' + (levelLabels[entity.hierarchical_level] || 'Level ' + entity.hierarchical_level) + '</p>' +
      '<h3 class="card-name">' + entity.canonical_name + '</h3>' +
      '<div class="card-domains">' + domains + '</div>' +
      '<div class="card-traditions">' + tradPips + '</div>' +
      '<span class="card-depth depth-' + dl + '">' + dt + '</span>';
    grid.appendChild(card);
  });
}

// ══════════════════════════════════════════════════════════════
//  MODULE 10 — PRINT / EXPORT MODE
// ══════════════════════════════════════════════════════════════
function M_openExportModal(entityId) {
  if (!window.DB) return;
  var entity = window.DB.entities.find(function(e) { return e.id === entityId; });
  if (!entity) return;
  var modal = document.getElementById('export-modal');
  if (!modal) return;
  modal.dataset.entityId = entityId;
  var nameEl = document.getElementById('export-modal-name');
  if (nameEl) nameEl.textContent = entity.canonical_name;
  modal.classList.add('open');
}

function M_closeExportModal() {
  var modal = document.getElementById('export-modal');
  if (modal) modal.classList.remove('open');
}

function M_exportJSON() {
  var modal = document.getElementById('export-modal');
  if (!modal || !window.DB) return;
  var entity = window.DB.entities.find(function(e) { return e.id === modal.dataset.entityId; });
  if (!entity) return;
  var text = JSON.stringify(entity, null, 2);
  M_copyToClipboard(text, 'JSON copied to clipboard ✦');
}

function M_entityToMarkdown(entity) {
  var levelLabels = window.LEVEL_LABELS || {};
  var tradLabels = window.TRADITION_LABELS || {};
  var aliases = (entity.aliases || []).join(', ');
  var domains = (entity.functional_domains || []).map(function(d) { return '- ' + d; }).join('\n');

  var tradSection = '';
  Object.entries(entity.tradition_vectors || {}).forEach(function(entry) {
    var trad = entry[0], tv = entry[1];
    var tradName = tradLabels[trad] || trad;
    var fields = Object.entries(tv)
      .filter(function(e) { return e[1] && e[0] !== 'source_texts'; })
      .map(function(e) { return e[0].replace(/_/g, ' ') + ': ' + (Array.isArray(e[1]) ? e[1].join(', ') : e[1]); })
      .join('\n');
    var srcs = (tv.source_texts || []).map(function(s) { return 'source: ' + s; }).join('\n');
    tradSection += '\n### ' + tradName + '\n' + fields + (srcs ? '\n' + srcs : '') + '\n';
  });

  var rels = (entity.relationships || []).map(function(r) {
    var tgt = window.DB.entities.find(function(e) { return e.id === r.target_id; });
    var tName = tgt ? tgt.canonical_name : r.target_id;
    return '- ' + r.edge_type + ' → ' + tName + ' (' + r.source_text + ')';
  }).join('\n');

  var sources = (entity.source_attestations || []).map(function(s, i) { return (i + 1) + '. ' + s; }).join('\n');

  return '# ' + entity.canonical_name + '\n' +
    '*' + (aliases || 'No aliases recorded') + '*\n' +
    (levelLabels[entity.hierarchical_level] || 'Level ' + entity.hierarchical_level) + '\n\n' +
    '## Functional Domains\n' + (domains || '—') + '\n\n' +
    '## Tradition Vectors\n' + tradSection + '\n' +
    '## Relationships\n' + (rels || '—') + '\n\n' +
    '## Source Attestations\n' + (sources || '—') + '\n\n' +
    '## Research Notes\n' + (entity.research_notes || '—') + '\n';
}

function M_exportMarkdown() {
  var modal = document.getElementById('export-modal');
  if (!modal || !window.DB) return;
  var entity = window.DB.entities.find(function(e) { return e.id === modal.dataset.entityId; });
  if (!entity) return;
  M_copyToClipboard(M_entityToMarkdown(entity), 'Markdown copied to clipboard ✦');
}

function M_printCard() {
  var modal = document.getElementById('export-modal');
  if (!modal || !window.DB) return;
  var entityId = modal.dataset.entityId;
  M_closeExportModal();
  var detailOpen = document.getElementById('detail-overlay').classList.contains('open');
  if (!detailOpen) window.openDetail(entityId);
  setTimeout(function() { window.print(); }, 400);
}

function M_copyToClipboard(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      M_showExportFeedback(successMsg);
    }).catch(function() {
      M_fallbackCopy(text, successMsg);
    });
  } else {
    M_fallbackCopy(text, successMsg);
  }
}

function M_fallbackCopy(text, successMsg) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    M_showExportFeedback(successMsg);
  } catch(e) {
    M_showExportFeedback('Copy failed — please select and copy manually');
  }
  document.body.removeChild(ta);
}

function M_showExportFeedback(msg) {
  var fb = document.getElementById('export-feedback');
  if (!fb) return;
  fb.textContent = msg;
  fb.style.opacity = '1';
  setTimeout(function() { fb.style.opacity = '0'; }, 2800);
}

// ══════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  M_initSound();
  M_initSigils();
  M_initLoreTooltips();
  M_initSearchSuggestions();
  M_initInsightBar();
  M_initCompare();
  M_initTimeline();
  M_initConstellation();
  M_initScriptureSearch();

  var idleFn = function() {
    M_whenReady(function() {
      M_injectCompareButtons();
      M_showPageLoadInsight();
    });
  };
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(idleFn, { timeout: 4000 });
  } else {
    setTimeout(idleFn, 500);
  }
});
