"use client"

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency } from '@/lib/currency'
import {
  MessageSquare,
  UserPlus,
  DollarSign,
  Send,
  Wallet,
  UserCheck,
  TriangleAlert,
  RotateCcw,
  Cake
} from 'lucide-react'

import {
  loadActivity,
  loadConversationsSeries,
  loadMetrics,
  loadPipelineDonut,
  loadResponseTime,
} from '@/lib/dashboard/queries'
import type {
  ActivityItem,
  ConversationsSeriesPoint,
  MetricsBundle,
  PipelineDonutData,
  ResponseTimeSummary,
} from '@/lib/dashboard/types'

import { MetricCard } from '@/components/dashboard/metric-card'
import { SkeletonCard } from '@/components/dashboard/skeleton'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ConversationsChart } from '@/components/dashboard/conversations-chart'
import { PipelineDonut } from '@/components/dashboard/pipeline-donut'
import { ResponseTimeChart } from '@/components/dashboard/response-time-chart'
import { ActivityFeed } from '@/components/dashboard/activity-feed'

import { useTranslations } from 'next-intl'

type RangeDays = 7 | 30 | 90

export default function DashboardPage() {
  const t = useTranslations('Dashboard.page')
  const { defaultCurrency } = useAuth()
  const [metrics, setMetrics] = useState<MetricsBundle | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)

  const [range, setRange] = useState<RangeDays>(30)
  // Keep a cache per range so switching tabs doesn't re-fetch what we
  // already have. Ranges the user hasn't opened yet stay null and
  // trigger a fetch on first view.
  const [series, setSeries] = useState<Record<RangeDays, ConversationsSeriesPoint[] | null>>({
    7: null,
    30: null,
    90: null,
  })
  const [seriesLoading, setSeriesLoading] = useState(true)

  const [pipeline, setPipeline] = useState<PipelineDonutData | null>(null)
  const [pipelineLoading, setPipelineLoading] = useState(true)

  const [responseTime, setResponseTime] = useState<ResponseTimeSummary | null>(null)
  const [responseTimeLoading, setResponseTimeLoading] = useState(true)

  const [activity, setActivity] = useState<ActivityItem[] | null>(null)
  const [activityLoading, setActivityLoading] = useState(true)

  const loadAll = useCallback(() => {
    const db = createClient()

    // Kick everything off in parallel. Each block has its own
    // setState + finally so a slow query doesn't hold up faster
    // sections — each widget shows its own skeleton independently.
    void loadMetrics(db)
      .then((m) => setMetrics(m))
      .catch((err) => console.error('[dashboard] metrics failed:', err))
      .finally(() => setMetricsLoading(false))

    void loadConversationsSeries(db, 30)
      .then((s) => setSeries((prev) => ({ ...prev, 30: s })))
      .catch((err) => console.error('[dashboard] series failed:', err))
      .finally(() => setSeriesLoading(false))

    void loadPipelineDonut(db)
      .then((p) => setPipeline(p))
      .catch((err) => console.error('[dashboard] pipeline failed:', err))
      .finally(() => setPipelineLoading(false))

    void loadResponseTime(db)
      .then((r) => setResponseTime(r))
      .catch((err) => console.error('[dashboard] response time failed:', err))
      .finally(() => setResponseTimeLoading(false))

    // Fetch up to 50 so the biggest page-size option in the feed
    // (50 rows) is already in memory — switching sizes then becomes
    // a pure client-side slice with no extra round trip.
    void loadActivity(db, 50)
      .then((a) => setActivity(a))
      .catch((err) => console.error('[dashboard] activity failed:', err))
      .finally(() => setActivityLoading(false))
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Range switch handler — kept in an event callback (not an effect)
  // so the setState calls stay out of the react-hooks/set-state-in-effect
  // rule's way. The cached bucket check means switching back to a
  // previously-viewed range is instant and doesn't re-fetch.
  const handleRangeChange = useCallback(
    (r: RangeDays) => {
      setRange(r)
      if (series[r] !== null) return
      setSeriesLoading(true)
      const db = createClient()
      loadConversationsSeries(db, r)
        .then((s) => setSeries((prev) => ({ ...prev, [r]: s })))
        .catch((err) => console.error('[dashboard] series failed:', err))
        .finally(() => setSeriesLoading(false))
    },
    [series],
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricsLoading || !metrics ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <MetricCard
              title="Receita Recuperada Hoje"
              value={formatCurrency(metrics.todaySalesRevenue.current, defaultCurrency)}
              icon={Wallet}
              delta={{
                sign: Math.sign(metrics.todaySalesRevenue.current - metrics.todaySalesRevenue.previous),
                label: `vs ontem`,
              }}
            />
            <MetricCard
              title="Vendas Realizadas"
              value={metrics.todaySalesCount.current.toString()}
              icon={UserCheck}
              delta={{
                sign: Math.sign(metrics.todaySalesCount.current - metrics.todaySalesCount.previous),
                label: `vs ontem`,
              }}
            />
            <MetricCard
              title="Valor Previsto (Pipeline)"
              value={formatCurrency(metrics.openDealsValue, defaultCurrency)}
              icon={DollarSign}
              subtitle={t('openDeals', { count: metrics.openDealsCount })}
            />
            <MetricCard
              title="Mensagens Enviadas"
              value={metrics.messagesSentToday.current.toLocaleString()}
              icon={Send}
              subtitle="Automações ativas hoje"
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Oportunidades (Visuno) */}
      <div className="mt-2 mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Oportunidades de Hoje
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Risco */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <TriangleAlert className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">
                  {metricsLoading || !metrics ? '-' : metrics.contactsAtRiskCount}
                </h4>
                <p className="text-xs text-muted-foreground">Clientes em risco de sumir</p>
              </div>
            </div>
            <button className="text-xs font-medium text-muted-foreground hover:text-foreground">Agir agora &rarr;</button>
          </div>

          {/* Reativar */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">
                  {metricsLoading || !metrics ? '-' : metrics.contactsToReactivateCount}
                </h4>
                <p className="text-xs text-muted-foreground">Para reativar hoje</p>
              </div>
            </div>
            <button className="text-xs font-medium text-muted-foreground hover:text-foreground">Prontos &rarr;</button>
          </div>

          {/* Novos Leads */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-[#6D5EF8]/20 bg-[#6D5EF8]/5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6D5EF8]/10 text-[#6D5EF8]">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">
                  {metricsLoading || !metrics ? '-' : metrics.newContactsToday.current}
                </h4>
                <p className="text-xs text-muted-foreground">Novos Leads Hoje</p>
              </div>
            </div>
            <button className="text-xs font-medium text-muted-foreground hover:text-foreground">Ver leads &rarr;</button>
          </div>
        </div>
      </div>

      {/* Charts row */}
      {/* items-stretch (the grid default) stretches the two columns to
          match the tallest sibling; adding h-full on each wrapper and
          on the inner panels makes both cards actually fill that
          stretched height so their rounded borders line up. Without
          this, the pipeline card rendered at its natural (shorter)
          height while the line chart drove the row height. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="h-full lg:col-span-3">
          <ConversationsChart
            series={series}
            loading={seriesLoading}
            range={range}
            onRangeChange={handleRangeChange}
          />
        </div>
        <div className="h-full lg:col-span-2">
          <PipelineDonut
            data={pipeline}
            loading={pipelineLoading}
            currency={defaultCurrency}
          />
        </div>
      </div>

      {/* Response time */}
      <ResponseTimeChart data={responseTime} loading={responseTimeLoading} />

      {/* Activity feed */}
      <ActivityFeed items={activity} loading={activityLoading} />
    </div>
  )
}

// ------------------------------------------------------------

function deltaLabel(delta: number, suffix: string, noChangeLabel: string): string {
  if (delta === 0) return noChangeLabel
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toLocaleString()} ${suffix}`
}
