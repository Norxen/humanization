# Hub Location Template

## Purpose

Every hub building or location should use the same base template so the hub can grow without turning every building into a bespoke system. A location is not just a room label. It is a stateful object that tells the game:

- What the player can do there right now.
- What the location needs before it can improve.
- Which survivors affect it.
- Which requests it can push into the next dungeon run.
- Which story or event beats can happen there.

The player-facing result should be simple: walk to a location, see its current state, choose one or two meaningful actions, and leave with a clearer next objective.

## Minimum Template

| Field | Purpose |
| --- | --- |
| `id` | Stable internal identifier, such as `clinic` or `generator_room`. |
| `displayName` | Player-facing name. |
| `category` | Survival, Production, Exploration, Combat, Knowledge, Power, or Connectivity. |
| `purpose` | The building's permanent role across eras. This should not change when the building upgrades. |
| `eraLevel` | Current civilization tier of the building. |
| `status` | Current condition, output, problem, or blocked state shown to the player. |
| `functions` | Actions the player can perform here, such as heal, craft, assign, decode, repair, or launch. |
| `upgrades` | Available improvements, missing requirements, and the resulting new function or output. |
| `assignedSurvivors` | Survivors currently working here. |
| `dialog` | NPC lines, explanations, reactions, and story scenes. |
| `requests` | Needs that can become dungeon objectives. |
| `events` | Local problems, consequences, or discoveries. |

Every location should have one clear purpose before it gains complexity. A clinic heals and manages health. A forge improves materials and equipment. An archive converts recovered knowledge into usable technology. Later upgrades can deepen those functions, but the core purpose should stay readable.

## Runtime Behavior

A hub location should be evaluated in this order when the player enters it:

```text
Load saved location state
-> Apply global hub state, such as power, population, morale, and supplies
-> Apply assigned survivor bonuses or penalties
-> Resolve active events affecting this location
-> Show current status, available actions, blocked actions, and next upgrade
-> Let the player take one interaction
-> Emit any resulting request, upgrade, dialog, or state change
```

The important part is that the location owns its local state, but it can read broader settlement state. For example, the clinic owns its medicine stock and upgrade list, but it reads city health, available clean water, power, and whether a doctor is assigned.

## Player-Facing Screen

A location should expose a compact screen or panel with:

- Current state: "Medicine low", "Powered", "Doctor assigned", "Upgrade blocked".
- Main action: the one thing this location primarily does.
- Next improvement: what changes if the player completes it.
- Missing inputs: resources, survivor roles, milestones, or power dependencies.
- Request button: if a missing input can become the next dungeon objective.

Avoid showing every internal field. The template is for designers and save data. The player only needs the state, the useful action, and the reason to care.

## Example

```text
id: clinic
displayName: Clinic
category: Survival
purpose: Restore health and manage medical problems.
eraLevel: Settlement
status: Low medicine supply.
functions:
- Heal player between runs.
- Craft basic medicine.
- Treat injured survivors.
upgrades:
- Sterile Clinic: requires Medicinal Fungus x12, Clean Water x8, Doctor assigned.
assignedSurvivors:
- Doctor or medical specialist.
requests:
- Recover medicinal fungus from organic rooms.
- Find surgical tools in Settlement Era floors.
events:
- Survivor infection.
- Medicine shortage.
```

## Worked Example

If the player returns with `Medicinal Fungus x12`, the clinic should not only remove an item from inventory. It should run a clear resolution:

```text
Player delivers Medicinal Fungus x12
-> Clinic medicine stock increases
-> "Heal between runs" restores more HP
-> City health rises
-> Doctor reaction dialog becomes available
-> "Sterile Clinic" checks whether Clean Water and Doctor are also present
```

This makes a dungeon reward visibly change hub behavior instead of becoming an abstract currency deposit.
