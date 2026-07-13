import { createClient } from '@/lib/supabase/server'

export const salvarNomeDefinition = {
  type: 'function' as const,
  function: {
    name: 'salvar_nome',
    description:
      'Salva ou atualiza o nome do cliente (contato) no sistema quando ele disser como se chama.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'O nome completo ou de preferência do cliente (ex: "Carlos Silva").',
        },
      },
      required: ['name'],
    },
  },
}

export async function executeSalvarNome(
  accountId: string,
  contactId: string,
  args: { name: string }
) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('contacts')
      .update({ name: args.name })
      .eq('id', contactId)
      .eq('account_id', accountId)

    if (error) {
      console.error('[ai/tools/salvar_nome] Erro ao atualizar nome do contato:', error)
      return { error: 'Erro ao salvar o nome no sistema.' }
    }

    return {
      success: true,
      message: `Nome do contato atualizado para: ${args.name}`,
    }
  } catch (err) {
    console.error('[ai/tools/salvar_nome] execution error:', err)
    return { error: 'Erro interno ao salvar o nome.' }
  }
}
