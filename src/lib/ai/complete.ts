import type { AiConfig } from "@/lib/ai/config";
import { logger } from "@/lib/logger";

export type FetchFn = typeof fetch;

interface CompleteOptions {
  system: string;
  user: string;
  maxTokens?: number;
}

export async function completeWithAi(
  config: AiConfig,
  options: CompleteOptions,
  fetchFn: FetchFn = fetch,
): Promise<string> {
  if (config.provider === "anthropic") {
    return completeAnthropic(config, options, fetchFn);
  }
  return completeOpenAi(config, options, fetchFn);
}

async function completeAnthropic(
  config: AiConfig,
  options: CompleteOptions,
  fetchFn: FetchFn,
): Promise<string> {
  const response = await fetchFn("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: options.maxTokens ?? 2048,
      system: options.system,
      messages: [{ role: "user", content: options.user }],
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    const snippet = body.slice(0, 200);
    logger.error("ai.api.anthropic", {
      context: { status: response.status, body: snippet },
    });
    throw new Error(`Anthropic API ${String(response.status)}: ${snippet}`);
  }
  const data = (await response.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((block) => block.type === "text")?.text;
  if (!text) {
    logger.error("ai.api.anthropic", {
      context: { status: response.status, reason: "empty_response" },
    });
    throw new Error("Anthropic: pusta odpowiedź");
  }
  return text;
}

async function completeOpenAi(
  config: AiConfig,
  options: CompleteOptions,
  fetchFn: FetchFn,
): Promise<string> {
  const response = await fetchFn("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: options.maxTokens ?? 2048,
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    const snippet = body.slice(0, 200);
    logger.error("ai.api.openai", {
      context: { status: response.status, body: snippet },
    });
    throw new Error(`OpenAI API ${String(response.status)}: ${snippet}`);
  }
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    logger.error("ai.api.openai", {
      context: { status: response.status, reason: "empty_response" },
    });
    throw new Error("OpenAI: pusta odpowiedź");
  }
  return text;
}
