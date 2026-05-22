import { redirect } from "next/navigation";

import { AppNav } from "@/components/AppNav";
import { AppPrivacyShell } from "@/components/privacy/AppPrivacyShell";
import { auth } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return (
    <AppPrivacyShell>
      <div className="min-h-screen">
        <AppNav />
        <div className="mx-auto max-w-6xl p-4">{children}</div>
      </div>
    </AppPrivacyShell>
  );
}
