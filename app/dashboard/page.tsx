import { getDashboardStats, getRecentOrders, getLowStockProducts } from '@/lib/queries';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentOrders } from '@/components/dashboard/recent-orders';
import { LowStockAlert } from '@/components/dashboard/low-stock-alert';

export default async function DashboardPage() {
  const [stats, recentOrders, lowStockProducts] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(5),
    getLowStockProducts(5),
  ]);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back to your e-commerce admin panel</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentOrders orders={recentOrders} />
        </div>
        <LowStockAlert products={lowStockProducts} />
      </div>
    </div>
  );
}
