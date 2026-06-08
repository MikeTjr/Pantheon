/* ═══════════════════════════════════════════════════════════════
   MAGIC.JS — Enhancement Layer · Pantheon Concordance
   All globals prefixed M_ | Additive only | No existing fn removal
═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── SAFE GLOBALS — app.js uses const/let (not var), so they're
//     in the shared script scope but NOT on window.
//     These helpers safely reference them by name.
function M_DB()            { return (typeof DB !== 'undefined') ? DB : null; }
function M_EDGE_COLORS()   { return (typeof EDGE_COLORS !== 'undefined') ? EDGE_COLORS : {}; }
function M_NODE_COLORS()   { return (typeof NODE_COLORS !== 'undefined') ? NODE_COLORS : {}; }
function M_TRAD_LABELS()   { return (typeof TRADITION_LABELS !== 'undefined') ? TRADITION_LABELS : {}; }
function M_LEVEL_LABELS()  { return (typeof LEVEL_LABELS !== 'undefined') ? LEVEL_LABELS : {}; }
function M_FUSE()          { return (typeof fuse !== 'undefined') ? fuse : null; }

// ─── READY GUARD ──────────────────────────────────────────────
function M_whenReady(fn, retries) {
  retries = retries || 0;
  var db = M_DB();
  if (db && db.entities && db.entities.length > 0) {
    fn();
  } else if (retries < 120) {
    setTimeout(function() { M_whenReady(fn, retries + 1); }, 100);
  }
}

// ══════════════════════════════════════════════════════════════
//  MODULE A — OPENING INVOCATION SEAL
// ══════════════════════════════════════════════════════════════
function M_initInvocation() {
  var overlay = document.getElementById('m-invocation-overlay');
  if (!overlay) return;

  try {
    if (localStorage.getItem('pantheon_invocation_seen') === '1') {
      overlay.remove();
      return;
    }
  } catch(e) {}

  document.body.style.overflow = 'hidden';

  // Animate seal rings
  var rings = overlay.querySelectorAll('.m-seal-ring');
  rings.forEach(function(r, i) {
    r.style.animationDelay = (i * 0.18) + 's';
  });

  // Reveal text staggered
  var lines = overlay.querySelectorAll('.m-invocation-line');
  lines.forEach(function(l, i) {
    l.style.animationDelay = (1.2 + i * 0.55) + 's';
    l.style.opacity = '0';
    l.style.animation = 'none';
    setTimeout(function() {
      l.style.animation = '';
      l.style.animationDelay = '';
    }, 50);
  });
}

function M_dismissInvocation() {
  var overlay = document.getElementById('m-invocation-overlay');
  if (!overlay) return;
  overlay.classList.add('m-invocation-dismissed');
  document.body.style.overflow = '';
  try { localStorage.setItem('pantheon_invocation_seen', '1'); } catch(e) {}
  setTimeout(function() { overlay.remove(); }, 900);
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
var M_CHIME_FREQS = [261.63, 329.63, 392, 493.88, 587.33];

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
  kabbalistic: '<circle cx="50" cy="10" r="4" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.65"/><circle cx="76" cy="26" r="3.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/><circle cx="24" cy="26" r="3.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/><circle cx="76" cy="46" r="3.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/><circle cx="24" cy="46" r="3.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/><circle cx="50" cy="56" r="4" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.65"/><circle cx="76" cy="68" r="3.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/><circle cx="24" cy="68" r="3.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/><circle cx="50" cy="78" r="3.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.6"/><circle cx="50" cy="92" r="4" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.65"/><line x1="50" y1="10" x2="76" y2="26" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="50" y1="10" x2="24" y2="26" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="76" y1="26" x2="24" y2="26" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="76" y1="26" x2="50" y2="56" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="24" y1="26" x2="50" y2="56" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="50" y1="56" x2="76" y2="68" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="50" y1="56" x2="24" y2="68" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="76" y1="68" x2="50" y2="78" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="24" y1="68" x2="50" y2="78" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/><line x1="50" y1="78" x2="50" y2="92" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/>',
  hermetic: '<line x1="50" y1="14" x2="50" y2="88" stroke="var(--gold)" stroke-width="1.5" opacity="0.65"/><path d="M50,30 Q36,38 50,48 Q64,58 50,68 Q36,78 50,86" stroke="var(--gold)" stroke-width="1.3" fill="none" opacity="0.6"/><path d="M50,30 Q64,38 50,48 Q36,58 50,68 Q64,78 50,86" stroke="var(--gold)" stroke-width="1.3" fill="none" opacity="0.6"/><circle cx="50" cy="21" r="5.5" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.55"/>',
  gnostic: '<circle cx="50" cy="50" r="33" stroke="var(--gold)" stroke-width="1.5" fill="none" opacity="0.65"/><path d="M50,17 Q18,28 17,50 Q18,72 50,83 Q54,80 56,77 Q34,68 33,50 Q34,32 56,25 Z" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.4"/><circle cx="56" cy="19" r="3.5" fill="var(--gold)" fill-opacity="0.35" stroke="var(--gold)" stroke-width="0.8" opacity="0.7"/>',
  greek: '<polygon points="50,14 55,38 80,21 62,43 88,50 62,57 80,79 55,62 50,86 45,62 20,79 38,57 12,50 38,43 20,21 45,38" stroke="var(--gold)" stroke-width="1.3" fill="none" opacity="0.65"/>',
  roman: '<ellipse cx="50" cy="50" rx="30" ry="38" stroke="var(--gold)" stroke-width="1.3" fill="none" opacity="0.55"/>',
  egyptian: '<circle cx="50" cy="30" r="15" stroke="var(--gold)" stroke-width="1.5" fill="none" opacity="0.65"/><line x1="50" y1="45" x2="50" y2="88" stroke="var(--gold)" stroke-width="1.5" opacity="0.65"/><line x1="32" y1="62" x2="68" y2="62" stroke="var(--gold)" stroke-width="1.5" opacity="0.65"/>',
  mesopotamian: '<polygon points="50,12 57,36 80,21 65,43 90,50 65,57 80,79 57,64 50,88 43,64 20,79 35,57 10,50 35,43 20,21 43,36" stroke="var(--gold)" stroke-width="1.3" fill="none" opacity="0.65"/><circle cx="50" cy="50" r="9" stroke="var(--gold)" stroke-width="1" fill="none" opacity="0.4"/>',
  canaanite: '<path d="M24,50 A26,26 0 1,1 50,24 A26,26 0 0,0 24,50" stroke="var(--gold)" stroke-width="1.5" fill="none" opacity="0.65"/>',
  hindu: '<text x="50" y="68" text-anchor="middle" font-size="54" font-family="serif" fill="none" stroke="var(--gold)" stroke-width="0.9" opacity="0.6">ॐ</text>',
  goetic: '<circle cx="50" cy="50" r="37" stroke="var(--crimson)" stroke-width="1.3" fill="none" opacity="0.75"/><polygon points="50,13 83.5,58.5 16.5,58.5" stroke="var(--crimson)" stroke-width="1" fill="none" opacity="0.6"/><polygon points="50,87 83.5,41.5 16.5,41.5" stroke="var(--crimson)" stroke-width="1" fill="none" opacity="0.45"/>',
  islamic: '<polygon points="50,14 61,36 86,35 68,54 76,78 50,65 24,78 32,54 14,35 39,36" stroke="var(--gold)" stroke-width="1.3" fill="none" opacity="0.65"/>',
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
//  MODULE B — DANGER MARKS (fallen/goetic visual treatment)
// ══════════════════════════════════════════════════════════════
var M_FALLEN_TRADITIONS = ['goetic'];
var M_FALLEN_EDGE_TYPES  = ['FALLEN_FORM_OF', 'POLEMIC_EQUIVALENT'];

function M_isDangerous(entity) {
  if (!entity) return false;
  var tv = entity.tradition_vectors || {};
  for (var i = 0; i < M_FALLEN_TRADITIONS.length; i++) {
    if (tv[M_FALLEN_TRADITIONS[i]]) return true;
  }
  var rels = entity.relationships || [];
  for (var j = 0; j < rels.length; j++) {
    if (M_FALLEN_EDGE_TYPES.indexOf(rels[j].edge_type) >= 0) return true;
  }
  return false;
}

function M_applyDangerMarks() {
  var db = M_DB();
  if (!db) return;
  document.querySelectorAll('.entity-card:not([data-danger-ok])').forEach(function(card) {
    card.setAttribute('data-danger-ok', '1');
    var nameEl = card.querySelector('.card-name');
    if (!nameEl) return;
    var name = nameEl.textContent.trim();
    var entity = db.entities.find(function(e) { return e.canonical_name === name; });
    if (entity && M_isDangerous(entity)) {
      card.classList.add('m-danger-card');
    }
  });
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
    M_triggerTypewriter(id);
    M_applyDangerMarks();
  };

  var _origClose = window.closeDetail;
  window.closeDetail = function() {
    _origClose();
    M_hideInsightBar();
  };

  // Add Connections button to nav
  M_addConstellationNavBtn();
}

function M_addConstellationNavBtn() {
  var nav = document.getElementById('nav');
  if (!nav || document.getElementById('m-nav-connections')) return;
  var btn = document.createElement('button');
  btn.className = 'nav-btn';
  btn.id = 'm-nav-connections';
  btn.textContent = '✦ Connections';
  btn.addEventListener('click', function() {
    var db = M_DB();
    if (!db) return;
    var pool = db.entities.filter(function(e) { return (e.relationships || []).length > 0; });
    if (!pool.length) return;
    var pick = pool[Math.floor(Math.random() * Math.min(10, pool.length))];
    M_openConstellation(pick.id);
  });
  nav.appendChild(btn);
}

function M_injectDetailExtras(entityId) {
  var old = document.getElementById('m-constellation-btn');
  if (old) old.remove();

  var actions = document.querySelector('.detail-actions');
  if (!actions) return;

  var cBtn = document.createElement('button');
  cBtn.id = 'm-constellation-btn';
  cBtn.className = 'detail-graph-btn';
  cBtn.setAttribute('aria-label', 'Open Constellation Map');
  cBtn.textContent = '✦ Connections';
  cBtn.addEventListener('click', function() { M_openConstellation(entityId); });

  var closeBtn = actions.querySelector('.detail-close');
  if (closeBtn) {
    actions.insertBefore(cBtn, closeBtn);
  } else {
    actions.appendChild(cBtn);
  }
}

function M_openConstellation(entityId) {
  var db = M_DB();
  if (!db) return;
  var overlay = document.getElementById('constellation-overlay');
  if (!overlay) return;

  var lbl = overlay.querySelector('.constellation-entity-label');
  if (lbl) {
    var ent = db.entities.find(function(e) { return e.id === entityId; });
    if (ent) lbl.textContent = ent.canonical_name;
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Small delay so the overlay has rendered dimensions
  setTimeout(function() { M_buildConstellationGraph(entityId); }, 60);
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
  var db = M_DB();
  if (!db) return;
  var entity = db.entities.find(function(e) { return e.id === entityId; });
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
    wrap.innerHTML = '<div class="constellation-empty"><span class="constellation-empty-glyph">◉</span><p>Graph library loading — please try again in a moment.</p></div>';
    return;
  }

  var edgeColors = M_EDGE_COLORS();
  var nodeColors = M_NODE_COLORS();

  var nodes = [{ id: entity.id, name: entity.canonical_name, level: entity.hierarchical_level || 5, focal: true, entity: entity }];
  var links = [];
  var seen = {};
  seen[entity.id] = true;

  rels.forEach(function(rel) {
    var target = db.entities.find(function(e) { return e.id === rel.target_id; });
    if (!seen[rel.target_id]) {
      seen[rel.target_id] = true;
      nodes.push({
        id: rel.target_id,
        name: target ? target.canonical_name : rel.target_id.replace(/-/g, ' '),
        level: target ? (target.hierarchical_level || 5) : 5,
        focal: false,
        entity: target || null
      });
    }
    links.push({ source: entity.id, target: rel.target_id, type: rel.edge_type });
  });

  var W = Math.max(400, wrap.clientWidth || wrap.offsetWidth || 800);
  var H = Math.max(300, wrap.clientHeight || wrap.offsetHeight || 500);

  var svg = d3.select(wrap).append('svg')
    .attr('width', W).attr('height', H)
    .style('background', 'radial-gradient(ellipse at center, rgba(26,10,10,0.6) 0%, rgba(8,6,4,0.95) 100%)');

  // Starfield
  var starG = svg.append('g');
  for (var s = 0; s < 60; s++) {
    starG.append('circle')
      .attr('cx', Math.random() * W)
      .attr('cy', Math.random() * H)
      .attr('r', Math.random() * 0.8 + 0.2)
      .attr('fill', '#c9983a')
      .attr('opacity', Math.random() * 0.25 + 0.05);
  }

  var defs = svg.append('defs');
  Object.keys(edgeColors).forEach(function(type) {
    defs.append('marker')
      .attr('id', 'cst-arrow-' + type)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 24).attr('refY', 0)
      .attr('markerWidth', 5).attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', edgeColors[type]);
  });

  var sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(function(d) { return d.id; }).distance(150).strength(0.5))
    .force('charge', d3.forceManyBody().strength(-380))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(48));

  var linkSel = svg.append('g').selectAll('line')
    .data(links).join('line')
    .attr('stroke', function(d) { return edgeColors[d.type] || '#c9983a'; })
    .attr('stroke-width', 1.2)
    .attr('stroke-opacity', 0.5)
    .attr('stroke-dasharray', '4 2')
    .attr('marker-end', function(d) { return edgeColors[d.type] ? 'url(#cst-arrow-' + d.type + ')' : null; });

  // Edge labels
  var edgeLabelG = svg.append('g').attr('class', 'edge-labels');
  var edgeLabels = edgeLabelG.selectAll('text')
    .data(links).join('text')
    .attr('fill', function(d) { return edgeColors[d.type] || '#c9983a'; })
    .attr('font-family', 'Cinzel, serif')
    .attr('font-size', '7px')
    .attr('text-anchor', 'middle')
    .attr('opacity', 0.65)
    .text(function(d) { return d.type.replace(/_/g, ' '); });

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
    var dangerous = d.entity && M_isDangerous(d.entity);
    var trad = 'default';
    if (d.entity) {
      var keys = Object.keys(d.entity.tradition_vectors || {});
      if (keys.length) trad = keys[0];
    }
    var color = d.focal ? '#f0cc70' : (dangerous ? '#c05050' : (nodeColors[trad] || '#c9983a'));
    var r = d.focal ? 22 : Math.max(10, 22 - d.level * 1.5);

    // Outer ring
    if (d.focal) {
      g.append('circle').attr('r', r + 8).attr('fill', 'none')
        .attr('stroke', '#f0cc70').attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '3 4').attr('opacity', 0.5);
      g.append('circle').attr('r', r + 4).attr('fill', 'none')
        .attr('stroke', '#f0cc70').attr('stroke-width', 0.5).attr('opacity', 0.3);
    }
    if (dangerous) {
      g.append('circle').attr('r', r + 5).attr('fill', 'none')
        .attr('stroke', '#c05050').attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '2 3').attr('opacity', 0.45);
    }

    g.append('circle').attr('r', r)
      .attr('fill', color).attr('fill-opacity', d.focal ? 0.18 : 0.12)
      .attr('stroke', color).attr('stroke-width', d.focal ? 1.8 : 1);

    // Name label
    var shortName = d.name.split(' / ')[0].split(' (')[0];
    if (shortName.length > 18) shortName = shortName.substring(0, 16) + '…';
    g.append('text')
      .attr('text-anchor', 'middle').attr('dy', r + 15)
      .attr('font-family', 'Cinzel, serif')
      .attr('font-size', d.focal ? '10px' : '8.5px')
      .attr('fill', color).attr('fill-opacity', 0.88)
      .text(shortName);

    g.on('click', function() {
      M_closeConstellation();
      setTimeout(function() { window.openDetail(d.id); }, 200);
    })
    .on('mouseenter', function() { g.select('circle').attr('fill-opacity', 0.35); })
    .on('mouseleave', function() { g.select('circle').attr('fill-opacity', d.focal ? 0.18 : 0.12); });
  });

  sim.on('tick', function() {
    linkSel
      .attr('x1', function(d) { return clamp(d.source.x, 20, W - 20); })
      .attr('y1', function(d) { return clamp(d.source.y, 20, H - 20); })
      .attr('x2', function(d) { return clamp(d.target.x, 20, W - 20); })
      .attr('y2', function(d) { return clamp(d.target.y, 20, H - 20); });

    edgeLabels
      .attr('x', function(d) { return (clamp(d.source.x, 20, W - 20) + clamp(d.target.x, 20, W - 20)) / 2; })
      .attr('y', function(d) { return (clamp(d.source.y, 20, H - 20) + clamp(d.target.y, 20, H - 20)) / 2 - 5; });

    nodeGrp.attr('transform', function(d) {
      return 'translate(' + clamp(d.x, 30, W - 30) + ',' + clamp(d.y, 30, H - 30) + ')';
    });
  });

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Legend
  var legendEl = document.getElementById('constellation-legend');
  if (legendEl) {
    var usedTypes = links.map(function(l) { return l.type; })
      .filter(function(t, i, a) { return a.indexOf(t) === i; });
    legendEl.innerHTML = usedTypes.map(function(t) {
      var c = edgeColors[t] || '#c9983a';
      return '<div class="legend-item"><div class="legend-dot" style="background:' + c + '"></div>' + t.replace(/_/g, ' ') + '</div>';
    }).join('');
  }
}

// ══════════════════════════════════════════════════════════════
//  MODULE C — NAME TYPEWRITER REVEAL
// ══════════════════════════════════════════════════════════════
function M_triggerTypewriter(entityId) {
  var db = M_DB();
  if (!db) return;
  var nameEl = document.getElementById('d-name');
  if (!nameEl) return;
  var entity = db.entities.find(function(e) { return e.id === entityId; });
  if (!entity) return;

  var full = entity.canonical_name;
  nameEl.textContent = '';
  nameEl.classList.add('m-typewriter');
  var i = 0;
  var speed = Math.max(28, Math.min(60, 1200 / full.length));
  var interval = setInterval(function() {
    if (i >= full.length) {
      clearInterval(interval);
      nameEl.classList.remove('m-typewriter');
      return;
    }
    nameEl.textContent = full.slice(0, i + 1);
    i++;
  }, speed);
}

// ══════════════════════════════════════════════════════════════
//  MODULE 3 — ENTITY LORE TOOLTIPS
// ══════════════════════════════════════════════════════════════
var M_loreTimer = null;

function M_initLoreTooltips() {
  var grid = document.getElementById('results-grid');
  if (!grid) return;
  var obs = new MutationObserver(function() {
    M_attachLoreListeners();
    M_applyDangerMarks();
  });
  obs.observe(grid, { childList: true });
  M_attachLoreListeners();
}

function M_attachLoreListeners() {
  document.querySelectorAll('.entity-card:not([data-lore-ok])').forEach(function(card) {
    card.setAttribute('data-lore-ok', '1');
    card.addEventListener('mouseenter', function() {
      clearTimeout(M_loreTimer);
      M_loreTimer = setTimeout(function() {
        var detail = document.getElementById('detail-overlay');
        if (detail && detail.classList.contains('open')) return;
        var db = M_DB();
        if (!db) return;
        var nameEl = card.querySelector('.card-name');
        if (!nameEl) return;
        var name = nameEl.textContent.trim();
        var entity = db.entities.find(function(e) { return e.canonical_name === name; });
        if (entity) M_showLoreTooltip(entity, card);
      }, 1100);
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
  var doms = (entity.functional_domains || []).slice(0, 3);
  if (doms.length) return doms.join(' · ');
  return null;
}

function M_showLoreTooltip(entity, cardEl) {
  var text = M_getLoreText(entity);
  if (!text) return;
  var tooltip = document.getElementById('lore-tooltip');
  if (!tooltip) return;
  var dangerous = M_isDangerous(entity);
  tooltip.innerHTML = (dangerous ? '<span class="m-tooltip-danger-glyph">⚠</span> ' : '') + text;
  tooltip.className = dangerous ? 'visible m-tooltip-danger' : 'visible';
  var rect = cardEl.getBoundingClientRect();
  tooltip.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 300)) + 'px';
  tooltip.style.top = (rect.bottom + 8) + 'px';
}

function M_hideLoreTooltip() {
  var tooltip = document.getElementById('lore-tooltip');
  if (tooltip) { tooltip.className = ''; }
}

// ══════════════════════════════════════════════════════════════
//  MODULE 5 — SMART SEARCH SUGGESTIONS + PLACEHOLDER ROTATION
// ══════════════════════════════════════════════════════════════
var M_suggActive = -1;

var M_SEARCH_PROMPTS = [
  'e.g. Azazel — the scapegoat who taught forbidden arts…',
  'e.g. Thoth · Hermes · Mercury — one figure, three traditions…',
  'e.g. Lucifer — the morning star before the fall…',
  'e.g. Asmodeus — King of Demons, 72nd of the Goetia…',
  'e.g. Enoch — patriarch, scribe, and angel…',
  'e.g. Baal — storm lord or demon king?…',
  'e.g. Sophia — Gnostic wisdom and the Demiurge…',
  'e.g. Michael — commander of the heavenly host…',
  'e.g. Metatron — the angel who was once a man…',
  'e.g. Osiris · Christ — resurrection across traditions…'
];

var M_promptIndex = 0;
var M_promptTimer = null;

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

  // Rotate placeholders
  M_startPlaceholderRotation(input);

  input.addEventListener('input', function() {
    var q = input.value.trim();
    M_stopPlaceholderRotation();
    if (q.length < 2 || !M_FUSE()) { M_hideSuggestions(); return; }
    M_renderSuggestions(q);
  });

  input.addEventListener('focus', function() { M_stopPlaceholderRotation(); });
  input.addEventListener('blur', function() {
    if (!input.value.trim()) M_startPlaceholderRotation(input);
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

function M_startPlaceholderRotation(input) {
  M_stopPlaceholderRotation();
  input.placeholder = M_SEARCH_PROMPTS[M_promptIndex];
  M_promptTimer = setInterval(function() {
    if (document.activeElement === input) return;
    M_promptIndex = (M_promptIndex + 1) % M_SEARCH_PROMPTS.length;
    input.style.transition = 'opacity 0.3s ease';
    input.style.opacity = '0.4';
    setTimeout(function() {
      input.placeholder = M_SEARCH_PROMPTS[M_promptIndex];
      input.style.opacity = '';
    }, 300);
  }, 4500);
}

function M_stopPlaceholderRotation() {
  clearInterval(M_promptTimer);
  M_promptTimer = null;
}

function M_renderSuggestions(query) {
  var fuseInst = M_FUSE();
  var db = M_DB();
  if (!fuseInst || !db) return;
  var results = fuseInst.search(query).slice(0, 7);
  M_suggActive = -1;
  var sugg = document.getElementById('search-suggestions');
  if (!sugg) return;
  if (!results.length) { M_hideSuggestions(); return; }

  var nodeColors = M_NODE_COLORS();
  var tradLabels = M_TRAD_LABELS();
  var levelRoman = ['I','II','III','IV','V','VI','VII'];

  sugg.innerHTML = results.map(function(r) {
    var e = r.item;
    var trad = Object.keys(e.tradition_vectors || {})[0] || 'default';
    var color = nodeColors[trad] || '#c9983a';
    var domain = (e.functional_domains || [])[0] || '';
    var lvl = e.hierarchical_level || 7;
    var dangerous = M_isDangerous(e);
    return '<div class="suggestion-item' + (dangerous ? ' suggestion-danger' : '') + '" role="option" data-entity-id="' + e.id + '">' +
      (dangerous ? '<span class="m-danger-pip">⚠</span>' : '') +
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
//  MODULE 6 — INSIGHT BAR
// ══════════════════════════════════════════════════════════════
function M_initInsightBar() {
  var nav = document.getElementById('nav');
  if (!nav) return;
  var bar = document.createElement('div');
  bar.id = 'insight-bar';
  bar.setAttribute('role', 'status');
  bar.setAttribute('aria-live', 'polite');
  bar.innerHTML = '<span class="insight-glyph">✦</span>' +
    '<span class="insight-text" id="insight-text"></span>' +
    '<button class="insight-dismiss" onclick="M_hideInsightBar()" aria-label="Dismiss">×</button>';
  nav.parentNode.insertBefore(bar, nav.nextSibling);
}

function M_showEntityInsightForId(entityId) {
  var db = M_DB();
  if (!db) return;
  var entity = db.entities.find(function(e) { return e.id === entityId; });
  if (!entity) return;

  var text = null;
  var rels = entity.relationships || [];
  if (rels.length) {
    var rel = rels[Math.floor(Math.random() * rels.length)];
    var target = db.entities.find(function(e) { return e.id === rel.target_id; });
    var tName = target ? target.canonical_name : rel.target_id.replace(/-/g, ' ');
    if (rel.notes && rel.notes.length > 20) {
      text = rel.notes;
    } else {
      text = entity.canonical_name + ' ' + rel.edge_type.replace(/_/g, ' ').toLowerCase() + ' ' + tName + ' — a connection that crossed at least two traditions.';
    }
  } else if (entity.research_notes && entity.research_notes.length > 20) {
    text = entity.research_notes.split(/[.!?]/)[0].trim() + '.';
  }

  if (text) M_showInsightBar(text);
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
  var db = M_DB();
  if (!db) return;
  var pool = db.entities.filter(function(e) { return (e.relationships || []).length > 0; });
  if (!pool.length) return;
  var entity = pool[Math.floor(Math.random() * pool.length)];
  var rels = entity.relationships || [];
  var rel = rels[Math.floor(Math.random() * rels.length)];
  var target = db.entities.find(function(e) { return e.id === rel.target_id; });
  var tName = target ? target.canonical_name : rel.target_id.replace(/-/g, ' ');

  var text;
  if (rel.notes && rel.notes.length > 20) {
    text = rel.notes;
  } else {
    text = entity.canonical_name + ' and ' + tName + ' share a ' + rel.edge_type.replace(/_/g, ' ').toLowerCase() + ' connection that survives in at least two independent traditions.';
  }

  var banner = document.createElement('div');
  banner.id = 'concordance-insight-banner';
  banner.setAttribute('role', 'status');
  banner.innerHTML = '<span class="cib-sigil">✦</span> <em>Concordance:</em> ' + text +
    ' <button class="cib-close" aria-label="Dismiss">×</button>';
  banner.querySelector('.cib-close').addEventListener('click', function() {
    banner.classList.remove('visible');
    setTimeout(function() { if (banner.parentNode) banner.remove(); }, 600);
  });
  document.body.appendChild(banner);

  setTimeout(function() {
    banner.classList.add('visible');
    setTimeout(function() {
      if (banner.parentNode) {
        banner.classList.remove('visible');
        setTimeout(function() { if (banner.parentNode) banner.remove(); }, 600);
      }
    }, 9000);
  }, 4000);
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
  var db = M_DB();
  if (!db) return;
  document.querySelectorAll('.entity-card:not([data-cmp-ok])').forEach(function(card) {
    card.setAttribute('data-cmp-ok', '1');
    var nameEl = card.querySelector('.card-name');
    if (!nameEl) return;
    var name = nameEl.textContent.trim();
    var entity = db.entities.find(function(e) { return e.canonical_name === name; });
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
  var db = M_DB();
  if (!bar || !db) return;
  if (!M_compareSet.length) { bar.classList.remove('visible'); return; }

  var entities = M_compareSet.map(function(id) {
    return db.entities.find(function(e) { return e.id === id; });
  }).filter(Boolean);

  bar.innerHTML = entities.map(function(e) {
    return '<span class="compare-bar-item">' + e.canonical_name +
      ' <button class="compare-remove" onclick="M_removeFromCompare(\'' + e.id + '\')" aria-label="Remove">×</button></span>';
  }).join('') +
    '<button class="compare-open-btn" onclick="M_openCompareOverlay()">⊞ Open Comparison</button>' +
    '<button class="compare-clear-btn" onclick="M_clearCompare()">Clear</button>';
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
  var detail = document.getElementById('detail-overlay');
  if (!detail || !detail.classList.contains('open')) document.body.style.overflow = '';
}

function M_buildCompareContent() {
  var body = document.getElementById('compare-body');
  var db = M_DB();
  if (!body || !db) return;
  var entities = M_compareSet.map(function(id) {
    return db.entities.find(function(e) { return e.id === id; });
  }).filter(Boolean);
  if (!entities.length) return;

  var nodeColors = M_NODE_COLORS();
  var tradLabels = M_TRAD_LABELS();
  var levelLabels = M_LEVEL_LABELS();

  var allTrads = [];
  entities.forEach(function(e) { Object.keys(e.tradition_vectors || {}).forEach(function(t) { if (allTrads.indexOf(t) < 0) allTrads.push(t); }); });
  var allDoms = [];
  entities.forEach(function(e) { (e.functional_domains || []).forEach(function(d) { if (allDoms.indexOf(d) < 0) allDoms.push(d); }); });

  var sharedTrads = allTrads.filter(function(t) { return entities.every(function(e) { return !!(e.tradition_vectors || {})[t]; }); });
  var sharedDoms = allDoms.filter(function(d) { return entities.filter(function(e) { return (e.functional_domains || []).indexOf(d) >= 0; }).length > 1; });

  var cols = entities.length;
  var html = '<div class="compare-grid" style="grid-template-columns:repeat(' + cols + ',1fr)">';

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

  html += '<div class="compare-row-label" style="grid-column:1/-1">Functional Domains</div>';
  entities.forEach(function(e) {
    html += '<div class="compare-cell">' + (e.functional_domains || []).map(function(d) {
      return '<span class="domain-tag ' + (sharedDoms.indexOf(d) >= 0 ? 'compare-shared' : '') + '">' + d + '</span>';
    }).join('') + '</div>';
  });

  html += '<div class="compare-row-label" style="grid-column:1/-1">Tradition Vectors</div>';
  entities.forEach(function(e) {
    html += '<div class="compare-cell">' + Object.keys(e.tradition_vectors || {}).map(function(t) {
      return '<span class="compare-trad-tag ' + (sharedTrads.indexOf(t) >= 0 ? 'compare-shared' : '') + '">' + (tradLabels[t] || t) + '</span>';
    }).join('') + '</div>';
  });

  html += '<div class="compare-row-label" style="grid-column:1/-1">Relationships</div>';
  entities.forEach(function(e) {
    var rels = e.relationships || [];
    if (!rels.length) { html += '<div class="compare-cell compare-dim">—</div>'; return; }
    html += '<div class="compare-cell">' + rels.slice(0, 4).map(function(r) {
      var tgt = db.entities.find(function(x) { return x.id === r.target_id; });
      var tName = tgt ? tgt.canonical_name : r.target_id.replace(/-/g, ' ');
      return '<div class="compare-rel"><span class="edge-type edge-' + r.edge_type + '" style="font-size:0.6rem">' + r.edge_type.replace(/_/g, ' ') + '</span> ' + tName + '</div>';
    }).join('') + (rels.length > 4 ? '<div class="compare-dim">+' + (rels.length - 4) + ' more</div>' : '') + '</div>';
  });

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
  }, 80);
}

function M_addTimelineJumpButtons() {
  var tlHeader = document.querySelector('.tl-header');
  if (!tlHeader || document.getElementById('tl-jump-strip')) return;
  var ERAS = [
    { label: 'Sumerian', start: -3500 }, { label: 'Bronze Age', start: -2000 },
    { label: 'Classical', start: -800 }, { label: '2nd Temple', start: -167 },
    { label: 'Late Antique', start: 200 }, { label: 'Medieval', start: 700 },
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
    isDown = true; startX = e.pageX - wrap.offsetLeft; scrollLeft = wrap.scrollLeft; lastX = e.pageX; velocity = 0;
    cancelAnimationFrame(rafId); wrap.classList.add('is-grabbing');
    try { wrap.setPointerCapture(e.pointerId); } catch(err) {}
  });
  wrap.addEventListener('pointermove', function(e) {
    if (!isDown) return;
    velocity = e.pageX - lastX; lastX = e.pageX;
    wrap.scrollLeft = scrollLeft - (e.pageX - wrap.offsetLeft - startX);
  });
  var endDrag = function() {
    if (!isDown) return; isDown = false; wrap.classList.remove('is-grabbing');
    var v = velocity;
    var coast = function() { v *= 0.91; if (Math.abs(v) < 0.5) return; wrap.scrollLeft -= v; rafId = requestAnimationFrame(coast); };
    rafId = requestAnimationFrame(coast);
  };
  wrap.addEventListener('pointerup', endDrag);
  wrap.addEventListener('pointercancel', endDrag);
}

function M_addTimelineBadgeTooltips() {
  var canvas = document.getElementById('tl-canvas');
  var db = M_DB();
  if (!canvas || !db) return;
  canvas.querySelectorAll('.tl-badge:not([data-tl-tip])').forEach(function(badge) {
    badge.setAttribute('data-tl-tip', '1');
    badge.addEventListener('mouseenter', function() {
      var entityId = badge.dataset.entityId;
      if (!entityId) return;
      var entity = db.entities.find(function(e) { return e.id === entityId; });
      if (!entity) return;
      var domain = (entity.functional_domains || [])[0] || '';
      var tooltip = document.getElementById('lore-tooltip');
      if (!tooltip) return;
      tooltip.innerHTML = '<strong style="font-family:var(--font-heading);color:var(--gold-light);font-size:0.78rem">' + entity.canonical_name + '</strong>' +
        (domain ? '<br><em style="color:var(--faint);font-size:0.78rem">' + domain + '</em>' : '');
      tooltip.className = 'visible';
      var rect = badge.getBoundingClientRect();
      tooltip.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
      tooltip.style.top = (rect.bottom + 8) + 'px';
    });
    badge.addEventListener('mouseleave', function() { M_hideLoreTooltip(); });
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
  var db = M_DB();
  if (M_fuseScripture || !db) return;
  var docs = [];
  db.entities.forEach(function(entity) {
    (entity.source_attestations || []).forEach(function(src) {
      docs.push({ entityId: entity.id, name: entity.canonical_name, source: src });
    });
    Object.values(entity.tradition_vectors || {}).forEach(function(tv) {
      if (!tv || !tv.source_texts) return;
      tv.source_texts.forEach(function(src) {
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
  var db = M_DB();
  if (!M_fuseScripture || !db) return;
  var input = document.getElementById('search-input');
  var q = input ? input.value.trim() : '';
  if (q.length < 2) return;

  var results = M_fuseScripture.search(q);
  var entityIds = [];
  results.forEach(function(r) { if (entityIds.indexOf(r.item.entityId) < 0) entityIds.push(r.item.entityId); });
  var entities = entityIds.map(function(id) { return db.entities.find(function(e) { return e.id === id; }); }).filter(Boolean);

  var countEl = document.getElementById('results-count');
  if (countEl) countEl.textContent = entities.length + ' entries matching scripture "' + q + '"';

  var grid = document.getElementById('results-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!entities.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-glyph">◉</div><p>No scripture references match. Try a book name (e.g. "Enoch", "Daniel") or citation.</p></div>';
    return;
  }
  entities.forEach(function(entity, i) {
    var card = document.createElement('div');
    var isJesus = entity.id === 'jesus-christ';
    card.className = 'entity-card' + (isJesus ? ' card-jesus' : '') + (M_isDangerous(entity) ? ' m-danger-card' : '');
    card.style.animationDelay = Math.min(i * 0.04, 0.4) + 's';
    card.addEventListener('click', function() { window.openDetail(entity.id); });
    var tradKeys = Object.keys(entity.tradition_vectors || {});
    var tradLabels = M_TRAD_LABELS();
    var tradPips = tradKeys.map(function(k) { return '<span class="trad-pip trad-' + k + '">' + (tradLabels[k] || k) + '</span>'; }).join('');
    var domains = (entity.functional_domains || []).slice(0, 3).map(function(d) { return '<span class="domain-tag">' + d + '</span>'; }).join('');
    var levelLabels = M_LEVEL_LABELS();
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
//  MODULE D — MANUSCRIPT ATMOSPHERE
// ══════════════════════════════════════════════════════════════
function M_initAtmosphere() {
  // Vignette overlay
  var vignette = document.createElement('div');
  vignette.id = 'm-vignette';
  document.body.appendChild(vignette);

  // Marginalia glyphs (fixed, decorative)
  var GLYPHS = ['✦', '✧', '⊛', '◈', '⊜', '⊕', '✶', '⊗', '◉', '✷'];
  var positions = [
    { top: '12%', left: '1.5%' }, { top: '38%', left: '0.8%' },
    { top: '65%', left: '1.8%' }, { top: '82%', left: '1.1%' },
    { top: '18%', right: '1.2%' }, { top: '44%', right: '0.7%' },
    { top: '70%', right: '1.5%' }, { top: '90%', right: '1.0%' }
  ];
  positions.forEach(function(pos, i) {
    var el = document.createElement('div');
    el.className = 'm-marginalia-glyph';
    el.textContent = GLYPHS[i % GLYPHS.length];
    Object.assign(el.style, pos);
    el.style.animationDelay = (i * 0.7) + 's';
    document.body.appendChild(el);
  });
}

// ══════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  M_initInvocation();
  M_initSound();
  M_initSigils();
  M_initLoreTooltips();
  M_initSearchSuggestions();
  M_initInsightBar();
  M_initCompare();
  M_initTimeline();
  M_initConstellation();
  M_initScriptureSearch();
  M_initAtmosphere();

  var idleFn = function() {
    M_whenReady(function() {
      M_injectCompareButtons();
      M_applyDangerMarks();
      M_showPageLoadInsight();
    });
  };
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(idleFn, { timeout: 4000 });
  } else {
    setTimeout(idleFn, 600);
  }
});
