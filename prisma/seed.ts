import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.upsert({
    where: { slug: "camiseta-classica" },
    update: {},
    create: {
      slug: "camiseta-classica",
      name: "Camiseta Clássica",
      description: "Produto base para a demonstração da POC.",
      imagePath: "/demo-products/camiseta-classica.svg",
      layout: {
        create: {
          name: "Grade padrão adulto",
          description: "Layout base com medidas corporais principais.",
          sizes: {
            create: [
              {
                label: "P",
                sortOrder: 1,
                bust: 92,
                waist: 72,
                hip: 96,
                length: 62,
                sleeve: 22,
                notes: "Slim",
              },
              {
                label: "M",
                sortOrder: 2,
                bust: 100,
                waist: 80,
                hip: 104,
                length: 65,
                sleeve: 24,
                notes: "Padrão",
              },
              {
                label: "G",
                sortOrder: 3,
                bust: 108,
                waist: 88,
                hip: 112,
                length: 68,
                sleeve: 26,
                notes: "Mais folgada",
              },
            ],
          },
        },
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "moletom-oversized" },
    update: {},
    create: {
      slug: "moletom-oversized",
      name: "Moletom Oversized",
      description: "Segundo produto para seleção no demo.",
      imagePath: "/demo-products/moletom-oversized.svg",
      layout: {
        create: {
          name: "Grade oversized",
          description: "Grade pensada para caimento amplo.",
          sizes: {
            create: [
              {
                label: "P",
                sortOrder: 1,
                bust: 118,
                waist: 110,
                hip: 112,
                length: 69,
                sleeve: 55,
              },
              {
                label: "M",
                sortOrder: 2,
                bust: 124,
                waist: 116,
                hip: 118,
                length: 72,
                sleeve: 56,
              },
            ],
          },
        },
      },
    },
  });
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
