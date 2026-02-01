import { z } from "zod";

export const ShopLinksSchema = z.object({
  website: z.string().url().nullable(),
  instagram: z.string().url().nullable(),
  x: z.string().url().nullable(),
  facebook: z.string().url().nullable(),
});

export const ShopSchema = z.object({
  number: z.number().int().positive(),
  name: z.string().min(1),
  imageUrl: z.string().url().nullable(),
  businessHours: z.string(),
  sentraSetHours: z.string().nullable(),
  regularHoliday: z.string(),
  address: z.string(),
  tel: z.string().nullable(),
  description: z.string(),
  links: ShopLinksSchema,
});

export const ShopsSchema = z.array(ShopSchema);

export type ShopLinks = z.infer<typeof ShopLinksSchema>;
export type Shop = z.infer<typeof ShopSchema>;
export type Shops = z.infer<typeof ShopsSchema>;
