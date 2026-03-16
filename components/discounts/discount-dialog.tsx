'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { useToast } from '@/hooks/use-toast';

interface Discount {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  start_date: string | null;
  end_date: string | null;
}

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount?: Discount | null;
  onSuccess: () => void;
}

export function DiscountDialog({ open, onOpenChange, discount, onSuccess }: DiscountDialogProps) {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    max_uses: '',
    start_date: '',
    end_date: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (discount) {
        setFormData({
          code: discount.code,
          description: discount.description,
          discount_type: discount.discount_type,
          discount_value: discount.discount_value.toString(),
          max_uses: discount.max_uses?.toString() || '',
          start_date: discount.start_date ? discount.start_date.split('T')[0] : '',
          end_date: discount.end_date ? discount.end_date.split('T')[0] : '',
        });
      } else {
        setFormData({
          code: '',
          description: '',
          discount_type: 'percentage',
          discount_value: '',
          max_uses: '',
          start_date: '',
          end_date: '',
        });
      }
    }
  }, [open, discount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        code: formData.code,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      const url = discount ? `/api/discounts/${discount.id}` : '/api/discounts';
      const method = discount ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save discount');

      toast({
        title: 'Success',
        description: `Discount ${discount ? 'updated' : 'created'} successfully`,
      });
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${discount ? 'update' : 'create'} discount`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{discount ? 'Edit Discount' : 'Add New Discount'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <FieldLabel>Discount Code</FieldLabel>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., SUMMER20"
              required
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Discount description (for your records)"
              rows={2}
            />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <FieldLabel>Discount Type</FieldLabel>
              <Select
                value={formData.discount_type}
                onValueChange={(value: any) => setFormData({ ...formData, discount_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>
                Discount Value
                <span className="text-gray-500 text-sm ml-2">
                  {formData.discount_type === 'percentage' ? '%' : '$'}
                </span>
              </FieldLabel>
              <Input
                type="number"
                step={formData.discount_type === 'percentage' ? '0.1' : '0.01'}
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                placeholder="0"
                required
              />
            </FieldGroup>
          </div>

          <FieldGroup>
            <FieldLabel>Maximum Uses (Optional)</FieldLabel>
            <Input
              type="number"
              value={formData.max_uses}
              onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
              placeholder="Leave empty for unlimited"
              min="1"
            />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <FieldLabel>Start Date (Optional)</FieldLabel>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>End Date (Optional)</FieldLabel>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </FieldGroup>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Discount'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
