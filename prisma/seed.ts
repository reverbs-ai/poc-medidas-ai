import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const productSlugs = ["product-1", "product-2"];

const products = [
  {
    slug: "product-1",
    name: "Blusa Frente Única em Suede com Decote Degagê Branco",
    description:
      "Blusa feminina em suede branco, frente única com decote degagê e caimento sofisticado para vitrine de moda casual premium.",
    imagePath: "/demo-products/produtos/product-1.webp",
    layout: {
      name: "Grade blusa frente única",
      description:
        "Tabela para blusa feminina sem manga, com foco em busto, cintura, comprimento e abertura de cava/decote.",
      sizes: [
        { label: "PP", sortOrder: 1, bust: 80, waist: 64, hip: 86, length: 48, sleeve: 0, notes: "Caimento ajustado" },
        { label: "P", sortOrder: 2, bust: 86, waist: 70, hip: 92, length: 50, sleeve: 0, notes: "Padrão varejo" },
        { label: "M", sortOrder: 3, bust: 92, waist: 76, hip: 98, length: 52, sleeve: 0, notes: "Confortável" },
        { label: "G", sortOrder: 4, bust: 100, waist: 84, hip: 106, length: 54, sleeve: 0, notes: "Mais solta" },
      ],
    },
  },
  {
    slug: "product-2",
    name: "Blusa Justinha em Renda com Manga Longa Preto",
    description:
      "Blusa preta em renda, modelagem justinha e manga longa, ideal para apresentar uma peça fashion com informação de medida clara.",
    imagePath: "/demo-products/produtos/product-2.webp",
    layout: {
      name: "Grade blusa renda manga longa",
      description:
        "Tabela para blusa ajustada de manga longa, considerando busto, cintura, quadril, comprimento e manga.",
      sizes: [
        { label: "PP", sortOrder: 1, bust: 78, waist: 62, hip: 82, length: 58, sleeve: 58, notes: "Ajustada" },
        { label: "P", sortOrder: 2, bust: 84, waist: 68, hip: 88, length: 60, sleeve: 59, notes: "Padrão" },
        { label: "M", sortOrder: 3, bust: 90, waist: 74, hip: 94, length: 62, sleeve: 60, notes: "Justinha" },
        { label: "G", sortOrder: 4, bust: 98, waist: 82, hip: 102, length: 64, sleeve: 61, notes: "Mais confortável" },
      ],
    },
  },
];

async function main() {
  await prisma.product.deleteMany({
    where: {
      slug: { notIn: productSlugs },
    },
  });

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        imagePath: product.imagePath,
        layout: {
          upsert: {
            create: {
              name: product.layout.name,
              description: product.layout.description,
              sizes: {
                create: product.layout.sizes,
              },
            },
            update: {
              name: product.layout.name,
              description: product.layout.description,
              sizes: {
                deleteMany: {},
                create: product.layout.sizes,
              },
            },
          },
        },
      },
      create: {
        slug: product.slug,
        name: product.name,
        description: product.description,
        imagePath: product.imagePath,
        layout: {
          create: {
            name: product.layout.name,
            description: product.layout.description,
            sizes: {
              create: product.layout.sizes,
            },
          },
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
