export type Recipe = {
  id: string;
  name: string;
  instructions: string;
  createdAt: number;
};

export type ViewMode = 'list' | 'grid';

export type RecipeDraft = Pick<Recipe, 'name' | 'instructions'>;
