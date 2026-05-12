export type Tag = {
  id: string;
  name: string;
};

export type Recipe = {
  id: string;
  name: string;
  instructions: string;
  tagIds: string[];
  createdAt: number;
};

export type ViewMode = 'list' | 'grid';

export type RecipeDraft = Pick<Recipe, 'name' | 'instructions' | 'tagIds'>;
