import {
  CLOTHING_SIZE_CHART,
  SIZE_ORDER,
  type ClothingMeasurements,
  type ClothingSize,
  type PersonMeasurements,
} from "./types";

// Folga (em cm) considerada ideal entre o busto do corpo e o busto da peça
// para que o tamanho seja considerado "recomendado" (caimento confortável).
const RECOMMENDED_EASE_CM = 4;

export interface SizeDecision {
  recommendedSize: ClothingSize;
  looseSize: ClothingSize;
  recommended: Required<ClothingMeasurements>;
  loose: Required<ClothingMeasurements>;
  reasoning: string;
}

function parseCm(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.replace(",", ".").match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1]);
}

export function determineSizes(person: PersonMeasurements): SizeDecision {
  const fallbackBust = parseCm(CLOTHING_SIZE_CHART.M.bust) ?? 92;
  const personBust = parseCm(person.bust) ?? fallbackBust;
  const targetBust = personBust + RECOMMENDED_EASE_CM;

  let recommendedSize: ClothingSize =
    SIZE_ORDER[SIZE_ORDER.length - 1];

  for (const size of SIZE_ORDER) {
    const garmentBust = parseCm(CLOTHING_SIZE_CHART[size].bust) ?? 0;
    if (garmentBust >= targetBust) {
      recommendedSize = size;
      break;
    }
  }

  const recommendedIndex = SIZE_ORDER.indexOf(recommendedSize);
  const looseIndex = Math.min(recommendedIndex + 1, SIZE_ORDER.length - 1);
  const looseSize = SIZE_ORDER[looseIndex];

  const recommended = CLOTHING_SIZE_CHART[recommendedSize];
  const loose = CLOTHING_SIZE_CHART[looseSize];

  const isLargestAvailable = looseIndex === recommendedIndex;

  const reasoning = isLargestAvailable
    ? `Seu busto (${person.bust ?? `${personBust}cm`}) + folga ideal de ${RECOMMENDED_EASE_CM}cm sugere o tamanho ${recommendedSize} (busto registrado: ${recommended.bust}), que já é o maior tamanho cadastrado para esta peça. Por isso, as duas imagens mostram o mesmo resultado no tamanho ${looseSize}.`
    : `Seu busto (${person.bust ?? `${personBust}cm`}) + folga ideal de ${RECOMMENDED_EASE_CM}cm = ${targetBust}cm. O tamanho ${recommendedSize} (busto registrado: ${recommended.bust}) é o recomendado para um caimento ideal. Para uma opção mais folgada, também geramos o tamanho ${looseSize} (busto registrado: ${loose.bust}).`;

  return {
    recommendedSize,
    looseSize,
    recommended,
    loose,
    reasoning,
  };
}
