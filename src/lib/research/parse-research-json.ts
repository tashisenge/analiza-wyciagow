import type { Prisma } from "@prisma/client";

import type { ResearchAlternative, ResearchSource } from "@/lib/research/types";

export function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function parseAlternativesJson(value: Prisma.JsonValue): ResearchAlternative[] {
  return value as unknown as ResearchAlternative[];
}

export function parseSourcesJson(value: Prisma.JsonValue): ResearchSource[] {
  return value as unknown as ResearchSource[];
}
