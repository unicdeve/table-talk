import { z } from 'zod';

import { categories } from './menu.ts';

export const searchToolSchema = z
  .object({
    query: z.string().max(100).optional(),
    vegetarian: z.boolean().optional(),
    maxPrice: z.number().finite().nonnegative().optional(),
    category: z.enum(categories).optional(),
  })
  .strict();

export const highlightToolSchema = z.object({ itemIds: z.array(z.string()).max(9) }).strict();

export const updateToolSchema = z
  .object({
    itemId: z.string(),
    action: z.enum(['add', 'set', 'remove']),
    quantity: z.number().int().min(0).max(20),
  })
  .strict();
