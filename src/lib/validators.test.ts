import { describe, expect, it } from 'vitest';

import { createListingSchema } from './validators';

describe('createListingSchema', () => {
  it('rejects whitespace-only required fields', () => {
    const result = createListingSchema.safeParse({
      title: '   ',
      description: 'A short description',
      category: 'Technology',
      availability: '   ',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        title: expect.arrayContaining([expect.stringMatching(/required/i)]),
        availability: expect.arrayContaining([expect.stringMatching(/required/i)]),
      });
    }
  });
});
