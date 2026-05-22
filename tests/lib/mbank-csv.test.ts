import { readFileSync } from "fs";
import { join } from "path";

import { describe, expect, it } from "vitest";

import { parseMbankCsv, parseSemicolonCsvLine } from "@/lib/mbank-csv";

const FIXTURE_PATH = join(process.cwd(), "tests/fixtures/mbank-sample.csv");

describe("parseMbankCsv", () => {
  it("parses mBank lista operacji export from fixture", () => {
    const raw = readFileSync(FIXTURE_PATH, "utf-8");
    const rows = parseMbankCsv(raw);

    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      amount: "-13.38",
      counterparty: "NETTO",
      mbankCategory: "Żywność i chemia domowa",
      accountLabel: "osobiste 7711 ... 7243",
    });
    expect(rows[2]?.amount).toBe("1900.00");
    expect(rows[3]?.counterparty).toBe("LIDL");
  });

  it("throws on empty file", () => {
    expect(() => parseMbankCsv("")).toThrow("Pusty plik CSV");
  });

  it("throws when header is missing", () => {
    expect(() => parseMbankCsv("a;b\nc;d")).toThrow("Nie znaleziono nagłówka");
  });

  it("skips malformed short rows", () => {
    const csv = `#Data operacji;#Opis operacji;#Rachunek;#Kategoria;#Kwota;
2026-05-20;"OK";"konto";"Kat";-1,00 PLN;;
broken;line
2026-05-19;"DRUGI";"konto";"Kat";-2,00 PLN;;`;
    const rows = parseMbankCsv(csv);
    expect(rows).toHaveLength(2);
  });

  it("throws when no transaction rows", () => {
    const headerOnly = `#Data operacji;#Opis operacji;#Rachunek;#Kategoria;#Kwota;`;
    expect(() => parseMbankCsv(headerOnly)).toThrow("nie zawiera żadnych transakcji");
  });

  it("parses line with semicolons inside quoted description", () => {
    const line =
      '2025-12-22;"Uniwersytet WSB, Wynagrodzenie BFP; extra";"osobiste 7711";"Wynagrodzenie";1 405,07 PLN;;';
    const cols = parseSemicolonCsvLine(line).slice(0, 5);
    expect(cols).toHaveLength(5);
    const rows = parseMbankCsv(
      `#Data operacji;#Opis operacji;#Rachunek;#Kategoria;#Kwota;\n${line}`,
    );
    expect(rows[0]?.amount).toBe("1405.07");
    expect(rows[0]?.mbankCategory).toBe("Wynagrodzenie");
  });

  it("throws on invalid amount", () => {
    const broken = `#Data operacji;#Opis operacji;#Rachunek;#Kategoria;#Kwota;
2026-01-01;"TEST";"konto";"Kat";"nie-kwota";`;
    expect(() => parseMbankCsv(broken)).toThrow("Nieprawidłowa kwota");
  });
});
