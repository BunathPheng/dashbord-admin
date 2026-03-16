'use client';

import { DollarSign, ShoppingCart, Users, Package, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardsProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    lowStockProducts: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-[#f95672]',
      bgColor: 'bg-[#f95672]/10',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'text-[#f95672]',
      bgColor: 'bg-[#f95672]/10',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: 'text-[#f95672]',
      bgColor: 'bg-[#f95672]/10',
    },
    {
      title: 'Active Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'text-[#f95672]',
      bgColor: 'bg-[#f95672]/10',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockProducts.toString(),
      icon: AlertTriangle,
      color: 'text-[#f95672]',
      bgColor: 'bg-[#f95672]/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
