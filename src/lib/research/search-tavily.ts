import { logger } from "@/lib/logger";
import type { TavilyConfig } from "@/lib/research/config";

export interface TavilySearchHit {
  title: string;
  url: string;
  content: string;
}

export type FetchFn = typeof fetch;

interface TavilyResponse {
  results?: { title?: string; url?: string; content?: string }[];
}

function mapTavilyHits(data: TavilyResponse): TavilySearchHit[] {
  return (data.results ?? [])
    .filter((row) => row.url && row.title)
    .map((row) => ({
      title: row.title ?? "",
      url: row.url ?? "",
      content: (row.content ?? "").slice(0, 500),
    }));
}

function buildTavilyBody(config: TavilyConfig, query: string): string {
  return JSON.stringify({
    api_key: config.apiKey,
    query,
    search_depth: "basic",
    max_results: 5,
    country: "poland",
    include_answer: false,
  });
}

export async function searchTavily(
  config: TavilyConfig,
  query: string,
  fetchFn: FetchFn = fetch,
): Promise<TavilySearchHit[]> {
  const response = await fetchFn("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: buildTavilyBody(config, query),
  });

  if (!response.ok) {
    await throwTavilyError(response);
  }

  const data = (await response.json()) as TavilyResponse;
  const hits = mapTavilyHits(data);
  if (hits.length === 0) {
    throw new Error("Tavily: brak wyników wyszukiwania");
  }
  return hits;
}

async function throwTavilyError(response: Response): Promise<never> {
  const body = await response.text();
  const snippet = body.slice(0, 200);
  logger.error("research.api.tavily", {
    context: { status: response.status, body: snippet },
  });
  throw new Error(`Tavily API ${String(response.status)}: ${snippet}`);
}
