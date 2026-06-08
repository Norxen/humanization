---
status: draft
lastReviewed: 2026-06-09
summary: Building functions and their evolution across civilization eras.
related:
  - ../Hub.md
  - Upgrade Requirements.md
  - ../Progression/Era Progression.md
---
# Building Purpose and Era Levels

## Purpose

Each building should keep its purpose across the whole game, but its form should evolve with civilization.

This avoids replacing familiar systems with unrelated ones. The player should understand that the same location is growing with the settlement. The clinic is always about health, but it can evolve from a bedroll and herbal table into a powered medical station and networked diagnostic facility.

The practical rule is: an era upgrade should change how strongly or broadly the building serves its purpose, not what category of gameplay it belongs to.

## Recommended Era Levels

| Era Level | Meaning |
| --- | --- |
| Survival | Improvised, manual, fragile, and local. |
| Settlement | Organized, staffed, and community-supported. |
| Metalworking | Durable, precise, specialized, and tool-supported. |
| Mechanization | Machine-assisted, repeatable, and more productive. |
| Electricity | Powered, faster, sensor-enabled, and connected to a local grid. |
| Connectivity | Networked, data-driven, coordinated, and able to affect distant objectives. |

## Era Resource Sets

Resources should evolve by era so the player feels civilization becoming more complex. Early resources are physical and local. Later resources become refined, powered, networked, and experimental.

| Era Level | Core Resources | Specialized Resources | Knowledge Items |
| --- | --- | --- | --- |
| Survival | Stone, wood, bone, fiber, clean water, medicinal fungus, raw food. | Hide, clay, charcoal, simple herbs. | Oral memory, crude map, survival note. |
| Settlement | Timber, cut stone, stored food, cloth, rope, basic medicine, scrap. | Seeds, preserved food, simple tools, shelter parts. | Building plan, farming note, clinic procedure. |
| Metalworking | Copper, iron ore, coal, refined scrap, nails, wire. | Bronze parts, iron tools, sterile instruments. | Forge diagram, tool schematic, alloy note. |
| Mechanization | Gears, pipes, springs, machine parts, lubricant, pressure tanks. | Pump parts, engine casing, conveyor pieces. | Machine blueprint, repair manual, factory log. |
| Electricity | Copper wire, batteries, fuel cells, ceramic insulators, circuit boards. | Generator coils, lamps, powered tools. | Wiring plan, power diagram, signal note. |
| Connectivity | Antenna parts, data cores, lenses, sensors, transmitters. | Relay modules, encrypted drives, network maps. | Protocol fragment, radio coordinate, diagnostic file. |

Later eras can reuse older resources in smaller amounts, but each era should introduce at least two new resources that change request and dungeon generation.

## Upgrade Impact

Era upgrades should change at least one of these things:

- What the building can do.
- How much it produces.
- Which survivors can work there.
- Which dialog or story scenes become available.
- Which dungeon objectives it can generate.
- Which other buildings it can support.

Each era level should therefore define three things:

| Field          | Meaning                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| New Capability | A new action or passive effect the player can understand immediately.                                    |
| Better Output  | A numerical or systemic improvement, such as faster crafting, stronger healing, or lower failure chance. |
| New Dependency | A new need that connects this building to survivors, power, knowledge, or another location.              |

If an upgrade does not add at least one visible capability or improve an important output, it should probably be a cosmetic stage instead of a gameplay era level.

## How Era Progression Works

Buildings do not all advance at the same time. The settlement can contain mixed-era locations:

```text
The Workbench reaches Metalworking
-> It can produce refined parts
-> Refined parts unlock the Generator's Mechanization upgrade
-> The Generator later provides power
-> Power unlocks the Clinic's Electricity upgrade
```

This creates a dependency web without forcing a single global "tech age" button. The player should feel like they are rebuilding civilization piece by piece.

## Example: Clinic Through Eras

| Era Level | Form | Main Function | New Dependency |
| --- | --- | --- | --- |
| Survival | Bedroll, herbs, boiled tools. | Restore a small amount of HP between runs. | Medicinal fungus or clean water. |
| Settlement | Staffed infirmary. | Treat injured survivors and reduce sickness events. | Doctor or trained caregiver. |
| Metalworking | Durable tools and sterile surfaces. | Craft stronger medicine and surgery kits. | Metal tools from Workbench. |
| Mechanization | Pump-assisted treatment and repeatable equipment. | Improve treatment throughput and support more complex injuries. | Mechanical parts and workshop support. |
| Electricity | Powered medical station. | Stabilize critical injuries and improve recovery speed. | Generator output. |
| Connectivity | Networked diagnostics. | Predict outbreaks and generate targeted resource requests. | Archive data or radio network. |

The clinic never stops being about health. What changes is the scale, reliability, and complexity of health management.

## Design Rule

The building's purpose should remain stable even when its era form changes. The player should not need to relearn what the location is for every time civilization advances.
