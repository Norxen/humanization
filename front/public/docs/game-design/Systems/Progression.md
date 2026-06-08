---
status: draft
lastReviewed: 2026-06-09
summary: Permanent advancement through resources, knowledge, eras, equipment, and settlement capability.
related:
  - Core Loop.md
  - Hub/Building Purpose and Era Levels.md
  - Progression/Era Progression.md
---
# Progression

## Purpose

Progression connects the dungeon and hub. The player should always know what they are trying to unlock and why it matters.

## Progression Layers

| Layer | Examples |
| --- | --- |
| Equipment | Better tools, weapons, armor, gadgets. |
| Skills | Engineering abilities, combat techniques, survival perks. |
| Hub Upgrades | Buildings, facilities, extraction systems. |
| Knowledge | Recipes, blueprints, era unlocks. |
| Relationships | NPC trust, quests, companion abilities. |
| Dungeon Access | Shortcuts, deeper floors, new zones. |

## Resource System

Resources support both crafting and civilization progress.

| Type | Examples | Used For |
| --- | --- | --- |
| Basic Materials | Stone, wood, fiber, bone, clay | Early tools, shelter, basic crafting. |
| Organic Materials | Herbs, seeds, fungus, resin, leather | Medicine, farming, food, utility items. |
| Metal Materials | Copper, iron, tin, coal, scrap | Weapons, tools, machines, buildings. |
| Energy Materials | Batteries, crystals, fuel cells, conductive minerals | Power systems, gadgets, electricity. |
| Knowledge Materials | Blueprints, memory cores, research notes | Technologies and buildings. |
| Human Resources | Survivors, specialists, workers | Hub growth, jobs, research speed. |

## Resource Rule

Old resources should not become useless.

Example: stone is used early for tools, then later for reinforced structures, furnace upgrades, insulation, defensive walls, and chemical processing.

## Knowledge System

Knowledge is separate from physical materials.

Materials answer:

> Can we build it?

Knowledge answers:

> Do we know how to build it?

Important unlocks should often require both.

Example: Basic Generator

```text
Requirements:
- Copper x40
- Iron x25
- Magnetic Core x2
- Mechanical Parts x10
- Electricity Blueprint I
- Engineer or technician assigned
- Powered workshop built
```

## Era Progression

Era progression should require:

```text
Resources + Knowledge + Milestone Objective
```

The player should not advance eras only by reaching a floor number. The hub must also be ready.

The first-campaign sequence is:

```text
Survival
-> Settlement
-> Metalworking
-> Mechanization
-> Electricity
-> Connectivity
```

Exact transition requirements remain unresolved until campaign, hub, dungeon, and content dependencies are defined together.

## Capability-Gated Salvage

Advanced technology can be discovered before the settlement reaches the era needed to support it.

Recovery and ownership do not automatically grant full use. The current civilization capability determines whether an item can be:

- Understood.
- Safely powered.
- Repaired.
- Supplied with ammunition, fuel, or replacement parts.
- Reproduced.
- Modified and upgraded.

An advanced relic may function briefly in an unreliable state, remain locked for research, or provide knowledge and components before it becomes a sustainable combat option. This preserves discovery without allowing random loot to bypass civilization progression.

## Engineer Progression

The protagonist should feel like an engineer, not a generic fighter.

Engineer combat style:

- Preparation.
- Gadgets.
- Traps.
- Positioning.
- Improvised weapons.
- Environmental control.

The universal combat actions and loadout live in [Player Actions](Combat/Player%20Actions.md). Era progression transforms what those actions can affect rather than replacing them with disconnected ability sets.

The fantasy:

> You are not the strongest thing in the dungeon. You are the smartest thing in the dungeon.

## Inventory Pressure

Inventory should create decisions without becoming annoying.

| Category | Example |
| --- | --- |
| Backpack | General resources. |
| Toolbelt | Active tools and gadgets. |
| Protected Case | Blueprints and data cores. |
| Rescue Slot | Survivors, capsules, escort objectives. |
| Quick Slots | Healing, bombs, traps, consumables. |

Important item types should not all compete for the same space. A rescued survivor should not compete directly with basic rocks.

## Progression Loop Summary

```text
Need identified
-> Run objective chosen
-> Resource or knowledge recovered
-> Hub upgrade built
-> New capability unlocked
-> Deeper need appears
```
