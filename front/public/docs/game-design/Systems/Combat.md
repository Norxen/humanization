---
status: draft
lastReviewed: 2026-06-09
summary: Authoritative real-time combat rules covering controls, actions, loadout, damage direction, engineering, and validation.
related:
  - Dungeon/Encounters.md
  - Progression.md
  - Progression/Era Progression.md
  - ../Content/Content Requirements.md
---
# Combat

## Purpose

Combat should be mechanically satisfying without turning the engineer into a generic action hero. Responsive weapons create immediate skill expression; scanning, tools, gadgets, positioning, and environmental control let the player reshape encounters and resolve them efficiently.

Avoidance, disabling machinery, creating a route, spending a tool, or leaving an optional reward behind remain valid alternatives to killing every threat.

## Combat Identity

Combat is real-time from a top-down or isometric perspective. Movement and aiming are independent:

- Keyboard or left stick controls movement.
- Mouse or right stick controls facing and free aim.
- Weapons and aimed tools act toward the current aim direction.
- Movement does not automatically rotate aim toward travel direction.

The camera must reveal telegraphs, hazards, deployable coverage, escape routes, and interactions between several threats. Tactical pause is not a default mechanic.

The target experience is:

> Read the danger, create an advantage, execute precisely, and preserve enough capability to continue the expedition.

## Encounter Shape

Encounters normally use small groups of dangerous, readable enemies with complementary roles. Difficulty comes from behavior, terrain, objectives, target priority, positioning, and the cost of continuing afterward rather than defaulting to large hordes.

Players can avoid some encounters, disengage where space permits, or solve a threat without killing every enemy. Exact enemy counts and encounter duration remain tuning decisions.

## Combat Pillars

### Mechanical Skill Matters

Aiming, movement, evade timing, target priority, positioning, and committed deployment must feel responsive and learnable.

### Engineering Changes the Fight

Scanning reveals actionable information. Tools and gadgets create control, expose vulnerabilities, redirect enemies, manipulate machinery, and turn environmental systems into advantages.

### Correct Play Resolves Threats Faster

Enemies have moderate default durability. Weak points, status interactions, armor breaks, control effects, environmental hazards, and correct tool use create fast resolution windows.

### Resources Create Expedition Pressure

The sidearm and engineering tool remain dependable. Primary ammunition or energy, healing, and powerful gadgets are limited enough that encounters affect later decisions.

### Technology Expands Existing Verbs

Each era transforms what weapons, tools, and devices can affect. Older equipment remains useful through repair, modification, combination, and new interactions rather than being replaced by higher numbers.

## Standard Field Loadout

| Slot | Responsibility |
| --- | --- |
| Primary Weapon | Specialized power using limited ammunition, charge, or energy. |
| Sidearm | Dependable fallback governed by reload, heat, or renewable ammunition. |
| Engineering Tool | Scanning, interaction, repair, hacking, and era-supported operations. |
| Gadget Slots | Two limited devices chosen before the expedition or through supported field systems. |
| Healing | Limited recovery with a readable commitment and expedition cost. |

Additional slots require a clear control and decision benefit.

## Player Actions

| Action | Behavior |
| --- | --- |
| Move | Navigate independently from aim direction. |
| Aim | Control facing, targeting, weapon direction, and placement direction. |
| Use Active Weapon | Fire, strike, charge, or use the equipped primary weapon or sidearm. |
| Swap Weapon | Switch directly between primary weapon and sidearm. |
| Directional Evade | Commit to a short defensive movement using one of two charges. |
| Scanner Pulse | Reveal vulnerabilities, machinery, hazards, and engineering links. |
| Engineering Tool | Repair, hack, reroute, disable, overload, link, or inspect supported targets. |
| Deploy Gadget | Preview and place a limited device through a short committed action. |
| Interact | Use machinery, doors, objectives, allies, and environmental systems. |
| Heal | Spend limited recovery through an interruptible or committed action. |

## Evade, Scanner, and Deployment

The player has two evade charges that recover sequentially. An evade follows movement input, or aim direction when there is no movement input. Its defensive window, recovery timing, and cancellation rules require playtesting. The UI must communicate both charges clearly.

The scanner is non-consumable and limited by recovery time. It reveals useful information without stopping time or automatically solving an encounter. Familiar enemies remain readable without mandatory rescanning.

Device placement follows a stable flow:

```text
Select device
-> Hold to preview valid location and direction
-> Aim and position
-> Release to commit
-> Complete a short exposed deployment
-> Device enters its active state
```

Healing, heavy attacks, deployment, repair, and hacking may expose the player or be interrupted. Commitments must create timing decisions without making controls feel delayed.

## Combat Rhythm

```text
Observe or scan
-> Identify threats, weak points, and environmental links
-> Position and choose an engagement
-> Create or expose a vulnerability
-> Exploit it with weapon skill, a tool, or the environment
-> Resolve, avoid, or disengage from the threat
-> Reassess health, ammunition, gadgets, and position
```

## Damage Direction

Careless direct damage remains viable against ordinary threats but costs more time, ammunition, health, or position. Understanding and execution should matter more than repeatedly attacking a large health pool.

Required readability:

- Dangerous attacks have clear visual and audio telegraphs.
- Damage, armor response, resistance, immunity, and weak-point hits have distinct feedback.
- Vulnerability windows communicate their cause and duration.
- Interruptions and stagger are predictable enough to plan around.
- Off-screen threats receive camera-appropriate warnings.
- Damage information never relies on color alone.

Enemy definitions must eventually include durability, protection layers, weak points, resistances, stagger thresholds, status interactions, and engineering responses. Exact formulas, time-to-kill, invulnerability windows, healing values, and difficulty scaling remain unresolved until representative enemies and encounters exist.

## Era Relationship

Capability-gated salvage controls whether discovered technology can be understood, repaired, powered, supplied, reproduced, and upgraded. The canonical combat evolution is defined in [Era Progression](Progression/Era%20Progression.md).

## Validation Criteria

Combat is ready for review when representative playtests show:

- Movement, free aim, firing, and evasion are enjoyable without gadgets.
- Scanning and engineering create meaningful options rather than mandatory busywork.
- Ordinary threats have a readable direct resolution and a faster vulnerability-based resolution.
- Several distinct threats remain understandable at once.
- Resource use affects expedition decisions without making basic combat unreliable.
- Era upgrades add interactions and combinations rather than only damage.
- Recovery consequences connect combat to the wider expedition.
