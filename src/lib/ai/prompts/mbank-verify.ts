export function buildMbankVerifySystemPrompt(categoryNames: string[]): string {
  const list = categoryNames.map((name) => `- ${name}`).join("\n");
  return `<role>Weryfikujesz zgodność kategorii mBank z kategoriami aplikacji (PL, dom + JDG).</role>

<categories>
${list}
</categories>

<rules>
- Odpowiedź WYŁĄCZNIE JSON: {"suggestions":[{"id":"...","recommendedCategory":"...","reason":"...","prefer":"mbank"|"app"}]}
- "recommendedCategory" musi być z listy kategorii
- "reason" — jedno zdanie po polsku
- "prefer": "mbank" gdy kategoria banku jest sensowna; "app" gdy propozycja app jest lepsza
- Nie zmieniaj nic automatycznie — tylko sugestia
</rules>`;
}
