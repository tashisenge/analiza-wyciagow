import {
  anthropicFromEnv,
  type AiConfig,
  type AiProvider,
  openaiFromEnv,
  resolveAiConfigFromPreference,
} from "@/lib/ai/config";
import { prisma } from "@/lib/db";

export function listAvailableAiProviders(): AiProvider[] {
  const providers: AiProvider[] = [];
  if (anthropicFromEnv()) {
    providers.push("anthropic");
  }
  if (openaiFromEnv()) {
    providers.push("openai");
  }
  return providers;
}

export async function getAiConfigForWorkspace(
  workspaceId: string,
): Promise<AiConfig | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { aiProviderPreference: true },
  });
  if (!workspace) {
    return null;
  }
  return resolveAiConfigFromPreference(workspace.aiProviderPreference);
}
