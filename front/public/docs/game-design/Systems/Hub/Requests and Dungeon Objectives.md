---
status: draft
lastReviewed: 2026-06-09
summary: Rules that convert settlement needs into generated dungeon objectives and resolve their outcomes.
related:
  - ../Hub.md
  - ../Dungeon.md
  - ../Dungeon/Level Generation.md
---
# Requests and Dungeon Objectives

## Purpose

The hub should generate the next run objective. This is one of its most important jobs.

A request starts as a local need inside a building, then becomes a dungeon objective. When the player extracts the required reward, the request resolves back in the hub and changes the settlement.

Requests are the bridge between hub management and roguelike runs. They should explain why the player is going back into danger, what success looks like, and what changes when the player returns.

The hub supports three request classes:

| Class | Time Scale | Purpose |
| --- | --- | --- |
| Daily Requests | One in-game day or one expedition cycle. | Short-term needs, small rewards, pressure relief, resource targeting. |
| Weekly Requests | Several in-game days. | Larger settlement projects, NPC needs, stabilizing systems, medium upgrades. |
| Era Upgrade Requests or Conditions | Long-term progression gates. | Major civilization advancement, boss gates, new dungeon rules, new hub capabilities. |

## Example Flow

```text
Clinic lacks medicine
-> Doctor requests medicinal fungus
-> Player chooses Resource Run
-> Player finds fungus in organic rooms
-> Player extracts safely
-> Clinic crafts better medicine
-> Health improves
-> New clinic upgrade becomes available
```

## Request Lifecycle

Every request should move through clear states:

| State | Meaning |
| --- | --- |
| Available | A building has a need the player can inspect. |
| Accepted | The player has chosen it as a tracked objective. |
| In Run | The dungeon generator can place the needed target. |
| Secured | The player found the target but has not extracted yet. |
| Delivered | The player extracted and returned it to the hub. |
| Resolved | The building changed state and the request is complete. |
| Failed or Expired | The run failed, the crisis worsened, or the opportunity changed. |

The important distinction is `Secured` versus `Delivered`. Finding a medicine crate is not enough if the player dies before extraction. This keeps extraction meaningful.

## Request Class Rules

| Request Class | Active Limit | Failure Rule | Typical Reward |
| --- | --- | --- | --- |
| Daily | Up to 3 visible, 1 tracked for dungeon influence. | Expires or worsens at night. | Supplies, health, morale, small relationship or building progress. |
| Weekly | Up to 2 active. | Loses progress, adds event pressure, or extends completion time. | Building level progress, survivor stability, larger resource bundles. |
| Era Upgrade | Any number visible, but only 1 pinned as the current civilization goal. | Does not expire. Missing conditions remain blocked until solved. | New era level, new dungeon strata, new building functions, story progression. |

Daily requests should make each day feel different. Weekly requests should create medium-term planning. Era upgrade requests should define the player's current strategic direction.

## Request Types

| Request Type | Example |
| --- | --- |
| Resource | Farm needs seeds, forge needs copper, clinic needs fungus. |
| Survivor | Generator needs technician, school needs teacher. |
| Blueprint | Workbench needs tool schematic, radio needs antenna plan. |
| Repair | Elevator needs parts from a damaged floor. |
| Signal | Radio tower detects a coordinate or distress call. |
| Story | Archive asks for a specific memory core. |
| Crisis | Disease outbreak, power shortage, food collapse. |

Requests should be clear enough to guide the player, but not so rigid that every run feels identical.

## Objective Generation Rules

When a request becomes a dungeon objective, it should define:

- Target: what the player is looking for.
- Source zones: which rooms, floors, eras, or enemy types can contain it.
- Minimum success: how much is needed to resolve the request.
- Bonus success: what extra recovery does, if anything.
- Failure consequence: what changes if the player ignores or fails it.
- Hub payoff: the exact building function, upgrade, stat, or dialog unlocked.

Example:

```text
Request: Recover Medicinal Fungus
Target: Medicinal Fungus x12
Source zones: Organic rooms, damp caves, ruined hydroponics
Minimum success: x8 reduces the current sickness event
Full success: x12 resolves the request and stocks the clinic
Bonus success: Extra fungus becomes medicine crafting material
Failure consequence: City health drops and infection event may spread
Hub payoff: Stronger between-run healing and Sterile Clinic requirement progress
```

## Dungeon Placement Rules

Dungeon levels are generated as whole levels, not room-by-room templates. Each level should receive a small set of tags, then requests use those tags to place compatible objectives.

Level generation should follow this order:

```text
Choose depth and era band
-> Choose level theme
-> Choose threat intensity
-> Choose resource bias
-> Apply tracked request requirements
-> Place objective anchor
-> Place extraction path or exit condition
-> Add optional side targets
```

### Level Tags

Each generated level should have tags like:

| Tag Type | Examples | Use |
| --- | --- | --- |
| Era Band | Stone, Settlement, Metalworking, Mechanization, Electricity. | Controls materials, enemies, hazards, and available knowledge. |
| Theme | Cavern, Ruin, Utility, Organic, Workshop, Archive, Transit. | Controls dominant resource families and visual identity. |
| Threat | Low, Medium, High, Crisis. | Controls enemy density, hazard severity, and objective risk. |
| Resource Bias | Food, Medicine, Scrap, Copper, Fuel, Data. | Increases specific drops and objective compatibility. |
| Special State | Flooded, Dark, Infested, Collapsing, Powered, Signal-Active. | Adds modifiers and event hooks. |

The request does not say "spawn fungus in room 4." It says "this objective needs a level with Organic or Flooded tags, early era band, and Medicine bias." The generator then creates a level that supports that need.

### Request Placement Strength

Tracked requests should influence generation with clear strength:

| Strength | Rule |
| --- | --- |
| Guaranteed | Main tracked request target appears when the objective and run structure explicitly promise access. |
| Favored | Compatible resources and side targets have increased chance. |
| Incidental | Untracked requests may appear only if the generated level already fits them. |
| Blocked | The request cannot appear because the required era band, milestone, or level tag is unavailable. |

Placement certainty must be defined by objective type, available information, and run structure. Generation must not promise guaranteed access unless the player-facing objective makes that guarantee clear.

### Objective Anchor

Every tracked dungeon objective should create one objective anchor on the level:

| Objective Type | Anchor Example |
| --- | --- |
| Resource | Fungus cluster, scrap cache, copper conduit, water purifier. |
| Survivor | Locked shelter, signal flare, barricaded alcove. |
| Blueprint | Workbench schematic, archive terminal, broken machine. |
| Repair | Damaged elevator, generator component, blocked tunnel. |
| Signal | Antenna point, distress beacon, corrupted transmitter. |

The anchor is the point of commitment. It should be reachable, guarded, risky, or require a small interaction so the objective feels like a goal rather than a random pickup.

### Level Result

At extraction, the level reports:

```text
Main objective completed or failed
-> Quantity secured
-> Optional targets secured
-> Survivor rescued or lost
-> New tags discovered
-> Hub requests updated
```

This result feeds directly into the hub's daily, weekly, and era request states.

## Multiple Requests

The number of tracked and secondary requests remains unresolved. The expedition interface must make the primary purpose of a run clear even when several compatible opportunities exist.

For example, a clinic fungus request and workbench copper request can both target early floors, but the expedition board should ask the player to choose the main run goal. The chosen goal influences dungeon placement so the run feels intentional.
