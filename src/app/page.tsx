"use client";

import { useState, useRef, ChangeEvent } from "react";
import {
  Shirt,
  PersonStanding,
  Sparkles,
  Lightbulb,
  ImageIcon,
  RefreshCw,
  Download,
  Loader2,
} from "lucide-react";
import {
  PRESET_MEASUREMENTS,
  CLOTHING_SIZE_CHART,
  GARMENT_NAME,
  SIZE_ORDER,
} from "@/lib/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PersonMeasurements {
  height: string;
  weight: string;
  bust: string;
  waist: string;
  hips: string;
}

const ASPECT_RATIOS = [
  { value: "3:4", label: "3:4 (Retrato - Moda)" },
  { value: "2:3", label: "2:3 (Retrato)" },
  { value: "9:16", label: "9:16 (Story/Reels)" },
  { value: "1:1", label: "1:1 (Quadrado)" },
];

const RESOLUTIONS = [
  { value: "1K", label: "1K (Padrão)" },
  { value: "2K", label: "2K (Alta)" },
];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function Home() {
  const [clothingImage, setClothingImage] = useState<File | null>(null);
  const [clothingPreview, setClothingPreview] = useState<string | null>(null);
  const [bodyImage, setBodyImage] = useState<File | null>(null);
  const [bodyPreview, setBodyPreview] = useState<string | null>(null);

  const [personMeasurements, setPersonMeasurements] =
    useState<PersonMeasurements>({ ...PRESET_MEASUREMENTS.person });

  const [aspectRatio, setAspectRatio] = useState("3:4");
  const [resolution, setResolution] = useState("1K");

  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);
  const [looseSize, setLooseSize] = useState<string | null>(null);
  const [recommendedImage, setRecommendedImage] = useState<string | null>(null);
  const [looseImage, setLooseImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  const clothingInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleClothingUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setClothingImage(file);
      setClothingPreview(URL.createObjectURL(file));
    }
  };

  const handleBodyUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBodyImage(file);
      setBodyPreview(URL.createObjectURL(file));
    }
  };

  const handlePersonMeasurement = (
    field: keyof PersonMeasurements,
    value: string
  ) => {
    setPersonMeasurements((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!clothingImage || !bodyImage) {
      setError("Envie a imagem da roupa e a foto do corpo");
      return;
    }

    setLoading(true);
    setError(null);
    setRecommendation(null);
    setRecommendedImage(null);
    setLooseImage(null);
    setRecommendedSize(null);
    setLooseSize(null);

    try {
      setLoadingStep("Gerando imagens com a Gemini...");

      const formData = new FormData();
      formData.append("clothingImage", clothingImage);
      formData.append("bodyImage", bodyImage);
      formData.append("aspectRatio", aspectRatio);
      formData.append("resolution", resolution);

      Object.entries(personMeasurements).forEach(([key, value]) => {
        if (value) formData.append(`person${capitalize(key)}`, value);
      });

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data = await response.json();

      setRecommendation(data.recommendation);
      setRecommendedSize(data.recommendedSize);
      setLooseSize(data.looseSize);
      setRecommendedImage(
        `data:${data.recommendedMimeType};base64,${data.recommendedImage}`
      );
      setLooseImage(`data:${data.looseMimeType};base64,${data.looseImage}`);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleDownload = (imageSrc: string, filename: string) => {
    if (!imageSrc) return;
    const a = document.createElement("a");
    a.href = imageSrc;
    a.download = filename;
    a.click();
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-provei-gradient flex items-center justify-center text-base sm:text-lg font-bold font-display text-white">
              M
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold font-display text-slate-900">
                Moda POC
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500">
                Recomendação + Try-on com Gemini
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-slate-200 bg-slate-50 text-slate-500 text-xs"
          >
            <Sparkles className="h-3 w-3" />
            POC
          </Badge>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* ── Coluna Esquerda: Inputs ── */}
          <div className="space-y-5">
            {/* Upload de Imagens */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Imagens</CardTitle>
                <CardDescription>
                  Envie a foto da roupa e a foto do corpo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-xs mb-2 block">
                      Imagem da Roupa *
                    </Label>
                    <input
                      ref={clothingInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleClothingUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => clothingInputRef.current?.click()}
                      className={cn(
                        "w-full aspect-square rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer",
                        clothingPreview
                          ? "border-primary/50 bg-primary/5"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50"
                      )}
                    >
                      {clothingPreview ? (
                        <img
                          src={clothingPreview}
                          alt="Roupa"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <>
                          <Shirt className="h-7 w-7 sm:h-8 sm:w-8 text-slate-300" />
                          <span className="text-[10px] sm:text-xs text-slate-400">
                            Clique para enviar
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                  <div>
                    <Label className="text-xs mb-2 block">
                      Foto do Corpo *
                    </Label>
                    <input
                      ref={bodyInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBodyUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => bodyInputRef.current?.click()}
                      className={cn(
                        "w-full aspect-square rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer",
                        bodyPreview
                          ? "border-primary/50 bg-primary/5"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50"
                      )}
                    >
                      {bodyPreview ? (
                        <img
                          src={bodyPreview}
                          alt="Corpo"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <>
                          <PersonStanding className="h-7 w-7 sm:h-8 sm:w-8 text-slate-300" />
                          <span className="text-[10px] sm:text-xs text-slate-400">
                            Clique para enviar
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medidas da Pessoa */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Medidas da Pessoa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(
                    [
                      { key: "height", label: "Altura", ph: "1,70m" },
                      { key: "weight", label: "Peso", ph: "65kg" },
                      { key: "bust", label: "Busto", ph: "92cm" },
                      { key: "waist", label: "Cintura", ph: "70cm" },
                      { key: "hips", label: "Quadril", ph: "98cm" },
                    ] as const
                  ).map(({ key, label, ph }) => (
                    <div key={key}>
                      <Label className="text-xs mb-1 block">{label}</Label>
                      <Input
                        type="text"
                        value={personMeasurements[key]}
                        onChange={(e) =>
                          handlePersonMeasurement(key, e.target.value)
                        }
                        placeholder={ph}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Medidas Cadastradas da Peça */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Medidas Cadastradas</CardTitle>
                <CardDescription>
                  {GARMENT_NAME} — tabela de referência usada na recomendação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="py-1.5 pr-2 font-medium">Tam.</th>
                        <th className="py-1.5 px-2 font-medium">Busto</th>
                        <th className="py-1.5 px-2 font-medium">Cintura</th>
                        <th className="py-1.5 px-2 font-medium">Quadril</th>
                        <th className="py-1.5 px-2 font-medium">Comp.</th>
                        <th className="py-1.5 px-2 font-medium">Manga</th>
                        <th className="py-1.5 pl-2 font-medium">Ombro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_ORDER.map((size) => {
                        const m = CLOTHING_SIZE_CHART[size];
                        return (
                          <tr key={size} className="border-t border-border">
                            <td className="py-1.5 pr-2 font-bold text-foreground">
                              {size}
                            </td>
                            <td className="py-1.5 px-2">{m.bust}</td>
                            <td className="py-1.5 px-2">{m.waist}</td>
                            <td className="py-1.5 px-2">{m.hips}</td>
                            <td className="py-1.5 px-2">{m.length}</td>
                            <td className="py-1.5 px-2">{m.sleeve}</td>
                            <td className="py-1.5 pl-2">{m.shoulder}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Configurações */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Configurações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map((ar) => (
                          <SelectItem key={ar.value} value={ar.value}>
                            {ar.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Resolução</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOLUTIONS.map((res) => (
                          <SelectItem key={res.value} value={res.value}>
                            {res.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !clothingImage || !bodyImage}
              className="w-full py-6 text-sm font-semibold rounded-xl bg-provei-gradient hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {loadingStep || "Processando..."}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Analisar e Gerar
                </span>
              )}
            </Button>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
                {error}
              </div>
            )}
          </div>

          {/* ── Coluna Direita: Resultado ── */}
          <div
            ref={resultRef}
            className="lg:sticky lg:top-24 lg:self-start scroll-mt-20 space-y-5"
          >
            {/* Recomendação */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Recomendação</CardTitle>
              </CardHeader>
              <CardContent>
                {recommendation ? (
                  <div className="space-y-3">
                    <Badge
                      variant="secondary"
                      className="bg-primary/20 text-primary border-primary/30 font-bold"
                    >
                      Tamanho {recommendedSize}
                    </Badge>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {recommendation}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">A recomendação aparecerá aqui</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Foto: Caimento Ideal */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Caimento Ideal ({recommendedSize || "—"})
                  </CardTitle>
                  {recommendedImage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs text-primary hover:text-primary"
                      onClick={() =>
                        handleDownload(
                          recommendedImage,
                          `caimento-ideal-${recommendedSize}.png`
                        )
                      }
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {recommendedImage ? (
                  <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                    <img
                      src={recommendedImage}
                      alt="Tamanho recomendado"
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <ImageIcon className="h-9 w-9 text-slate-300" />
                    <p className="text-xs">Foto no tamanho ideal</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Foto: Caimento Mais Solto */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">
                      Caimento Mais Solto ({looseSize || "—"})
                    </CardTitle>
                    {recommendedSize &&
                      looseSize &&
                      recommendedSize === looseSize && (
                        <CardDescription className="text-xs mt-0.5">
                          {looseSize} já é o maior tamanho cadastrado — mesma
                          imagem do caimento ideal
                        </CardDescription>
                      )}
                  </div>
                  {looseImage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs text-primary hover:text-primary"
                      onClick={() =>
                        handleDownload(
                          looseImage,
                          `caimento-solto-${looseSize}.png`
                        )
                      }
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {looseImage ? (
                  <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                    <img
                      src={looseImage}
                      alt="Tamanho folgado"
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="h-9 w-9 text-slate-300" />
                    <p className="text-xs">Foto no tamanho mais solto</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
