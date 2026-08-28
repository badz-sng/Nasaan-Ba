import { createCategorySchema, updateCategorySchema } from './category.validation';
import { categoryRepository } from './category.repository';
import type { Category, CategoryWithCount } from './category.types';

export class CategoryServiceError extends Error {
  constructor(message: string, public readonly fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'CategoryServiceError';
  }
}

class CategoryService {
  async getAllCategories(): Promise<CategoryWithCount[]> {
    return categoryRepository.findAll();
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return categoryRepository.findById(id);
  }

  async createCategory(rawInput: unknown): Promise<Category> {
    const parsed = createCategorySchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path.join('.')] = issue.message;
      }
      throw new CategoryServiceError('The category details are invalid.', fieldErrors);
    }

    try {
      return await categoryRepository.create(parsed.data);
    } catch {
      throw new CategoryServiceError('Could not save the category. Please try again.');
    }
  }

  async updateCategory(id: string, rawInput: unknown): Promise<Category> {
    const parsed = updateCategorySchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path.join('.')] = issue.message;
      }
      throw new CategoryServiceError('The category details are invalid.', fieldErrors);
    }

    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new CategoryServiceError('Category not found.');
    }

    try {
      return await categoryRepository.update(id, parsed.data);
    } catch {
      throw new CategoryServiceError('Could not update the category. Please try again.');
    }
  }

  async deleteCategory(id: string): Promise<void> {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new CategoryServiceError('Category not found.');
    }

    const itemCount = await categoryRepository.countItemsUsingCategory(id);
    if (itemCount > 0) {
      throw new CategoryServiceError(
        `This category has ${itemCount} item(s). Move or update them first.`
      );
    }

    try {
      await categoryRepository.delete(id);
    } catch {
      throw new CategoryServiceError('Could not delete the category. Please try again.');
    }
  }
}

export const categoryService = new CategoryService();
