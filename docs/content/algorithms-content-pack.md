# Algorithms Content Pack

Algorithms training items are stored as local static JSON content grouped by roadmap node.

## Canonical Ownership

- `src/tracks/algorithms/algorithmItems.ts` remains the canonical TypeScript API for Algorithms training items.
- `src/tracks/algorithms/content/index.ts` is the local static content loader.
- `src/tracks/algorithms/content/items/**/questions.json` files are the content source for training items.
- Roadmap and taxonomy definitions remain TypeScript model definitions for now. They are not part of this content-pack split yet.

## Folder Structure

```text
src/tracks/algorithms/content/
  index.ts
  manifest.json
  items/
    <roadmap-node-folder>/
      questions.json
```

`questions.json` is the current file name for generic Algorithms training items. It contains more than quiz questions, including primers, worked examples, trace drills, strategy choices, and checks. Keep this name until there is a dedicated rename slice.

Content is grouped by `roadmapNodeId` so authoring, validation, and selectable practice coverage stay aligned with the learner roadmap.

## Add An Item

1. Choose the target roadmap node in `src/tracks/algorithms/algorithmRoadmap.ts`.
2. Add the item to that node's `questions.json` file.
3. Set `trackId` to `algorithms`.
4. Set `contentVersion` to `ALGORITHM_CONTENT_VERSION`.
5. Set `roadmapNodeId` to the group roadmap node id.
6. Use a globally unique `id`.
7. Add taxonomy refs for the primary pattern family and primary skill atom.
8. Add at least one active static micro-check for active items.
9. Add `difficulty` using the Algorithms difficulty scale: `intro`, `easy`, `medium`, or `hard`.
10. Add distinct per-distractor feedback in `feedbackModel.distractorExplanations` for every incorrect option id in active option-based micro-checks.
11. Add the new item id to `manifest.json` `itemOrder` in the exact public order you want to preserve.
12. Increase the matching group `itemCount` and top-level `itemCount`.

Run:

```bash
npm run typecheck
npm test
npm run validate:questions
```

## Add A New Roadmap Node Content Group

1. Add or confirm the roadmap node in `src/tracks/algorithms/algorithmRoadmap.ts`.
2. Create `src/tracks/algorithms/content/items/<folder-name>/questions.json`.
3. Add the JSON import to `src/tracks/algorithms/content/index.ts`.
4. Add the file to `algorithmQuestionFilesByPath` using the key `items/<folder-name>/questions.json`.
5. Add a group to `manifest.json` with:
   - `folderName`
   - `questionFile`
   - `roadmapNodeId`
   - `itemCount`
6. Add every item id to `manifest.json` `itemOrder`.
7. Update top-level `itemCount`.

The loader derives content groups from the manifest and validates the manifest against the static import map. This keeps the manifest as the metadata source while still making Metro bundle the local JSON files.

## Required Fields

Every training item must include the base Algorithms content contract:

- `id`
- `trackId`
- `contentVersion`
- `status`
- `type`
- `title`
- `prompt`
- `learningStage`
- `roadmapNodeId`
- `primarySkillAtomId`
- `taxonomyRefs`
- `feedbackModel`
- `difficulty`
- `staticMicroChecks` for active items

Item-type-specific fields are validated in `src/tracks/algorithms/algorithmContentQuality.ts`.

## Feedback Model

Algorithms feedback uses the existing `feedbackModel` as the canonical authoring contract. It maps to the layered feedback UI as follows:

- `mentalModelCorrection` is the collapsed core reason.
- `decisionSignal` is the recognition signal the learner should notice next time.
- `nextAction` is the collapsed recommended review action.
- `mistakeTypes` are stored on incorrect or partial attempts as `mistakeTypeRefs`.
- `distractorExplanations` explains why each incorrect option is weaker; do not reuse the same explanation for multiple distractors.
- Optional `details` can hold longer notes, but long explanation text should stay behind the feedback disclosure in the UI.

Do not add generic feedback such as "Correct because this is correct" or copy-only answer reveals. Feedback should name the pattern signal, constraint, complexity tradeoff, invariant, edge case, or mistake type that mattered.

## Forbidden Terms

Visible content and model text must not use the platform/model terms listed in `ALGORITHM_FORBIDDEN_MODEL_TERMS`, including:

- `readiness`
- `retention`
- `mastery`
- `streak`
- `leaderboard`
- `leetcode`
- `ai-generated`
- `llm-generated`
- `mock`
- `demo`
- `legacy`
- `compatibility`
- `migration`
- `alias`
- `temporary`
- `provisional`
- `placeholder`
- `fallback`
- `draft`

## Validation

The content loader and tests validate:

- manifest track id and content version
- manifest groups against imported JSON files
- imported JSON files against manifest groups
- unique folder names and question file paths
- group item counts
- item `trackId`
- item `roadmapNodeId`
- item `difficulty`
- globally unique item ids
- active item roadmap availability
- active option-based item distractor explanations, including duplicate explanation text
- generic or empty feedback text
- per-item Algorithms content quality
- total item count
- complete, unique `itemOrder`

`itemOrder` is intentionally kept for now. The current exported order is not equivalent to roadmap order plus JSON file order, and changing it would affect public item ordering and session selection behavior.
