# Pantheon-Concordance

### Syncretic Mythology, Angelology & Occult Genealogy — A Cross-Traditional Research Database

> *“When you know that all divine names are one name, the mind begins to see the map beneath the map.”*
> — paraphrased from Pico della Mirandola, *Oration on the Dignity of Man* (1486)

-----

A structured, cross-referenced comparative framework mapping the intersection of Classical Mythology, Judeo-Christian Angelology and Demonology, Enochian Literature, Islamic Prophet Traditions, Kabbalistic Systems, Hermeticism, Gnosticism, Egyptian Theology, Planetary Astrology, and Renaissance Esotericism.

This repository compiles historical syncretism — such as Roman *Interpretatio romana*, the Patristic reframing of pagan deities as fallen angels, and Islamic-Hermetic correspondences — alongside grimoiric and occult lineages drawn from the *Ars Goetia*, *Sefer ha-Zohar*, and the Agrippan magical tradition. The goal is a unified, searchable network of correspondences organized as a hierarchical graph: the kind of cross-reference system used by Renaissance occultists like Agrippa and Ficino, and by modern comparative mythology researchers.

**Target scope: 200–500 named entities.** Current status: schema design and sample population phase.

-----

## Table of Contents

1. [Project Philosophy](#project-philosophy)
1. [Tradition Vectors Covered](#tradition-vectors-covered)
1. [Data Model & Schema](#data-model--schema)
1. [Canonical Hierarchy](#canonical-hierarchy)
1. [Syncretic Concordance Matrix (Sample)](#syncretic-concordance-matrix-sample)
1. [Relationship Edge Types](#relationship-edge-types)
1. [Concordance Design Notes](#concordance-design-notes)
1. [Development Roadmap](#development-roadmap)
1. [Deployment Strategy](#deployment-strategy)
1. [Source Bibliography by Tradition](#source-bibliography-by-tradition)
1. [Methodology Disclaimer](#methodology-disclaimer)

-----

## Project Philosophy

This project operates on a single foundational premise: **convergence is data.** When multiple independent traditions — separated by centuries, continents, and theological hostility — independently assign the same attributes, domains, or narrative roles to different-named figures, that convergence is itself a historical and cultural artifact worth mapping.

This is not theological advocacy. It is the same methodology used by:

- Renaissance synthesizers (Ficino’s *prisca theologia*, Pico’s *Conclusiones*)
- 19th-century comparative mythologists (Max Müller, James Frazer)
- 20th-century Jungian archetypal psychology (Jung’s *Answer to Job*, Campbell’s *The Hero With a Thousand Faces*)
- Modern academic historians of religion (Wouter Hanegraaff, Frances Yates)

The concordance maps **claimed** relationships, **polemical** equivalences (e.g., Church Fathers identifying Zeus with Beelzebub), and **structural** parallels. Every relationship is tagged with both a type and a source tradition, so the database never flattens contested history into false certainty.

-----

## Tradition Vectors Covered

Each entity in the database may carry zero or more **Tradition Vectors** — attestations within a specific historical or esoteric framework. The eleven primary tradition tracks are:

|# |Tradition Track             |Scope                                                                           |
|--|----------------------------|--------------------------------------------------------------------------------|
|1 |**Greek Polytheism**        |Olympian, Chthonic, Primordial, Titan, Daemonic classes                         |
|2 |**Roman Polytheism**        |Direct *Interpretatio romana* equivalences + distinctly Roman figures           |
|3 |**Egyptian Theology**       |Heliopolitan, Hermopolitan, and Memphite theologies; Ennead & Ogdoad            |
|4 |**Biblical Angelology**     |Canonical angels, archangels, seraphim, cherubim (Hebrew Bible + NT)            |
|5 |**Enochian Literature**     |1 Enoch Watchers (Grigori), 2 Enoch, Book of Giants, Nephilim traditions        |
|6 |**Kabbalistic System**      |Sefirot correspondences, Qliphoth, angelic orders per Sephira, *Sefer Raziel*   |
|7 |**Hermetic Tradition**      |*Corpus Hermeticum*, Neoplatonism, Theurgy, Agrippan magical philosophy         |
|8 |**Gnostic Systems**         |Valentinian, Sethian, Manichean; Archons, Aeons, Demiurge                       |
|9 |**Ars Goetia / Grimoiric**  |72 Goetic spirits with rank, legions, and seals (*Lemegeton*, *Grand Grimoire*) |
|10|**Islamic Correspondences** |Quranic prophets, Jinn taxonomy, Isra’iliyyat angelic traditions                |
|11|**Planetary & Astrological**|Seven classical planets, twelve zodiacal sign rulers, 36 decans, day/night hours|

-----

## Data Model & Schema

### Design Principle: Graph Nodes, Not a Flat Table

Entities are modeled as **nodes** in a directed relationship graph rather than rows in a rigid relational table. This is essential because:

- A single archetype may have *multiple* Greek names (Hermes, Hermes Chthonios, Hermes Psychopompos)
- Relationships are contested: the Enochian Azazel is linked to both Azazel the Levitical scapegoat and the Greek Prometheus *by different traditions*, not by scholarly consensus
- Some equivalences are **polemical** (the Church calling Zeus “Beelzebub”), some are **structural** (both are sky-sovereigns), and they must be stored differently

### JSON Schema (v0.3 — Working Draft)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PantheonEntity",
  "type": "object",
  "required": ["id", "canonical_name", "tradition_vectors"],
  "properties": {

    "id": {
      "type": "string",
      "description": "Unique slug. e.g. 'hermes-trismegistus', 'azazel-watcher', 'baal-hadad'"
    },

    "canonical_name": {
      "type": "string",
      "description": "Most historically prominent or cross-traditional name for this node."
    },

    "aliases": {
      "type": "array",
      "items": { "type": "string" },
      "description": "All attested alternate names, epithets, or transliterations."
    },

    "tradition_vectors": {
      "type": "object",
      "description": "Attestations within each tradition track. All fields optional.",
      "properties": {

        "greek": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "class": { "type": "string", "enum": ["Primordial","Titan","Olympian","Chthonic","Daemonic","Hero","Nymph","Other"] },
            "epithets": { "type": "array", "items": { "type": "string" } },
            "source_texts": { "type": "array", "items": { "type": "string" } }
          }
        },

        "roman": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "interpretatio_type": { "type": "string", "enum": ["Direct","Partial","Contested","None"] },
            "source_texts": { "type": "array", "items": { "type": "string" } }
          }
        },

        "egyptian": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "theology": { "type": "string", "enum": ["Heliopolitan","Hermopolitan","Memphite","Theban","Other"] },
            "ennead_position": { "type": "string" },
            "source_texts": { "type": "array", "items": { "type": "string" } }
          }
        },

        "biblical_angel": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "rank": { "type": "string", "enum": ["Seraph","Cherub","Throne","Dominion","Virtue","Power","Principality","Archangel","Angel"] },
            "canonical_function": { "type": "string" },
            "source_texts": { "type": "array", "items": { "type": "string" } }
          }
        },

        "enochian": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "classification": { "type": "string", "enum": ["Watcher","Fallen Watcher","Nephilim","Archangel","Other"] },
            "enoch_book": { "type": "string", "enum": ["1 Enoch","2 Enoch","Book of Giants","Book of Jubilees","Other"] },
            "sin_or_role": { "type": "string", "description": "e.g. 'Taught metalwork and war' (Azazel), 'Led the descent' (Semjaza)" },
            "chapter_reference": { "type": "string" }
          }
        },

        "kabbalistic": {
          "type": "object",
          "properties": {
            "sephira": { "type": "string", "enum": ["Kether","Chokmah","Binah","Chesed","Geburah","Tiphareth","Netzach","Hod","Yesod","Malkuth"] },
            "qliphoth_counterpart": { "type": "string" },
            "angelic_order": { "type": "string" },
            "divine_name": { "type": "string" },
            "source_texts": { "type": "array", "items": { "type": "string" } }
          }
        },

        "hermetic": {
          "type": "object",
          "properties": {
            "role": { "type": "string" },
            "corpus_hermeticum_ref": { "type": "string" },
            "agrippan_attribution": { "type": "string" },
            "alchemical_symbol": { "type": "string" }
          }
        },

        "gnostic": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "system": { "type": "string", "enum": ["Valentinian","Sethian","Manichean","Mandaean","Other"] },
            "classification": { "type": "string", "enum": ["Monad","Aeon","Archon","Demiurge","Sophia","Pneuma","Other"] },
            "source_texts": { "type": "array", "items": { "type": "string" } }
          }
        },

        "goetic": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "rank": { "type": "string", "enum": ["King","Duke","Prince","Marquis","Count","Knight","President","Earl"] },
            "legions": { "type": "integer" },
            "seal_reference": { "type": "string" },
            "primary_functions": { "type": "array", "items": { "type": "string" } },
            "grimoire_source": { "type": "string", "enum": ["Ars Goetia","Ars Theurgia-Goetia","Grand Grimoire","Grimorium Verum","Munich Manual","Other"] }
          }
        },

        "islamic": {
          "type": "object",
          "properties": {
            "name_arabic": { "type": "string" },
            "name_transliterated": { "type": "string" },
            "classification": { "type": "string", "enum": ["Prophet","Angel","Jinn","Iblis","Malak","Other"] },
            "quranic_reference": { "type": "string" },
            "isra_iliyyat_link": { "type": "string", "description": "Connections via Judeo-Christian material absorbed into Islamic tradition" }
          }
        },

        "planetary": {
          "type": "object",
          "properties": {
            "planet": { "type": "string", "enum": ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn"] },
            "zodiac_rulership": { "type": "array", "items": { "type": "string" } },
            "decan": { "type": "string", "description": "e.g. 'First decan of Aries'" },
            "day_of_week": { "type": "string" },
            "metal": { "type": "string" },
            "color": { "type": "string" },
            "agrippa_book_ref": { "type": "string" }
          }
        }

      }
    },

    "functional_domains": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Canonical functional roles shared cross-traditionally. e.g. ['Psychopomp','Divine Scribe','Liminal Guardian']"
    },

    "hierarchical_level": {
      "type": "integer",
      "minimum": 1,
      "maximum": 7,
      "description": "Structural rank within the project's top-down emanation hierarchy (see Canonical Hierarchy section)."
    },

    "relationships": {
      "type": "array",
      "description": "Directed edges to other entities in the database.",
      "items": {
        "type": "object",
        "required": ["target_id", "edge_type", "source_tradition", "source_text"],
        "properties": {
          "target_id": { "type": "string" },
          "edge_type": {
            "type": "string",
            "enum": [
              "SYNCRETIZED_WITH",
              "DESCENDED_FROM",
              "EMANATED_FROM",
              "POLEMIC_EQUIVALENT",
              "MANIFESTED_AS",
              "FUNCTIONAL_PARALLEL",
              "FALLEN_FORM_OF",
              "TAUGHT_BY",
              "COMMANDS",
              "CORRESPONDS_TO",
              "CONTESTED_IDENTIFICATION"
            ]
          },
          "source_tradition": { "type": "string" },
          "source_text": { "type": "string" },
          "notes": { "type": "string" }
        }
      }
    },

    "source_attestations": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Full list of primary texts in which this entity appears with significant treatment."
    },

    "research_notes": {
      "type": "string",
      "description": "Contested claims, scholarly disputes, or editorial flags for this entry."
    },

    "completeness_score": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100,
      "description": "Editorial tracking field. Percentage of tradition tracks populated with verified data."
    }

  }
}
```

### Sample Populated Entry: Azazel

```json
{
  "id": "azazel",
  "canonical_name": "Azazel",
  "aliases": ["Azael", "Azaziel", "Hazazel", "Scapegoat-Demon"],
  "tradition_vectors": {
    "biblical_angel": {
      "name": "Azazel",
      "rank": "Angel",
      "canonical_function": "Levitical scapegoat recipient (Leviticus 16:8–10); wilderness demon or divine being debated by scholars",
      "source_texts": ["Leviticus 16", "Mishnah Yoma"]
    },
    "enochian": {
      "name": "Azazel",
      "classification": "Fallen Watcher",
      "enoch_book": "1 Enoch",
      "sin_or_role": "Taught humanity metalworking, weapons-craft, cosmetics, and sorcery. Bound under the desert of Dudael until final judgment.",
      "chapter_reference": "1 Enoch 8:1–3, 10:4–8"
    },
    "kabbalistic": {
      "sephira": "Geburah",
      "qliphoth_counterpart": "Golachab",
      "angelic_order": "Fallen from Seraphim class per some traditions",
      "source_texts": ["Zohar", "Sefer ha-Bahir"]
    },
    "greek": {
      "name": "Prometheus",
      "class": "Titan",
      "epithets": ["Pyrphoros (Fire-bearer)", "Pronoea (Forethought)"],
      "source_texts": ["Hesiod, Theogony 521–616", "Aeschylus, Prometheus Bound"]
    },
    "planetary": {
      "planet": "Mars",
      "metal": "Iron",
      "color": "Red",
      "agrippa_book_ref": "Three Books of Occult Philosophy, Book II, Ch. 10"
    }
  },
  "functional_domains": ["Forbidden Knowledge Transmission", "Weapons and War Technology", "Scapegoat Sacrifice", "Rebellion Against Divine Order"],
  "hierarchical_level": 3,
  "relationships": [
    {
      "target_id": "prometheus",
      "edge_type": "FUNCTIONAL_PARALLEL",
      "source_tradition": "Comparative Mythology",
      "source_text": "Forsyth, 'The Old Enemy' (1987); Hanegraaff, 'Fallen Angels and the History of Judaism and Christianity' (2010)",
      "notes": "Both figures transmit forbidden technology to humanity and are punished by the supreme deity; parallel is structural, not claimed by any ancient source directly."
    },
    {
      "target_id": "samyaza",
      "edge_type": "COMMANDS",
      "source_tradition": "Enochian",
      "source_text": "1 Enoch 6–8",
      "notes": "Azazel is among the 200 Watchers led by Semjaza/Samyaza; his sin is treated separately as more corrupting than Semjaza's."
    },
    {
      "target_id": "lucifer",
      "edge_type": "CONTESTED_IDENTIFICATION",
      "source_tradition": "Christian Demonology",
      "source_text": "Various Early Modern grimoires; Origen, 'De Principiis'",
      "notes": "Some traditions conflate Azazel with Lucifer or Satan; treated as distinct entities here per primary Enochian text."
    }
  ],
  "source_attestations": ["Leviticus 16", "1 Enoch 6–10", "Apocalypse of Abraham 13–14", "Zohar II:237b"],
  "research_notes": "The Leviticus passage's meaning is heavily contested: 'Azazel' may be a place-name (precipice), a function (scapegoat), or a proper demon name. The identification with the 1 Enoch Watcher is likely but not philologically certain. See Stökl Ben Ezra (2003).",
  "completeness_score": 62
}
```

-----

## Canonical Hierarchy

The project organizes entities across **seven structural levels**, representing the cosmological distance from the ultimate source of being — as that distance is described, with remarkable consistency, across Neoplatonic, Kabbalistic, Gnostic, and Hermetic systems. This hierarchy is a **research scaffold**, not a theological claim.

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  LEVEL 1 — THE ABSOLUTE / PRIMORDIAL SOURCE                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Neoplatonism:  The One (Plotinus, Enneads)                                 ║
║  Kabbalah:      Ein Sof ("Without Limit") / Ain                             ║
║  Gnosticism:    Monad / Bythos / The Invisible Spirit (Apocryphon of John)  ║
║  Hermeticism:   The All (Corpus Hermeticum I: Poimandres)                   ║
║  Egyptian:      Nun (Primordial Waters) / Atum as self-created              ║
╚══════════════════════════════════════════════════════════════════════════════╝
                                    │
╔══════════════════════════════════════════════════════════════════════════════╗
║  LEVEL 2 — FIRST EMANATIONS / SUPREME CREATIVE PRINCIPLES                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Neoplatonism:  Nous (Divine Intellect), World-Soul                         ║
║  Kabbalah:      Kether → Chokmah → Binah (Supernal Triad)                  ║
║  Gnosticism:    Barbelo (First Emanation), Foreknowledge, Aeons             ║
║  Greek:         Chaos / Gaia / Eros / Uranus (Hesiod's Theogony)            ║
║  Egyptian:      Atum / Ptah (creative logos figures)                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
                                    │
╔══════════════════════════════════════════════════════════════════════════════╗
║  LEVEL 3 — SOVEREIGN RULERS / COSMIC ARCHONS                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Greek/Roman:   Zeus / Jupiter; Poseidon / Neptune; Hades / Pluto           ║
║  Egyptian:      Ra-Atum, Osiris, Amun-Ra                                    ║
║  Angelology:    Seraphim class; Archangel Michael (general of the host)     ║
║  Gnosticism:    Yaldabaoth / Saklas / Samael (Demiurge / Blind God)         ║
║  Kabbalah:      Metatron (Kether-adjacent), Tzaphkiel (Binah)               ║
║  Islamic:       Allah's throne-bearers (Hamalat al-'Arsh); Israfil          ║
╚══════════════════════════════════════════════════════════════════════════════╝
                                    │
╔══════════════════════════════════════════════════════════════════════════════╗
║  LEVEL 4 — MEDIATORS, MESSENGERS & LIMINAL FIGURES                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Greek/Roman:   Hermes / Mercury; Iris; Hekate; Janus                       ║
║  Egyptian:      Thoth, Anubis (psychopomp)                                  ║
║  Hermetic:      Hermes Trismegistus; Nous as divine messenger principle     ║
║  Angelology:    Gabriel, Raphael, Uriel (messenger archangels)              ║
║  Islamic:       Jibreel (Gabriel); Idris (Enoch/Hermes parallel)           ║
║  Enochian:      Semjaza / Samyaza (leader of the Watchers before descent)   ║
║  Kabbalah:      Raziel (Chokmah); Haniel (Netzach); Raphael (Hod)          ║
╚══════════════════════════════════════════════════════════════════════════════╝
                                    │
╔══════════════════════════════════════════════════════════════════════════════╗
║  LEVEL 5 — POWERS OF NATURE / FUNCTIONAL DOMAIN DEITIES                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Greek/Roman:   Ares/Mars, Aphrodite/Venus, Artemis/Diana, Apollo/Apollo    ║
║  Egyptian:      Horus (solar sovereignty), Sekhmet (war), Isis (magic)     ║
║  Planetary:     Seven Classical Planets with domain rulerships (Agrippa)   ║
║  Fallen Angels: Azazel (metals/war); Baraqel (astrology); Sariel (lunar)   ║
║  Kabbalah:      Sephiroth 4–9 (Chesed through Yesod) and their angelic orders║
╚══════════════════════════════════════════════════════════════════════════════╝
                                    │
╔══════════════════════════════════════════════════════════════════════════════╗
║  LEVEL 6 — GRIMOIRIC HIERARCHY / NAMED SPIRITS OF THE TRADITION            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Ars Goetia:    72 named spirits with ranks, seals, and specific functions  ║
║   Kings (9):    Bael, Purson, Beleth, Belial, Asmodai, Vine, Balam,        ║
║                 Zagan, Paimon                                               ║
║   Dukes (24):   Agares, Valefore, Marbas, Valefor, Amon, Barbatos...       ║
║   Princes (3):  Sitri, Ipos, Seere                                          ║
║   Marquises (9):Samigina, Amon, Leraje, Naberius, Ronove, Foraii...        ║
║   Presidents (8):Marbas, Botis, Glasya-Labolas, Foras, Gaap...             ║
║   Counts (6):   Furfur, Marchosias, Stolas, Phenex, Halphas, Raum          ║
║  Grand Grimoire: Lucifuge Rofocale, Satanachia, Agaliarept, Fleurety       ║
║  Grimorium Verum: Scirlin, Clauneck, Musisin                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
                                    │
╔══════════════════════════════════════════════════════════════════════════════╗
║  LEVEL 7 — REGIONAL, CHTHONIC & FOLKLORIC MANIFESTATIONS                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Greek:         Nymphs (Naiads, Dryads, Oreads), Satyrs, Harpies, Fates    ║
║  Roman:         Lares, Penates, Lemures, Larvae (household and ancestral)   ║
║  Jinn Taxonomy: Jinn, Marid, Ifrit, Ghul, Si'la (Islamic folk tradition)   ║
║  Nephilim:      Giants of Canaan (Og of Bashan, Goliath lineage, Anakim)   ║
║  Folkloric:     Regional daemones, incubi/succubi, elemental spirits        ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

-----

## Syncretic Concordance Matrix (Sample)

Below is a working excerpt of the cross-tradition concordance. **Bold** entries indicate primary attestation; *italic* entries indicate structural or polemical parallels.

|Canonical Node                |Greek                                 |Roman                     |Egyptian                |Biblical/Angelic             |Enochian                                 |Kabbalistic                  |Goetic                         |Islamic                      |Planetary                 |
|:-----------------------------|:-------------------------------------|:-------------------------|:-----------------------|:----------------------------|:----------------------------------------|:----------------------------|:------------------------------|:----------------------------|:-------------------------|
|**The Messenger / Scribe**    |**Hermes**                            |**Mercury**               |**Thoth**               |*Metatron (scribe of heaven)*|*Enoch (translated scribe)*              |Hod / Raphael                |—                              |**Idris (prophet)**          |**Mercury**               |
|**The Light-Bringer**         |Prometheus; *Phosphorus*              |**Lucifer (Morning Star)**|*Sopdet (Sirius rising)*|*Helel ben Shahar* (Isa. 14) |**Azazel** (forbidden light/knowledge)   |Qliphoth of Tiphareth        |*King Lucifer* (some grimoires)|*Iblis* (pride/refusal)      |**Venus / Sun**           |
|**The Sovereign Sky**         |**Zeus**                              |**Jupiter**               |**Amun-Ra / Horus**     |—                            |—                                        |**Chesed / Tzadkiel**        |**King Bael**                  |—                            |**Jupiter / Sun**         |
|**The Underworld Ruler**      |**Hades**                             |**Pluto / Dis Pater**     |**Osiris**              |—                            |—                                        |**Binah / Tzaphkiel**        |*King Beleth*                  |—                            |**Saturn**                |
|**The Psychopomp**            |**Hermes Chthonios**                  |*Mercury*                 |**Anubis**              |**Azrael** (Islamic-Jewish)  |—                                        |Yesod-passage figures        |—                              |**Azra’il**                  |**Mercury / Moon**        |
|**The War-Bringer**           |**Ares**                              |**Mars**                  |**Sekhmet / Montu**     |*Michael (warrior archon)*   |**Azazel** (weapons teacher)             |**Geburah / Samael**         |**Duke Flauros**               |—                            |**Mars**                  |
|**The Love / Venus Principle**|**Aphrodite**                         |**Venus**                 |**Hathor / Isis**       |—                            |—                                        |**Netzach / Haniel**         |**Duke Sitri**                 |—                            |**Venus**                 |
|**The Craftsman / Architect** |**Hephaestus**                        |**Vulcan**                |**Ptah**                |*Bezalel (divine craftsman)* |*Azazel (metals), Tubal-cain lineage*    |—                            |—                              |*Dawud / Suleiman (builders)*|**Saturn (structures)**   |
|**The Cosmic Weaver / Fate**  |**Moirai** (Clotho, Lachesis, Atropos)|**Parcae**                |**Meskhenet / Shai**    |—                            |—                                        |**Binah (limitation/form)**  |*Marquis Ronove*               |—                            |—                         |
|**The Dark Feminine**         |**Hekate; Nyx**                       |**Trivia; Nox**           |**Nephthys; Mut**       |*Lilith (extra-biblical)*    |*Naamah (Watcher bride tradition)*       |**Malkuth Qliphoth / Lilith**|—                              |*Si’la (shapeshifting jinn)* |**Moon (dark phase)**     |
|**The Primordial Serpent**    |**Python; Typhon**                    |**Typhon**                |**Apep / Apophis**      |**Nachash (Eden serpent)**   |*Gadreel (introduced sin per 1 Enoch 69)*|**Da’ath (abyss)**           |*King Bael* (toad/serpent form)|**Iblis**                    |**Saturn / Dragon’s Head**|
|**The Divine Wisdom / Sophia**|**Athena / Metis**                    |**Minerva**               |**Ma’at; Seshat**       |**Sophia (Proverbs 8)**      |—                                        |**Chokmah / Raziel**         |—                              |**Hikmah (divine wisdom)**   |**Jupiter / Mercury**     |

-----

## Relationship Edge Types

Every connection between two nodes in the graph is typed. This prevents the database from conflating distinct kinds of correspondence.

|Edge Type                 |Definition                                                     |Example                                                  |
|:-------------------------|:--------------------------------------------------------------|:--------------------------------------------------------|
|`SYNCRETIZED_WITH`        |Ancient sources explicitly identified these figures as the same|Hermes ↔ Thoth (Herodotus, *Histories* II.67)            |
|`DESCENDED_FROM`          |Genealogical parentage within a tradition                      |Hermes ← Zeus (Hesiod, *Theogony* 938)                   |
|`EMANATED_FROM`           |Neoplatonic/Kabbalistic ontological procession                 |Nous → World-Soul (Plotinus, *Enneads* V.1)              |
|`POLEMIC_EQUIVALENT`      |One tradition’s hostile identification of another’s deity      |Zeus = Beelzebub (Origen, *Contra Celsum* VII)           |
|`MANIFESTED_AS`           |An archetype taking a specific grimoiric or regional form      |Sovereign-Sky archetype → Goetic King Bael               |
|`FUNCTIONAL_PARALLEL`     |Scholarly structural identification, not ancient claim         |Azazel ≈ Prometheus (modern comparative mythology)       |
|`FALLEN_FORM_OF`          |A deity reframed as a fallen angel by a later tradition        |Pagan god → Fallen Watcher (Patristic tradition)         |
|`TAUGHT_BY`               |Transmission of knowledge or initiation                        |Hermes ← Thoth (Hermetic tradition)                      |
|`COMMANDS`                |Grimoiric hierarchy of subordination                           |Lucifuge Rofocale → Bael, Agares, Marbas                 |
|`CORRESPONDS_TO`          |Astrological, alchemical, or Agrippan correspondence           |Mercury planet ↔ Hermes (Agrippa, *Occult Philosophy* II)|
|`CONTESTED_IDENTIFICATION`|A connection made in some sources but disputed in others       |Azazel ≈ Satan (debated; not primary Enochian)           |

-----

## Concordance Design Notes

### On the Goetic 72

The 72 Goetic spirits present a specific data challenge: they are clearly a **composite tradition**. Their ranks (King, Duke, Marquis, etc.) are modeled on Renaissance European aristocratic hierarchies. Their functions combine Neoplatonic planetary correspondences, folk magic traditions, corrupted angelic names, and Christian demonological polemic. Many names appear to derive from:

- Hebrew divine names or angelic titles with prefix/suffix modification (Belial ← *beli ya’al*, “worthlessness”; Alloces ← possible *Allochus*)
- Degraded Canaanite or Near Eastern deities (Baal/Bael, Astarte-adjacent figures, Moloch traditions)
- Procedurally invented names for filling the 72 slots (which may correspond to the 72 names of God in Kabbalistic tradition — the *Shem HaMephorash*)

Each Goetic entry will be tagged with its probable derivation class and linked upward to its suspected pre-grimoiric archetype where evidence supports it.

### On Islamic Correspondences

Islamic material is handled with particular care. The *Isra’iliyyat* tradition — Hadith-era transmission of Judeo-Christian material into Islamic scholarship — creates real but contested bridges between Quranic figures and Enochian or Kabbalistic ones. Idris-as-Enoch is relatively well attested in classical Islamic scholarship. Harut and Marut (Quran 2:102) as Watchers is a stronger correspondence. All such links are marked with their attestation type and scholarly controversy status.

### On the Nephilim Traditions

The Nephilim data track covers:

- **Genesis 6:1–4** (Bene ha-Elohim / Sons of God, daughters of men)
- **1 Enoch 6–11** (200 Watchers, 70 Nephilim giants named in *Book of Giants*)
- **Numbers 13:33** (Anakim as Nephilim descendants in Canaan)
- **Deuteronomy 2–3** (Rephaim: Og of Bashan; Emim, Zamzummim)
- **Post-biblical traditions**: Jubilees, Dead Sea Scrolls 4Q201–4Q202
- **Renaissance synthesis**: Agrippa’s reading of Giants as corrupted Titans

-----

## Development Roadmap

### Phase 0 — Foundation (Current State)

- [x] Project philosophy and data model defined
- [x] JSON schema drafted (v0.3)
- [x] Hierarchy scaffolded across seven levels
- [x] Tradition vectors identified for all 11 tracks
- [x] Edge type taxonomy defined
- [x] Sample entries drafted (Hermes/Trismegistus, Azazel)
- [ ] Schema peer review and v1.0 freeze
- [ ] Complete the 72 Goetic entries (rank, legions, functions, source citations)

### Phase 1 — Core Data Population (Q3–Q4 target)

- [ ] **Greek Pantheon**: Full Olympian 12 + major Titans + Primordials (target: 60 entries)
- [ ] **Roman equivalences**: Map all *Interpretatio romana* correspondences; add distinctly Roman figures (Janus, Quirinus, Terminus)
- [ ] **Egyptian Ennead + Ogdoad**: Full Heliopolitan and Hermopolitan theology (target: 35 entries)
- [ ] **Enochian Watchers**: All 20 named Watchers from 1 Enoch 6–8 + their taught arts
- [ ] **Biblical Angelology**: Full Pseudo-Dionysian nine-order hierarchy with named archangels
- [ ] **Ars Goetia complete**: All 72 spirits with seals referenced, ranks, and upward links
- [ ] **Kabbalistic mapping**: All 10 Sephirot with angelic orders, divine names, and Qliphothic counterparts

### Phase 2 — Graph Infrastructure (Static-File Approach for GitHub Pages)

- [ ] Compile all JSON entity files into a single `concordance.json` dataset
- [ ] Build a lightweight static site: pure HTML + CSS + vanilla JS (zero build tools)
- [ ] Implement **client-side search**: filter by name, tradition, domain, planetary correspondence
- [ ] Implement **Cytoscape.js** graph visualization — nodes colored by tradition vector
- [ ] Add **hierarchy-level filter**: isolate view by structural level (1–7)
- [ ] Node detail panel: clicking a node expands its full profile with all tradition vectors
- [ ] Edge filter: show only `SYNCRETIZED_WITH` connections, or only `POLEMIC_EQUIVALENT` connections
- [ ] Mobile-responsive layout (critical for GitHub Pages use on phone)

### Phase 3 — Scholarly Apparatus

- [ ] Citation layer: every relationship edge links to specific chapter/verse/page in source text
- [ ] Tradition-lens toggle: “View the cosmos through Kabbalistic lens” reorganizes visual hierarchy by Sephirot; “Neoplatonic lens” reorganizes by emanation levels
- [ ] Disputed-entry flagging system with alternative interpretations displayed
- [ ] Export: generate printable concordance tables (PDF-friendly CSS) per tradition track
- [ ] Changelog and source versioning — track when entries are added, revised, or disputed

### Phase 4 — Extended Traditions (Stretch Goals)

- [ ] **Hindu correspondences**: Vedic devas and their Western functional parallels (Indra/Zeus, Yama/Hades)
- [ ] **Mesopotamian layer**: Sumerian/Babylonian deities and their direct Canaanite-Biblical links (Anu, Enlil, Marduk)
- [ ] **Norse correspondences**: Odin/Mercury, Thor/Jupiter, Loki — as mapped by Snorri and Renaissance mythographers
- [ ] **Zoroastrian**: Ahura Mazda/Angra Mainyu as structural parallel to Gnostic Monad/Demiurge split
- [ ] **Theosophical synthesis layer**: H.P. Blavatsky and G.R.S. Mead mappings as a distinct late-tradition vector

-----

## Deployment Strategy

This project is designed for **zero-infrastructure GitHub Pages deployment**, accessible on both mobile browser and desktop without any backend, build pipeline, or paid hosting.

### Repository Structure

```
pantheon-concordance/
├── index.html              ← Single-page application entry point
├── style.css               ← All styling
├── app.js                  ← Search, filter, graph rendering
├── data/
│   ├── concordance.json    ← Master compiled dataset (all entities)
│   └── entities/           ← Individual entity JSON files (source of truth)
│       ├── hermes.json
│       ├── azazel.json
│       ├── thoth.json
│       └── ...
├── lib/
│   ├── cytoscape.min.js    ← Graph visualization (local copy, no CDN dependency)
│   └── fuse.min.js         ← Fuzzy search library
├── schema/
│   └── entity.schema.json  ← JSON schema for validation
├── docs/
│   └── bibliography.md     ← Full source bibliography
└── README.md
```

### GitHub Pages Setup

1. Push repository to GitHub (public or private with Pages enabled)
1. Settings → Pages → Source: **Deploy from branch** → `main` → `/root`
1. Site live at `https://[username].github.io/pantheon-concordance/`
1. No build step needed — pure static files load directly
1. Update data by editing individual entity JSON files and committing

### Design Constraints (Kept Intentionally Simple)

- **No React, no Node.js, no bundler** — all vanilla JS, loads instantly on mobile
- **No database server** — the entire concordance is a single JSON file loaded client-side
- **No authentication** — this is a reference tool, fully public
- At 500 entries, `concordance.json` will be approximately 800KB–1.2MB: well within browser tolerance
- Cytoscape.js handles graphs up to several thousand nodes client-side without performance issues

-----

## Source Bibliography by Tradition

### 1. Greek & Roman Polytheism

- Hesiod. *Theogony* and *Works and Days*. Trans. M.L. West. Oxford, 1988.
- Homer. *Iliad* and *Odyssey*. Trans. Richmond Lattimore. Chicago, 1951/1965.
- Homeric Hymns. Trans. Apostolos Athanassakis. Johns Hopkins, 2004.
- Ovid. *Metamorphoses*. Trans. A.D. Melville. Oxford, 1986.
- Virgil. *Aeneid*. Trans. Robert Fagles. Penguin, 2006.
- Pausanias. *Description of Greece*. Trans. W.H.S. Jones. Loeb, 1918.
- Walter Burkert. *Greek Religion*. Harvard, 1985.
- Timothy Gantz. *Early Greek Myth: A Guide to Literary and Artistic Sources*. Johns Hopkins, 1993.

### 2. Egyptian Theology

- R.T. Rundle Clark. *Myth and Symbol in Ancient Egypt*. Thames & Hudson, 1959.
- Erik Hornung. *Conceptions of God in Ancient Egypt: The One and the Many*. Cornell, 1982.
- Jan Assmann. *The Search for God in Ancient Egypt*. Cornell, 2001.
- E.A. Wallis Budge. *The Gods of the Egyptians* (2 vols.). Dover, 1969. *(Primary-source compendium; methodology dated.)*
- *The Egyptian Book of the Dead* (Papyrus of Ani). Trans. E.A.W. Budge; also trans. R.O. Faulkner. British Museum, 1972.
- Siegfried Morenz. *Egyptian Religion*. Cornell, 1973.

### 3. Biblical Angelology & Demonology

- Pseudo-Dionysius the Areopagite. *The Celestial Hierarchy*. Trans. Luibheid & Rorem. Paulist Press, 1987.
- Thomas Aquinas. *Summa Theologiae*, Prima Pars, Questions 50–64 (On Angels).
- Gustav Davidson. *A Dictionary of Angels, Including the Fallen Angels*. Free Press, 1967. *(Reference compendium.)*
- Darrell Hannah. *Michael and Christ: Michael Traditions and Angel Christology in Early Christianity*. Mohr Siebeck, 1999.

### 4. Enochian Literature & Watchers

- *1 Enoch (The Ethiopic Book of Enoch)*. Trans. E. Isaac. In *Old Testament Pseudepigrapha*, vol. 1. Ed. Charlesworth. Doubleday, 1983.
- *2 Enoch (The Slavonic Enoch)*. Trans. F.I. Andersen. In *Old Testament Pseudepigrapha*, vol. 1.
- Loren Stuckenbruck. *The Book of Giants from Qumran*. Mohr Siebeck, 1997.
- Philip Alexander. *The Mystical Texts: Songs of the Sabbath Sacrifice and Related Manuscripts*. T&T Clark, 2006.
- David Suter. “Fallen Angel, Fallen Priest.” *HUCA* 50 (1979): 115–135.
- Daniel Stökl Ben Ezra. *The Impact of Yom Kippur on Early Christianity*. Mohr Siebeck, 2003. *(Key on Azazel.)*

### 5. Kabbalistic Sources

- *Sefer Yetzirah* (Book of Formation). Trans. Aryeh Kaplan. Weiser, 1993.
- *The Zohar*. Trans. Daniel Matt. Stanford, 2004–2017 (12 vols.). *(Pritzker Edition — critical scholarly translation.)*
- Gershom Scholem. *Major Trends in Jewish Mysticism*. Schocken, 1941.
- Gershom Scholem. *Kabbalah*. Keter, 1974. *(Reference encyclopedia.)*
- Moshe Idel. *Kabbalah: New Perspectives*. Yale, 1988.
- Dion Fortune. *The Mystical Qabalah*. Aquarian Press, 1935. *(Western esoteric reception tradition — treat as primary source for that lineage, not academic scholarship.)*

### 6. Hermetic & Neoplatonic Sources

- *Corpus Hermeticum*. Trans. Brian Copenhaver. Cambridge, 1992.
- Plotinus. *The Enneads*. Trans. Stephen MacKenna. Larson Publications, 1992.
- Iamblichus. *De Mysteriis* (On the Mysteries). Trans. Emma Clarke et al. Society of Biblical Literature, 2003.
- Frances Yates. *Giordano Bruno and the Hermetic Tradition*. Chicago, 1964. *(Foundational study.)*
- Wouter Hanegraaff. *Esotericism and the Academy: Rejected Knowledge in Western Culture*. Cambridge, 2012.

### 7. Gnostic Sources

- *The Nag Hammadi Scriptures*. Ed. Marvin Meyer. HarperOne, 2007. *(Comprehensive modern translation.)*
- *The Apocryphon of John*. In Meyer (above) and also trans. Frederik Wisse in NHL (Robinson ed.).
- Bentley Layton. *The Gnostic Scriptures*. Doubleday, 1987.
- Kurt Rudolph. *Gnosis: The Nature and History of Gnosticism*. Harper & Row, 1983.
- Ioan Couliano. *The Tree of Gnosis*. Harper, 1992.

### 8. Grimoiric & Renaissance Occultism

- *Lemegeton Clavicula Salomonis* (*The Lesser Key of Solomon*, including *Ars Goetia*). Ed. Joseph Peterson. Ibis Press, 2001. *(Critical scholarly edition.)*
- Heinrich Cornelius Agrippa. *Three Books of Occult Philosophy* (1531). Trans. James Freake; ed. Donald Tyson. Llewellyn, 1993.
- *The Grand Grimoire* (Le Dragon Rouge). Ed. & trans. Joseph Peterson. Esoteric Archives, 2007.
- *Grimorium Verum*. Trans. Joseph Peterson. CreateSpace, 2007.
- *The Picatrix* (Ghāyat al-Ḥakīm). Trans. John Michael Greer & Christopher Warnock. Adocentyn Press, 2010.
- Richard Kieckhefer. *Magic in the Middle Ages*. Cambridge, 1990.
- Owen Davies. *Grimoires: A History of Magic Books*. Oxford, 2009.

### 9. Islamic Angelology & Jinn Traditions

- *Quran*. Multiple translations; primary citations use Sahih International or A.J. Arberry.
- Al-Suyuti. *Al-Haba’ik fi Akhbar al-Mala’ik* (On the Conditions of the Angels). *(Classical Islamic angelology compendium, Arabic primary source.)*
- Amira El-Zein. *Islam, Arabs, and the Intelligent World of the Jinn*. Syracuse, 2009.
- Roberto Tottoli. *Biblical Prophets in the Qur’an and Muslim Literature*. Routledge, 2002. *(On Isra’iliyyat and Idris-Enoch identification.)*
- David Cook. *Studies in Muslim Apocalyptic*. Darwin Press, 2002.

### 10. Planetary & Astrological Correspondences

- Agrippa, *Three Books* (Book II) — see above.
- *Picatrix* — see above.
- Al-Biruni. *The Book of Instruction in the Elements of the Art of Astrology* (1029). Trans. R.R. Wright. Luzac, 1934.
- Claudius Ptolemy. *Tetrabiblos*. Trans. F.E. Robbins. Loeb, 1940.
- *Liber Hermetis*. Trans. Robert Hand. ARHAT, 1990. *(Hellenistic astrological text on decans and fixed stars.)*
- Christopher Warnock. *The Mansions of the Moon*. Renaissance Astrology, 2010.

-----

## Methodology Disclaimer

This repository is a tool for **comparative literature, history of ideas, and esoteric studies**. It maps ideological lineages, symbolic syncretism, and historical claims found across occult, mythological, and theological writings.

Three principles govern every entry:

**1. Source transparency.** Every correspondence is tagged with the tradition and text that makes the claim. The database distinguishes between: (a) ancient sources explicitly equating two figures, (b) structural parallels identified by modern scholars, and (c) polemical equivalences made by one tradition about another’s figures.

**2. Contested claims are preserved, not resolved.** Where scholars disagree — and they frequently do, especially on Enochian identification, Goetic derivations, and Islamic Isra’iliyyat — both positions are stored and flagged. The database does not adjudicate.

**3. This is history of ideas, not theology.** Mapping Augustine’s claim that Zeus is a demon does not endorse Augustine’s theology. Mapping the Zohar’s Qliphoth does not endorse Kabbalistic cosmology. The concordance treats all traditions as equally worthy of scholarly attention and none as uniquely authoritative.

-----

*Schema version: 0.3 (draft) | Last updated: June 2026 | Status: Active development — Phase 0*