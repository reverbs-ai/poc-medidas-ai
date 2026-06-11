// Tipos e dados estáticos — seguro para client e server

export interface PersonMeasurements {
  height?: string;
  weight?: string;
  bust?: string;
  waist?: string;
  hips?: string;
}

export interface ClothingMeasurements {
  size?: string;
  bust?: string;
  waist?: string;
  hips?: string;
  length?: string;
  sleeve?: string;
  shoulder?: string;
}

export type ClothingSize = "P" | "M" | "G" | "GG";

export const SIZE_ORDER: ClothingSize[] = ["P", "M", "G", "GG"];

export const PRESET_MEASUREMENTS = {
  person: {
    height: "1,70m",
    weight: "65kg",
    bust: "92cm",
    waist: "70cm",
    hips: "98cm",
  } as Required<PersonMeasurements>,
};

// Medidas cadastradas da peça (blusa feminina) — tabela de referência
// usada tanto para a recomendação de tamanho quanto para o prompt da Gemini.
export const GARMENT_NAME = "Blusa feminina";

export const CLOTHING_SIZE_CHART: Record<ClothingSize, Required<ClothingMeasurements>> = {
  P: {
    size: "P",
    bust: "88cm",
    waist: "68cm",
    hips: "92cm",
    length: "60cm",
    sleeve: "21cm",
    shoulder: "37cm",
  },
  M: {
    size: "M",
    bust: "92cm",
    waist: "72cm",
    hips: "96cm",
    length: "62cm",
    sleeve: "22cm",
    shoulder: "38cm",
  },
  G: {
    size: "G",
    bust: "100cm",
    waist: "80cm",
    hips: "104cm",
    length: "65cm",
    sleeve: "24cm",
    shoulder: "41cm",
  },
  GG: {
    size: "GG",
    bust: "108cm",
    waist: "88cm",
    hips: "112cm",
    length: "68cm",
    sleeve: "26cm",
    shoulder: "44cm",
  },
};
