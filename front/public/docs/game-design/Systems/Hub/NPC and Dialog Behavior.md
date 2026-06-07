---
status: draft
lastReviewed: 2026-06-07
summary: Contextual dialog priorities and mechanical outputs for survivors in the hub.
related:
  - ../Hub.md
  - Hub Events and Consequences.md
  - ../../Narrative/Narrative Delivery.md
---
# NPC and Dialog Behavior

## Purpose

NPC dialog in the hub should support both story and gameplay. A survivor standing in a building should help the player understand what that building does, what it needs, and how the settlement is changing.

Dialog should not be a separate layer that repeats flavor text forever. It should read hub state and then explain, request, react, or escalate. When the player talks to an NPC, the game should decide why that line exists mechanically.

Survivor assignment should start as a binary unlock. A survivor either has the needed role for a building or does not. The first implementation should avoid deep job simulation.

```text
Doctor assigned to Clinic
-> Clinic healing improves
-> Medicine requests become clearer
-> Sickness events resolve faster
```

Later systems can add temporary survivor states such as injured, exhausted, afraid, sick, or angry. Those states should modify or block the binary assignment without turning every NPC into a full life simulator.

## Dialog Types

| Dialog Type | Purpose |
| --- | --- |
| Greeting | Short line that reflects current hub mood. |
| Explanation | Teaches what the building does. |
| Request | Creates a hub need or dungeon objective. |
| Reaction | Responds to upgrades, rescues, failures, or milestones. |
| Conflict | Shows disagreement between survivors or with The Curator. |
| Story Scene | Advances character arcs or main campaign beats. |

Dialog should be contextual. A doctor should not repeat the same line after the clinic gains power. A technician should react when the generator starts. A survivor should remember if the player failed to rescue someone during an expedition.

## Dialog Selection Rules

Choose dialog by priority, not at random:

```text
Critical event or crisis line
-> New upgrade or milestone reaction
-> Active request reminder
-> Building explanation if first visit
-> Relationship or mood line
-> Generic ambient line
```

This prevents important information from being buried under flavor. If the clinic has an infection event, the doctor should talk about that before giving a generic greeting.

## Dialog Outputs

A dialog line can do one of four things:

| Output | Use |
| --- | --- |
| Teach | Explain a system the first time it matters. |
| Request | Create or clarify a dungeon objective. |
| React | Acknowledge player success, failure, upgrade, rescue, or loss. |
| Decide | Present a choice that changes assignments, morale, resources, or story state. |

Most lines should have no mechanical side effect, but the lines that do should be explicit. For example, a doctor asking for fungus should create a tracked request, not just imply that fungus would be useful.

## Conditional Dialog Example

```text
building = clinic
eraLevel >= Electricity
assignedSurvivor = doctor
cityHealth < 40
recentEvent = expedition_failed
```

Those conditions can produce a line, a request, or a small event.

## Worked Example

```text
Context:
- Clinic is Settlement era
- Doctor is assigned
- Medicine stock is low
- Player just returned without completing the fungus request

Selected line priority:
Active request reminder

Possible line purpose:
The doctor reminds the player that the clinic can still heal minor wounds, but cannot treat the infected survivor until fungus is recovered.

Mechanical result:
- No new request is created because the request already exists
- The existing fungus objective is highlighted on the expedition board
- City health continues to decline slowly while unresolved
```

This keeps dialog tied to the hub loop: the NPC clarifies urgency, the UI points to the objective, and the settlement state keeps moving.
