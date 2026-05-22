import { describe, expect, it, vi } from "vitest";

import { searchTavily } from "@/lib/research/search-tavily";

describe("searchTavily", () => {
  it("maps API results", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [{ title: "T", url: "https://t.pl", content: "opis" }],
        }),
    });

    const hits = await searchTavily(
      { apiKey: "test-key" },
      "Netflix alternatywa",
      fetchFn as typeof fetch,
    );

    expect(hits).toHaveLength(1);
    expect(hits[0]?.title).toBe("T");
  });

  it("throws when API returns empty results", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    await expect(
      searchTavily({ apiKey: "k" }, "q", fetchFn as typeof fetch),
    ).rejects.toThrow("brak wyników");
  });
});
