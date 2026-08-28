import { createItemSchema } from './item.validation';

describe('createItemSchema', () => {
  it('accepts name and locationId only and defaults quantity to 1', () => {
    const result = createItemSchema.safeParse({
      name: 'Box',
      locationId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });

  it('rejects a blank name', () => {
    const result = createItemSchema.safeParse({
      name: '',
      locationId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid locationId', () => {
    const result = createItemSchema.safeParse({
      name: 'Box',
      locationId: 'not-a-uuid',
    });

    expect(result.success).toBe(false);
  });

  it('rejects quantity values below 1', () => {
    const zeroResult = createItemSchema.safeParse({
      name: 'Box',
      locationId: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 0,
    });

    const negativeResult = createItemSchema.safeParse({
      name: 'Box',
      locationId: '550e8400-e29b-41d4-a716-446655440000',
      quantity: -1,
    });

    expect(zeroResult.success).toBe(false);
    expect(negativeResult.success).toBe(false);
  });
});
