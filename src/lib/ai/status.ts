import { getAiConfig } from "@/lib/ai/config";
import {
  getAiConfigForWorkspace,
  listAvailableAiProviders,
} from "@/lib/ai/resolve-workspace-ai";
import { prisma } from "@/lib/db";

export function getAiStatus(): {
  available: boolean;
  provider: string | null;
  availableProviders: string[];
} {
  const config = getAiConfig();
  return {
    available: config !== null,
    provider: config?.provider ?? null,
    availableProviders: listAvailableAiProviders(),
  };
}

export async function getWorkspaceAiStatus(workspaceId: string): Promise<{
  available: boolean;
  activeProvider: string | null;
  preference: string;
  availableProviders: string[];
}> {
  const [config, workspace] = await Promise.all([
    getAiConfigForWorkspace(workspaceId),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { aiProviderPreference: true },
    }),
  ]);
  return {
    available: config !== null,
    activeProvider: config?.provider ?? null,
    preference: workspace?.aiProviderPreference ?? "auto",
    availableProviders: listAvailableAiProviders(),
  };
}
