---
status: draft
lastReviewed: 2026-06-09
summary: Real-time isometric combat model built around independent free aim, deliberate enemy groups, readable vulnerabilities, and engineering control.
related:
  - ../Combat.md
  - Player Actions.md
  - Damage Rules.md
  - ../Progression/Era Progression.md
---
# Combat Model

## Perspective and Timing

Combat is real-time from a top-down or isometric perspective. The camera must show enough surrounding space to read enemy telegraphs, environmental hazards, deployable coverage, escape routes, and interactions between several threats.

Combat does not use a tactical pause as a default mechanic. Planning happens through observation, scanning, positioning, loadout selection, and readable enemy behavior while time continues.

## Movement and Aim

Movement and aiming are independent:

- Keyboard or left stick controls movement.
- Mouse or right stick controls facing and free aim.
- Weapons and aimed tools act toward the current aim direction.
- Player movement does not automatically rotate aim toward the travel direction.

Independent free aim is the canonical model. Controller assistance and accessibility options may support it later without replacing manual targeting.

## Encounter Shape

Encounters should usually contain a small number of dangerous enemies with complementary roles. Difficulty comes from understanding behavior, maintaining space, prioritizing targets, and choosing when to spend limited resources.

The model avoids relying on large hordes as the default challenge. Higher pressure should come from:

- Role combinations.
- Terrain and hazards.
- Objectives or vulnerable allies.
- Limited safe positions.
- Enemy reinforcement or escalation rules.
- The cost of continuing the expedition after the fight.

Enemy count and encounter duration remain tuning decisions owned by encounter design.

## Combat State Flow

```text
Unengaged
-> Observe, avoid, or scan
-> Enemies detect the player or the player commits
-> Reposition, fire, evade, interact, or deploy
-> Vulnerability or control window appears
-> Player exploits or misses the opportunity
-> Threat resolves, escalates, retreats, or changes state
-> Player reassesses and continues or disengages
```

Players should be able to avoid some encounters, disengage where the environment permits, or solve a threat without killing every enemy.

## Scanner and Information

The engineering tool provides an active scanner pulse:

- It is non-consumable and limited by recovery time.
- It reveals readable vulnerabilities, important machinery, device links, hazards, and relevant interactable systems.
- It does not automatically solve the encounter or stop time.
- Information persists long enough to act on without requiring constant rescanning.
- Skilled observation can recognize familiar behavior without using the scanner every time.

## Spatial Engineering

Engineering actions must affect the combat space. Depending on equipment and era, the player can create cover, restrict movement, redirect a machine, overload a system, deploy a device, open or close a route, or coordinate linked technology.

Placement uses a quick aimed interaction:

1. Hold the relevant input to preview location, direction, and valid placement.
2. Adjust aim or position.
3. Release to commit.
4. Complete a short deployment action during which the player remains exposed.

Invalid placement must be clear before commitment. Instant deployment is reserved for equipment specifically designed for immediate reactions.

## Skill Expression

Combat skill comes from combining:

- Independent movement and aim.
- Accurate weapon handling.
- Directional evade timing.
- Threat and target prioritization.
- Scanner interpretation.
- Environmental awareness.
- Tool and gadget timing.
- Resource judgment across the expedition.

No single layer should remove the need for the others. Weapons cannot make engineering irrelevant, and engineering cannot automate every dangerous encounter.

## Failure and Recovery Boundaries

Combat defines immediate consequences such as damage, interruption, resource loss, and incapacitation. Expedition failure, extraction loss, and hub recovery remain owned by dungeon and progression systems.

Exact health formulas, invulnerability windows, status durations, and recovery values remain unresolved in [Damage Rules](Damage%20Rules.md).
