import { NextResponse, after } from 'next/server'
import { supabaseAdmin } from '@/lib/flows/admin-client'
import { normalizePhone } from '@/lib/whatsapp/phone-utils'
import { findOrCreateContact, findOrCreateConversation } from '@/lib/whatsapp/resolve-conversation'
import { dispatchInboundToAiReply } from '@/lib/ai/auto-reply'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('[evolution webhook] payload:', JSON.stringify(body, null, 2))

    // Validar se é evento de nova mensagem
    if (body.event !== 'messages.upsert' && !body.data?.message) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }

    const msgData = body.data
    // Verifica se fomos nós que enviamos (bot) e ignora para não entrar em loop
    if (msgData.key.fromMe) {
      return NextResponse.json({ status: 'ignored (from_me)' }, { status: 200 })
    }

    after(async () => {
      try {
        await processEvolutionMessage(msgData)
      } catch (err) {
        console.error('[evolution webhook] Error processing message:', err)
      }
    })

    return NextResponse.json({ status: 'received' }, { status: 200 })
  } catch (error) {
    console.error('Error in evolution webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processEvolutionMessage(msgData: any) {
  // A Evolution API envia o numero como `551199999999@s.whatsapp.net`
  const senderPhone = normalizePhone(msgData.key.remoteJid.split('@')[0])
  const contactName = msgData.pushName || senderPhone
  
  // Extrair texto da mensagem
  const messageContent = msgData.message?.conversation || 
                         msgData.message?.extendedTextMessage?.text || 
                         ''
                         
  if (!messageContent) {
    console.log('[evolution webhook] Mensagem sem texto ignorada.')
    return
  }

  // Puxar conta
  const { data: configs } = await supabaseAdmin()
    .from('accounts')
    .select('id, owner_user_id')
    .limit(1)
    .single()
    
  if (!configs) {
    console.error('[evolution webhook] Nenhuma conta encontrada no CRM')
    return
  }

  const accountId = configs.id
  const configOwnerUserId = configs.owner_user_id

  // 1. Criar ou Encontrar o Contato
  const contactOutcome = await findOrCreateContact(
    accountId,
    configOwnerUserId,
    senderPhone,
    contactName
  )
  if (!contactOutcome) return
  const contactRecord = contactOutcome.contact

  // 2. Criar ou Encontrar a Conversa
  const convResult = await findOrCreateConversation(
    accountId,
    configOwnerUserId,
    contactRecord.id
  )
  if (!convResult) return
  const conversation = convResult.conversation

  // 3. Inserir a Mensagem no banco
  const messageId = msgData.key.id
  const { error: msgError } = await supabaseAdmin().from('messages').insert({
    conversation_id: conversation.id,
    sender_type: 'customer',
    content_type: 'text',
    content_text: messageContent,
    message_id: messageId,
    status: 'delivered',
    created_at: new Date().toISOString(),
  })

  if (msgError) {
    console.error('[evolution webhook] Error inserting message:', msgError)
    return
  }

  // 4. Atualizar o contador da conversa
  await supabaseAdmin()
    .from('conversations')
    .update({
      last_message_text: messageContent,
      last_message_at: new Date().toISOString(),
      unread_count: (conversation.unread_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversation.id)

  // 5. Chamar a IA
  await dispatchInboundToAiReply({
    accountId,
    contactId: contactRecord.id,
    conversationId: conversation.id,
    messageText: messageContent,
  })
}
