---
status: draft
lastReviewed: 2026-06-07
summary: Chronological register of accepted cross-document design and documentation decisions.
related:
  - Open Questions.md
  - Documentation Conventions.md
---

# Decision Log

| ID      | Date       | Decision                                                                                                | Reason                                                                    | Affected Documents                |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------- |
| DEC-001 | 2026-06-07 | Use Roguelike Civilization Rebuilder as an explicit working title.                                      | The final game title is not selected.                                     | Index, Vision, repository README  |
| DEC-002 | 2026-06-07 | Organize documentation by vision, production, systems, content, narrative, presentation, and reference. | The full game needs a stable knowledge architecture before production reduction. | Entire documentation tree         |
| DEC-003 | 2026-06-07 | Pair every folder with a same-named overview page placed immediately before it.                         | Readers need both a conceptual entry point and expandable detail.         | Navigation and manifest generator |
| DEC-004 | 2026-06-07 | Use explicit navigation configuration instead of filename prefixes.                                     | Filenames remain readable while order stays intentional.                  | Documentation pipeline            |
| DEC-005 | 2026-06-09 | Defer MVP scope until the complete game model, dependencies, and complexity are understood. | Premature feature counts were constraining design before system definition. | Production, roadmap, all systems |
| DEC-006 | 2026-06-09 | Use real-time top-down or isometric combat with independent movement and free aim. | Mechanical weapon skill and readable spatial engineering must coexist. | Combat, encounters, UI, enemies |
| DEC-007 | 2026-06-09 | Combine responsive weapons with scanning, tools, gadgets, and environmental control. | Engineering should create decisive advantages without replacing action combat. | Combat, progression, items |
| DEC-008 | 2026-06-09 | Use capability-gated salvage across six first-campaign eras. | Discovery can precede reliable use while civilization rebuilding remains mechanically necessary. | Progression, combat, hub, content |
| DEC-009 | 2026-06-09 | Keep authoritative rules in compact owner documents and create child pages only for distinct substantial topics. | The 55-page tree duplicated rules and treated unresolved questions as independent design branches. | Entire documentation tree |
| DEC-010 | 2026-06-09 | Treat calendar-based request timing as unresolved until expedition and campaign pacing are tested. | Calendar labels were creating commitments before the game time model was defined. | Hub, dungeon, campaign |

## Entry Rule

Record decisions that settle a significant open question, alter multiple systems, or establish a durable documentation convention.
