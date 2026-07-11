'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product } from '@/types';

interface CreateSaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  contactId?: string;
  onSubmit: (saleData: {
    sale_number?: string;
    description?: string;
    contact_id?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
    }>;
    total_value: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function CreateSaleForm({
  open,
  onOpenChange,
  products,
  contactId,
  onSubmit,
  isLoading = false,
}: CreateSaleFormProps) {
  const [saleNumber, setSaleNumber] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<
    Array<{ product_id: string; quantity: number; unit_price: number }>
  >([{ product_id: '', quantity: 1, unit_price: 0 }]);

  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (
    idx: number,
    field: string,
    value: string | number
  ) => {
    const newItems = [...items];
    (newItems[idx] as any)[field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter((item) => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      alert('Adicione pelo menos um item à venda');
      return;
    }

    const totalValue = validItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );

    await onSubmit({
      sale_number: saleNumber || undefined,
      description: description || undefined,
      contact_id: contactId,
      items: validItems,
      total_value: totalValue,
    });

    // Reset form
    setSaleNumber('');
    setDescription('');
    setItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
    onOpenChange(false);
  };

  const totalValue = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Venda</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale-number">Nº da Venda</Label>
              <Input
                id="sale-number"
                value={saleNumber}
                onChange={(e) => setSaleNumber(e.target.value)}
                placeholder="Ex: VND-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Venda Online"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Itens</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
              >
                + Adicionar Item
              </Button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={item.product_id}
                    onValueChange={(value) =>
                      handleItemChange(idx, 'product_id', value || '')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku || 'sem SKU'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="number"
                  placeholder="Qtd"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(
                      idx,
                      'quantity',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-24"
                  step="0.01"
                />
                <Input
                  type="number"
                  placeholder="Preço"
                  value={item.unit_price}
                  onChange={(e) =>
                    handleItemChange(
                      idx,
                      'unit_price',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-32"
                  step="0.01"
                />
                <div className="w-28 rounded-md bg-muted p-2 text-right text-sm font-medium">
                  R$ {(item.quantity * item.unit_price).toFixed(2)}
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(idx)}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-md bg-muted p-4">
            <div className="flex justify-between">
              <span className="font-medium">Total:</span>
              <span className="text-lg font-bold">
                R$ {totalValue.toFixed(2)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Registrar Venda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
