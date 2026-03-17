import { getDashboardStats, getRecentOrders } from '@/lib/queries';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentOrders } from '@/components/dashboard/recent-orders';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(5),
  ]);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back to your e-commerce admin panel</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <RecentOrders orders={recentOrders} />
      </div>
    </div>
  );
}
