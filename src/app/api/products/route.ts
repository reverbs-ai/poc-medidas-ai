import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSlug } from "@/lib/slug";
import { productPayloadSchema } from "@/lib/product-schemas";
import type { Product, ProductLayout, ProductSize } from "@prisma/client";

export const dynamic = "force-dynamic";

type ProductWithRelations = Product & {
  layout: (ProductLayout & { sizes: ProductSize[] }) | null;
};

function toPlainProduct(product: ProductWithRelations) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    imagePath: product.imagePath,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    layout: product.layout
      ? {
          id: product.layout.id,
          name: product.layout.name,
          description: product.layout.description,
        }
      : null,
    sizes:
      product.layout?.sizes.map((size) => ({
        id: size.id,
        label: size.label,
        sortOrder: size.sortOrder,
        bust: size.bust,
        waist: size.waist,
        hip: size.hip,
        length: size.length,
        sleeve: size.sleeve,
        notes: size.notes,
      })) ?? [],
  };
}

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      layout: {
        include: {
          sizes: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ products: products.map((product) => toPlainProduct(product as ProductWithRelations)) });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = productPayloadSchema.parse(json);
    const slug = `${createSlug(payload.name)}-${Math.random().toString(36).slice(2, 8)}`;

    const created = await prisma.product.create({
      data: {
        slug,
        name: payload.name,
        description: payload.description || null,
        imagePath: payload.imagePath || null,
        layout: {
          create: {
            name: payload.layout.name,
            description: payload.layout.description || null,
            sizes: {
              create: payload.sizes.map((size) => ({
                label: size.label,
                sortOrder: size.sortOrder,
                bust: size.bust,
                waist: size.waist,
                hip: size.hip,
                length: size.length,
                sleeve: size.sleeve,
                notes: size.notes || null,
              })),
            },
          },
        },
      },
      include: {
        layout: {
          include: {
            sizes: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json({ product: toPlainProduct(created as ProductWithRelations) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro inesperado ao criar produto.",
      },
      { status: 400 }
    );
  }
}
