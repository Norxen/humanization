# Index

## Purpose

This document is the entry point for the gameplay design. The original single long document has been split into smaller loop-focused files so each system is easier to read, edit, and prototype.

## Core Design Statement

The player prepares in a growing human hub, descends into The Cradle to gather resources, rescue survivors, and recover lost knowledge, then chooses whether to extract safely or risk going deeper. Everything successfully extracted is used to rebuild civilization, unlock new technologies, improve the hub, and prepare for more dangerous expeditions.

## Document Map

| File | Covers |
| --- | --- |
| [Core Loop](Design/Core%20Loop.md) | The complete player cycle and design pillars. |
| [Hub Loop](Design/Hub%20Loop.md) | Hub preparation, buildings, survivors, and city needs. |
| [Dungeon Loop](Design/Dungeon%20Loop.md) | Runs, rooms, Survey Mode, Expedition Mode, extraction, and failure. |
| [Progression Loop](Design/Progression%20Loop.md) | Resources, knowledge, eras, player upgrades, and unlock logic. |
| [First 10 Floors Prototype](Design/First%2010%20Floors%20Prototype.md) | Small playable vertical slice for the first implementation. |
| [Story Brief](Story%20Brief.md) | Narrative premise, world, protagonist, campaign arc, and themes. |

## Recommended Reading Order

1. Start with the [Story Brief](Story%20Brief.md) for context.
2. Read the [Core Loop](Design/Core%20Loop.md) for the player experience.
3. Read the [First 10 Floors Prototype](Design/First%2010%20Floors%20Prototype.md) before implementing anything.
4. Use the hub, dungeon, and progression loop documents as system references.

## Prototype Rule

Do not start by building 300 floors, every era, or every system.

The first job is to prove this loop:

```text
Enter dungeon
-> Fight enemies
-> Gather resources
-> Reach extraction
-> Return to hub
-> Build one upgrade
-> Unlock a deeper objective
```

If that loop is not fun at 10 floors, more content will not fix it.
