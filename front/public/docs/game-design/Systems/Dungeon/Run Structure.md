---
status: planned
lastReviewed: 2026-06-07
summary: Planned state model for preparing, entering, traversing, and resolving a dungeon run.
related:
  - ../Dungeon.md
  - Extraction.md
---
# Run Structure

## Known Requirements

A run begins with a hub objective and selected mode, progresses through generated levels, exposes extraction opportunities, and resolves secured or lost value on return.

## Questions to Resolve

- Floor count and expected duration by run type.
- Rules for route selection, rest points, and backtracking.
- How objectives, escorts, inventory pressure, and failure alter the run state.
- Which information is known before entering.

## Completion Criteria

Define the run state machine, transitions, persistence boundaries, and minimum telemetry required to evaluate pacing.
