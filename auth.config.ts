import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

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
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // NEXTAUTH_URL is required for fetch - use VERCEL_URL on Vercel, localhost for dev
          const baseUrl =
            process.env.NEXTAUTH_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
          const response = await fetch(`${baseUrl}/api/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const admin = await response.json();
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
