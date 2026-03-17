'use client';

import { useState, useEffect } from 'react';
import { ImageIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getImagePreviewProxyUrl } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  category_name: string;
  imageUrl?: string;
  discountPercentage?: number;
  onPromotion?: boolean;
}

export default function DiscountsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editPercent, setEditPercent] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, [page]);

  async function loadProducts() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to load products');

      const data = await response.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateDiscount(product: Product) {
    const raw = editPercent[product.id] ?? String(product.discountPercentage ?? 0);
    const percentage = Math.min(100, Math.max(0, parseFloat(raw) || 0));
    setUpdatingId(product.id);
    try {
      const response = await fetch(`/api/products/${product.id}/discount`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage }),
        credentials: 'include',
      });
      const errData = await response.json().catch(() => ({}));
      const errMsg = (errData as { error?: string })?.error;
      if (!response.ok) throw new Error(errMsg || `Failed to update (${response.status})`);

      toast({
        title: 'Success',
        description: `Discount set to ${percentage}%`,
      });
      setEditPercent((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      loadProducts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update discount',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Product Discounts</h1>
        <p className="text-gray-600 mt-1">Set discount percentage for products</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <h2 className="text-lg font-semibold">Products</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr className="text-sm font-medium text-gray-600">
                  <th className="text-left py-3 px-4 w-16">Image</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Price</th>
                  <th className="text-left py-3 px-4">Discount %</th>
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
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-600">
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const imgSrc = getImagePreviewProxyUrl(product.imageUrl) || product.imageUrl;
                    const percent = product.discountPercentage ?? 0;
                    const display = editPercent[product.id] ?? String(percent);
                    const isUpdating = updatingId === product.id;

                    return (
                      <tr
                        key={product.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                            {imgSrc ? (
                              <img
                                src={imgSrc}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                        <td className="py-3 px-4 text-sm">{product.category_name || '-'}</td>
                        <td className="py-3 px-4 font-medium">${product.price.toFixed(2)}</td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              value={display}
                              onChange={(e) =>
                                setEditPercent((prev) => ({ ...prev, [product.id]: e.target.value }))
                              }
                              className="w-14 h-8 text-sm"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {(product.onPromotion || (product.discountPercentage ?? 0) > 0) ? (
                            <Badge className="bg-green-100 text-green-800">On Promotion</Badge>
                          ) : (
                            <span className="text-gray-500 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center align-middle">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateDiscount(product)}
                            disabled={isUpdating}
                            className="gap-1"
                          >
                            {isUpdating ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Apply
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && products.length > 0 && (
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total} products
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
                  disabled={page * 20 >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
