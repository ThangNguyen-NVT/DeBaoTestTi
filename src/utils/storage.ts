import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Recipe, Tag, ViewMode } from '../types/recipe';

const STORAGE_KEY = 'cookbook-os/state';

export type PersistedRecipeState = {
  recipes: Recipe[];
  tags: Tag[];
  viewMode: ViewMode;
};

const defaultState: PersistedRecipeState = {
  recipes: [],
  tags: [],
  viewMode: 'list',
};

function isTag(value: unknown): value is Tag {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const tag = value as Record<string, unknown>;
  return typeof tag.id === 'string' && typeof tag.name === 'string';
}

function isLegacyRecipeShape(value: unknown): value is {
  id: string;
  name: string;
  instructions: string;
  createdAt: number;
  tagIds?: unknown;
} {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const recipe = value as Record<string, unknown>;

  return (
    typeof recipe.id === 'string' &&
    typeof recipe.name === 'string' &&
    typeof recipe.instructions === 'string' &&
    typeof recipe.createdAt === 'number'
  );
}

function toRecipe(value: unknown): Recipe | null {
  if (!isLegacyRecipeShape(value)) {
    return null;
  }

  const tagIds = Array.isArray(value.tagIds)
    ? value.tagIds.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    id: value.id,
    name: value.name,
    instructions: value.instructions,
    createdAt: value.createdAt,
    tagIds,
  };
}

export async function saveRecipes(state: PersistedRecipeState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function loadRecipes(): Promise<PersistedRecipeState> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return defaultState;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PersistedRecipeState>;
    const tags = Array.isArray(parsed.tags) ? parsed.tags.filter(isTag) : [];
    const recipes = Array.isArray(parsed.recipes)
      ? parsed.recipes
          .map((recipe) => toRecipe(recipe))
          .filter((recipe): recipe is Recipe => recipe !== null)
      : [];
    const viewMode = parsed.viewMode === 'grid' ? 'grid' : 'list';

    return {
      recipes,
      tags,
      viewMode,
    };
  } catch {
    return defaultState;
  }
}
