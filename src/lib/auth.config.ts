import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    authorized: ({ auth, request }) => {
      const isAppRoute =
        request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname.startsWith("/transactions") ||
        request.nextUrl.pathname.startsWith("/import") ||
        request.nextUrl.pathname.startsWith("/categories") ||
        request.nextUrl.pathname.startsWith("/settings");
      if (isAppRoute) {
        return Boolean(auth?.user);
      }
      return true;
    },
    jwt({ token, user }) {
      const authUser = user as { workspaceId?: string } | undefined;
      if (authUser?.workspaceId) {
        token.workspaceId = authUser.workspaceId;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub && token.workspaceId) {
        session.user.id = token.sub;
        session.user.workspaceId = token.workspaceId;
      }
      return session;
    },
  },
};
