import {
  coverageStep,
  importStep,
  limitHint,
} from "@/lib/analytics/savings-ritual-steps";
import {
  isDiscretionaryLimitApproaching,
  isDiscretionaryLimitOverrun,
} from "@/lib/discretionary/limit-status";

export const SAVINGS_RITUAL_COVERAGE_PERCENT = 80;

export type SavingsRitualStepId = "import" | "coverage" | "limit" | "aiReport";

export interface SavingsRitualStep {
  id: SavingsRitualStepId;
  label: string;
  done: boolean;
  optional?: boolean;
  href?: string;
  hint?: string;
}

export interface SavingsRitualInput {
  hasImport: boolean;
  isStaleImport: boolean;
  categorizedPercent: number;
  monthlyLimit: number | null;
  limitUsedPercent: number | null;
}

export interface SavingsRitualLinks {
  importHref: string;
  transactionsHref: string;
  opcjonalneHref: string;
}

function isLimitOk(input: SavingsRitualInput): boolean {
  if (input.monthlyLimit === null || input.limitUsedPercent === null) {
    return true;
  }
  return (
    !isDiscretionaryLimitApproaching(input.limitUsedPercent) &&
    !isDiscretionaryLimitOverrun(input.limitUsedPercent)
  );
}

function limitStep(input: SavingsRitualInput, links: SavingsRitualLinks): SavingsRitualStep {
  const done = isLimitOk(input);
  return {
    id: "limit",
    label: "Limit opcjonalnych OK",
    done,
    href: done ? undefined : links.opcjonalneHref,
    hint: limitHint(input),
  };
}

function aiReportStep(links: SavingsRitualLinks): SavingsRitualStep {
  return {
    id: "aiReport",
    label: "Raport AI opcjonalne",
    done: false,
    optional: true,
    href: links.opcjonalneHref,
    hint: "Opcjonalny raport głupot za bieżący okres",
  };
}

export function buildSavingsRitualSteps(
  input: SavingsRitualInput,
  links: SavingsRitualLinks,
): SavingsRitualStep[] {
  return [
    importStep(input, links),
    coverageStep(input, links, SAVINGS_RITUAL_COVERAGE_PERCENT),
    limitStep(input, links),
    aiReportStep(links),
  ];
}

export function savingsRitualCoreComplete(steps: SavingsRitualStep[]): boolean {
  return steps.filter((step) => !step.optional).every((step) => step.done);
}
