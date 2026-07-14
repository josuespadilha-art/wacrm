import { supabaseAdmin } from '@/lib/flows/admin-client'

interface SendTextEngineArgs {
  accountId: string
  conversationId: string
  contactId: string
  text: string
  aiGenerated?: boolean
}

export async function evolutionSendText(
  args: SendTextEngineArgs,
): Promise<{ messageId: string }> {
  const db = supabaseAdmin()

  // Buscar contato
  const { data: contact, error: contactErr } = await db
    .from('contacts')
    .select('id, phone')
    .eq('id', args.contactId)
    .eq('account_id', args.accountId)
    .maybeSingle()
    
  if (contactErr || !contact?.phone) {
    throw new Error('Contact not found for this account')
  }

  // Pega a URL do túnel ou da config local
  const apiUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY || 'visuno123'
  
  if (!apiUrl) {
    throw new Error('EVOLUTION_API_URL is not configured')
  }

  const payload = {
    number: contact.phone,
    text: args.text
  }

  // Requisição para Evolution API
  const response = await fetch(`${apiUrl}/message/sendText/visuno-teste`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Evolution API Error: ${err}`)
  }

  const result = await response.json()
  const messageId = result.key?.id || `evo-${Date.now()}`

  // Gravar a mensagem enviada no DB
  const { error: msgErr } = await db.from('messages').insert({
    conversation_id: args.conversationId,
    sender_type: 'bot',
    content_type: 'text',
    content_text: args.text,
    message_id: messageId,
    status: 'sent',
    ai_generated: args.aiGenerated ?? false,
  })
  if (msgErr) {
    throw new Error(`Sent to Evolution but DB insert failed: ${msgErr.message}`)
  }

  await db
    .from('conversations')
    .update({
      last_message_text: args.text,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', args.conversationId)

  return { messageId }
}
