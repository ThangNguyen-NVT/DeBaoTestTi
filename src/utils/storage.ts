import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Recipe, ViewMode } from '../types/recipe';

const STORAGE_KEY = 'cookbook-os/state';

export type PersistedRecipeState = {
  recipes: Recipe[];
  viewMode: ViewMode;
};

const defaultState: PersistedRecipeState = {
  recipes: [],
  viewMode: 'list',
};

function isRecipe(value: unknown): value is Recipe {
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

export async function saveRecipes(
  recipes: Recipe[],
  viewMode: ViewMode
): Promise<void> {
  const payload: PersistedRecipeState = {
    recipes,
    viewMode,
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function loadRecipes(): Promise<PersistedRecipeState> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return defaultState;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PersistedRecipeState>;
    const recipes = Array.isArray(parsed.recipes)
      ? parsed.recipes.filter(isRecipe)
      : [];
    const viewMode = parsed.viewMode === 'grid' ? 'grid' : 'list';

    return {
      recipes,
      viewMode,
    };
  } catch {
    return defaultState;
  }
}
