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
import { put } from 'http';

interface Product {
  id: string;
  name: string;
  sku: string;
  category_name: string;
  price: number;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
}

export function ProductDialog({ open, onOpenChange, product, onSuccess }: ProductDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    cost: '',
    sku: '',
    image_url: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadCategories();
      if (product) {
        // Fetch full product details
        fetchProductDetails(product.id);
      } else {
        setFormData({
          name: '',
          description: '',
          category_id: '',
          price: '',
          cost: '',
          sku: '',
          image_url: '',
        });
      }
    }
  }, [open, product]);

  async function loadCategories() {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to load categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function fetchProductDetails(id: string) {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error('Failed to load product');
      const data = await response.json();
      setFormData({
        name: data.name,
        description: data.description,
        category_id: data.category_id,
        price: data.price.toString(),
        cost: data.cost.toString(),
        sku: data.sku,
        image_url: data.image_url || '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
      };

      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save product');

      toast({
        title: 'Success',
        description: `Product ${product ? 'updated' : 'created'} successfully`,
      });
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${product ? 'update' : 'create'} product`,
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
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <FieldLabel>Product Name</FieldLabel>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Wireless Headphones"
              required
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description"
              rows={3}
            />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <FieldLabel>Category</FieldLabel>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>SKU</FieldLabel>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g., PROD-001"
                required
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <FieldLabel>Price ($)</FieldLabel>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Cost ($)</FieldLabel>
              <Input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
                required
              />
            </FieldGroup>
          </div>

          <FieldGroup>
            <FieldLabel>Image URL</FieldLabel>
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              type="url"
            />
          </FieldGroup>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
