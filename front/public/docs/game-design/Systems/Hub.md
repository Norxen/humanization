---
status: review
lastReviewed: 2026-06-09
summary: Authoritative settlement model for walkable locations, upgrades, survivors, routine interaction, and visible civilization growth.
related:
  - Core Loop.md
  - Progression.md
  - Progression/Era Progression.md
  - Hub/Requests and Consequences.md
  - ../Narrative/Story and Campaign.md
---
# Hub

## Purpose

The hub turns extracted value into visible civilization. It gives each expedition a human reason, provides preparation and recovery, and shows the mechanical and emotional consequences of success and failure.

The hub is walkable. Physical space provides orientation, atmosphere, visible construction, and contextual survivor placement. Focused overlays provide decisions without turning the settlement into a spreadsheet.

## Hub Fantasy

The player should feel that they are rebuilding a place rather than filling an upgrade menu:

- Buildings visibly change across eras.
- Survivors occupy meaningful roles and react to settlement state.
- Shortages, construction, power, and events appear in the environment.
- Extracted resources create understandable new functions.
- The next dungeon objective grows from an actual settlement need.

## Location Model

Every location uses one shared schema:

| Field | Responsibility |
| --- | --- |
| Identity | Stable ID, display name, category, and permanent purpose. |
| Era State | Current era capability, construction progress, and visual form. |
| Status | Most important output, shortage, event, or blocked state. |
| Functions | Actions such as heal, craft, assign, decode, repair, or launch. |
| Upgrade | Next improvement, requirements, partial progress, and payoff. |
| Survivors | Assigned roles and current availability. |
| Requests | Needs that can influence the next expedition. |
| Events | Local pressure, consequences, reactions, and discoveries. |

A location keeps the same purpose across eras. A clinic remains about health while its reliability, scale, dependencies, and available actions evolve.

## Interaction Model

Locations use three layers:

| Layer | Purpose |
| --- | --- |
| Physical Space | Walking, environmental storytelling, construction, NPC placement, and visible problems. |
| Proximity Information | A concise status or interaction prompt. |
| Interaction Overlay | Main function, upgrade, people, requests, and relevant event decisions. |

The standard flow is:

```text
Approach location
-> Read status or prompt
-> Open focused overlay
-> See main function first
-> Review current problem or next upgrade
-> Take one meaningful action
-> Hub state updates
-> Return to the walkable space
```

Each location should normally expose one primary action and no more than two secondary actions. Use stable groups such as `Use`, `Upgrade`, `People`, and `Requests` when additional depth is justified.

Walking must not become repetitive travel. Discovered shortcuts, pinned requests, and an expedition-exit summary should support fast preparation.

## Upgrade Requirements

Building upgrades can require:

- Materials.
- Retained knowledge or blueprints.
- A survivor role.
- Settlement health, morale, food, population, or power.
- Another building.
- A dungeon or story milestone.

Requirements have four readable states: met, missing but known, unknown, and blocked. Players should understand what is missing, how it can be pursued, and what the upgrade changes.

Materials may be loaded gradually into a building and remain protected from ordinary expedition loss. Knowledge, survivors, power, and milestones are conditions rather than consumable materials.

Partial construction should produce visible progress and may grant small benefits, but the previous universal percentage tiers are a design proposal rather than a fixed rule. Each building needs only as many construction stages as create meaningful feedback.

## Era Evolution

The canonical building capability sequence is:

| Era | Building Character |
| --- | --- |
| Survival | Improvised, manual, fragile, and local. |
| Settlement | Organized, staffed, and community-supported. |
| Metalworking | Durable, precise, specialized, and tool-supported. |
| Mechanization | Machine-assisted, repeatable, and productive. |
| Electricity | Powered, faster, sensor-enabled, and grid-dependent. |
| Connectivity | Networked, coordinated, data-driven, and remotely influential. |

Buildings advance independently, allowing a mixed-era settlement. Each era upgrade should add a visible capability, improve an important output, or introduce a meaningful dependency. Purely cosmetic changes do not need systemic era levels.

## Survivors and Dialog

Survivor assignment starts as a clear capability rule: the needed role is present or absent. Temporary states such as injured, exhausted, afraid, sick, or angry can modify availability later without requiring a full population simulation.

Dialog reads current hub state and serves one of four purposes:

- Teach a system.
- Create or clarify a request.
- React to success, failure, rescue, construction, or loss.
- Present a decision affecting resources, assignments, morale, or story.

Priority is critical event, milestone reaction, active request, first-use explanation, relationship state, then ambient line. Important information should not be hidden behind random flavor.

## Hub Cycle

```text
Return from expedition
-> Resolve deliveries, injuries, requests, and events
-> Observe visible settlement changes
-> Recover, craft, assign, build, and choose priorities
-> Select a primary expedition objective
-> Prepare loadout
-> Leave through the physical expedition exit
```

The exact calendar model is unresolved. Calendar-based request terminology should not create mandatory chores until time pressure, expiration, and campaign pacing are tested together.

## Boundaries

- [Requests and Consequences](Hub/Requests%20and%20Consequences.md) owns request states, objective conversion, event pressure, and failure escalation.
- [Progression](Progression.md) owns resource, knowledge, equipment, and player-growth rules.
- [Era Progression](Progression/Era%20Progression.md) owns civilization-wide capability transitions.
- [Story and Campaign](../Narrative/Story%20and%20Campaign.md) owns canonical characters, campaign beats, and authored narrative truth.

## Validation Criteria

The hub is ready for review when:

- A player can understand each location's purpose and most important state quickly.
- Extracted value creates visible and functional change.
- Upgrades connect materials, knowledge, people, and infrastructure without opaque blockers.
- Survivors matter without requiring a deep workforce simulation.
- Preparation can be completed quickly after locations are understood.
- Requests create clear expedition motives and consequences create recovery decisions.
