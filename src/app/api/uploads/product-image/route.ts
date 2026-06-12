import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSlug } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie uma imagem válida." }, { status: 400 });
  }

  const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Formato de imagem não suportado." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = createSlug(file.name.replace(/\.[^.]+$/, "")) || "produto";
  const extension = file.name.includes(".") ? file.name.split(".").pop() ?? "png" : "png";
  const fileName = `${safeName}-${Date.now()}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads", "products");
  const absolutePath = path.join(directory, fileName);

  await mkdir(directory, { recursive: true });
  await writeFile(absolutePath, buffer);

  return NextResponse.json({ path: `/uploads/products/${fileName}` }, { status: 201 });
}
