'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InventoryDialog } from '@/components/inventory/inventory-dialog';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  low_stock_threshold: number;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInventory();
  }, [page, filter]);

  async function loadInventory() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filter === 'low' && { lowStockOnly: 'true' }),
      });

      const response = await fetch(`/api/inventory?${params}`);
      if (!response.ok) throw new Error('Failed to load inventory');

      const data = await response.json();
      setInventory(data.inventory);
      setTotal(data.total);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load inventory',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-1">Track and manage product stock levels</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-2">Filter</label>
              <Select value={filter} onValueChange={(value: any) => {
                setFilter(value);
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="low">Low Stock Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr className="text-sm font-medium text-gray-600">
                  <th className="text-left py-3 px-4">Product</th>
                  <th className="text-left py-3 px-4">SKU</th>
                  <th className="text-center py-3 px-4">On Hand</th>
                  <th className="text-center py-3 px-4">Reserved</th>
                  <th className="text-center py-3 px-4">Available</th>
                  <th className="text-center py-3 px-4">Threshold</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-center py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-600">
                      Loading...
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-600">
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const isLowStock = item.quantity_available < item.low_stock_threshold;
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-100 transition-colors ${
                          isLowStock ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-gray-900">{item.product_name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{item.sku}</td>
                        <td className="py-3 px-4 text-center font-medium">{item.quantity_on_hand}</td>
                        <td className="py-3 px-4 text-center font-medium text-orange-600">
                          {item.quantity_reserved}
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-[#f95672]">
                          {item.quantity_available}
                        </td>
                        <td className="py-3 px-4 text-center text-sm">{item.low_stock_threshold}</td>
                        <td className="py-3 px-4 text-center">
                          {isLowStock ? (
                            <Badge className="bg-red-100 text-red-800 gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setDialogOpen(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && inventory.length > 0 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total} items
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page * 10 >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <InventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onSuccess={() => {
          loadInventory();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
