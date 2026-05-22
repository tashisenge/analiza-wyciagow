import { redirect } from "next/navigation";

import { SettingsView } from "@/components/settings/SettingsView";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAccount, deleteAllWorkspaceData } from "@/server/actions/workspace";

async function createAccountAction(formData: FormData): Promise<void> {
  "use server";
  const result = await createAccount(formData);
  if (!result.ok) {
    redirect(`/settings?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/settings");
}

async function deleteDataAction(formData: FormData): Promise<void> {
  "use server";
  const result = await deleteAllWorkspaceData(formData);
  if (!result.ok) {
    redirect(`/settings?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/settings?deleted=1");
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string }>;
}): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const params = await searchParams;
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: session.user.workspaceId },
    include: { accounts: true, members: { include: { user: true } } },
  });

  return (
    <SettingsView
      workspaceName={workspace.name}
      inviteCode={workspace.inviteCode}
      accounts={workspace.accounts}
      members={workspace.members}
      error={params.error}
      deleted={params.deleted === "1"}
      createAccountAction={createAccountAction}
      deleteDataAction={deleteDataAction}
    />
  );
}
