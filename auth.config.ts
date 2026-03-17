import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { verifyAdminCredentials } from '@/lib/auth';
import { isRealApiMode, loginWithBackend } from '@/lib/api-client';

// Auth.js reads AUTH_SECRET from env directly - set fallback before any auth code runs
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = 'fallback-secret-change-in-production';
}

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = request.nextUrl.pathname === '/login';

      if (isOnLoginPage) {
        return isLoggedIn ? false : true;
      }

      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user && 'accessToken' in user) {
        token.accessToken = user.accessToken as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as { accessToken?: string }).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Real API mode: authenticate against backend (API_URL)
          if (isRealApiMode()) {
            const result = await loginWithBackend(
              String(credentials.email),
              String(credentials.password)
            );
            if (!result) return null;
            return {
              id: result.id,
              email: result.email,
              name: result.name,
              role: result.role,
              accessToken: result.accessToken,
            };
          }

          // Database mode: use admins table (DATABASE_URL)
          const admin = await verifyAdminCredentials(
            String(credentials.email),
            String(credentials.password)
          );
          if (!admin) return null;

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
          };
        } catch (error) {
          console.error('[Auth] Error verifying credentials:', error);
          return null;
        }
      },
    }),
  ],
};
