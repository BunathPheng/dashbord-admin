import { hash, compare } from 'bcryptjs';
import { query } from './db';

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export async function getAdminByEmail(email: string): Promise<Admin | null> {
  const result = await query<Admin & { password_hash: string }>(
    'SELECT id, email, name, role, is_active, created_at, updated_at FROM admins WHERE email = $1 AND is_active = true',
    [email]
  );
  return result.rows[0] || null;
}

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<Admin | null> {
  const result = await query<Admin & { password_hash: string }>(
    'SELECT * FROM admins WHERE email = $1 AND is_active = true',
    [email]
  );

  const admin = result.rows[0];
  if (!admin) return null;

  const isValid = await verifyPassword(password, admin.password_hash);
  if (!isValid) return null;

  // Return admin without password_hash
  const { password_hash, ...adminData } = admin;
  return adminData as Admin;
}

export async function createAdmin(
  email: string,
  password: string,
  name: string
): Promise<Admin> {
  const passwordHash = await hashPassword(password);
  const result = await query<Admin>(
    'INSERT INTO admins (email, password_hash, name, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, is_active, created_at, updated_at',
    [email, passwordHash, name, 'admin', true]
  );
  return result.rows[0];
}
