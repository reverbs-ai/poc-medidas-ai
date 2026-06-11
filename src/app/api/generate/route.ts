import { NextRequest, NextResponse } from "next/server";
import { generateRecommendation, applyCrop } from "@/lib/gemini";

export const maxDuration = 90; // 2 chamadas em paralelo ao Gemini (recomendado + folgado)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const clothingImage = formData.get("clothingImage") as File | null;
    const bodyImage = formData.get("bodyImage") as File | null;
    const apiKey = process.env.GEMINI_API_KEY;
    const aspectRatio = (formData.get("aspectRatio") as string) || "3:4";
    const resolution = (formData.get("resolution") as string) || "1K";

    // Medidas da pessoa
    const personMeasurements = {
      height: (formData.get("personHeight") as string) || undefined,
      weight: (formData.get("personWeight") as string) || undefined,
      bust: (formData.get("personBust") as string) || undefined,
      waist: (formData.get("personWaist") as string) || undefined,
      hips: (formData.get("personHips") as string) || undefined,
    };

    if (!clothingImage || !bodyImage) {
      return NextResponse.json(
        { error: "Imagem da roupa e foto do corpo são obrigatórias" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY não configurada no servidor" },
        { status: 500 }
      );
    }

    const clothingBuffer = Buffer.from(await clothingImage.arrayBuffer());
    const bodyBuffer = Buffer.from(await bodyImage.arrayBuffer());

    const result = await generateRecommendation({
      clothingImageBase64: clothingBuffer.toString("base64"),
      clothingImageMimeType: clothingImage.type || "image/jpeg",
      bodyImageBase64: bodyBuffer.toString("base64"),
      bodyImageMimeType: bodyImage.type || "image/jpeg",
      personMeasurements,
      apiKey,
      aspectRatio,
      resolution,
    });

    // Aplicar crop nas duas imagens
    const recommendedCropped = await applyCrop(
      Buffer.from(result.recommendedImageBase64, "base64"),
      aspectRatio
    );
    const looseCropped = await applyCrop(
      Buffer.from(result.looseImageBase64, "base64"),
      aspectRatio
    );

    return NextResponse.json({
      recommendation: result.text,
      recommendedSize: result.recommendedSize,
      looseSize: result.looseSize,
      recommendedImage: recommendedCropped.toString("base64"),
      looseImage: looseCropped.toString("base64"),
      recommendedMimeType: result.recommendedMimeType,
      looseMimeType: result.looseMimeType,
    });
  } catch (error) {
    console.error("Erro:", error);
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
