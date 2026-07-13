import { createClient } from '@/lib/supabase/server'
import { parseISO, addMinutes } from 'date-fns'

export const agendarHorarioDefinition = {
  type: 'function' as const,
  function: {
    name: 'agendar_horario',
    description:
      'Faz o agendamento real de um serviço na agenda do sistema, associando a um barbeiro. Se o cliente não tiver um negócio (deal) aberto no funil, um novo será criado na primeira etapa. Use essa ferramenta apenas quando o cliente já tiver escolhido o horário e o serviço.',
    parameters: {
      type: 'object',
      properties: {
        startTime: {
          type: 'string',
          description:
            'A data e hora de INÍCIO escolhida pelo cliente no formato ISO-8601, ex: "2026-07-13T14:00:00Z".',
        },
        durationMinutes: {
          type: 'number',
          description: 'A duração total do(s) serviço(s) escolhido(s) em minutos.',
        },
        barberName: {
          type: 'string',
          description: 'Nome do barbeiro (Igor, Bruna, Josue).',
        },
        serviceNames: {
          type: 'string',
          description: 'Nome dos serviços escolhidos pelo cliente, separados por vírgula (ex: "Corte e Barba").',
        },
        totalValue: {
          type: 'number',
          description: 'Valor total dos serviços em números (ex: 150).',
        }
      },
      required: ['startTime', 'durationMinutes', 'barberName', 'serviceNames', 'totalValue'],
    },
  },
}

export async function executeAgendarHorario(
  accountId: string,
  contactId: string, // Precisamos injetar isso via executor
  args: { startTime: string; durationMinutes: number; barberName: string; serviceNames: string; totalValue: number }
) {
  try {
    const supabase = await createClient()
    const start = parseISO(args.startTime)
    const end = addMinutes(start, args.durationMinutes)

    // 1. Achar o barbeiro
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('account_id', accountId)
      .ilike('full_name', `%${args.barberName}%`)
      .maybeSingle()
    
    if (!profile) {
      return { error: 'Barbeiro não encontrado pelo nome.' }
    }
    const assigneeId = profile.user_id

    // 2. Criar appointment
    const { data: appt, error: apptError } = await supabase
      .from('appointments')
      .insert({
        account_id: accountId,
        contact_id: contactId,
        assignee_id: assigneeId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'scheduled',
        notes: `Serviço(s): ${args.serviceNames}`,
      })
      .select('id')
      .single()

    if (apptError) {
      console.error('[ai/tools/agendar] Erro criando appointment:', apptError)
      return { error: 'Erro ao salvar na agenda do sistema.' }
    }

    // 3. Garantir o Deal (Pipeline)
    // Acha o primeiro pipeline da conta (padrão)
    const { data: pipeline } = await supabase
      .from('pipelines')
      .select('id')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (pipeline) {
      // Acha o primeiro estágio
      const { data: stage } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('pipeline_id', pipeline.id)
        .order('position', { ascending: true })
        .limit(1)
        .single()

      if (stage) {
        // Verifica se tem deal ativo para esse contato
        const { data: activeDeal } = await supabase
          .from('deals')
          .select('id, value')
          .eq('contact_id', contactId)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()

        if (activeDeal) {
          // Atualiza valor se achar necessário ou não faz nada, vamos apenas atualizar o valor e o título
          await supabase
            .from('deals')
            .update({ 
              value: Number(activeDeal.value) + args.totalValue,
              title: `Agendado: ${args.serviceNames}`,
              stage_id: stage.id // Move para o primeiro estágio caso estivesse esquecido no final
            })
            .eq('id', activeDeal.id)
        } else {
          // Cria um deal novo
          await supabase
            .from('deals')
            .insert({
              user_id: assigneeId, // Dono do deal = barbeiro
              pipeline_id: pipeline.id,
              stage_id: stage.id,
              contact_id: contactId,
              title: `Agendado: ${args.serviceNames}`,
              value: args.totalValue,
              status: 'active',
            })
        }
      }
    }

    return {
      success: true,
      message: 'Agendamento concluído com sucesso e pipeline atualizado.',
    }
  } catch (err) {
    console.error('[ai/tools/agendar] execution error:', err)
    return { error: 'Internal error while processing the booking.' }
  }
}
