---
status: draft
lastReviewed: 2026-06-09
summary: Universal movement, free-aim, weapon, scanner, engineering, gadget, evade, and interaction actions.
related:
  - ../Combat.md
  - Combat Model.md
  - Damage Rules.md
  - ../Progression/Player Progression.md
---
# Player Actions

## Universal Actions

| Action | Behavior |
| --- | --- |
| Move | Navigate independently from aim direction. |
| Aim | Control facing, targeting, weapon direction, and placement direction with mouse or right stick. |
| Use Active Weapon | Fire, strike, charge, or otherwise use the currently equipped primary weapon or sidearm. |
| Swap Weapon | Switch directly between primary weapon and sidearm. |
| Directional Evade | Commit to a short defensive movement in the chosen direction. |
| Scanner Pulse | Reveal vulnerabilities, machinery, hazards, and engineering links within its readable range. |
| Engineering Tool | Repair, hack, reroute, disable, or perform the active era-supported tool function. |
| Deploy Gadget | Preview and place the selected limited device through a short committed action. |
| Interact | Use combat-relevant machinery, doors, objectives, allies, and environmental systems. |
| Heal | Consume limited recovery through an interruptible or committed action defined by damage rules. |

## Loadout Rules

The standard field loadout contains:

- One primary weapon.
- One sidearm.
- One multifunction engineering tool.
- Two gadget slots.
- Limited healing.

The loadout creates clear responsibilities:

- The primary weapon provides specialized power at a meaningful expedition cost.
- The sidearm ensures the player retains a dependable combat response.
- The engineering tool provides information and system interaction.
- Gadgets provide chosen control, preparation, or emergency capabilities.

Equipment content may alter these responsibilities, but additional slots should not be added without a clear control and decision benefit.

## Directional Evade

The player has two evade charges.

- An evade travels in the current movement-input direction, with aim direction as the fallback when no movement input exists.
- Charges recover sequentially rather than simultaneously.
- The action provides a defensive timing window whose exact duration remains a tuning decision.
- Evading interrupts ordinary movement but does not automatically cancel every committed action.
- The UI must show both charge availability and recovery clearly.

Two charges allow skilled correction and aggressive repositioning while sequential recovery prevents permanent evade chaining.

## Scanner Pulse

The scanner is a core, non-consumable engineering action.

- It has a recovery period rather than ammunition.
- It highlights actionable information, not every decorative object.
- It can reveal weak points, resistances, machinery, powered connections, hazards, and device interactions supported by the current era.
- Familiar enemies remain readable through animation and presentation, so scanning is advantageous rather than compulsory.
- Repeated scanning cannot permanently stun, damage, or trivialize threats unless a later upgrade explicitly adds such an interaction.

## Engineering Tool

The tool's core interaction language remains stable while era capability expands what it can affect.

Core functions can include:

- Inspect.
- Repair.
- Disable.
- Reroute.
- Hack.
- Overload.
- Link.

The player should understand the verb before selecting a target. Context determines the valid result, and invalid or unavailable operations must explain the missing capability.

## Gadget Deployment

Gadgets occupy two limited slots and consume charges, ammunition, crafted units, or another explicit expedition resource.

Placement behavior:

```text
Select gadget
-> Hold input to preview valid placement
-> Aim and position
-> Release to commit
-> Complete short exposed deployment
-> Gadget enters its active state
```

Examples include traps, barricades, turrets, decoys, beacons, and control devices. The content list remains undefined until item and era design establishes each archetype.

## Action Commitments

Powerful actions require readable commitments. Healing, heavy attacks, deployment, repair, and hacking may expose the player or be interrupted. Commitments should create timing decisions without making controls feel delayed or unresponsive.

Exact bindings, buffering, cancellation windows, reload behavior, and controller assistance remain implementation and accessibility design work.
