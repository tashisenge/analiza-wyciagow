"use server";

import bcrypt from "bcryptjs";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError, logger } from "@/lib/logger";
import { seedCategoriesForWorkspace } from "@/lib/seed-default-categories";

const loginSchema = z.object({
  email: z.email("Nieprawidłowy email"),
  password: z.string().min(1, "Podaj hasło"),
});

export type LoginResult = { ok: true } | { ok: false; error: string };

function readSignInError(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null || !("error" in raw)) {
    return null;
  }
  const err = Reflect.get(raw, "error");
  return typeof err === "string" ? err : null;
}

export async function loginUser(formData: FormData): Promise<LoginResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    const raw: unknown = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    const signInError = readSignInError(raw);
    if (signInError) {
      logger.warn("auth.login.failed", {
        context: { email: parsed.data.email, reason: signInError },
      });
      return { ok: false, error: "Nieprawidłowy email lub hasło" };
    }

    return { ok: true };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      logger.warn("auth.login.failed", {
        context: { email: parsed.data.email, reason: error.type },
      });
      return { ok: false, error: "Nieprawidłowy email lub hasło" };
    }
    throw error;
  }
}

const registerSchema = z.object({
  email: z.email("Nieprawidłowy email"),
  password: z.string().min(8, "Hasło min. 8 znaków"),
  name: z.string().min(1, "Podaj imię").optional(),
  inviteCode: z.string().optional(),
});

export type RegisterResult = { ok: true } | { ok: false; error: string };

type RegisterInput = z.infer<typeof registerSchema>;

async function joinWorkspace(input: RegisterInput): Promise<RegisterResult> {
  const workspace = await prisma.workspace.findUnique({
    where: { inviteCode: input.inviteCode },
  });
  if (!workspace) {
    return { ok: false, error: "Nieprawidłowy kod zaproszenia" };
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      memberships: { create: { workspaceId: workspace.id } },
    },
  });
  return { ok: true };
}

async function createWorkspaceWithDefaults(input: RegisterInput): Promise<void> {
  const passwordHash = await bcrypt.hash(input.password, 12);
  await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({ data: { name: "Nasze finanse" } });
    await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        memberships: { create: { workspaceId: workspace.id } },
      },
    });
    await tx.account.createMany({
      data: [
        { workspaceId: workspace.id, type: "firma", name: "Konto firmowe (mBank)" },
        { workspaceId: workspace.id, type: "dom", name: "Konto domowe (mBank)" },
      ],
    });
    await seedCategoriesForWorkspace(workspace.id, (data) =>
      tx.category.create({ data }),
    );
  });
}

export async function registerUser(formData: FormData): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") ?? undefined,
    inviteCode: formData.get("inviteCode") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { ok: false, error: "Konto z tym adresem email już istnieje" };
  }

  try {
    if (parsed.data.inviteCode) {
      return await joinWorkspace({ ...parsed.data, inviteCode: parsed.data.inviteCode });
    }
    await createWorkspaceWithDefaults(parsed.data);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("auth.register", error, {
        context: { email: parsed.data.email },
        fallbackMessage: "Błąd rejestracji",
      }),
    };
  }
}
