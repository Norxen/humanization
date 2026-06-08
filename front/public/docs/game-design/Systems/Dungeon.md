---
status: draft
lastReviewed: 2026-06-09
summary: Dungeon exploration loop, run modes, floor flow, room purposes, extraction, and failure.
related:
  - Core Loop.md
  - Hub/Requests and Dungeon Objectives.md
  - Dungeon/Run Structure.md
  - Dungeon/Extraction.md
---
# Dungeon

## Purpose

The dungeon is the risk layer. It creates pressure, rewards, discovery, and the decision to extract or push deeper.

## Moment-to-Moment Loop

```text
Move
-> Observe
-> Decide
-> Fight, avoid, or interact
-> Collect
-> Manage risk
-> Move deeper
```

The player should constantly make small decisions:

- Fight this enemy or avoid it?
- Spend durability or save it?
- Use the last healing item now?
- Mine a noisy resource node?
- Open the sealed chamber?
- Rescue the NPC before clearing the floor?
- Carry the unstable artifact?
- Push to the next extraction point?

## Floor Loop

```text
Enter floor
-> Explore rooms
-> Fight enemies
-> Gather resources
-> Find events
-> Make choices
-> Reach transition
-> Continue or extract
```

Each floor should contain at least one meaningful interaction.

## Room Types

| Room Type | Purpose |
| --- | --- |
| Combat Room | Fight enemies. |
| Resource Room | Gather materials. |
| Survivor Room | Rescue or interact with NPCs. |
| Puzzle Room | Use tools or logic to unlock rewards. |
| Hazard Room | Environmental danger. |
| Lore Room | Discover logs or memory fragments. |
| Elite Room | Hard fight with better reward. |
| Rest Room | Limited healing or repairs. |
| Trade Room | Exchange resources with survivors or systems. |
| Boss Room | Major challenge. |
| Extraction Room | Presents an opportunity to secure carried value and leave or continue. |

## Dungeon Modes

| Mode | Purpose | Risk |
| --- | --- | --- |
| Survey Mode | Farming, practice, minor lore, side objectives. | Lower. |
| Expedition Mode | Major progress, key survivors, blueprints, bosses, era advancement. | Higher. |

## Survey Mode

Survey Mode represents controlled exploration of stabilized or previously accessed areas.

Rules:

| Feature | Rule |
| --- | --- |
| Death penalty | Lose a percentage of carried resources. |
| Progression | Cannot unlock new eras or major content. |
| Resources | Common and some uncommon materials. |
| Survivors | Minor NPCs or clues only. |
| Story | Minor lore, environmental logs, rumors. |
| Bosses | No major era bosses. |
| Difficulty | Lower or more controlled. |

Survey Mode should feel useful, but it should not replace Expedition Mode.

## Expedition Mode

Expedition Mode represents entry into unstable, sealed, or enemy-controlled sections.

Rules:

| Feature | Rule |
| --- | --- |
| Death penalty | Lose everything gathered during that expedition. |
| Extraction | Availability and frequency depend on unresolved run-structure rules. |
| Progression | Can unlock eras, buildings, survivors, bosses, and major story. |
| Resources | All resource types. |
| Survivors | Important specialists and story NPCs. |
| Story | Major data, blueprints, and Return Protocol fragments. |
| Bosses | Major encounters may gate progression when content and campaign design require them. |
| Difficulty | Higher and less predictable. |

The main question:

> Do I extract now, or accept the risk of continuing deeper?

## Extraction Gates

Extraction opportunities should appear according to run pacing, route structure, objectives, and player capability. Their frequency remains unresolved.

Options can include:

- Return to the hub with all rewards.
- Continue deeper.
- Send back part of the resources.
- Send rescued survivors back while continuing alone.
- Store materials in an emergency cache.
- Spend a limited resource to heal.
- Call hub support if unlocked.
- Activate a shortcut for future expeditions.

Extraction Gates should be strategic checkpoints, not only exit buttons.

## Failure

Failure should hurt, but it should not destroy motivation.

Survey Mode death:

- Lose a percentage of gathered resources.
- Keep minor lore.
- Return to hub.
- Possibly gain small experience or knowledge scraps.

Expedition Mode death:

- Lose resources gathered during the expedition.
- Lose unextracted blueprints.
- Lose unextracted major story data.
- Lose unextracted rescued survivors.
- Return to hub injured or delayed.
- Dungeon layout may change.

The player always keeps:

- Previously extracted resources.
- Built hub upgrades.
- Unlocked knowledge.
- Rescued survivors already brought home.
- Permanent era progress.
- Permanent player upgrades.

## Dungeon Loop Summary

```text
Enter floor
-> Clear or avoid threats
-> Gather rewards
-> Manage inventory and health
-> Reach extraction
-> Leave safely or push deeper
```
