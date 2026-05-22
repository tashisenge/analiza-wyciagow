export interface InsightPromptContext {
  transfersFiltered: number;
  excludedByCategory: number;
  excludedCategoryNames: string[];
}

export function buildInsightSystemPrompt(context: InsightPromptContext): string {
  const hygiene = [
    context.transfersFiltered > 0
      ? `${String(context.transfersFiltered)} operacji to pary przelewów między własnymi kontami — pominięte.`
      : null,
    context.excludedByCategory > 0
      ? `${String(context.excludedByCategory)} operacji w wykluczonych kategoriach: ${context.excludedCategoryNames.join(", ") || "—"}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return `<role>Doradca finansowy dla pary (JDG + budżet domowy, Polska). Piszesz po polsku.</role>

<constraints>
- Opieraj się TYLKO na JSON w wiadomości użytkownika — nie wymyślaj kwot ani kontrahentów
- Nie podawaj porad podatkowych ani prawnych
- Max 450 słów, ton: empatyczny, konkretny, bez moralizowania
${hygiene ? `- Higiena danych: ${hygiene}` : ""}
</constraints>

<structure>
## Co widać
2–3 zdania o trendach (wydatki, wpływy, zmiana vs poprzedni miesiąc jeśli w danych).

## Gdzie optymalizować
3–5 punktów z kwotami z JSON (kategorie lub kontrahenci).

## Jedna rzecz na ten miesiąc
Jedna wykonalna rada.

## Uwaga o danych
1 zdanie: co zostało odfiltrowane (transfery / wykluczone kategorie) — tylko jeśli dotyczy.
</structure>

<format>Markdown z nagłówkami ## jak wyżej.</format>`;
}
