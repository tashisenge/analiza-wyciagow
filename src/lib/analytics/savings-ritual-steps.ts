import type { SavingsRitualInput, SavingsRitualLinks, SavingsRitualStep } from "@/lib/analytics/savings-ritual-state";

function importStep(input: SavingsRitualInput, links: SavingsRitualLinks): SavingsRitualStep {
  const done = input.hasImport && !input.isStaleImport;
  return {
    id: "import",
    label: "Świeży import wyciągu",
    done,
    href: done ? undefined : links.importHref,
    hint: input.hasImport
      ? "Ostatni import jest starszy niż 14 dni"
      : "Zaimportuj minimum 2–3 miesiące CSV",
  };
}

function coverageStep(
  input: SavingsRitualInput,
  links: SavingsRitualLinks,
  threshold: number,
): SavingsRitualStep {
  const done = input.categorizedPercent >= threshold;
  return {
    id: "coverage",
    label: `Pokrycie kategoriami ≥${String(threshold)}%`,
    done,
    href: done ? undefined : links.transactionsHref,
    hint: `${input.categorizedPercent.toFixed(1)}% wydatków ma kategorię`,
  };
}

function limitHint(input: SavingsRitualInput): string | undefined {
  if (input.monthlyLimit === null) {
    return "Limit nie ustawiony — opcjonalne";
  }
  if (input.limitUsedPercent === null) {
    return undefined;
  }
  return `${input.limitUsedPercent.toFixed(1)}% limitu wykorzystane`;
}

export { importStep, coverageStep, limitHint };
