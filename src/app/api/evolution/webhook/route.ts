import { NextResponse, after } from 'next/server'
import { supabaseAdmin } from '@/lib/flows/admin-client'
import { normalizePhone } from '@/lib/whatsapp/phone-utils'
import { findExistingContact } from '@/lib/contacts/dedupe'
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
  let contactId: string
  const existing = await findExistingContact(supabaseAdmin(), accountId, senderPhone)
  if (existing) {
    contactId = existing.id
  } else {
    const { data: created } = await supabaseAdmin()
      .from('contacts')
      .insert({
        account_id: accountId,
        user_id: configOwnerUserId,
        phone: senderPhone,
        name: contactName,
      })
      .select('id')
      .single()
    if (!created) return
    contactId = created.id
  }

  // 2. Criar ou Encontrar a Conversa
  let conversationId: string
  const { data: conv } = await supabaseAdmin()
    .from('conversations')
    .select('id, unread_count')
    .eq('account_id', accountId)
    .eq('contact_id', contactId)
    .maybeSingle()
    
  if (conv?.id) {
    conversationId = conv.id
  } else {
    const { data: newConv } = await supabaseAdmin()
      .from('conversations')
      .insert({
        account_id: accountId,
        user_id: configOwnerUserId,
        contact_id: contactId,
      })
      .select('id')
      .single()
    if (!newConv) return
    conversationId = newConv.id
  }

  // 3. Inserir a Mensagem no banco
  const messageId = msgData.key.id
  const { error: msgError } = await supabaseAdmin().from('messages').insert({
    conversation_id: conversationId,
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
  const unreadCount = conv?.unread_count ? conv.unread_count + 1 : 1
  await supabaseAdmin()
    .from('conversations')
    .update({
      last_message_text: messageContent,
      last_message_at: new Date().toISOString(),
      unread_count: unreadCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  // 5. Chamar a IA
  await dispatchInboundToAiReply({
    accountId,
    contactId: contactId,
    conversationId: conversationId,
    messageText: messageContent,
  })
}
