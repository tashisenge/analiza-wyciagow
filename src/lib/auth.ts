import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { logActionError, logger } from "@/lib/logger";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  workspaceId: string;
}

async function lookupAuthUser(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { take: 1 } },
  });
  if (!user) {
    logger.warn("auth.authorize.not_found", { context: { email } });
    return null;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  const membership = user.memberships[0];
  if (!valid || !membership) {
    logger.warn("auth.authorize.invalid", { context: { email } });
    return null;
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    workspaceId: membership.workspaceId,
  };
}

async function authorizeCredentials(
  credentials: Partial<Record<"email" | "password", unknown>>,
): Promise<AuthUser | null> {
  try {
    const parsed = credentialsSchema.safeParse(credentials);
    if (!parsed.success) {
      return null;
    }
    return await lookupAuthUser(parsed.data.email, parsed.data.password);
  } catch (error) {
    logActionError("auth.authorize", error);
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Hasło", type: "password" },
      },
      authorize: authorizeCredentials,
    }),
  ],
});
