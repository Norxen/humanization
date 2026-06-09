---
status: draft
lastReviewed: 2026-06-09
summary: Authoritative expedition structure covering run states, generated spaces, objectives, extraction, and failure.
related:
  - Core Loop.md
  - Hub/Requests and Consequences.md
  - Dungeon/Encounters.md
  - Progression.md
---
# Dungeon

## Purpose

The dungeon converts settlement needs into dangerous expeditions. Each run should provide a clear purpose, readable opportunities, increasing unsecured value, and repeated decisions about whether to continue or extract.

## Run State

```text
Review hub needs
-> Select a primary objective and expedition mode
-> Prepare loadout
-> Enter a generated route
-> Explore, fight, solve, rescue, and recover value
-> Reach an extraction opportunity
-> Extract, continue deeper, or fail
-> Resolve delivered and lost value in the hub
```

The exact run duration, route length, rest points, and backtracking rules remain unresolved. They must be determined through pacing tests rather than fixed floor counts.

## Moment-to-Moment Loop

```text
Enter a space
-> Read threats, exits, resources, and objective signals
-> Choose whether and how to engage
-> Spend time, health, tools, or supplies
-> Secure value or information
-> Reassess the route and extraction risk
```

Spaces can focus on combat, hazards, resources, rescue, machinery, navigation, story evidence, or a combination. Not every room should become an arena.

## Expedition Modes

Survey and Expedition modes remain useful working concepts:

- **Survey** prioritizes information, mapping, low-commitment recovery, and discovering future opportunities.
- **Expedition** pursues a known settlement objective with stronger generation influence and greater commitment.

Their exact rules, rewards, and durations remain unresolved. They should only remain separate if playtests show they create meaningfully different planning and risk.

## Generated Space Model

Levels are generated as coherent spaces using a small set of tags:

| Tag | Examples |
| --- | --- |
| Era | Survival, Settlement, Metalworking, Mechanization, Electricity, Connectivity. |
| Theme | Cavern, ruin, utility, organic, workshop, archive, transit. |
| Threat | Low, medium, high, crisis. |
| Resource Bias | Food, medicine, scrap, copper, fuel, data. |
| Special State | Flooded, dark, infested, collapsing, powered, signal-active. |

Generation should:

1. Choose depth and supported era band.
2. Choose theme, threat, resource bias, and special state.
3. Apply tracked objective compatibility.
4. Build a valid critical route and optional spaces.
5. Place the objective anchor and extraction logic.
6. Add encounters, landmarks, secrets, and narrative opportunities.
7. Validate reachability and resource assumptions.

The request system specifies compatible tags and certainty, not exact room coordinates. Seed behavior, algorithm choice, debug visualization, and generation validity tests remain technical design work.

## Objectives

A tracked objective defines:

- Target and minimum success.
- Compatible zones and source rules.
- Placement certainty.
- Objective anchor or interaction.
- Failure consequence.
- Exact hub payoff.

The main objective must be clear even when compatible secondary opportunities exist. A promise of guaranteed access is only valid when both the player-facing objective and generator support it.

## Extraction

Extraction converts carried rewards into permanent value. At each opportunity, the player chooses between securing current progress and accepting additional risk.

Required states:

- **Carried:** in the expedition inventory and vulnerable to loss.
- **Secured:** objective acquired but not yet delivered.
- **Extracting:** the player has committed to the extraction process.
- **Delivered:** value has reached the hub and becomes persistent.
- **Lost:** unsecured value is removed or transformed by failure rules.

Extraction frequency, activation cost, defense, timing, cancellation, escort behavior, and mode-specific loss remain unresolved. No fixed extraction cadence is currently defined.

## Failure

Failure should create pressure and a new decision without casually deleting secured civilization progress.

- Delivered value remains safe unless a later explicit system targets it.
- Secured but undelivered value is normally lost.
- Failed objectives can worsen hub pressure or change future opportunities.
- Named survivor loss requires warning and state escalation before permanent consequences.
- Recovery rules must prevent a failure spiral while preserving expedition tension.

## Validation Criteria

Dungeon design is ready for review when:

- The run state machine and persistence boundaries are explicit.
- Target run durations are supported by playtests.
- Generated routes cannot produce unreachable objectives or impossible costs.
- Extraction produces a meaningful continue-or-leave decision.
- Hub objectives influence runs without making generation repetitive.
- Survey and Expedition modes either prove distinct value or are merged.
