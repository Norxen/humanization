---
status: planned
lastReviewed: 2026-06-09
summary: Direction for moderate enemy durability, vulnerability-driven fast resolutions, readable telegraphs, interruption, and recovery.
related:
  - ../Combat.md
  - Combat Model.md
  - Player Actions.md
  - ../../Content/Enemies.md
---
# Damage Rules

## Direction

Enemies should have moderate default durability. Careless direct damage remains viable against ordinary threats but consumes more time, ammunition, health, or position.

Correct play should create fast resolution windows through:

- Weak-point exposure.
- Armor break or penetration.
- Status and environmental interactions.
- Stagger, disable, or control effects.
- Positioning and directional advantage.
- Engineering tools or linked devices.

The goal is not to make every enemy fragile. The goal is to ensure understanding and execution matter more than repeatedly attacking a large health pool.

## Readability Requirements

- Dangerous attacks require clear visual and audio telegraphs.
- Damage, armor response, resistance, immunity, and weak-point hits need distinct feedback.
- Vulnerability windows must communicate when they open, what caused them, and when they close.
- Interruptions and stagger must be predictable enough to plan around.
- Off-screen or obscured threats require warnings appropriate to the isometric camera.
- Damage cannot rely on color alone.

## Player Damage

Player damage should create immediate combat pressure and longer expedition consequences without making every mistake terminal.

The final model still needs to define:

- Health and armor relationship.
- Healing commitment and interruption.
- Injury, downed, or incapacitated states.
- Between-encounter recovery.
- Expedition and hub recovery boundaries.

## Enemy Damage Model

Enemy templates must eventually define:

- Base durability.
- Armor or protection layers.
- Weak points and exposure conditions.
- Resistances and vulnerabilities.
- Stagger and interruption thresholds.
- Status interactions.
- Environmental and engineering responses.

Enemy roles should change these rules meaningfully rather than only changing health and damage values.

## Unresolved Tuning

The following remain deliberately undefined:

- Damage formulas.
- Exact time-to-kill targets.
- Invulnerability duration.
- Evade recovery time.
- Critical-hit behavior.
- Status duration and stacking.
- Healing quantity and speed.
- Difficulty scaling.

These values require representative weapons, enemies, encounters, and expedition pressure before they can be tuned coherently.

## Validation Criteria

Damage rules are ready for review when representative enemy roles can demonstrate:

- A readable ordinary resolution.
- A faster vulnerability-based resolution.
- A meaningful cost for ignoring the intended interaction.
- Consistent telegraphs and feedback.
- Recovery consequences that connect combat to the wider expedition.
