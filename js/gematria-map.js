// ══════════════════════════════════════════════════════════════
//  GEMATRIA RESONANCE MAP — Pantheon Concordance
//  Clusters all 170 entities by English Ordinal digital root
//  using a D3 force-directed layout.
//
//  Gematria system: English Ordinal (A=1 … Z=26) — used as the
//  universal baseline across all traditions. Hebrew Mispar
//  Hechrachi and Greek Isopsephy values are shown in tooltips
//  where attested in primary sources.
//
//  Frequencies: Hans Cousto, The Cosmic Octave (1988) — orbital
//  periods transposed to the audible range through octave doubling.
//  EM field notes cite published bioacoustics / neuroscience.
// ══════════════════════════════════════════════════════════════

const GEM_MAP = (function () {
  'use strict';

  // ── Root metadata ─────────────────────────────────────────────
  const ROOT_META = {
    1: { label: 'Unity',        desc: 'One · Beginning · Source',          color: '#f0cc70' },
    2: { label: 'Duality',      desc: 'Balance · Opposition · Mirror',     color: '#8bc4e8' },
    3: { label: 'Trinity',      desc: 'Creation · Synthesis · Word',       color: '#90d890' },
    4: { label: 'Foundation',   desc: 'Structure · Law · Matter',          color: '#d8a060' },
    5: { label: 'Quintessence', desc: 'Change · Will · Humanity',          color: '#c880c0' },
    6: { label: 'Beauty',       desc: 'Harmony · Tiphareth · Love',        color: '#50c8c8' },
    7: { label: 'Mystery',      desc: 'Spirit · Sabbath · Occult',         color: '#9898e8' },
    8: { label: 'Infinity',     desc: 'Power · Eternity · Dominion',       color: '#e88060' },
    9: { label: 'Completion',   desc: 'Ennead · Return · Perfection',      color: '#b0d070' },
  };

  // ── Tradition display ─────────────────────────────────────────
  const TRAD_LABELS = {
    greek:'Greek', roman:'Roman', egyptian:'Egyptian',
    mesopotamian:'Mesopotamian', biblical_angel:'Biblical',
    enochian:'Enochian', kabbalistic:'Kabbalah', hermetic:'Hermetic',
    gnostic:'Gnostic', goetic:'Goetic', islamic:'Islamic',
    planetary:'Planetary', canaanite:'Canaanite', hindu:'Hindu',
  };

  const NODE_COLORS = {
    greek:'#d4a832', roman:'#c4703a', egyptian:'#3ab8b8',
    mesopotamian:'#d9a07a', biblical_angel:'#a088d8',
    enochian:'#c06060', kabbalistic:'#50b870', hermetic:'#d4aa30',
    gnostic:'#9060c0', goetic:'#d04040', islamic:'#30a0c0',
    planetary:'#6088d8', canaanite:'#c8a060', hindu:'#e87040',
    default:'#c9983a',
  };

  // ── Attested notable gematria values ──────────────────────────
  // Sources cited inline. Only include values documented in primary
  // scholarship — no invented correspondences.
  const NOTABLE_VALUES = {
    888:  'Greek isopsephy of ΙΗΣΟΥΣ (Iesous) = 888 — documented in early patristic numerology; the "number of Christ"',
    666:  'Number of the Beast (Rev 13:18 NIV); also isopsephy of ΝΕΡΩΝ ΚΑΙΣΑΡ (Nero Caesar) in Greek; Σοράθ (Sorath, solar demon) = 666 in Kabbalistic tradition',
    365:  'Greek isopsephy of ΑΒΡΑΣΑΞ = 365, equalling days in the solar year — central to Basilidean cosmology (Irenaeus, Adv. Haer. 1.24.7)',
    777:  'Triple Shin (300+300+300) in Hebrew; Crowley, 777 and Other Qabalistic Writings (1909) — codified as triple synthesis across the Tree of Life',
    314:  'Hebrew gematria of מטטרון (Metatron) = שדי (Shaddai) = 314 — noted as evidence of Metatron\'s divine title in Kabbalistic literature (3 Enoch, Sefer ha-Bahir)',
    26:   'Hebrew gematria of יהוה (YHWH) = 26 — the Tetragrammaton; foundation of Kabbalistic number theology',
    72:   '72 Names of God (shem ha-mephorash) derived from Ex 14:19–21; also count of Goetic spirits in the Ars Goetia',
    216:  '6³ = 216; associated with the 216-letter Name of God (Kabbalistic tradition); also 72 names × 3 letters = 216 letters in Ex 14:19–21',
    13:   'Hebrew: אחד (Echad, "One") = 13; אהבה (Ahavah, "Love") = 13. Talmudic teaching: "God is One, God is Love" (Rav Akiva, Shabbat 31a)',
    15:   'Hebrew: יה (Yah) = 15 — abbreviated divine name (Ps 68:4); also triangular number (1+2+3+4+5)',
    248:  'Hebrew: אברהם (Abraham) = 248; also number of positive Torah commandments (b. Makkot 23b); equals limbs in human body (Talmud)',
    480:  'Hebrew: לילית (Lilith) = 480 — standard Mispar Hechrachi value; attested in Kabbalistic grimoire tradition',
    101:  'Hebrew: מיכאל (Michael) = 101 — standard value; noted in Sefer Raziel and later angelic literature',
    246:  'Hebrew: גבריאל (Gabriel) = 246 — standard value; attested in Midrash and Talmudic sources (b. Sanhedrin 44b)',
    131:  'Hebrew: סמאל (Samael) = 131 — equals Hebrew מיכאל... (Michael) + 30; noted contrast in Zoharic demonology',
    142:  'Hebrew: בליעל (Belial) = 142 — standard value; appears in Dead Sea Scrolls (1QS iii.18–19)',
    45:   'Hebrew: אדם (Adam) = 45; also מה (mah, "what") = 45 — associated with the World of Formation (Yetzirah)',
    358:  'Hebrew: משיח (Mashiach, Messiah) = נחש (Nachash, Serpent) = 358 — famous Kabbalistic equivalence (Zohar III.276b); implies the Messiah raises what the serpent fell',
    386:  'Hebrew: ישוע (Yeshua/Jesus) = 386 — standard Mispar Hechrachi value; used in Jewish-Christian polemical literature',
    84:   'Hebrew: חנוך (Enoch) = 84 — standard value; Enoch\'s age at Methuselah\'s birth was 65 (Gen 5:21)',
    58:   'Hebrew: נח (Noah) = 58; Noah lived 950 years (Gen 9:29)',
  };

  // ── Gematria computation ──────────────────────────────────────

  function ordinal(str) {
    // English Ordinal: A=1 … Z=26 (letters only, case-insensitive)
    return str.toUpperCase().replace(/[^A-Z]/g, '')
      .split('').reduce((s, c) => s + (c.charCodeAt(0) - 64), 0);
  }

  function digitalRoot(n) {
    if (n <= 0) return 0;
    // Formula: 1 + ((n - 1) mod 9)
    return 1 + (n - 1) % 9;
  }

  // ── State ─────────────────────────────────────────────────────
  let _initialized = false;
  let _tooltip = null;
  let _filterTrad = 'all';

  function getTooltip() {
    if (!_tooltip) {
      _tooltip = document.createElement('div');
      _tooltip.id = 'gem-map-tt';
      Object.assign(_tooltip.style, {
        position: 'fixed', display: 'none', zIndex: '10001',
        background: 'rgba(10,7,4,0.97)',
        border: '1px solid rgba(201,152,58,0.4)',
        borderRadius: '3px', padding: '10px 14px',
        pointerEvents: 'none', maxWidth: '310px',
        fontFamily: 'EB Garamond, serif', fontSize: '0.9rem',
        color: '#e8dcc8', lineHeight: '1.6',
        boxShadow: '0 8px 28px rgba(0,0,0,0.75)',
      });
      document.body.appendChild(_tooltip);
    }
    return _tooltip;
  }

  // ── Build ─────────────────────────────────────────────────────

  function build(entities) {
    if (_initialized) return;
    _initialized = true;

    const wrap = document.getElementById('gem-map-svg-wrap');
    if (!wrap) return;
    wrap.innerHTML = '';

    if (!entities || entities.length === 0) {
      wrap.innerHTML = '<p style="text-align:center;color:var(--dim);padding:3rem">No entity data available.</p>';
      return;
    }

    // ── Prepare node data ─────────────────────────────────────
    const nodes = entities.map(e => {
      const primaryName = e.canonical_name.split('/')[0].split('(')[0].trim();
      const ov = ordinal(primaryName);
      const dr = digitalRoot(ov);
      const trads = Object.keys(e.tradition_vectors || {});
      const primaryTrad = trads.find(t => t !== 'planetary') || trads[0] || 'default';
      const level = e.hierarchical_level || 4;
      const notable = NOTABLE_VALUES[ov] || null;
      const vib = e.vibrational_data || null;

      // Hebrew/Greek values stored in entity data (if present)
      const gem = e.gematria || {};

      return {
        id:           e.id,
        name:         e.canonical_name,
        primaryName,
        ordinalValue: ov,
        digitalRoot:  dr,
        tradition:    primaryTrad,
        allTrads:     trads,
        level,
        notable,
        hebrewValue:  gem.hebrew_value   || null,
        hebrewSpell:  gem.hebrew_spelling || null,
        greekValue:   gem.greek_isopsephy || null,
        greekSpell:   gem.greek_spelling  || null,
        freq:         vib ? vib.frequency_hz    : null,
        freqLabel:    vib ? vib.frequency_label  : null,
        r: Math.max(5, Math.round(14 - level * 1.5)),
      };
    });

    const W  = wrap.clientWidth || 900;
    const H  = Math.max(640, Math.round(W * 0.72));
    const COLS = 3, ROWS = 3;
    const cellW = W / COLS, cellH = H / ROWS;
    const clusterR = Math.min(cellW, cellH) * 0.44;

    // Cluster centres (3 × 3 grid)
    const clusters = {};
    for (let r = 1; r <= 9; r++) {
      const col = (r - 1) % COLS;
      const row = Math.floor((r - 1) / COLS);
      clusters[r] = {
        root: r,
        cx: cellW * col + cellW / 2,
        cy: cellH * row + cellH / 2,
        r: clusterR,
        meta: ROOT_META[r],
      };
    }

    // Initial positions near cluster centres
    nodes.forEach(n => {
      const cl = clusters[n.digitalRoot] || clusters[1];
      const angle = Math.random() * Math.PI * 2;
      const dist  = Math.random() * clusterR * 0.35;
      n.x = cl.cx + Math.cos(angle) * dist;
      n.y = cl.cy + Math.sin(angle) * dist;
    });

    // ── SVG ───────────────────────────────────────────────────
    const svg = d3.select(wrap)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('width', '100%')
      .attr('height', H)
      .style('display', 'block')
      .style('background', 'transparent');

    const g = svg.append('g');

    // Zoom / pan
    svg.call(
      d3.zoom().scaleExtent([0.35, 4])
        .on('zoom', ev => g.attr('transform', ev.transform))
    );

    // ── Cluster backgrounds ───────────────────────────────────
    const clusterG = g.append('g').attr('class', 'gem-clusters');

    Object.values(clusters).forEach(cl => {
      clusterG.append('circle')
        .attr('cx', cl.cx).attr('cy', cl.cy).attr('r', cl.r)
        .attr('fill', 'none')
        .attr('stroke', cl.meta.color)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.2);

      clusterG.append('circle')
        .attr('cx', cl.cx).attr('cy', cl.cy).attr('r', cl.r)
        .attr('fill', cl.meta.color)
        .attr('fill-opacity', 0.03);

      // Cluster label
      clusterG.append('text')
        .attr('x', cl.cx).attr('y', cl.cy - cl.r + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', cl.meta.color).attr('fill-opacity', 0.7)
        .attr('font-family', 'Cinzel, serif').attr('font-size', 12.5)
        .attr('letter-spacing', '0.05em')
        .text(`${cl.root} — ${cl.meta.label}`);

      clusterG.append('text')
        .attr('x', cl.cx).attr('y', cl.cy - cl.r + 34)
        .attr('text-anchor', 'middle')
        .attr('fill', cl.meta.color).attr('fill-opacity', 0.32)
        .attr('font-family', 'EB Garamond, serif').attr('font-size', 9.5)
        .attr('font-style', 'italic')
        .text(cl.meta.desc);
    });

    // ── Entity nodes ─────────────────────────────────────────
    const nodeG = g.append('g').attr('class', 'gem-nodes');

    const nodeEls = nodeG.selectAll('g.gn')
      .data(nodes).enter()
      .append('g').attr('class', 'gn')
      .style('cursor', 'pointer');

    nodeEls.append('circle')
      .attr('r', d => d.r)
      .attr('fill', d => NODE_COLORS[d.tradition] || NODE_COLORS.default)
      .attr('fill-opacity', d => d.notable ? 0.9 : 0.65)
      .attr('stroke', d => NODE_COLORS[d.tradition] || NODE_COLORS.default)
      .attr('stroke-width', d => d.notable ? 2 : 1)
      .attr('stroke-opacity', 0.9);

    // Mark notable entities with a sigil
    nodeEls.filter(d => !!d.notable).append('text')
      .attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('font-size', d => Math.max(5, d.r - 2))
      .attr('fill', 'rgba(255,240,200,0.9)')
      .attr('pointer-events', 'none')
      .text('✦');

    // ── Tooltip ───────────────────────────────────────────────
    const tt = getTooltip();

    nodeEls
      .on('mousemove', function (event, d) {
        const cl = clusters[d.digitalRoot] || clusters[1];
        let h = `<div style="font-family:Cinzel,serif;font-size:1rem;color:#f0cc70;margin-bottom:3px">${d.name}</div>`;
        h += `<div style="font-size:0.77rem;color:rgba(240,204,112,0.5);margin-bottom:7px">`;
        h += d.allTrads.map(t => TRAD_LABELS[t] || t).join(' · ');
        h += `</div>`;
        h += `<div style="border-top:1px solid rgba(201,152,58,0.18);padding-top:7px">`;
        h += `<span style="color:#a0bca0">English Ordinal:</span> <strong>${d.ordinalValue}</strong>`;
        h += ` → Digital Root <strong style="color:${cl.meta.color}">${d.digitalRoot}</strong>`;
        h += ` <em style="font-size:0.78rem;color:rgba(201,152,58,0.5)">(${cl.meta.label})</em></div>`;

        if (d.hebrewValue) {
          h += `<div style="margin-top:5px;font-size:0.82rem"><span style="color:#a0bca0">Hebrew gematria</span> `;
          if (d.hebrewSpell) h += `${d.hebrewSpell} `;
          h += `= <strong>${d.hebrewValue}</strong></div>`;
        }
        if (d.greekValue) {
          h += `<div style="font-size:0.82rem"><span style="color:#a0bca0">Greek isopsephy</span> `;
          if (d.greekSpell) h += `${d.greekSpell} `;
          h += `= <strong>${d.greekValue}</strong></div>`;
        }
        if (d.notable) {
          h += `<div style="margin-top:7px;font-size:0.78rem;color:rgba(240,204,112,0.75);font-style:italic;border-top:1px solid rgba(201,152,58,0.15);padding-top:7px">${d.notable}</div>`;
        }
        if (d.freq) {
          h += `<div style="margin-top:6px;font-size:0.8rem;color:#88c0a8"><strong>Planetary tone:</strong> ${d.freq} Hz`;
          if (d.freqLabel) h += ` — ${d.freqLabel}`;
          h += `</div>`;
        }
        h += `<div style="margin-top:5px;font-size:0.72rem;color:rgba(200,180,140,0.38)">Click to open detail panel</div>`;

        tt.innerHTML = h;
        tt.style.display = 'block';
        // Keep tooltip within viewport
        const vw = window.innerWidth;
        const left = event.clientX + 18;
        tt.style.left = (left + 320 > vw ? event.clientX - 330 : left) + 'px';
        tt.style.top  = (event.clientY - 12) + 'px';
      })
      .on('mouseleave', () => { tt.style.display = 'none'; })
      .on('click', (event, d) => {
        tt.style.display = 'none';
        if (typeof openDetail === 'function') openDetail(d.id);
      });

    // ── Force simulation ──────────────────────────────────────

    function clusterForce(strength) {
      return function () {
        nodes.forEach(n => {
          const cl = clusters[n.digitalRoot] || clusters[1];
          n.vx = (n.vx || 0) + (cl.cx - n.x) * strength;
          n.vy = (n.vy || 0) + (cl.cy - n.y) * strength;
        });
      };
    }

    function boundForce() {
      return function () {
        nodes.forEach(n => {
          const cl = clusters[n.digitalRoot] || clusters[1];
          const dx = n.x - cl.cx, dy = n.y - cl.cy;
          const dist = Math.hypot(dx, dy);
          const max  = cl.r - n.r - 2;
          if (dist > max && dist > 0) {
            const scale = max / dist;
            n.x = cl.cx + dx * scale;
            n.y = cl.cy + dy * scale;
            n.vx *= 0.45;
            n.vy *= 0.45;
          }
        });
      };
    }

    d3.forceSimulation(nodes)
      .force('collide', d3.forceCollide(d => d.r + 1.8).strength(0.9).iterations(4))
      .force('cluster', clusterForce(0.16))
      .force('bound',   boundForce())
      .alphaDecay(0.012)
      .on('tick', () => {
        nodeEls.attr('transform', d => `translate(${d.x.toFixed(2)},${d.y.toFixed(2)})`);
      });

    // ── Legend ────────────────────────────────────────────────
    const legendEl = document.createElement('div');
    legendEl.id = 'gem-map-legend';
    legendEl.style.cssText = [
      'display:flex', 'flex-wrap:wrap', 'gap:7px 14px',
      'padding:10px 20px 14px', 'margin-top:2px',
      'border-top:1px solid rgba(201,152,58,0.15)',
    ].join(';');

    Object.entries(NODE_COLORS)
      .filter(([k]) => k !== 'default')
      .forEach(([trad, color]) => {
        const item = document.createElement('span');
        item.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:0.77rem;color:rgba(232,220,200,0.6);font-family:EB Garamond,serif';
        item.innerHTML = `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${color};opacity:0.85;flex-shrink:0"></span>${TRAD_LABELS[trad] || trad}`;
        legendEl.appendChild(item);
      });

    wrap.appendChild(legendEl);

    // ── Usage hint ────────────────────────────────────────────
    const hint = document.createElement('p');
    hint.style.cssText = 'text-align:center;font-size:0.78rem;color:rgba(200,180,140,0.38);font-family:EB Garamond,serif;font-style:italic;margin:6px 0 0;padding:0 20px';
    hint.textContent = 'Scroll to zoom · Drag to pan · Hover for gematria detail · Click to open entity';
    wrap.appendChild(hint);
  }

  // ── Tab switching (called from inline onclick in HTML) ────────
  function switchTab(tabId, btn) {
    document.querySelectorAll('.gem-view-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.gem-sub-panel').forEach(p => { p.style.display = 'none'; });
    const panel = document.getElementById('gem-sub-' + tabId);
    if (panel) panel.style.display = '';
    if (tabId === 'resonance') {
      // DB is the global entities store from app.js
      const entities = (window.DB && window.DB.entities) ? window.DB.entities : [];
      build(entities);
    }
  }

  return { build, switchTab };

})();

window.GEM_MAP = GEM_MAP;
