export type ContentPackGroupManifest<GroupId extends string = string> = {
  folderName: string;
  itemCount: number;
  questionFile: string;
  roadmapNodeId: GroupId;
};

export type ContentPackManifest<TrackId extends string = string, GroupId extends string = string> = {
  contentVersion: string;
  groups: readonly ContentPackGroupManifest<GroupId>[];
  itemCount: number;
  itemOrder?: readonly string[];
  trackId: TrackId;
};

export type ContentPackGroup<Item, GroupId extends string = string> = {
  folderName: string;
  itemCount: number;
  items: readonly Item[];
  questionFile: string;
  roadmapNodeId: GroupId;
};

export type ContentPackValidationInput<Item, TrackId extends string, GroupId extends string> = {
  expectedContentVersion: string;
  expectedTrackId: TrackId;
  getItemId: (item: Item) => string | undefined;
  getItemTrackId?: (item: Item) => string | undefined;
  groups: readonly ContentPackGroup<Item, GroupId>[];
  manifest: ContentPackManifest<TrackId, GroupId>;
};

export function validateContentPackManifest<Item, TrackId extends string, GroupId extends string>(
  input: ContentPackValidationInput<Item, TrackId, GroupId>,
): string[] {
  const issues: string[] = [];
  const itemIds = new Set<string>();
  const manifestGroupIds = new Set<GroupId>();
  const manifestQuestionFiles = new Set<string>();
  const manifestFolderNames = new Set<string>();
  const importedGroupIds = new Set<GroupId>();
  const manifestGroupsById = new Map<GroupId, ContentPackGroupManifest<GroupId>>();
  const groupsById = new Map<GroupId, ContentPackGroup<Item, GroupId>>();

  if (input.manifest.trackId !== input.expectedTrackId) {
    issues.push(
      `Content pack manifest trackId must be "${input.expectedTrackId}"; received ${String(input.manifest.trackId)}.`,
    );
  }

  if (input.manifest.contentVersion !== input.expectedContentVersion) {
    issues.push(
      `Content pack manifest contentVersion must be "${input.expectedContentVersion}"; received ${String(input.manifest.contentVersion)}.`,
    );
  }

  for (const manifestGroup of input.manifest.groups) {
    if (manifestGroupIds.has(manifestGroup.roadmapNodeId)) {
      issues.push(`Content pack manifest duplicates group: ${manifestGroup.roadmapNodeId}.`);
    }
    manifestGroupIds.add(manifestGroup.roadmapNodeId);
    manifestGroupsById.set(manifestGroup.roadmapNodeId, manifestGroup);

    if (manifestFolderNames.has(manifestGroup.folderName)) {
      issues.push(`Content pack manifest duplicates folderName: ${manifestGroup.folderName}.`);
    }
    manifestFolderNames.add(manifestGroup.folderName);

    if (manifestQuestionFiles.has(manifestGroup.questionFile)) {
      issues.push(`Content pack manifest duplicates questionFile: ${manifestGroup.questionFile}.`);
    }
    manifestQuestionFiles.add(manifestGroup.questionFile);

    const expectedQuestionFiles = [
      `items/${manifestGroup.folderName}/questions.json`,
      `items/${manifestGroup.folderName}/index.ts`,
    ];
    if (!expectedQuestionFiles.includes(manifestGroup.questionFile)) {
      issues.push(
        `Content pack manifest group ${manifestGroup.roadmapNodeId} questionFile must be one of ${expectedQuestionFiles.join(" or ")}; received ${manifestGroup.questionFile}.`,
      );
    }
  }

  for (const group of input.groups) {
    if (importedGroupIds.has(group.roadmapNodeId)) {
      issues.push(`Content pack imports duplicate group: ${group.roadmapNodeId}.`);
    }
    importedGroupIds.add(group.roadmapNodeId);
    groupsById.set(group.roadmapNodeId, group);

    const manifestGroup = manifestGroupsById.get(group.roadmapNodeId);

    if (!manifestGroup) {
      issues.push(`Content pack imported group missing from manifest: ${group.roadmapNodeId}.`);
      continue;
    }

    if (manifestGroup.folderName !== group.folderName) {
      issues.push(
        `Content pack group ${group.roadmapNodeId} folderName mismatch: manifest has ${manifestGroup.folderName}, import has ${group.folderName}.`,
      );
    }

    if (manifestGroup.questionFile !== group.questionFile) {
      issues.push(
        `Content pack group ${group.roadmapNodeId} questionFile mismatch: manifest has ${manifestGroup.questionFile}, import has ${group.questionFile}.`,
      );
    }

    if (manifestGroup.itemCount !== group.items.length) {
      issues.push(
        `Content pack group ${group.roadmapNodeId} itemCount mismatch: manifest has ${manifestGroup.itemCount}, actual is ${group.items.length}.`,
      );
    }

    if (group.itemCount !== group.items.length) {
      issues.push(
        `Content pack group ${group.roadmapNodeId} imported itemCount mismatch: group has ${group.itemCount}, actual is ${group.items.length}.`,
      );
    }

    for (const item of group.items) {
      const itemId = input.getItemId(item);
      const itemLabel = itemId ?? `${group.roadmapNodeId}:unknown-item`;

      if (!itemId) {
        issues.push(`Content pack item ${itemLabel} must have a non-empty id.`);
      } else if (itemIds.has(itemId)) {
        issues.push(`Content pack item id is duplicated: ${itemId}.`);
      } else {
        itemIds.add(itemId);
      }

      const itemTrackId = input.getItemTrackId?.(item);
      if (itemTrackId !== undefined && itemTrackId !== input.expectedTrackId) {
        issues.push(`Content pack item ${itemLabel} has invalid trackId: ${itemTrackId}.`);
      }
    }
  }

  for (const manifestGroup of input.manifest.groups) {
    if (!groupsById.has(manifestGroup.roadmapNodeId)) {
      issues.push(`Content pack manifest group missing imported items: ${manifestGroup.roadmapNodeId}.`);
    }
  }

  if (input.manifest.itemCount !== itemIds.size) {
    issues.push(`Content pack manifest itemCount mismatch: manifest has ${input.manifest.itemCount}, actual is ${itemIds.size}.`);
  }

  if (input.manifest.itemOrder) {
    issues.push(...validateContentPackItemOrder(input.manifest.itemOrder, itemIds));
  }

  return issues;
}

export function validateContentPackItemOrder(
  itemOrder: readonly string[],
  itemIds: ReadonlySet<string>,
): string[] {
  const issues: string[] = [];
  const orderedItemIds = new Set<string>();

  for (const itemId of itemOrder) {
    if (orderedItemIds.has(itemId)) {
      issues.push(`Content pack itemOrder duplicates item: ${itemId}.`);
      continue;
    }

    orderedItemIds.add(itemId);

    if (!itemIds.has(itemId)) {
      issues.push(`Content pack itemOrder references missing item: ${itemId}.`);
    }
  }

  const missingOrderedIds = [...itemIds].filter((itemId) => !orderedItemIds.has(itemId));
  if (missingOrderedIds.length > 0) {
    issues.push(`Content pack itemOrder omits items: ${missingOrderedIds.join(", ")}.`);
  }

  return issues;
}
