import { redirect } from "next/navigation";

import { ReviewPageClient } from "@/components/review/ReviewPageClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadReviewQueue } from "@/lib/review/load-review-queue";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const workspaceId = session.user.workspaceId;

  const [queue, categories] = await Promise.all([
    loadReviewQueue(workspaceId, page),
    prisma.category.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Weryfikacja mBank"
        lead="Porównaj kategorie banku z aplikacją. AI podpowiada — Ty decydujesz."
        tip="Pozycje z «Bez kategorii» mBank, rozbieżności nazw lub brak kategorii app mimo danych banku."
      />
      <ReviewPageClient
        items={queue.items}
        total={queue.total}
        page={queue.page}
        categories={categories}
      />
    </div>
  );
}
