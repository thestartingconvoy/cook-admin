import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function allowedEmails(): string[] {
  return (process.env.ALLOWED_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  const allow = allowedEmails();
  // If no allow-list is configured, deny by default (fail closed).
  if (allow.length === 0) return false;
  return allow.includes(email.toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Gate sign-in to the owner allow-list.
    async signIn({ user }) {
      return isAllowedEmail(user.email);
    },
    // Belt-and-suspenders: re-check on every session read so a revoked email
    // can't keep an old token alive.
    async session({ session }) {
      if (!isAllowedEmail(session.user?.email)) {
        // Returning a session with no user effectively logs them out.
        return { ...session, user: undefined as never };
      }
      return session;
    },
  },
});
