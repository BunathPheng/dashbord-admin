'use client';

import { useSession } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();

  return (
    <div className="h-16 bg-white border-b border-[#f95672]/30 flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-[#f95672]">E-Commerce Admin</h2>
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-600">
          {session?.user?.name && <span>Welcome, {session.user.name}</span>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ redirectTo: '/login' })}
          className="text-gray-600 hover:text-[#f95672] hover:bg-[#f95672]/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
