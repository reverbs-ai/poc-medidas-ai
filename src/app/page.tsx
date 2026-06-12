import { prisma } from "@/lib/db/prisma";
import ProductCatalogClient from "@/components/product-catalog-client";

export const dynamic = "force-dynamic";

async function getCatalogData() {
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

  return products.map((product) => ({
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
  }));
}

export default async function HomePage() {
  const products = await getCatalogData();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-provei-gradient font-display text-base font-bold text-white sm:h-10 sm:w-10 sm:text-lg">
              P
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-slate-900 sm:text-xl">PROVEI Fit</h1>
              <p className="text-[10px] text-slate-500 sm:text-xs">Catálogo + medidas + try-on com Gemini</p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
            POC
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <ProductCatalogClient initialProducts={products} />
      </div>
    </main>
  );
}
