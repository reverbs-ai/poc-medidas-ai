import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { productPayloadSchema } from "@/lib/product-schemas";
import type { Product, ProductLayout, ProductSize } from "@prisma/client";

export const dynamic = "force-dynamic";

type ProductWithRelations = Product & {
  layout: (ProductLayout & { sizes: ProductSize[] }) | null;
};

function toPlainProduct(product: ProductWithRelations | null) {
  if (!product) return null;
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

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
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

  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ product: toPlainProduct(product as ProductWithRelations) });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await request.json();
    const payload = productPayloadSchema.parse(json);

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { layout: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          name: payload.name,
          description: payload.description || null,
          imagePath: payload.imagePath || null,
          layout: {
            upsert: {
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
              update: {
                name: payload.layout.name,
                description: payload.layout.description || null,
              },
            },
          },
        },
      });

      const layout = await tx.productLayout.findUnique({ where: { productId: product.id } });
      if (layout) {
        await tx.productSize.deleteMany({ where: { layoutId: layout.id } });
        await tx.productSize.createMany({
          data: payload.sizes.map((size) => ({
            layoutId: layout.id,
            label: size.label,
            sortOrder: size.sortOrder,
            bust: size.bust,
            waist: size.waist,
            hip: size.hip,
            length: size.length,
            sleeve: size.sleeve,
            notes: size.notes || null,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
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
    });

    return NextResponse.json({ product: toPlainProduct(updated as ProductWithRelations | null) });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro inesperado ao atualizar produto.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro inesperado ao excluir produto.",
      },
      { status: 400 }
    );
  }
}
