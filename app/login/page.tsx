'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email?.trim()) {
      toast({ title: 'Validation', description: 'Please enter your email.', variant: 'destructive' });
      return;
    }
    if (!password?.trim()) {
      toast({ title: 'Validation', description: 'Please enter your password.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Validate credentials first to get backend error message on failure
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        const errorMessage = errData.error || 'Invalid password or email';
        toast({ title: 'Login failed', description: errorMessage, variant: 'destructive' });
        return;
      }

      // Credentials valid - sign in to create session
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/dashboard');
        return;
      }

      const errorMessage =
        result?.error === 'CredentialsSignin'
          ? 'Invalid password or email'
          : result?.error
            ? String(result.error)
            : 'Invalid password or email';
      toast({ title: 'Login failed', description: errorMessage, variant: 'destructive' });
    } catch (err) {
      console.error('[Login] Error:', err);
      toast({ title: 'Login failed', description: 'An error occurred. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-[#f95672]">Admin Dashboard</CardTitle>
          <CardDescription>Sign in to your admin account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@admin.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Sign in with your admin account credentials
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
