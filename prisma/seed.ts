import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const demoSlugs = [
  "camiseta-classica",
  "moletom-oversized",
  "vestido-festivo-floral",
  "vestido-branco-cerimonia",
  "vestido-midi-canelado",
  "blazer-alfaiataria-rosa",
  "calca-wide-leg-jeans",
  "camisa-cropped-linho",
  "jaqueta-jeans-oversized",
  "conjunto-moletinho-premium",
];

const modernFashionProducts = [
  {
    slug: "vestido-midi-canelado",
    name: "Vestido Midi Canelado",
    description:
      "Vestido feminino moderno em malha canelada, estilo loja de departamento, pensado para vitrine fashion casual.",
    imagePath: "/demo-products/moda/vestido-midi-canelado.svg",
    layout: {
      name: "Grade vestido midi",
      description: "Medidas para vestido casual com foco em busto, cintura, quadril e comprimento midi.",
      sizes: [
        { label: "PP", sortOrder: 1, bust: 82, waist: 62, hip: 88, length: 104, sleeve: 0, notes: "Modelagem ajustada" },
        { label: "P", sortOrder: 2, bust: 88, waist: 68, hip: 94, length: 106, sleeve: 0, notes: "Padrão varejo" },
        { label: "M", sortOrder: 3, bust: 96, waist: 76, hip: 102, length: 108, sleeve: 0, notes: "Confortável" },
        { label: "G", sortOrder: 4, bust: 104, waist: 84, hip: 110, length: 110, sleeve: 0, notes: "Caimento solto" },
      ],
    },
  },
  {
    slug: "blazer-alfaiataria-rosa",
    name: "Blazer Alfaiataria Rosa",
    description:
      "Blazer feminino de alfaiataria leve em tom rosé, peça de moda urbana para composição de looks de trabalho e passeio.",
    imagePath: "/demo-products/moda/blazer-alfaiataria-rosa.svg",
    layout: {
      name: "Grade blazer feminino",
      description: "Grade para terceira peça com medidas de busto, cintura, quadril, comprimento e manga longa.",
      sizes: [
        { label: "P", sortOrder: 1, bust: 92, waist: 84, hip: 96, length: 68, sleeve: 59, notes: "Ombro estruturado" },
        { label: "M", sortOrder: 2, bust: 100, waist: 92, hip: 104, length: 70, sleeve: 60, notes: "Padrão" },
        { label: "G", sortOrder: 3, bust: 108, waist: 100, hip: 112, length: 72, sleeve: 61, notes: "Mais amplo" },
      ],
    },
  },
  {
    slug: "calca-wide-leg-jeans",
    name: "Calça Wide Leg Jeans",
    description:
      "Calça jeans feminina wide leg, tendência casual contemporânea para demonstrar medidas de cintura, quadril e comprimento.",
    imagePath: "/demo-products/moda/calca-wide-leg-jeans.svg",
    layout: {
      name: "Grade calça wide leg",
      description: "Tabela adaptada para calça: busto e manga ficam zerados por não se aplicarem ao produto.",
      sizes: [
        { label: "34", sortOrder: 1, bust: 0, waist: 66, hip: 94, length: 106, sleeve: 0, notes: "Cintura alta" },
        { label: "36", sortOrder: 2, bust: 0, waist: 70, hip: 98, length: 108, sleeve: 0, notes: "Padrão" },
        { label: "38", sortOrder: 3, bust: 0, waist: 74, hip: 102, length: 110, sleeve: 0, notes: "Wide leg" },
        { label: "40", sortOrder: 4, bust: 0, waist: 78, hip: 106, length: 112, sleeve: 0, notes: "Wide leg" },
      ],
    },
  },
  {
    slug: "camisa-cropped-linho",
    name: "Camisa Cropped Linho",
    description:
      "Camisa feminina cropped com aspecto de linho, visual clean e atual para looks leves de verão.",
    imagePath: "/demo-products/moda/camisa-cropped-linho.svg",
    layout: {
      name: "Grade camisa cropped",
      description: "Medidas para camisa curta com manga e largura de busto mais solta.",
      sizes: [
        { label: "P", sortOrder: 1, bust: 94, waist: 86, hip: 90, length: 48, sleeve: 24, notes: "Cropped" },
        { label: "M", sortOrder: 2, bust: 102, waist: 94, hip: 98, length: 50, sleeve: 25, notes: "Cropped" },
        { label: "G", sortOrder: 3, bust: 110, waist: 102, hip: 106, length: 52, sleeve: 26, notes: "Soltinha" },
      ],
    },
  },
  {
    slug: "jaqueta-jeans-oversized",
    name: "Jaqueta Jeans Oversized",
    description:
      "Jaqueta jeans feminina oversized, peça jovem e versátil para compor looks de moda casual urbana.",
    imagePath: "/demo-products/moda/jaqueta-jeans-oversized.svg",
    layout: {
      name: "Grade jaqueta oversized",
      description: "Grade com caimento amplo, manga longa e comprimento de jaqueta.",
      sizes: [
        { label: "P", sortOrder: 1, bust: 108, waist: 104, hip: 106, length: 60, sleeve: 58, notes: "Oversized leve" },
        { label: "M", sortOrder: 2, bust: 116, waist: 112, hip: 114, length: 62, sleeve: 59, notes: "Oversized" },
        { label: "G", sortOrder: 3, bust: 124, waist: 120, hip: 122, length: 64, sleeve: 60, notes: "Bem ampla" },
      ],
    },
  },
  {
    slug: "conjunto-moletinho-premium",
    name: "Conjunto Moletinho Premium",
    description:
      "Conjunto feminino em moletinho com blusa e calça jogger, confortável e atual para vitrine de moda casual.",
    imagePath: "/demo-products/moda/conjunto-moletinho-premium.svg",
    layout: {
      name: "Grade conjunto feminino",
      description: "Medidas combinadas para conjunto casual, considerando blusa e calça em um cadastro de produto.",
      sizes: [
        { label: "P", sortOrder: 1, bust: 94, waist: 68, hip: 98, length: 62, sleeve: 56, notes: "Conjunto P" },
        { label: "M", sortOrder: 2, bust: 102, waist: 76, hip: 106, length: 64, sleeve: 57, notes: "Conjunto M" },
        { label: "G", sortOrder: 3, bust: 110, waist: 84, hip: 114, length: 66, sleeve: 58, notes: "Conjunto G" },
      ],
    },
  },
];

async function main() {
  await prisma.product.deleteMany({
    where: {
      slug: { in: demoSlugs },
    },
  });

  for (const product of modernFashionProducts) {
    await prisma.product.create({
      data: {
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
