import sharp from "sharp";
import { GoogleGenAI } from "@google/genai";
import { determineSizes } from "./sizing";
import type {
  ClothingMeasurements,
  ClothingSize,
  PersonMeasurements,
} from "./types";

export type { PersonMeasurements, ClothingMeasurements } from "./types";
export { PRESET_MEASUREMENTS, CLOTHING_SIZE_CHART, GARMENT_NAME } from "./types";

const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image-preview";

// ── Tipos ──────────────────────────────────────────────

export interface GenerateParams {
  clothingImageBase64: string;
  clothingImageMimeType: string;
  bodyImageBase64: string;
  bodyImageMimeType: string;
  personMeasurements: PersonMeasurements;
  apiKey: string;
  aspectRatio?: string;
  resolution?: string;
}

export interface RecommendationResult {
  text: string;
  recommendedSize: ClothingSize;
  looseSize: ClothingSize;
  recommendedImageBase64: string;
  looseImageBase64: string;
  recommendedMimeType: string;
  looseMimeType: string;
}

interface ImageInput {
  base64: string;
  mimeType: string;
}

// ── Prompt fotorealista (baseado em compose/fashion) ──

const BASE_INSTRUCTIONS =
  "Edit the image to dress the person using the provided clothing image (CLOTHING). " +
  "Do not change the person's face, facial features, skin tone, body shape, pose, or identity in any way. " +
  "Preserve their exact likeness, expression, hairstyle, and proportions. " +
  "Replace only the clothing, fitting the garment naturally to the existing pose and body geometry, " +
  "with realistic fabric behavior. Match the lighting, shadows, and color temperature to the original photo " +
  "so the outfit integrates photorealistically, without looking pasted on. " +
  "Do not alter the background, camera angle, framing, or image quality, " +
  "and do not add accessories, text, logos, or watermarks. " +
  "The garment shown is a women's top (blouse/shirt).";

function formatGarmentMeasurements(m: Required<ClothingMeasurements>): string {
  return `bust ${m.bust}, waist ${m.waist}, hips ${m.hips}, length ${m.length}, sleeve ${m.sleeve}, shoulder ${m.shoulder}`;
}

function formatPersonMeasurements(m: PersonMeasurements): string {
  const parts: string[] = [];
  if (m.height) parts.push(`height ${m.height}`);
  if (m.weight) parts.push(`weight ${m.weight}`);
  if (m.bust) parts.push(`bust ${m.bust}`);
  if (m.waist) parts.push(`waist ${m.waist}`);
  if (m.hips) parts.push(`hips ${m.hips}`);
  return parts.length > 0 ? parts.join(", ") : "not informed";
}

interface FitPromptParams {
  size: ClothingSize;
  garmentMeasurements: Required<ClothingMeasurements>;
  personMeasurements: PersonMeasurements;
}

function buildTryOnPrompt({
  size,
  garmentMeasurements,
  personMeasurements,
}: FitPromptParams): string {
  return [
    BASE_INSTRUCTIONS,
    `Render the garment as size ${size}, following the registered measurements below exactly as they would naturally fit and drape on this person's body.`,
    `Registered garment measurements (size ${size}): ${formatGarmentMeasurements(garmentMeasurements)}.`,
    `Person's body measurements: ${formatPersonMeasurements(personMeasurements)}.`,
    "Use these measurements to inform how the garment realistically drapes and fits on this body at this size.",
  ].join("\n\n");
}

// ── Função principal ───────────────────────────────────

export async function generateRecommendation(
  params: GenerateParams
): Promise<RecommendationResult> {
  const {
    clothingImageBase64,
    clothingImageMimeType,
    bodyImageBase64,
    bodyImageMimeType,
    personMeasurements,
    apiKey,
    aspectRatio = "3:4",
    resolution = "1K",
  } = params;

  const { recommendedSize, looseSize, recommended, loose, reasoning } =
    determineSizes(personMeasurements);

  const client = new GoogleGenAI({ apiKey });

  const clothing: ImageInput = {
    base64: clothingImageBase64,
    mimeType: clothingImageMimeType,
  };
  const body: ImageInput = {
    base64: bodyImageBase64,
    mimeType: bodyImageMimeType,
  };

  const recommendedPrompt = buildTryOnPrompt({
    size: recommendedSize,
    garmentMeasurements: recommended,
    personMeasurements,
  });

  // Quando o tamanho recomendado já é o maior cadastrado, recomendado e
  // folgado são o mesmo tamanho — geramos uma única imagem e reaproveitamos
  // para os dois resultados, em vez de gerar duas imagens diferentes para
  // o mesmo tamanho.
  if (recommendedSize === looseSize) {
    const image = await composeTryOn(client, clothing, body, recommendedPrompt, aspectRatio, resolution);
    return {
      text: reasoning,
      recommendedSize,
      looseSize,
      recommendedImageBase64: image.base64,
      looseImageBase64: image.base64,
      recommendedMimeType: image.mimeType,
      looseMimeType: image.mimeType,
    };
  }

  const loosePrompt = buildTryOnPrompt({
    size: looseSize,
    garmentMeasurements: loose,
    personMeasurements,
  });

  const [recommendedImage, looseImage] = await Promise.all([
    composeTryOn(client, clothing, body, recommendedPrompt, aspectRatio, resolution),
    composeTryOn(client, clothing, body, loosePrompt, aspectRatio, resolution),
  ]);

  return {
    text: reasoning,
    recommendedSize,
    looseSize,
    recommendedImageBase64: recommendedImage.base64,
    looseImageBase64: looseImage.base64,
    recommendedMimeType: recommendedImage.mimeType,
    looseMimeType: looseImage.mimeType,
  };
}

// ── Crop centralizado (igual Fawkes) ───────────────────

export async function applyCrop(
  imageBuffer: Buffer,
  targetAspectRatio: string
): Promise<Buffer> {
  const [w, h] = targetAspectRatio.split(":").map(Number);
  const targetRatio = w / h;

  const metadata = await sharp(imageBuffer).metadata();
  const imgW = metadata.width || 0;
  const imgH = metadata.height || 0;
  if (imgW === 0 || imgH === 0) return imageBuffer;

  const currentRatio = imgW / imgH;
  if (Math.abs(currentRatio - targetRatio) < 0.01) return imageBuffer;

  let cropW = imgW;
  let cropH = imgH;
  if (currentRatio > targetRatio) {
    cropW = Math.round(imgH * targetRatio);
  } else {
    cropH = Math.round(imgW / targetRatio);
  }

  const left = Math.round((imgW - cropW) / 2);
  const top = Math.round((imgH - cropH) / 2);

  return sharp(imageBuffer)
    .extract({ left, top, width: cropW, height: cropH })
    .toBuffer();
}

// ── Chamada à API Gemini (composição multi-imagem) ─────

async function composeTryOn(
  client: GoogleGenAI,
  clothing: ImageInput,
  person: ImageInput,
  prompt: string,
  aspectRatio: string,
  imageSize: string
): Promise<ImageInput> {
  const response = await client.models.generateContent({
    model: GEMINI_IMAGE_MODEL,
    contents: [
      {
        role: "user" as const,
        parts: [
          { text: prompt },
          { text: "[Reference Image: CLOTHING]" },
          {
            inlineData: {
              data: clothing.base64,
              mimeType: clothing.mimeType,
            },
          },
          { text: "[Reference Image: PERSON]" },
          {
            inlineData: {
              data: person.base64,
              mimeType: person.mimeType,
            },
          },
        ],
      },
    ],
    config: {
      temperature: 0.4,
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio,
        imageSize,
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("Sem resposta da API Gemini");

  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || "image/png",
      };
    }
  }

  throw new Error("Nenhuma imagem na resposta da Gemini");
}
