'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface LowStockAlertProps {
  products: Array<{
    id: string;
    name: string;
    sku: string;
    quantity_on_hand: number;
    low_stock_threshold: number;
  }>;
}

export function LowStockAlert({ products }: LowStockAlertProps) {
  return (
    <Card className="border-0 shadow-sm border-l-4 border-[#f95672]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#f95672]" />
          <CardTitle className="text-[#f95672]">Low Stock Items</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {products.length === 0 ? (
          <p className="text-sm text-gray-600">All items are well stocked</p>
        ) : (
          <>
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-2 bg-[#f95672]/10 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                </div>
                <Badge variant="outline" className="bg-[#f95672]/20 text-[#f95672]">
                  {product.quantity_on_hand} left
                </Badge>
              </div>
            ))}
            <Link href="/dashboard/inventory" className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                Manage Inventory
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
