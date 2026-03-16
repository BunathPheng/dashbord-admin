'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DiscountDialog } from '@/components/discounts/discount-dialog';
import { useToast } from '@/hooks/use-toast';

interface Discount {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDiscounts();
  }, [page]);

  async function loadDiscounts() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/discounts?${params}`);
      if (!response.ok) throw new Error('Failed to load discounts');

      const data = await response.json();
      setDiscounts(data.discounts);
      setTotal(data.total);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load discounts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this discount?')) return;

    try {
      const response = await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete discount');

      toast({
        title: 'Success',
        description: 'Discount deleted successfully',
      });
      loadDiscounts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete discount',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discounts & Promotions</h1>
          <p className="text-gray-600 mt-1">Manage discount codes and promotional offers</p>
        </div>
        <Button
          onClick={() => {
            setSelectedDiscount(null);
            setDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Discount
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <h2 className="text-lg font-semibold">All Discounts</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr className="text-sm font-medium text-gray-600">
                  <th className="text-left py-3 px-4">Code</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Value</th>
                  <th className="text-center py-3 px-4">Usage</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-600">
                      Loading...
                    </td>
                  </tr>
                ) : discounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-600">
                      No discounts found
                    </td>
                  </tr>
                ) : (
                  discounts.map((discount) => (
                    <tr
                      key={discount.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-[#f95672]">{discount.code}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{discount.description}</td>
                      <td className="py-3 px-4 text-sm">
                        <Badge variant="outline">
                          {discount.discount_type === 'percentage' ? '%' : '$'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {discount.discount_type === 'percentage' ? (
                          <span>{discount.discount_value}% off</span>
                        ) : (
                          <span>${discount.discount_value.toFixed(2)} off</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        {discount.max_uses ? (
                          <span className="text-gray-600">
                            {discount.current_uses} / {discount.max_uses}
                          </span>
                        ) : (
                          <span className="text-gray-500">Unlimited</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            discount.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {discount.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDiscount(discount);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(discount.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && discounts.length > 0 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total} discounts
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

      <DiscountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        discount={selectedDiscount}
        onSuccess={() => {
          loadDiscounts();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
