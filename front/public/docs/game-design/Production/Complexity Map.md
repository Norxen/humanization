---
status: planned
lastReviewed: 2026-06-09
summary: Dependency, cost, risk, and validation map required before reducing the complete game into an MVP.
related:
  - ../Production.md
  - MVP Scope.md
  - ../Systems.md
  - ../Content/Content Requirements.md
---
# Complexity Map

## Purpose

This document will expose what the game costs to build before features are selected for the MVP. It must distinguish design importance from implementation expense and identify which systems require focused validation builds.

## Required Branches

| Branch | Questions to Answer |
| --- | --- |
| System Dependencies | Which systems require each other to produce a coherent player loop? |
| Content Multipliers | Which rules multiply enemy, item, room, animation, writing, or balancing work? |
| Reusable Pipelines | Which templates, generators, tools, and data schemas reduce repeated work? |
| Technical Risks | Which camera, controls, AI, generation, save-state, or platform requirements need proof? |
| Presentation Costs | Which readability, animation, audio, UI, and accessibility requirements affect every feature? |
| Narrative Costs | Which authored reactions, survivor states, and campaign branches create recurring content obligations? |
| Production Constraints | What team size, skills, schedule, platforms, and performance targets constrain the design? |
| Validation Strategy | Which focused builds and playtests answer the highest-risk questions without defining arbitrary content scope? |

## Open Questions

- Target expedition and campaign length.
- Team size, available disciplines, and production schedule.
- Supported platforms, input methods, and performance targets.
- Required content variation and reuse across six eras.
- Minimum representative set needed to validate combat, generation, hub consequence, and progression.
- Which complete-game dependencies are mandatory for a coherent MVP.

## Completion Criteria

The map is complete when every active system names its inputs, outputs, content obligations, technical risks, reusable pipeline opportunities, and cheapest valid test. Only then should [MVP Scope](MVP%20Scope.md) select or exclude features.
