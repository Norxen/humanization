---
status: draft
lastReviewed: 2026-06-07
summary: Material, knowledge, survivor, milestone, and dependency requirements for settlement upgrades.
related:
  - ../Hub.md
  - Building Purpose and Era Levels.md
  - ../Progression/Resources and Knowledge.md
---
# Upgrade Requirements

## Purpose

Building upgrades should require more than raw resources. The hub is a civilization-rebuilder, so progress should depend on materials, knowledge, people, and milestones working together.

An upgrade requirement is a design promise: "If you bring these things back, this location will change in a specific way." The player should always be able to inspect an upgrade and understand what is missing, where it might come from, and what the payoff will be.

Buildings can receive resources before the final upgrade is ready. Loading resources into a building creates partial progress and makes construction visible in the walkable hub.

## Requirement Types

| Requirement Type | Example |
| --- | --- |
| Materials | Copper, stone, iron, scrap, fuel cells. |
| Knowledge | Blueprint, memory core, research fragment. |
| Survivor | Doctor, farmer, blacksmith, technician, teacher. |
| City Need | Enough population, food stability, health, or morale. |
| Power | Electricity available before powered buildings work. |
| Other Building | Workshop required before generator upgrade. |
| Dungeon Milestone | Boss defeated, floor range reached, zone stabilized. |
| Story Milestone | Curator access granted, Return Protocol fragment decoded. |

This creates stronger progression than a simple shopping list. For example, a generator upgrade might require copper and fuel cells, but also a recovered blueprint, a technician, and a cleared Electricity Era gate.

## Requirement States

Each requirement should have a visible state:

| State | Meaning | Player Response |
| --- | --- | --- |
| Met | The hub already has it. | No action needed. |
| Missing but Known | The player knows what to find. | Can become a dungeon objective or hub task. |
| Unknown | The player knows there is a blocker, but not the exact solution. | Requires scouting, decoding, dialog, or story progress. |
| Blocked | The requirement cannot be pursued yet. | Shows the prerequisite that must happen first. |

This prevents vague upgrade walls. "Requires power" is useful. "Requires power from a repaired generator" is better. "Blocked: repair the generator before powered medical equipment can run" is best.

## Upgrade Flow

```text
Building has blocked next form
-> Player inspects missing requirements
-> Missing requirements become hub tasks or dungeon objectives
-> Player secures requirements
-> Player loads resources into building
-> Building reaches partial upgrade levels
-> Building upgrades to next era level
-> New function, dialog, request, or dependency appears
```

## Partial Upgrade Levels

Each building era has three partial upgrade levels before the full era upgrade completes.

| Loaded Progress | Building Level | Meaning |
| --- | --- | --- |
| 0-25% | Level 1 of current era | Basic form exists or is being repaired. |
| 25-50% | Level 2 of current era | Output improves and visual construction appears. |
| 50-75% | Level 3 of current era | Secondary function or stronger passive benefit unlocks. |
| 75-100% plus conditions | Era Upgrade Ready | Materials are mostly loaded; remaining blockers are knowledge, survivor, milestone, or power requirements. |
| 100% and all conditions met | Next Era Level | Building changes era and unlocks the next upgrade track. |

The percentage is based on loaded upgrade resources, not every condition. A clinic can be 100% stocked with construction materials but still blocked from the next era because no doctor is assigned or power is unavailable.

## Loading Rules

- Loaded resources stay in the building and are protected from normal inventory loss.
- The player can load resources gradually after returning from runs.
- Partial levels should provide small benefits so progress feels useful before the full era upgrade.
- Critical resources should not be unloadable by default; loading is a commitment.
- If designers want reversible loading, it should cost time or lose a percentage of materials.
- Knowledge, survivor, power, dungeon, and story requirements are conditions, not loaded resources.

Example:

```text
Clinic - Stone Era Upgrade Track
0-25% loaded: Bedroll clinic, minor healing
25-50% loaded: Herb table, daily medicine request appears
50-75% loaded: Clean treatment corner, sickness event pressure reduced
75-100% loaded: Ready for Settlement Clinic, blocked by Doctor requirement
100% + Doctor assigned: Clinic becomes Settlement Era
```

## Resolution Rules

When an upgrade completes, the game should do all of the following:

- Consume or reserve the required materials.
- Mark the knowledge, milestone, and survivor requirements as satisfied without consuming them unless the design explicitly says otherwise.
- Change the building's `eraLevel` or add the named upgrade flag.
- Recalculate available functions and requests.
- Trigger one short reaction: visual change, NPC line, new event, or changed hub stat.

Materials are usually spent. Knowledge is usually retained. Survivors are usually assigned or required, not consumed. Milestones are permanent unlocks.

## Worked Example

```text
Upgrade: Damaged Generator -> Hand-Crank Generator
Requires:
- Scrap Metal x10: Missing but Known, found on Industrial floors
- Copper Wire x4: Missing but Known, found in utility rooms
- Technician: Missing but Known, rescue objective available
- Generator Sketch: Unknown, decode first Archive memory core

Payoff:
- Unlocks low-power state for Workbench and Clinic
- Adds "Power Flicker" event risk until stabilized
- Opens next upgrade: Stable Generator
```

This upgrade works because every missing piece can drive a concrete activity. The player can plan a scrap run, pursue the technician, or decode the sketch instead of staring at a generic locked upgrade.
