import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials } from '@/lib/auth';
import { isMockMode } from '@/lib/mock-data';

const MOCK_ADMIN = { email: 'admin@admin.com', password: 'admin123' };

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      );
    }

    if (isMockMode() && email === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
      return NextResponse.json({
        id: 'mock-admin-1',
        email: MOCK_ADMIN.email,
        name: 'Admin User',
        role: 'admin',
      });
    }

    const admin = await verifyAdminCredentials(email, password);

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
  } catch (error) {
    console.error('[Auth Verify] Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
