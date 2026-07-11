'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import type { Product } from '@/types';

interface ProductPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onConfirm: (selectedProducts: Array<{ product_id: string; quantity: number }>) => void;
  isLoading?: boolean;
}

interface SelectedProduct {
  product_id: string;
  quantity: number;
  product?: Product;
}

export function ProductPicker({
  open,
  onOpenChange,
  products,
  onConfirm,
  isLoading = false,
}: ProductPickerProps) {
  const [selected, setSelected] = useState<SelectedProduct[]>([]);

  const handleAddProduct = (productId: string) => {
    const existingIndex = selected.findIndex((s) => s.product_id === productId);
    if (existingIndex >= 0) {
      const newSelected = [...selected];
      newSelected[existingIndex].quantity += 1;
      setSelected(newSelected);
    } else {
      setSelected([
        ...selected,
        {
          product_id: productId,
          quantity: 1,
          product: products.find((p) => p.id === productId),
        },
      ]);
    }
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }
    setSelected(
      selected.map((s) =>
        s.product_id === productId ? { ...s, quantity } : s
      )
    );
  };

  const handleRemoveProduct = (productId: string) => {
    setSelected(selected.filter((s) => s.product_id !== productId));
  };

  const handleConfirm = () => {
    if (selected.length === 0) {
      alert('Selecione pelo menos um produto');
      return;
    }
    onConfirm(selected.map((s) => ({ product_id: s.product_id, quantity: s.quantity })));
    setSelected([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Selecionar Produtos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Available Products */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Produtos Disponíveis</h3>
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum produto disponível</p>
              ) : (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-border p-2 hover:bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {product.price.toFixed(2)} - {product.unit}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddProduct(product.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Divider */}
          {selected.length > 0 && <div className="border-t border-border" />}

          {/* Selected Products */}
          {selected.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Produtos Selecionados</h3>
              <div className="space-y-2">
                {selected.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between rounded-lg bg-muted p-2"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {item.product?.name || 'Produto desconhecido'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        R$ {((item.product?.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateQuantity(item.product_id, parseInt(e.target.value) || 1)
                        }
                        className="w-12 rounded border border-border px-2 py-1 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveProduct(item.product_id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || selected.length === 0}
          >
            {isLoading ? 'Registrando...' : 'Registrar Compra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
