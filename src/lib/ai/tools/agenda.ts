import { createClient } from '@/lib/supabase/server'
import { endOfDay, startOfDay, parseISO } from 'date-fns'

export const agendaToolDefinition = {
  type: 'function' as const,
  function: {
    name: 'verificar_agenda',
    description:
      'Consulta o banco de dados para listar os horários que já estão OCUPADOS (agendados) na barbearia/empresa em um determinado intervalo de dias. A IA deve cruzar esses horários ocupados com o horário de funcionamento e tempo de serviço (definidos nas instruções) para deduzir e oferecer opções de horários LIVRES ao cliente. Ofereça os horários LIVRES de forma amigável e resumida.',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description:
            'Data de início para a busca no formato ISO-8601, ex: "2026-07-13T00:00:00Z". Deve ser o início do dia.',
        },
        endDate: {
          type: 'string',
          description:
            'Data de término para a busca no formato ISO-8601, ex: "2026-07-14T23:59:59Z". Deve ser o fim do dia.',
        },
        barberName: {
          type: 'string',
          description: 'Nome do barbeiro que o cliente deseja (ex: "Igor", "Bruna", "Josue"). Opcional.',
        }
      },
      required: ['startDate', 'endDate'],
    },
  },
}

export async function executeAgendaTool(
  accountId: string,
  args: { startDate: string; endDate: string; barberName?: string }
) {
  try {
    const supabase = await createClient()
    const start = startOfDay(parseISO(args.startDate)).toISOString()
    const end = endOfDay(parseISO(args.endDate)).toISOString()

    let assigneeId = null
    if (args.barberName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('account_id', accountId)
        .ilike('full_name', `%${args.barberName}%`)
        .maybeSingle()
      
      if (profile) assigneeId = profile.user_id
    }

    let query = supabase
      .from('appointments')
      .select('start_time, end_time, status')
      .eq('account_id', accountId)
      .gte('start_time', start)
      .lte('start_time', end)
      .neq('status', 'canceled')
      .order('start_time', { ascending: true })

    if (assigneeId) {
      query = query.eq('assignee_id', assigneeId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[ai/tools/agenda] Failed to fetch agenda', error)
      return { error: 'Failed to access calendar. Please ask a human to check.' }
    }

    // Return a compact array to save AI tokens
    return {
      occupied_slots: data.map((app: any) => ({
        start: app.start_time,
        end: app.end_time,
      })),
    }
  } catch (err) {
    console.error('[ai/tools/agenda] execution error:', err)
    return { error: 'Internal error while accessing calendar.' }
  }
}
