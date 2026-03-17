'use client';

import { useState, useEffect, useRef } from 'react';
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
import { getImagePreviewProxyUrl } from '@/lib/api-client';
import { Upload, Loader2, ImageIcon } from 'lucide-react';

const PRODUCT_CATEGORIES = [
  'WOMENS_FASHION',
  'MENS_FASHION',
  'KIDS_FASHION',
  'SHOES',
  'BAGS',
  'JEWELRY',
  'WATCHES',
  'SMARTPHONES',
  'LAPTOPS',
  'TABLETS',
  'CAMERAS',
  'AUDIO',
  'GAMING',
  'ACCESSORIES',
  'HOME_APPLIANCES',
  'HOME_DECOR',
  'FURNITURE',
  'KITCHEN_DINING',
  'BEAUTY',
  'PERSONAL_CARE',
  'SPORTS_OUTDOORS',
  'OTHERS',
];

interface Product {
  id: string;
  name: string;
  category_name: string;
  price: number;
  is_active: boolean;
}

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
}

type ImageUploadState = 'idle' | 'uploading' | 'success' | 'error';

export function ProductDialog({ open, onOpenChange, product, onSuccess }: ProductDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'OTHERS',
    price: '',
    imageUrl: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [imageUploadState, setImageUploadState] = useState<ImageUploadState>('idle');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  function validate(): boolean {
    const err: Record<string, string> = {};
    const name = formData.name.trim();
    if (!name) {
      err.name = 'Product name is required';
    }
    // description is optional
    if (!formData.category) {
      err.category = 'Category is required';
    }
    const priceNum = parseFloat(formData.price);
    if (formData.price === '' || isNaN(priceNum)) {
      err.price = 'Price is required';
    } else if (priceNum < 0) {
      err.price = 'Price must be 0 or greater';
    }
    if (!formData.imageUrl || imageUploadState !== 'success') {
      err.imageUrl = 'Product image is required';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  }

  useEffect(() => {
    if (open) {
      if (product) {
        fetchProductDetails(product.id);
      } else {
        setFormData({
          name: '',
          description: '',
          category: 'OTHERS',
          price: '',
          imageUrl: '',
        });
        setImageUploadState('idle');
        setImagePreviewUrl(null);
        setErrors({});
      }
    }
  }, [open, product]);

  async function fetchProductDetails(id: string) {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error('Failed to load product');
      const data = await response.json();
      const cat = data.category || (data.category_name ? String(data.category_name).replace(/\s/g, '_').toUpperCase() : 'OTHERS');
      const matchedCategory = PRODUCT_CATEGORIES.includes(cat) ? cat : 'OTHERS';
      setFormData({
        name: data.name,
        description: data.description || '',
        category: matchedCategory,
        price: data.price?.toString() || '',
        imageUrl: data.imageUrl || data.image_url || '',
      });
      if (data.imageUrl || data.image_url) {
        setImagePreviewUrl(data.imageUrl || data.image_url);
        setImageUploadState('success');
      } else {
        setImageUploadState('idle');
        setImagePreviewUrl(null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      });
    }
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file (PNG, JPG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    setImageUploadState('uploading');
    try {
      const fd = new FormData();
      fd.append('file', file);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: fd,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }

      const data = await response.json();
      const fileUrl = data.fileUrl;
      if (!fileUrl) throw new Error('No file URL returned');

      setFormData((prev) => ({ ...prev, imageUrl: fileUrl }));
      setImagePreviewUrl(fileUrl);
      setImageUploadState('success');
      setErrors((prev) => ({ ...prev, imageUrl: '' }));
      toast({
        title: 'Upload success',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      setImageUploadState('error');
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleRemoveImage() {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    setImagePreviewUrl(null);
    setImageUploadState('idle');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: 'Validation error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setErrors({});

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        price: parseFloat(formData.price) || 0,
        imageUrl: formData.imageUrl,
        category: formData.category,
      };

      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData?.error || errData?.message || `Failed to save product (${response.status})`;
        throw new Error(errMsg);
      }

      toast({
        title: 'Success',
        description: `Product ${product ? 'updated' : 'created'} successfully`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${product ? 'update' : 'create'} product`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-2 shrink-0">
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto scrollbar-hide flex-1 min-h-0">
          <FieldGroup>
            <FieldLabel>Product Name <span className="text-destructive">*</span></FieldLabel>
            <Input
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g., Wireless Headphones"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Description <span className="text-muted-foreground text-xs font-normal">(optional)</span></FieldLabel>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description"
              rows={3}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Category <span className="text-destructive">*</span></FieldLabel>
            <Select
              value={formData.category}
              onValueChange={(value) => {
                setFormData({ ...formData, category: value });
                if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
              }}
            >
              <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Price ($) <span className="text-destructive">*</span></FieldLabel>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => {
                setFormData({ ...formData, price: e.target.value });
                if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
              }}
              placeholder="0.00"
              className={errors.price ? 'border-destructive' : ''}
            />
            {errors.price && <p className="text-sm text-destructive mt-1">{errors.price}</p>}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Product Image <span className="text-destructive">*</span></FieldLabel>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {imageUploadState === 'idle' && (
              <div
                onClick={() => {
                  fileInputRef.current?.click();
                  if (errors.imageUrl) setErrors((prev) => ({ ...prev, imageUrl: '' }));
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex flex-col items-center justify-center gap-2 h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  errors.imageUrl
                    ? 'border-destructive bg-destructive/5'
                    : isDragging
                    ? 'border-[#f95672] bg-[#f95672]/10'
                    : 'border-gray-300 hover:border-[#f95672] hover:bg-[#f95672]/5'
                }`}
              >
                <Upload className={`w-10 h-10 ${isDragging ? 'text-[#f95672]' : 'text-gray-400'}`} />
                <p className="text-sm text-gray-600">
                  {isDragging ? 'Drop image here' : 'Drag and drop or click to upload'}
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            )}

            {imageUploadState === 'uploading' && (
              <div className="flex flex-col items-center justify-center gap-2 h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <Loader2 className="w-10 h-10 text-[#f95672] animate-spin" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            )}

            {imageUploadState === 'success' && imagePreviewUrl && (
              <div className="space-y-2">
                <div className="relative inline-block">
                  <img
                    src={getImagePreviewProxyUrl(imagePreviewUrl) || imagePreviewUrl}
                    alt="Preview"
                    className="h-40 w-auto max-w-full object-contain rounded-lg border border-gray-200"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    Remove
                  </Button>
                </div>
                <p className="text-xs text-green-600">Image uploaded successfully</p>
              </div>
            )}
            {errors.imageUrl && <p className="text-sm text-destructive mt-1">{errors.imageUrl}</p>}

            {imageUploadState === 'error' && (
              <div className="flex flex-col items-center justify-center gap-2 h-40 border-2 border-dashed border-red-200 rounded-lg bg-red-50">
                <ImageIcon className="w-10 h-10 text-red-400" />
                <p className="text-sm text-red-600">Upload failed</p>
                <Button type="button" variant="outline" size="sm" onClick={() => setImageUploadState('idle')}>
                  Try again
                </Button>
              </div>
            )}
          </FieldGroup>

          <div className="flex justify-end gap-3 pt-6">
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
