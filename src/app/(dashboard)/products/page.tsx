'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { ProductForm } from '@/components/products/product-form';
import { CreateSaleForm } from '@/components/products/create-sale-form';
import { useCan } from '@/hooks/use-can';
import { GatedButton } from '@/components/ui/gated-button';
import { useTranslations } from 'next-intl';

const PAGE_SIZE = 25;

export default function ProductsPage() {
  const t = useTranslations('Products.page');
  const supabase = createClient();
  const { user, accountId } = useAuth();
  const canEdit = useCan('send-messages');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saleFormOpen, setSaleFormOpen] = useState(false);
  const [savingSale, setSavingSale] = useState(false);

  // Fetching guard
  const fetchIdRef = useRef(0);

  const fetchProducts = useCallback(
    async (pageNum: number, searchTerm: string) => {
      try {
        fetchIdRef.current += 1;
        const fetchId = fetchIdRef.current;

        let query = supabase
          .from('products')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        if (searchTerm) {
          query = query.ilike('name', `%${searchTerm}%`);
        }

        const { data, count, error } = await query;

        if (fetchId !== fetchIdRef.current) return;

        if (error) {
          console.error('Failed to fetch products:', error);
          toast.error('Erro ao carregar produtos');
          return;
        }

        setProducts(data || []);
        setTotalCount(count || 0);
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    setLoading(true);
    setPage(0);
  }, [search]);

  useEffect(() => {
    fetchProducts(page, search);
  }, [page, search, fetchProducts]);

  const handleSaveProduct = async (
    formData: Omit<
      Product,
      'id' | 'created_at' | 'updated_at' | 'account_id' | 'user_id'
    > & { id?: string }
  ) => {
    setSaving(true);
    try {
      if (editProduct?.id) {
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editProduct.id);

        if (error) throw error;
        toast.success('Produto atualizado com sucesso');
      } else {
        const { error } = await supabase.from('products').insert([
          {
            ...formData,
            account_id: accountId,
            user_id: user?.id,
          },
        ]);

        if (error) throw error;
        toast.success('Produto criado com sucesso');
      }

      setEditProduct(null);
      await fetchProducts(page, search);
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteTarget?.id) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      toast.success('Produto deletado com sucesso');
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      await fetchProducts(page, search);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Erro ao deletar produto');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveSale = async (saleData: {
    sale_number?: string;
    description?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
    }>;
    total_value: number;
  }) => {
    setSavingSale(true);
    try {
      // Create sale
      const { data: saleData_, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            sale_number: saleData.sale_number,
            description: saleData.description,
            total_value: saleData.total_value,
            account_id: accountId,
            user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = saleData.items.map((item) => ({
        sale_id: saleData_.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_value: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from('sales_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      toast.success('Venda registrada com sucesso');
      setSaleFormOpen(false);
    } catch (error: any) {
      console.error('Error saving sale:', error);
      toast.error(error.message || 'Erro ao registrar venda');
    } finally {
      setSavingSale(false);
    }
  };

  const hasMore = (page + 1) * PAGE_SIZE < totalCount;
  const hasPrev = page > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Gerenciar seu catálogo de produtos
          </p>
        </div>
        <div className="flex gap-2">
          <GatedButton
            onClick={() => {
              setEditProduct(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </GatedButton>
          <GatedButton
            variant="outline"
            onClick={() => setSaleFormOpen(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            Registrar Venda
          </GatedButton>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 font-semibold">Nenhum produto encontrado</h3>
          <p className="text-sm text-muted-foreground">
            {search
              ? 'Tente ajustar sua busca'
              : 'Comece adicionando seu primeiro produto'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="w-10">Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.sku || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {product.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.cost ? `R$ ${product.cost.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.stock ?? '-'}
                  </TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      {/* @ts-ignore */}
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditProduct(product);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setDeleteTarget(product);
                            setDeleteConfirmOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Exibindo {page * PAGE_SIZE + 1}-
            {Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!hasPrev}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSaveProduct}
        initialData={editProduct}
        isLoading={saving}
      />

      <CreateSaleForm
        open={saleFormOpen}
        onOpenChange={setSaleFormOpen}
        products={products}
        onSubmit={handleSaveSale}
        isLoading={savingSale}
      />

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Produto?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar "{deleteTarget?.name}"? Esta ação
              não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={deleting}
            >
              {deleting ? 'Deletando...' : 'Deletar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
