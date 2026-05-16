import { z } from 'zod';

export const PersonResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  department: z.string().min(1),
});

export const SearchPersonSchema = z.object({
  q: z.string().min(2).max(100),
});

export const SavePersonPreferencesSchema = z.object({
  personIds: z.array(z.number().int().positive()).max(15),
  type: z.enum(['directors', 'actors']),
});

export type Person = z.infer<typeof PersonResponseSchema>;
export type SearchPersonInput = z.infer<typeof SearchPersonSchema>;
export type SavePersonPreferencesInput = z.infer<typeof SavePersonPreferencesSchema>;
