import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials } from '@/lib/auth';
import { isRealApiMode, loginWithBackendWithError } from '@/lib/api-client';

/**
 * POST /api/auth/verify
 * Validates credentials against backend (API_URL) or database (DATABASE_URL).
 * Returns user info on success, or { error } on failure.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    if (isRealApiMode()) {
      const result = await loginWithBackendWithError(email, password);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 401 });
      }
      return NextResponse.json({
        id: result.data.id,
        email: result.data.email,
        name: result.data.name,
        role: result.data.role,
      });
    }

    const admin = await verifyAdminCredentials(email, password);
    if (!admin) {
      return NextResponse.json({ error: 'Invalid password or email' }, { status: 401 });
    }
    return NextResponse.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
  } catch (error) {
    console.error('[Auth Verify] Error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
