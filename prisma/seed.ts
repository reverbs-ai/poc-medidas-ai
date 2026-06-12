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

  await prisma.product.upsert({
    where: { slug: "vestido-festivo-floral" },
    update: {
      name: "Vestido Festivo Floral",
      description: "Vestido feminino vermelho com bordados florais, cadastrado com imagem de referência baixada para a POC.",
      imagePath: "/demo-products/feminino/vestido-festivo.webp",
    },
    create: {
      slug: "vestido-festivo-floral",
      name: "Vestido Festivo Floral",
      description: "Vestido feminino vermelho com bordados florais, cadastrado com imagem de referência baixada para a POC.",
      imagePath: "/demo-products/feminino/vestido-festivo.webp",
      layout: {
        create: {
          name: "Grade vestido feminino",
          description: "Medidas focadas em busto, cintura, quadril e comprimento para vestidos.",
          sizes: {
            create: [
              { label: "P", sortOrder: 1, bust: 88, waist: 68, hip: 94, length: 96, sleeve: 18, notes: "Caimento acinturado" },
              { label: "M", sortOrder: 2, bust: 96, waist: 76, hip: 102, length: 99, sleeve: 19, notes: "Padrão" },
              { label: "G", sortOrder: 3, bust: 104, waist: 84, hip: 110, length: 102, sleeve: 20, notes: "Mais confortável" },
            ],
          },
        },
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "vestido-branco-cerimonia" },
    update: {
      name: "Vestido Branco Cerimônia",
      description: "Vestido feminino branco de cerimônia para demonstrar produtos com imagem real e grade própria.",
      imagePath: "/demo-products/feminino/vestido-noiva.webp",
    },
    create: {
      slug: "vestido-branco-cerimonia",
      name: "Vestido Branco Cerimônia",
      description: "Vestido feminino branco de cerimônia para demonstrar produtos com imagem real e grade própria.",
      imagePath: "/demo-products/feminino/vestido-noiva.webp",
      layout: {
        create: {
          name: "Grade cerimônia feminina",
          description: "Grade de vestido longo com tolerância maior em comprimento e busto.",
          sizes: {
            create: [
              { label: "PP", sortOrder: 1, bust: 84, waist: 64, hip: 90, length: 136, sleeve: 12, notes: "Modelo ajustado" },
              { label: "P", sortOrder: 2, bust: 90, waist: 70, hip: 96, length: 140, sleeve: 12, notes: "Padrão" },
              { label: "M", sortOrder: 3, bust: 98, waist: 78, hip: 104, length: 144, sleeve: 13, notes: "Caimento confortável" },
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
