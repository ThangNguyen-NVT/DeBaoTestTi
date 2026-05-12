import type { Recipe, Tag } from '../types/recipe';

export const IMPORT_EXPORT_SCHEMA_VERSION = 1;

export type CookbookExportData = {
  version: number;
  // Unix timestamp in seconds.
  exportedAt: number;
  recipes: Recipe[];
  tags: Tag[];
};

export type ImportMode = 'merge' | 'replace';

export type ImportValidationResult =
  | {
      valid: true;
      data: CookbookExportData;
    }
  | {
      valid: false;
      error: string;
    };

function isTag(value: unknown): value is Tag {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const tag = value as Record<string, unknown>;
  return typeof tag.id === 'string' && typeof tag.name === 'string';
}

function isRecipe(value: unknown): value is Recipe {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const recipe = value as Record<string, unknown>;

  return (
    typeof recipe.id === 'string' &&
    typeof recipe.name === 'string' &&
    typeof recipe.instructions === 'string' &&
    typeof recipe.createdAt === 'number' &&
    Array.isArray(recipe.tagIds) &&
    recipe.tagIds.every((tagId) => typeof tagId === 'string')
  );
}

function toCookbookExportData(value: unknown): CookbookExportData | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const payload = value as Record<string, unknown>;

  if (typeof payload.version !== 'number') {
    return null;
  }

  if (payload.version !== IMPORT_EXPORT_SCHEMA_VERSION) {
    return null;
  }

  if (typeof payload.exportedAt !== 'number') {
    return null;
  }

  if (!Array.isArray(payload.recipes) || !payload.recipes.every(isRecipe)) {
    return null;
  }

  if (!Array.isArray(payload.tags) || !payload.tags.every(isTag)) {
    return null;
  }

  return {
    version: payload.version,
    exportedAt: payload.exportedAt,
    recipes: payload.recipes,
    tags: payload.tags,
  };
}

export function createCookbookExportData(recipes: Recipe[], tags: Tag[]): CookbookExportData {
  return {
    version: IMPORT_EXPORT_SCHEMA_VERSION,
    exportedAt: Math.floor(Date.now() / 1000),
    recipes,
    tags,
  };
}

export function validateCookbookImport(rawData: string): ImportValidationResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawData);
  } catch {
    return {
      valid: false,
      error: 'Invalid JSON file format.',
    };
  }

  const data = toCookbookExportData(parsed);

  if (!data) {
    return {
      valid: false,
      error:
        'Invalid backup structure. Required fields: version, exportedAt, recipes[], and tags[].',
    };
  }

  return {
    valid: true,
    data,
  };
}
