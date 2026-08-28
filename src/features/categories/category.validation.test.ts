import { createCategorySchema } from './category.validation';

describe('createCategorySchema', () => {
  it('accepts valid input with name only', () => {
    const result = createCategorySchema.safeParse({ name: 'Kitchenware' });

    expect(result.success).toBe(true);
  });

  it('rejects a blank name', () => {
    const result = createCategorySchema.safeParse({ name: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Enter a category name');
    }
  });

  it('rejects a whitespace-only name after trimming', () => {
    const result = createCategorySchema.safeParse({ name: '   ' });

    expect(result.success).toBe(false);
  });

  it('rejects a name longer than 50 characters', () => {
    const result = createCategorySchema.safeParse({
      name: 'a'.repeat(51),
    });

    expect(result.success).toBe(false);
  });

  it('accepts and trims the icon field', () => {
    const result = createCategorySchema.safeParse({
      name: 'Storage',
      icon: '  📦  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.icon).toBe('📦');
    }
  });
});
