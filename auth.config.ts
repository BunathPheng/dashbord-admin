import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { isMockMode } from '@/lib/mock-data';
import { verifyAdminCredentials } from '@/lib/auth';

const MOCK_ADMIN = { email: 'admin@admin.com', password: 'admin123' };

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
          if (isMockMode()) {
            if (
              credentials.email === MOCK_ADMIN.email &&
              credentials.password === MOCK_ADMIN.password
            ) {
              return {
                id: 'mock-admin-1',
                email: MOCK_ADMIN.email,
                name: 'Admin User',
                role: 'admin',
              };
            }
            return null;
          }

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
