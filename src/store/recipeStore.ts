import { create } from 'zustand';

import type { Recipe, RecipeDraft, ViewMode } from '../types/recipe';
import { loadRecipes, saveRecipes, type PersistedRecipeState } from '../utils/storage';

type RecipeStore = {
  recipes: Recipe[];
  viewMode: ViewMode;
  addRecipe: (recipe: Recipe) => Promise<void>;
  updateRecipe: (id: string, data: RecipeDraft) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  setViewMode: (mode: ViewMode) => Promise<void>;
  hydrate: () => Promise<void>;
};

let saveQueue = Promise.resolve();

function persistState(state: PersistedRecipeState): Promise<void> {
  saveQueue = saveQueue
    .catch(() => undefined)
    .then(() => saveRecipes(state.recipes, state.viewMode));

  return saveQueue;
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  viewMode: 'list',
  hydrate: async () => {
    const persistedState = await loadRecipes();
    set(persistedState);
  },
  addRecipe: async (recipe) => {
    const nextState: PersistedRecipeState = {
      recipes: [recipe, ...get().recipes],
      viewMode: get().viewMode,
    };

    set(nextState);
    await persistState(nextState);
  },
  updateRecipe: async (id, data) => {
    const nextState: PersistedRecipeState = {
      recipes: get().recipes.map((recipe) =>
        recipe.id === id
          ? {
              ...recipe,
              ...data,
            }
          : recipe
      ),
      viewMode: get().viewMode,
    };

    set(nextState);
    await persistState(nextState);
  },
  deleteRecipe: async (id) => {
    const nextState: PersistedRecipeState = {
      recipes: get().recipes.filter((recipe) => recipe.id !== id),
      viewMode: get().viewMode,
    };

    set(nextState);
    await persistState(nextState);
  },
  setViewMode: async (mode) => {
    const nextState: PersistedRecipeState = {
      recipes: get().recipes,
      viewMode: mode,
    };

    set(nextState);
    await persistState(nextState);
  },
}));
