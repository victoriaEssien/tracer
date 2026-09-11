/**
 * Authentication.
 *
 * GitHub OAuth through Auth.js, with sessions in Postgres. The stored access
 * token matters beyond sign-in: GitHub's rate limit is per token, so requests
 * made on a user's behalf spend that user's own hourly budget rather than a
 * single shared one (see `src/server/github/index.ts`).
 */

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

import { db } from "@/server/db/client";
import { accounts, sessions, users, verificationTokens } from "@/server/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  pages: { signIn: "/" },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // Public repository data needs no scope beyond identifying the user.
      authorization: { params: { scope: "read:user user:email" } },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  events: {
    /**
     * Copies the GitHub identity onto the user row. Done as an event rather
     * than in the provider's `profile()` so the adapter's own insert shape
     * stays untouched.
     */
    async signIn({ user, profile }) {
      if (!user.id || !profile) return;
      const login = typeof profile.login === "string" ? profile.login : null;
      const githubId = profile.id === undefined || profile.id === null ? null : String(profile.id);
      if (!login && !githubId) return;

      await db
        .update(users)
        .set({ githubLogin: login, githubId })
        .where(eq(users.id, user.id));
    },
  },
});

/** The signed-in user's id, or null. The one way server code asks "who is this". */
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
