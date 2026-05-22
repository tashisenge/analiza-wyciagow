import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";

function escapeCsvField(value: string): string {
  if (value.includes(";") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildExportCsv(
  rows: {
    bookedAt: Date;
    amount: { toString(): string };
    description: string;
    counterparty: string;
    mbankCategory: string;
    category: { name: string } | null;
    account: { name: string; type: string };
  }[],
): string {
  const header = [
    "Data",
    "Kwota",
    "Opis",
    "Kontrahent",
    "Kategoria mBank",
    "Kategoria app",
    "Konto",
    "Typ konta",
  ].join(";");
  const lines = rows.map((row) =>
    [
      row.bookedAt.toISOString().slice(0, 10),
      row.amount.toString(),
      escapeCsvField(row.description),
      escapeCsvField(row.counterparty),
      escapeCsvField(row.mbankCategory),
      escapeCsvField(row.category?.name ?? ""),
      escapeCsvField(row.account.name),
      row.account.type,
    ].join(";"),
  );
  return [header, ...lines].join("\n");
}

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { bookedAt: "desc" },
      include: { category: true, account: true },
    });
    const csv = buildExportCsv(transactions);
    const filename = `eksport_${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logActionError("workspace.exportCsv", error, {
      context: { workspaceId: session.user.workspaceId },
    });
    return new Response("Błąd eksportu", { status: 500 });
  }
}
