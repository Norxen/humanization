# Location Interaction Rules

## Purpose

The hub is a walkable space. The player physically moves through the settlement, sees buildings and survivors in context, and interacts with locations by approaching them. Menus still exist, but they are overlays on top of a place the player inhabits.

Each hub location should expose a small set of interactions. The player should not need to open five menus to understand one building, and the hub should not collapse into a spreadsheet. Walking should provide orientation, mood, and discovery; interaction panels should provide decisions.

The interaction model should answer four questions quickly:

- What can I do here right now?
- What is this place missing?
- Who is involved?
- How does this affect my next dungeon run?

## Interaction Slots

A good first version of a location has:

| Slot | Meaning |
| --- | --- |
| Main Function | The action the building exists for. |
| Status | What the building is doing or missing. |
| Upgrade | The next improvement, if available. |
| NPC Interaction | Dialog, request, explanation, or reaction. |
| Assignment | Optional survivor role management. |

Not every building needs every slot at the start. A basic storage area may only need status and function. A clinic may need function, NPC dialog, requests, and events. A radio tower may need all of them because it is a major story system.

## Interaction Flow

Use the same flow for most locations:

```text
Player walks near a location
-> Location marker, status icon, or NPC prompt appears
-> Player interacts
-> Location summary appears as an overlay
-> Main function is highlighted first
-> Problems and blocked upgrades are shown second
-> NPC or event interaction appears only if currently relevant
-> Player chooses an action
-> Hub state updates or a dungeon objective is created
-> Overlay closes and the player remains in the walkable hub
```

This keeps locations readable even when they have several systems behind them. A player should not need to inspect upgrades to learn that the clinic is out of medicine; that belongs in the status line.

## Walkable Hub Mechanics

The hub should use three layers:

| Layer | Purpose | Example |
| --- | --- | --- |
| Physical Space | Where the player walks, sees construction, finds NPCs, and notices problems. | The generator sparks when unstable. |
| Proximity Prompts | Short interact prompts and status indicators. | `Clinic - Medicine Low`, `Talk`, `Upgrade Ready`. |
| Interaction Overlay | Focused UI for actions, requirements, requests, and assignments. | Clinic panel with Heal, Load Resources, Assign Doctor, Track Fungus Request. |

Walking should matter in these ways:

- Buildings have physical positions, so the player learns where systems live.
- NPCs can stand near relevant buildings, making their role readable before opening dialog.
- Events are visible in-world through small changes: smoke, flickering lights, sickbeds, construction scaffolds, empty storage.
- New construction creates new paths or visible upgrades in the hub.
- The Expedition Exit is a physical gate, elevator, tunnel, or vehicle bay that starts the next run.

Walking should not waste time. Add shortcuts after discovery:

- A map or quick-travel list can unlock after the player visits each location once.
- Critical requests can be pinned to the HUD.
- The Expedition Exit should summarize the currently tracked objective so the player does not have to revisit every building before leaving.

## Daily Walk Cycle

Each in-game day should make the hub feel alive without forcing chores:

```text
Morning
-> Daily requests refresh
-> NPCs move to assigned buildings
-> Events update pressure
-> Player walks the hub, resolves actions, chooses objectives
-> Player starts expedition or ends the day
Night
-> Settlement consumes daily needs
-> Weekly timers and era conditions advance
-> Consequences resolve
```

The player should be able to do a fast loop if they already know what they want: wake, check pinned needs, walk to the Expedition Exit, choose objective, leave.

## Slot Behavior

| Slot | What It Should Show | What It Should Do |
| --- | --- | --- |
| Main Function | The current usable action and its result. | Apply an immediate effect, such as healing, crafting, decoding, or launching a run. |
| Status | The most important current condition. | Explain outputs, shortages, disabled states, or active event pressure. |
| Upgrade | The next meaningful improvement. | Show payoff, missing requirements, and whether requirements can become objectives. |
| NPC Interaction | Contextual line, request, or scene. | Teach, react, create a request, or resolve a conflict. |
| Assignment | Empty role slot or current worker. | Assign or remove a survivor and recalculate building output. |

## Action Limits

Each location should usually expose one primary action and up to two secondary actions. If a location needs more, split the behavior into tabs or sub-panels with stable labels:

- `Use`: heal, craft, decode, launch, repair.
- `Upgrade`: inspect and commit improvements.
- `People`: assign survivors.
- `Requests`: convert needs into dungeon objectives.

Do not add a separate menu for a one-line interaction. If "talk to doctor" only repeats the clinic status, it should be folded into the status text or NPC reaction.

## Design Rule

> Add interactions when they create decisions, not just because the building exists.

The player should be able to understand a location quickly: what it does, what it needs, who is there, and why it matters for the next run.
