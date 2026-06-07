---
status: draft
lastReviewed: 2026-06-07
summary: Minimum hub locations, NPCs, state, and sequence required by the first playable prototype.
related:
  - ../Hub.md
  - ../../Production/First 10 Floors Prototype.md
---
# First Prototype Hub Scope

## Purpose

The first playable hub should be small. It only needs enough systems to prove that dungeon rewards become visible progress.

The prototype goal is not to simulate a full city. It is to prove the loop:

```text
Need appears in hub
-> Player chooses a run objective
-> Dungeon contains a relevant target
-> Player extracts
-> Hub location changes visibly
-> New need or option appears
```

If a prototype feature does not support that loop, defer it.

## Recommended Prototype Locations

| Location | Purpose |
| --- | --- |
| Shelter Core | Shows population, storage, and basic settlement state. |
| Workbench | Crafts tools and one upgrade. |
| Clinic Corner | Heals the player and requests medicinal fungus. |
| Archive Terminal | Decodes the first memory core or blueprint. |
| Damaged Generator | Creates the first major upgrade objective. |
| Expedition Exit | Starts the next dungeon run. |

## Recommended Prototype NPCs

| NPC | Role |
| --- | --- |
| First Survivor | Explains settlement needs and gives emotional grounding. |
| Medical Survivor or Doctor | Connects dungeon resources to healing. |
| Technician | Unlocks or explains the generator objective. |

The first prototype does not need full housing, morale, power networks, farming, radio systems, or multi-era upgrades.

## Required Prototype Behavior

Each prototype location should have one implemented behavior:

| Location | Required Behavior |
| --- | --- |
| Shelter Core | Shows population, stored supplies, and one settlement status line. |
| Workbench | Spends recovered scrap to craft or upgrade one tool. |
| Clinic Corner | Heals the player between runs and creates the fungus request. |
| Archive Terminal | Turns one recovered memory core into a blueprint or story reveal. |
| Damaged Generator | Shows a blocked upgrade that needs parts and a technician. |
| Expedition Exit | Lets the player choose the next tracked objective and start a run. |

This is enough to test whether the hub creates motivation for the dungeon and whether dungeon rewards feel useful afterward.

## Prototype State Variables

Keep the first implementation small:

- `population`
- `cityHealth`
- `scrap`
- `medicineStock`
- `memoryCores`
- `generatorState`
- `activeRequest`
- `rescuedSurvivors`
- `completedMilestones`

Do not add generalized housing, morale, food webs, full power routing, or multi-NPC relationship systems until these variables already produce a satisfying return loop.

## First Playable Sequence

```text
Start:
- Shelter has 1 survivor
- Clinic has low medicine
- Workbench has no scrap
- Generator is damaged

Run 1 objective:
- Recover scrap for Workbench

Return:
- Workbench crafts a basic tool
- Tool unlocks access to organic rooms
- Clinic creates fungus request

Run 2 objective:
- Recover medicinal fungus

Return:
- Clinic improves between-run healing
- Doctor or medical survivor joins if rescued
- Generator requirement is revealed

Run 3 objective:
- Recover copper wire or rescue technician

Return:
- Generator becomes hand-crank or low-power
- Archive or Workbench gains a new powered option
```

This sequence proves progression without needing a broad content set.

## Prototype Proof

The first hub only needs to prove this:

```text
The player returns from a run
-> sees the hub react
-> spends or assigns something
-> unlocks a new objective
-> wants to run again
```

## Acceptance Criteria

The prototype is successful when a first-time player can complete this sequence without designer explanation:

| Criterion | Pass Condition |
| --- | --- |
| Walkable Orientation | Player can identify Shelter, Clinic, Workbench, Generator, Archive, and Expedition Exit by walking through the hub. |
| Request Clarity | Player understands which request is daily, weekly, or era-level before starting a run. |
| Tracked Objective | Player can choose one primary expedition objective and see it summarized at the Expedition Exit. |
| Dungeon Placement | The chosen objective appears as a guaranteed anchor in the generated level. |
| Extraction Meaning | Objective rewards only count after extraction and delivery to the hub. |
| Visible Progress | Delivering resources visibly changes one building, stat, NPC line, or construction state. |
| Partial Upgrade | Loading resources into one building advances it through at least one partial level. |
| Failure Recovery | Failing one run creates pressure but does not permanently break the prototype loop. |
| Survivor Assignment | Assigning one survivor creates a clear binary improvement in one building. |
| Next Objective | Completing one request reveals or advances another objective. |

Minimum playable proof:

```text
Run 1: Track scrap request
-> Generated level contains scrap cache
-> Player extracts
-> Workbench reaches partial upgrade level 2
-> Clinic fungus request appears

Run 2: Track fungus request
-> Generated level has Organic or Medicine bias
-> Player extracts
-> Clinic healing improves
-> Doctor assignment or rescue condition appears

Run 3: Track copper wire or technician objective
-> Generated level contains utility anchor
-> Player extracts or rescues
-> Generator reaches low-power state
-> Era upgrade condition becomes visible
```

If this sequence works, the hub loop is strong enough to expand. If it does not, adding more buildings or resources will only hide the problem.

## Out of Scope Until After Prototype

- Full settlement economy.
- Multiple simultaneous crises.
- Complex power grid routing.
- Long NPC relationship arcs.
- Multi-era upgrades for every building.
- Procedural hub layout changes.
- Radio, farming, school, housing, or government systems.

Those systems can be designed later, but they should not enter the first playable hub unless the core return loop already works.
