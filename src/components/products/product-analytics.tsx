'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Product, Sale, SalesItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Calendar, TrendingUp, DollarSign, Package, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

type PeriodType = 'today' | '7days' | '15days' | '30days' | 'month' | 'custom';

interface ProductMetric {
  productId: string;
  productName: string;
  sku?: string;
  totalQuantity: number;
  totalValue: number;
  salesCount: number;
}

export function ProductAnalytics() {
  const supabase = createClient();
  const [period, setPeriod] = useState<PeriodType>('30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<ProductMetric[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  const getPeriodDates = useCallback((type: PeriodType) => {
    const now = new Date();
    let startDate = new Date();

    switch (type) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case '7days':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '15days':
        startDate = new Date(now.setDate(now.getDate() - 15));
        break;
      case '30days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        if (customStartDate) {
          startDate = new Date(customStartDate);
        }
        break;
    }

    return {
      start: startDate.toISOString(),
      end: (customEndDate && type === 'custom' 
        ? new Date(customEndDate)
        : new Date()
      ).toISOString(),
    };
  }, [customStartDate, customEndDate]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const dates = getPeriodDates(period);

      // Fetch sales items with product details for the period
      const { data: salesItems, error: salesError } = await supabase
        .from('sales_items')
        .select(`
          id,
          quantity,
          total_value,
          product_id,
          created_at,
          product:products(id, name, sku)
        `)
        .gte('created_at', dates.start)
        .lte('created_at', dates.end)
        .order('created_at', { ascending: true });

      if (salesError) throw salesError;

      // Also get top 10 products by quantity
      const { data: topProductsData, error: topError } = await supabase
        .from('sales_items')
        .select(`
          product_id,
          quantity,
          total_value,
          product:products(id, name, sku)
        `)
        .gte('created_at', dates.start)
        .lte('created_at', dates.end);

      if (topError) throw topError;

      // Process top products
      const productMap = new Map<string, ProductMetric>();

      (topProductsData || []).forEach((item: any) => {
        const productId = item.product_id;
        const product = item.product;

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            productId,
            productName: product?.name || 'Unknown',
            sku: product?.sku,
            totalQuantity: 0,
            totalValue: 0,
            salesCount: 0,
          });
        }

        const metric = productMap.get(productId)!;
        metric.totalQuantity += item.quantity || 0;
        metric.totalValue += item.total_value || 0;
        metric.salesCount += 1;
      });

      // Sort by total value and get top 10
      const sortedProducts = Array.from(productMap.values())
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);

      setTopProducts(sortedProducts);

      // Calculate totals
      const revenue = sortedProducts.reduce((sum, p) => sum + p.totalValue, 0);
      const sales = sortedProducts.reduce((sum, p) => sum + p.salesCount, 0);

      setTotalRevenue(revenue);
      setTotalSales(sales);

      // Generate chart data for daily trend
      const dailyData = new Map<string, { date: string; revenue: number; quantity: number }>();

      (salesItems || []).forEach((item: any) => {
        const date = new Date(item.created_at).toLocaleDateString('pt-BR');
        if (!dailyData.has(date)) {
          dailyData.set(date, { date, revenue: 0, quantity: 0 });
        }
        const data = dailyData.get(date)!;
        data.revenue += item.total_value || 0;
        data.quantity += item.quantity || 0;
      });

      const sortedChartData = Array.from(dailyData.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setChartData(sortedChartData);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error('Erro ao carregar análises');
    } finally {
      setLoading(false);
    }
  }, [supabase, period, getPeriodDates]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleCustomDateFilter = () => {
    if (!customStartDate) {
      toast.error('Selecione uma data inicial');
      return;
    }
    setPeriod('custom');
    setShowCustomDatePicker(false);
  };

  const periodOptions: { value: PeriodType; label: string }[] = [
    { value: 'today', label: 'Hoje' },
    { value: '7days', label: 'Últimos 7 dias' },
    { value: '15days', label: 'Últimos 15 dias' },
    { value: '30days', label: 'Últimos 30 dias' },
    { value: 'month', label: 'Este mês' },
    { value: 'custom', label: 'Período personalizado' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics de Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe as vendas e performance dos seus produtos
          </p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex flex-wrap gap-2">
        {periodOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={period === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (opt.value === 'custom') {
                setShowCustomDatePicker(true);
              } else {
                setPeriod(opt.value);
              }
            }}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {totalRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total no período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSales}</div>
                <p className="text-xs text-muted-foreground">
                  Quantidade de transações
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor médio por venda
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Faturamento Diário</CardTitle>
                <CardDescription>Tendência de vendas ao longo do período</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        name="Faturamento (R$)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Products by Quantity */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Produtos - Quantidade</CardTitle>
                <CardDescription>Produtos mais vendidos por volume</CardDescription>
              </CardHeader>
              <CardContent>
                {topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={topProducts}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 200 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="productName" width={190} />
                      <Tooltip />
                      <Bar dataKey="totalQuantity" fill="#10b981" name="Quantidade" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Ranking dos 10 Produtos Mais Vendidos</CardTitle>
              <CardDescription>Por valor faturado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 text-left font-semibold">Posição</th>
                      <th className="py-3 text-left font-semibold">Produto</th>
                      <th className="py-3 text-left font-semibold">SKU</th>
                      <th className="py-3 text-right font-semibold">Quantidade</th>
                      <th className="py-3 text-right font-semibold">Faturamento</th>
                      <th className="py-3 text-right font-semibold">Vendas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, idx) => (
                      <tr
                        key={product.productId}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="py-3 font-medium">#{idx + 1}</td>
                        <td className="py-3 font-medium">{product.productName}</td>
                        <td className="py-3 text-muted-foreground">
                          {product.sku || '-'}
                        </td>
                        <td className="py-3 text-right">
                          {product.totalQuantity.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-semibold">
                          R$ {product.totalValue.toFixed(2)}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                          {product.salesCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {topProducts.length === 0 && (
                <div className="flex justify-center py-8 text-muted-foreground">
                  Nenhum dado de vendas no período
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Custom Date Picker Dialog */}
      <Dialog open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Período Personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCustomDatePicker(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCustomDateFilter}>
                Aplicar Filtro
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
