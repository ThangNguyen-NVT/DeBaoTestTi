import { create } from 'zustand';

import type { Recipe, RecipeDraft, Tag, ViewMode } from '../types/recipe';
import type { CookbookExportData, ImportMode } from '../utils/importExport';
import { createCookbookExportData } from '../utils/importExport';
import { loadRecipes, saveRecipes, type PersistedRecipeState } from '../utils/storage';

type RecipeStore = {
  recipes: Recipe[];
  tags: Tag[];
  viewMode: ViewMode;
  addRecipe: (recipe: Recipe) => Promise<void>;
  updateRecipe: (id: string, data: RecipeDraft) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  setViewMode: (mode: ViewMode) => Promise<void>;
  addTag: (name: string) => Promise<void>;
  renameTag: (id: string, name: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  exportData: () => CookbookExportData;
  importData: (data: CookbookExportData, mode: ImportMode) => Promise<void>;
  resetApp: () => Promise<void>;
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
  const existingIds = new Set(tags.map((tag) => tag.id));

  const randomPart = Math.random().toString(36).slice(2, 8);
  const nextId = `tag-${timestamp}-${tags.length + 1}-${randomPart}`;

  if (!existingIds.has(nextId)) {
    return nextId;
  }

  return `tag-${timestamp}-${tags.length + 1}-${Date.now().toString(36)}`;
}

function buildState(state: RecipeStore): PersistedRecipeState {
  return {
    recipes: state.recipes,
    tags: state.tags,
    viewMode: state.viewMode,
  };
}

function sanitizeRecipeTags(recipes: Recipe[], tags: Tag[]): Recipe[] {
  const validTagIds = new Set(tags.map((tag) => tag.id));

  return recipes.map((recipe) => ({
    ...recipe,
    tagIds: recipe.tagIds.filter((tagId) => validTagIds.has(tagId)),
  }));
}

function dedupeTags(tags: Tag[]): Tag[] {
  const uniqueTags: Tag[] = [];
  const seenIds = new Set<string>();

  for (const tag of tags) {
    if (seenIds.has(tag.id)) {
      continue;
    }

    seenIds.add(tag.id);
    uniqueTags.push(tag);
  }

  return uniqueTags;
}

function dedupeRecipes(recipes: Recipe[]): Recipe[] {
  const uniqueRecipes: Recipe[] = [];
  const seenIds = new Set<string>();

  for (const recipe of recipes) {
    if (seenIds.has(recipe.id)) {
      continue;
    }

    seenIds.add(recipe.id);
    uniqueRecipes.push(recipe);
  }

  return uniqueRecipes;
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  tags: [],
  viewMode: 'list',
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
  exportData: () => {
    const currentState = buildState(get());
    return createCookbookExportData(currentState.recipes, currentState.tags);
  },
  importData: async (data, mode) => {
    const currentState = buildState(get());
    const importedTags = dedupeTags(data.tags);
    const importedRecipes = dedupeRecipes(data.recipes);

    const nextTags =
      mode === 'replace' ? importedTags : dedupeTags([...currentState.tags, ...importedTags]);
    const nextRecipes =
      mode === 'replace'
        ? importedRecipes
        : dedupeRecipes([...currentState.recipes, ...importedRecipes]);

    const nextState: PersistedRecipeState = {
      ...currentState,
      tags: nextTags,
      recipes: sanitizeRecipeTags(nextRecipes, nextTags),
    };

    set(nextState);
    await persistState(nextState);
  },
  resetApp: async () => {
    const nextState: PersistedRecipeState = {
      recipes: [],
      tags: [],
      viewMode: 'list',
    };

    set(nextState);
    await persistState(nextState);
  },
}));
