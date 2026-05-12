import { create } from 'zustand';

import type { Recipe, RecipeDraft, Tag, ViewMode } from '../types/recipe';
import { loadRecipes, saveRecipes, type PersistedRecipeState } from '../utils/storage';

type RecipeStore = {
  recipes: Recipe[];
  tags: Tag[];
  viewMode: ViewMode;
  managementMode: boolean;
  addRecipe: (recipe: Recipe) => Promise<void>;
  updateRecipe: (id: string, data: RecipeDraft) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  setViewMode: (mode: ViewMode) => Promise<void>;
  setManagementMode: (enabled: boolean) => Promise<void>;
  addTag: (name: string) => Promise<void>;
  renameTag: (id: string, name: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  hydrate: () => Promise<void>;
};

let saveQueue = Promise.resolve();

function persistState(state: PersistedRecipeState): Promise<void> {
  saveQueue = saveQueue
    .catch(() => undefined)
    .then(() => saveRecipes(state));

  return saveQueue;
}

function getTagId(tags: Tag[], timestamp: number): string {
  const prefix = `tag-${timestamp}-`;
  const nextSequence =
    tags.reduce((highestSequence, tag) => {
      if (!tag.id.startsWith(prefix)) {
        return highestSequence;
      }

      const sequence = Number(tag.id.slice(prefix.length));
      return Number.isNaN(sequence)
        ? highestSequence
        : Math.max(highestSequence, sequence);
    }, 0) + 1;

  return `${prefix}${nextSequence}`;
}

function buildState(state: RecipeStore): PersistedRecipeState {
  return {
    recipes: state.recipes,
    tags: state.tags,
    viewMode: state.viewMode,
    managementMode: state.managementMode,
  };
}

function sanitizeRecipeTags(recipes: Recipe[], tags: Tag[]): Recipe[] {
  const validTagIds = new Set(tags.map((tag) => tag.id));

  return recipes.map((recipe) => ({
    ...recipe,
    tagIds: recipe.tagIds.filter((tagId) => validTagIds.has(tagId)),
  }));
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  tags: [],
  viewMode: 'list',
  managementMode: false,
  hydrate: async () => {
    const persistedState = await loadRecipes();
    set({
      ...persistedState,
      recipes: sanitizeRecipeTags(persistedState.recipes, persistedState.tags),
    });
  },
  addRecipe: async (recipe) => {
    const nextState: PersistedRecipeState = {
      ...buildState(get()),
      recipes: [recipe, ...get().recipes],
    };

    set(nextState);
    await persistState(nextState);
  },
  updateRecipe: async (id, data) => {
    const validTagIds = new Set(get().tags.map((tag) => tag.id));
    const nextState: PersistedRecipeState = {
      ...buildState(get()),
      recipes: get().recipes.map((recipe) =>
        recipe.id === id
          ? {
              ...recipe,
              ...data,
              tagIds: data.tagIds.filter((tagId) => validTagIds.has(tagId)),
            }
          : recipe
      ),
    };

    set(nextState);
    await persistState(nextState);
  },
  deleteRecipe: async (id) => {
    const nextState: PersistedRecipeState = {
      ...buildState(get()),
      recipes: get().recipes.filter((recipe) => recipe.id !== id),
    };

    set(nextState);
    await persistState(nextState);
  },
  setViewMode: async (mode) => {
    const nextState: PersistedRecipeState = {
      ...buildState(get()),
      viewMode: mode,
    };

    set(nextState);
    await persistState(nextState);
  },
  setManagementMode: async (enabled) => {
    const nextState: PersistedRecipeState = {
      ...buildState(get()),
      managementMode: enabled,
    };

    set(nextState);
    await persistState(nextState);
  },
  addTag: async (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const normalizedName = trimmedName.toLowerCase();
    const hasDuplicate = get().tags.some(
      (tag) => tag.name.trim().toLowerCase() === normalizedName
    );

    if (hasDuplicate) {
      return;
    }

    const timestamp = Date.now();
    const newTag: Tag = {
      id: getTagId(get().tags, timestamp),
      name: trimmedName,
    };

    const nextState: PersistedRecipeState = {
      ...buildState(get()),
      tags: [...get().tags, newTag],
    };

    set(nextState);
    await persistState(nextState);
  },
  renameTag: async (id, name) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const normalizedName = trimmedName.toLowerCase();
    const hasDuplicate = get().tags.some(
      (tag) => tag.id !== id && tag.name.trim().toLowerCase() === normalizedName
    );

    if (hasDuplicate) {
      return;
    }

    const nextState: PersistedRecipeState = {
      ...buildState(get()),
      tags: get().tags.map((tag) =>
        tag.id === id
          ? {
              ...tag,
              name: trimmedName,
            }
          : tag
      ),
    };

    set(nextState);
    await persistState(nextState);
  },
  deleteTag: async (id) => {
    const nextTags = get().tags.filter((tag) => tag.id !== id);
    const nextState: PersistedRecipeState = {
      ...buildState(get()),
      tags: nextTags,
      recipes: get().recipes.map((recipe) => ({
        ...recipe,
        tagIds: recipe.tagIds.filter((tagId) => tagId !== id),
      })),
    };

    set(nextState);
    await persistState(nextState);
  },
}));
