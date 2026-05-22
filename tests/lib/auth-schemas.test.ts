import { describe, expect, it } from "vitest";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email("Nieprawidłowy email"),
  password: z.string().min(1, "Podaj hasło"),
});

describe("loginSchema", () => {
  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-email", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("accepts valid credentials shape", () => {
    const result = loginSchema.safeParse({
      email: "demo@analiza.local",
      password: "demo12345",
    });
    expect(result.success).toBe(true);
  });
});
