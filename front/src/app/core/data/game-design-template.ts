import { ProjectTemplateDocument } from '../models/project.model';

const paths = [
  'Index.md',
  'Vision.md',
  'Production.md',
  'Production/Complexity Map.md',
  'Production/MVP Scope.md',
  'Systems.md',
  'Systems/Core Loop.md',
  'Systems/Combat.md',
  'Systems/Dungeon.md',
  'Systems/Dungeon/Encounters.md',
  'Systems/Hub.md',
  'Systems/Hub/Requests and Consequences.md',
  'Systems/Progression.md',
  'Systems/Progression/Era Progression.md',
  'Content.md',
  'Content/Content Requirements.md',
  'Narrative.md',
  'Narrative/Story and Campaign.md',
  'Presentation.md',
  'Presentation/Presentation Requirements.md',
  'Reference.md',
  'Reference/Glossary.md',
  'Reference/Open Questions.md',
  'Reference/Decision Log.md',
  'Reference/Documentation Conventions.md'
];

function title(path: string): string {
  return path.split('/').at(-1)!.replace(/\.md$/i, '');
}

export const GAME_DESIGN_TEMPLATE: ProjectTemplateDocument[] = paths.map(
  (path, order) => {
    const pageTitle = title(path);
    return {
      path,
      order,
      status: order === 0 ? 'draft' : 'planned',
      summary:
        order === 0
          ? 'Entry point and reading map for this game-design knowledge base.'
          : `Defines the purpose, decisions, dependencies, and open questions for ${pageTitle}.`,
      related: [],
      body: `# ${pageTitle}

## Purpose

Describe what this area owns and why it matters to the complete game.

## Dependencies

- Identify the systems, content, or production constraints this page depends on.

## Open Questions

- Record the decisions that still need design work.

## Completion Criteria

- The page contains actionable decisions and links to its dependent documentation.
`
    };
  }
);
