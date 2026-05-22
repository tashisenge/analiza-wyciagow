export interface CategorizePreviewSample {
  counterparty: string;
  description: string;
  amount: string;
  mbankCategory: string;
}

export interface AiCategorizeDescription {
  headline: string;
  steps: string[];
  samples: CategorizePreviewSample[];
}

export function describeAiCategorization(
  targetCount: number,
  samples: CategorizePreviewSample[],
): AiCategorizeDescription {
  return {
    headline: `Kategoryzuj AI przypisze kategorie do ${String(targetCount)} transakcji`,
    steps: [
      "Bierze transakcje bez kategorii lub w kubełku «Bez kategorii» (max 100 na raz).",
      "Wysyła partie po 25 do modelu z listą Twoich kategorii.",
      "Model zwraca JSON z dopasowaniami — zapis w bazie od razu.",
      "Nie dotyka przelewów oznaczonych jako transfer między kontami.",
      "Po zakończeniu odśwież listę transakcji i dashboard.",
    ],
    samples: samples.slice(0, 5),
  };
}
