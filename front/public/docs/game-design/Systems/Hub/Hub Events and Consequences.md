---
status: draft
lastReviewed: 2026-06-07
summary: Settlement events, pressure, failure consequences, and survivor misery states.
related:
  - ../Hub.md
  - Requests and Dungeon Objectives.md
  - NPC and Dialog Behavior.md
---
# Hub Events and Consequences

## Purpose

Hub events make the settlement feel alive. They should be small, readable situations caused by city needs, rescued survivors, story milestones, or player failure.

An event is not just a random message. It is a temporary pressure on one or more hub locations that asks the player to respond. Good events convert settlement state into decisions: spend scarce resources now, assign someone differently, accept a risky dungeon objective, or tolerate a consequence.

## Event Examples

| Event | Cause | Result |
| --- | --- | --- |
| Medicine Shortage | Low health and low supplies. | Clinic creates urgent fungus request. |
| Power Flicker | Generator unstable. | Some powered buildings pause or weaken. |
| Survivor Conflict | Morale low or incompatible NPCs assigned. | Dialog scene and assignment choice. |
| Food Spoilage | Food high but storage poor. | Kitchen or storage upgrade becomes important. |
| Enemy Signal | Radio used without protection. | New threat, warning, or dungeon objective. |
| Curator Intervention | Player prioritizes survivors over data. | AI conflict scene or locked archive choice. |

Events should create decisions, not random punishment. If an event only damages the player without creating an interesting response, it should be redesigned.

## Event Flow

```text
Condition becomes true
-> Event appears in a hub location
-> Player inspects or discusses the problem
-> Event creates a choice, request, or consequence
-> Hub state updates
```

## Failure and Consequence Rules

The first version should use recoverable consequences. Failed expeditions and ignored requests should create pressure, not instantly erase progress.

Use these rules:

| Rule | Behavior |
| --- | --- |
| No Permanent Loss From One Failure | A single failed run should not destroy a building, kill a critical NPC, or lock an era path. |
| Extracted Progress Survives | Anything delivered to the hub remains safe unless a later explicit event targets it. |
| Secured But Not Extracted Is Lost | Items found during a failed run do not count as delivered. |
| Daily Requests Can Expire | Ignored daily requests disappear, worsen a stat, or become a small event. |
| Weekly Requests Degrade Slowly | Ignored weekly requests lose partial progress or increase pressure, but do not vanish immediately. |
| Era Conditions Do Not Expire | Era upgrade conditions stay until solved. Failure may add new blockers, but not reset the goal. |
| Named Survivors Get Warning States | Before a named survivor dies or leaves, they become injured, missing, angry, exhausted, or unavailable. |
| Critical Systems Fail Soft First | The generator flickers before it shuts down. The clinic weakens before it stops healing. |

Failure should mostly change the next decision. It should say, "this is getting worse, what do you prioritize now?" rather than "you lost because a timer ticked."

## Misery States for Survivors

Survivor assignment starts as a binary unlock: the right survivor enables or improves a building. Later, survivors can gain temporary negative states that make their life and work harder.

| State | Cause | Effect |
| --- | --- | --- |
| Injured | Failed rescue, hub event, dangerous assignment. | Cannot be assigned until treated. |
| Exhausted | Too many consecutive days assigned to urgent work. | Building bonus reduced. |
| Afraid | Repeated failures, enemy signal, low morale. | Refuses dangerous requests or slows work. |
| Sick | Low health, medicine shortage, contaminated food. | Occupies clinic capacity and may spread event pressure. |
| Angry | Conflict, ignored personal request, Curator disagreement. | Blocks assignment with another survivor or lowers morale. |

These states should be used sparingly. The base assignment system remains simple, but events can temporarily complicate it in readable ways.

## Event Anatomy

Each event should define:

| Field | Meaning |
| --- | --- |
| Trigger | The condition that starts the event. |
| Location | Where the player sees and resolves it. |
| Timer or Pressure | Whether it worsens over runs, after days, or after ignored milestones. |
| Choices | What the player can do about it. |
| Cost | Resources, assignment changes, morale loss, risk, or opportunity cost. |
| Consequence | What happens after success, failure, or neglect. |
| Follow-up | Any request, dialog, upgrade, or future event unlocked. |

This makes events implementable and testable. Designers can see what starts an event, players can see what it means, and programmers can wire it to state changes.

## Consequence Scale

Use small consequences often and major consequences rarely:

- Small: reduced healing, slower crafting, lower morale, one survivor unavailable for a run.
- Medium: a building pauses, a request becomes urgent, a survivor conflict blocks assignment.
- Major: a named survivor dies, a story route closes, an enemy threat enters the hub layer.

The hub should feel reactive, but early failures should usually create recovery paths instead of permanent loss.

## Worked Example

```text
Event: Medicine Shortage
Trigger: City health below 45 and clinic medicine stock below 3
Location: Clinic
Pressure: Worsens after each completed run
Choices:
- Spend clean water and fungus to stabilize the clinic
- Assign doctor to reduce health decline
- Accept urgent fungus objective
Success:
- Health decline stops
- Doctor reaction dialog plays
- Clinic upgrade requirement gains progress
Failure:
- One injured survivor becomes unavailable
- Infection event can trigger if health drops below 30
```

This event is useful because it does not just punish low supplies. It creates a clear decision and pushes the player back into the dungeon with a reason.
