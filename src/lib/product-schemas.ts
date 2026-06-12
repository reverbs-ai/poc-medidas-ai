import { z } from "zod";

export const productSizeSchema = z.object({
  label: z.string().min(1, "Informe o tamanho."),
  sortOrder: z.coerce.number().int().min(0).default(0),
  bust: z.coerce.number().min(0),
  waist: z.coerce.number().min(0),
  hip: z.coerce.number().min(0),
  length: z.coerce.number().min(0),
  sleeve: z.coerce.number().min(0),
  notes: z.string().optional().nullable(),
});

export const productPayloadSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  description: z.string().optional().nullable(),
  imagePath: z.string().optional().nullable(),
  layout: z.object({
    name: z.string().min(1, "Informe o nome do layout."),
    description: z.string().optional().nullable(),
  }),
  sizes: z.array(productSizeSchema).default([]),
});

export type ProductPayload = z.infer<typeof productPayloadSchema>;
export type ProductSizePayload = z.infer<typeof productSizeSchema>;
