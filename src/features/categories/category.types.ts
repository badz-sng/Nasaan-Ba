export interface Category {
  id: string;
  name: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithCount extends Category {
  itemCount: number;
}

export interface CreateCategoryInput {
  name: string;
  icon?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string | null;
}
