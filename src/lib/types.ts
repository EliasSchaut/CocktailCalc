export type Ingredient = {
  name: string;
  price: number;
  alcohol: boolean;
};

export type IngredientWithAmount = {
  name: string;
  amount: number;
};

export type RecipeWithIngredients = {
  name: string;
  description: string | null;
  price: number;
  alcohol: boolean;
  ingredients: IngredientWithAmount[];
};

export type RecipeWithAmount = {
  name: string;
  amount: number;
};

export type EventWithRecipes = {
  name: string;
  price: number;
  recipes: RecipeWithAmount[];
};

export type EventList = {
  ingredients: IngredientWithAmount[];
  price: number;
};

/** Full data dump used by export/import. */
export type DataExport = {
  version: 1;
  exportedAt?: string;
  ingredients: Ingredient[];
  recipes: {
    name: string;
    description: string | null;
    ingredients: IngredientWithAmount[];
  }[];
  events: { name: string; recipes: RecipeWithAmount[] }[];
};

export type ImportResult = {
  ingredients: number;
  recipes: number;
  events: number;
};
