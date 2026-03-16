'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
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

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem | null;
  onSuccess: () => void;
}

export function InventoryDialog({ open, onOpenChange, item, onSuccess }: InventoryDialogProps) {
  const [formData, setFormData] = useState({
    quantity_on_hand: '',
    quantity_reserved: '',
    low_stock_threshold: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && item) {
      setFormData({
        quantity_on_hand: item.quantity_on_hand.toString(),
        quantity_reserved: item.quantity_reserved.toString(),
        low_stock_threshold: item.low_stock_threshold.toString(),
      });
    }
  }, [open, item]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/inventory/${item.product_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity_on_hand: parseInt(formData.quantity_on_hand),
          quantity_reserved: parseInt(formData.quantity_reserved),
          low_stock_threshold: parseInt(formData.low_stock_threshold),
        }),
      });

      if (!response.ok) throw new Error('Failed to update inventory');

      toast({
        title: 'Success',
        description: 'Inventory updated successfully',
      });
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update inventory',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Inventory - {item?.product_name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600">SKU: {item?.sku}</p>
            <p className="text-sm text-gray-600">
              Available: {item ? parseInt(formData.quantity_on_hand) - parseInt(formData.quantity_reserved) : 0}
            </p>
          </div>

          <FieldGroup>
            <FieldLabel>Quantity On Hand</FieldLabel>
            <Input
              type="number"
              value={formData.quantity_on_hand}
              onChange={(e) => setFormData({ ...formData, quantity_on_hand: e.target.value })}
              placeholder="0"
              required
              min="0"
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Quantity Reserved</FieldLabel>
            <Input
              type="number"
              value={formData.quantity_reserved}
              onChange={(e) => setFormData({ ...formData, quantity_reserved: e.target.value })}
              placeholder="0"
              required
              min="0"
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Low Stock Threshold</FieldLabel>
            <Input
              type="number"
              value={formData.low_stock_threshold}
              onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
              placeholder="0"
              required
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
          </FieldGroup>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Inventory'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
