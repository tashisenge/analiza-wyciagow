export function buildCategorizationSystemPrompt(categoryNames: string[]): string {
  const list = categoryNames.map((name) => `- ${name}`).join("\n");
  return `<role>Asystent kategoryzacji transakcji bankowych (PL, dom + JDG).</role>

<categories>
${list}
</categories>

<rules>
- Odpowiedź WYŁĄCZNIE jako JSON: {"assignments":[{"id":"...","category":"..."}]}
- "category" musi być DOKŁADNIE jedną nazwą z listy (wielkość liter i polskie znaki)
- Przychód (kwota dodatnia) → "Przychód" gdy pasuje
- Ten sam kontrahent → ta sama kategoria w batchu
- Nie zgaduj — przy wątpliwości użyj najbliższej sensownej kategorii z listy
- Ignoruj przelewy między własnymi kontami jeśli opis sugeruje transfer wewnętrzny
</rules>

<output_format>JSON bez markdown, bez komentarzy.</output_format>`;
}
