import { extractMerchantFromDescription } from "@/lib/extract-merchant";

export interface ParsedMbankRow {
  bookedAt: Date;
  amount: string;
  description: string;
  counterparty: string;
  mbankCategory: string;
  accountLabel: string;
}

interface ColumnIndexes {
  date: number;
  description: number;
  account: number;
  category: number;
  amount: number;
}

function normalizeHeader(header: string): string {
  return header.replace(/^#/, "").trim().toLowerCase();
}

function parsePolishPlnAmount(raw: string): string {
  const withoutCurrency = raw.replace(/\s*PLN\s*$/i, "").trim();
  const normalized = withoutCurrency.replace(/\s/g, "").replace(",", ".");
  const value = Number(normalized);
  if (Number.isNaN(value)) {
    throw new Error(`Nieprawidłowa kwota: ${raw}`);
  }
  return value.toFixed(2);
}

/** Dzieli linię CSV z separatorem `;`, respektując cudzysłowy (opisy mogą zawierać `;`). */
export function parseSemicolonCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ";" && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  fields.push(current);
  return fields;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function findHeaderLineIndex(lines: string[]): number {
  return lines.findIndex((line) => {
    const first = normalizeHeader(parseSemicolonCsvLine(line)[0] ?? "");
    return first === "data operacji";
  });
}

function resolveColumnIndexes(headers: string[]): ColumnIndexes {
  const find = (name: string): number => {
    const index = headers.findIndex((h) => normalizeHeader(h) === name.toLowerCase());
    if (index === -1) {
      throw new Error(`Brak kolumny: ${name}`);
    }
    return index;
  };
  return {
    date: find("data operacji"),
    description: find("opis operacji"),
    account: find("rachunek"),
    category: find("kategoria"),
    amount: find("kwota"),
  };
}

function parseRow(cols: string[], indexes: ColumnIndexes): ParsedMbankRow {
  const description = unquote(cols[indexes.description] ?? "");
  const bookedAt = new Date(unquote(cols[indexes.date] ?? ""));
  if (Number.isNaN(bookedAt.getTime())) {
    throw new Error(`Nieprawidłowa data operacji: ${cols[indexes.date] ?? ""}`);
  }
  return {
    bookedAt,
    amount: parsePolishPlnAmount(unquote(cols[indexes.amount] ?? "")),
    description,
    counterparty: extractMerchantFromDescription(description),
    mbankCategory: unquote(cols[indexes.category] ?? ""),
    accountLabel: unquote(cols[indexes.account] ?? ""),
  };
}

interface ParseDataLinesInput {
  lines: string[];
  headerIndex: number;
  headers: string[];
  indexes: ColumnIndexes;
}

function parseDataLines(input: ParseDataLinesInput): ParsedMbankRow[] {
  const { lines, headerIndex, headers, indexes } = input;
  const rows: ParsedMbankRow[] = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      continue;
    }
    const cols = parseSemicolonCsvLine(line).slice(0, headers.length);
    if (cols.length < headers.length) {
      continue;
    }
    rows.push(parseRow(cols, indexes));
  }
  return rows;
}

/**
 * Parser eksportu mBank „Lista operacji” (CSV z preamble, separator `;`).
 */
export function parseMbankCsv(content: string): ParsedMbankRow[] {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Pusty plik CSV");
  }

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headerIndex = findHeaderLineIndex(lines);
  if (headerIndex === -1) {
    throw new Error(
      'Nie znaleziono nagłówka "#Data operacji" — to nie jest lista operacji mBank',
    );
  }

  const headerLine = lines[headerIndex];
  if (!headerLine) {
    throw new Error("Brak linii nagłówka w pliku CSV");
  }
  const headers = parseSemicolonCsvLine(headerLine).map(normalizeHeader);
  const indexes = resolveColumnIndexes(headers);
  const rows = parseDataLines({ lines, headerIndex, headers, indexes });

  if (rows.length === 0) {
    throw new Error("Plik nie zawiera żadnych transakcji");
  }

  return rows;
}
