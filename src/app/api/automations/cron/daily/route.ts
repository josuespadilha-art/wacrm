import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { runAutomationsForTrigger } from '@/lib/automations/engine'

/**
 * Rota do Cron Job Diário.
 * Dispara eventos baseados em data: aniversários e inatividade.
 */
export async function GET(request: Request) {
  // 1. Validar autorização
  const expected = process.env.AUTOMATION_CRON_SECRET || 'teste123'
  
  const suppliedHeader = request.headers.get('x-cron-secret')
  const { searchParams } = new URL(request.url)
  const suppliedQuery = searchParams.get('secret')
  
  if (suppliedHeader !== expected && suppliedQuery !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const today = new Date()

  let birthdayTriggersCount = 0
  let inactivityTriggersCount = 0

  // Buscar automações ativas de aniversário e inatividade
  const { data: automations, error: autoErr } = await db
    .from('automations')
    .select('id, account_id, trigger_type, trigger_config')
    .in('trigger_type', ['birthday', 'inactivity'])
    .eq('is_active', true)

  if (autoErr) {
    return NextResponse.json({ error: 'Failed to fetch automations', detail: autoErr }, { status: 500 })
  }

  if (automations && automations.length > 0) {
    for (const automation of automations) {
      if (automation.trigger_type === 'birthday') {
        const cfg = automation.trigger_config as any
        const daysBefore = typeof cfg?.days_before === 'number' ? cfg.days_before : 0
        
        const targetDate = new Date(today)
        targetDate.setDate(targetDate.getDate() + daysBefore)
        
        const currentMonth = targetDate.getMonth() + 1
        const currentDay = targetDate.getDate()
        const mm = currentMonth.toString().padStart(2, '0')
        const dd = currentDay.toString().padStart(2, '0')
        const suffix = `-${mm}-${dd}`
        const prefix = `${dd}/${mm}`

        const { data: contacts } = await db
          .from('contacts')
          .select('id, birth_date')
          .eq('account_id', automation.account_id)
          .not('birth_date', 'is', null)

        if (contacts) {
          for (const contact of contacts) {
            const bDate = contact.birth_date as string
            let isTarget = false
            if (bDate.includes('-')) {
              isTarget = bDate.endsWith(suffix)
            } else if (bDate.includes('/')) {
              isTarget = bDate.startsWith(`${prefix}/`) || bDate === prefix
            }

            if (isTarget) {
              await runAutomationsForTrigger({
                accountId: automation.account_id,
                triggerType: 'birthday',
                contactId: contact.id,
                context: { target_automation_id: automation.id } 
              })
              birthdayTriggersCount++
            }
          }
        }
      } 
      
      else if (automation.trigger_type === 'inactivity') {
        const cfg = automation.trigger_config as any
        if (!cfg || !cfg.days || !cfg.type) continue

        const thresholdDate = new Date()
        thresholdDate.setDate(thresholdDate.getDate() - cfg.days)
        const thresholdStr = thresholdDate.toISOString()

        if (cfg.type === 'last_purchase') {
          const { data: contacts } = await db
            .from('contacts')
            .select('id')
            .eq('account_id', automation.account_id)
            .not('last_sale_date', 'is', null)
            .lte('last_sale_date', thresholdStr)

          if (contacts) {
            for (const contact of contacts) {
              await runAutomationsForTrigger({
                accountId: automation.account_id,
                triggerType: 'inactivity',
                contactId: contact.id,
                context: { target_automation_id: automation.id }
              })
              inactivityTriggersCount++
            }
          }
        } else if (cfg.type === 'last_message') {
          const { data: conversations } = await db
            .from('conversations')
            .select('contact_id')
            .eq('account_id', automation.account_id)
            .not('last_message_at', 'is', null)
            .lte('last_message_at', thresholdStr)

          if (conversations) {
            for (const conv of conversations) {
              await runAutomationsForTrigger({
                accountId: automation.account_id,
                triggerType: 'inactivity',
                contactId: conv.contact_id,
                context: { target_automation_id: automation.id }
              })
              inactivityTriggersCount++
            }
          }
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    processed: {
      birthdays: birthdayTriggersCount,
      inactive: inactivityTriggersCount
    },
    today: today.toISOString()
  })
}
