import { redirect } from "next/navigation";

import { AppNav } from "@/components/AppNav";
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
    <div className="min-h-screen">
      <AppNav />
      <div className="mx-auto max-w-6xl p-4">{children}</div>
    </div>
  );
}
