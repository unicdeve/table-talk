import { z } from 'zod';

import { categories, searchMenu } from '@/lib/tabletalk/menu';

const filters = z.object({
  query: z.string().max(100).optional(),
  category: z.enum(categories).optional(),
  vegetarian: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  maxPrice: z.coerce.number().finite().nonnegative().optional(),
});

export function GET(request: Request) {
  const result = filters.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!result.success) return Response.json({ error: 'Invalid menu filters.' }, { status: 400 });
  return Response.json({
    items: searchMenu(result.data),
    currency: 'NGN',
    allergenNotice:
      'Allergen and cross-contact information is not verified. Contact the restaurant before ordering.',
  });
}
