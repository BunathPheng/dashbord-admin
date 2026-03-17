'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getImagePreviewProxyUrl } from '@/lib/api-client';
import { ImageIcon } from 'lucide-react';

interface OrderDetail {
  order: {
    id?: string;
    order_number: string;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
    payment_status: string;
    total_amount: number;
    subtotal: number;
    tax: number;
    shipping_cost: number;
    discount_amount: number;
    shipping_address: string;
    notes: string;
    created_at: string;
  };
  items: Array<{
    id: string;
    product_name: string;
    product_imageUrl?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  async function loadOrder() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      if (!response.ok) throw new Error('Failed to load order');
      const result = await response.json();
      if (!result?.order) {
        throw new Error('Invalid order data');
      }
      setData(result);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        variant: 'destructive',
      });
      router.push('/dashboard/orders');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!data || !data.order) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-600">Order not found</div>
      </div>
    );
  }

  const { order, items = [] } = data;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{order.order_number ?? `ORD-${order.id}`}</h1>
          <p className="text-gray-600">Placed on {new Date(order.created_at ?? '').toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{`${order.first_name} ${order.last_name}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{order.email}</p>
              </div>
              {order.shipping_address && (
                <div>
                  <p className="text-sm text-gray-600">Shipping Address</p>
                  <p className="font-medium">{order.shipping_address}</p>
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-medium">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr className="text-sm font-medium text-gray-600">
                      <th className="text-left py-3 px-4 w-16">Image</th>
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-right py-3 px-4">Quantity</th>
                      <th className="text-right py-3 px-4">Unit Price</th>
                      <th className="text-right py-3 px-4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const imgSrc = getImagePreviewProxyUrl(item.product_imageUrl) || item.product_imageUrl;
                      return (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                              {imgSrc ? (
                                <img src={imgSrc} alt={item.product_name} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">{item.product_name}</td>
                          <td className="text-right py-3 px-4">{item.quantity}</td>
                          <td className="text-right py-3 px-4">${item.unit_price.toFixed(2)}</td>
                          <td className="text-right py-3 px-4 font-medium">${item.total_price.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Status */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">Status</p>
              <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                {order.status === 'paid' ? 'Paid' : 'Pending'}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">
                Status updates automatically when payment is completed.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${(order.subtotal ?? order.total_amount ?? 0).toFixed(2)}</span>
              </div>
              {(order.tax ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${order.tax.toFixed(2)}</span>
                </div>
              )}
              {(order.shipping_cost ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">${(order.shipping_cost ?? 0).toFixed(2)}</span>
                </div>
              )}
              {(order.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-green-600">-${(order.discount_amount ?? 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">${order.total_amount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={order.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {order.payment_status}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
