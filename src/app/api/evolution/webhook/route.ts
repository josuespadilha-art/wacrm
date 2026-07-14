import { NextResponse, after } from 'next/server'
import { supabaseAdmin } from '@/lib/flows/admin-client'
import { normalizePhone } from '@/lib/whatsapp/phone-utils'
import { findExistingContact } from '@/lib/contacts/dedupe'
import { dispatchInboundToAiReply } from '@/lib/ai/auto-reply'
import { dispatchInboundToFlows } from '@/lib/flows/engine'
import { runAutomationsForTrigger } from '@/lib/automations/engine'

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
    // Permite "fromMe" mas marcamos para processar como agente
    const isFromMe = msgData.key.fromMe

    // Ignorar mensagens de grupos
    if (msgData.key.remoteJid?.includes('@g.us')) {
      return NextResponse.json({ status: 'ignored (group)' }, { status: 200 })
    }

    after(async () => {
      try {
        await processEvolutionMessage(msgData, isFromMe)
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

async function processEvolutionMessage(msgData: any, isFromMe: boolean = false) {
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
    sender_type: isFromMe ? 'agent' : 'customer',
    content_type: 'text',
    content_text: messageContent,
    message_id: messageId,
    status: isFromMe ? 'sent' : 'delivered',
    created_at: new Date().toISOString(),
  })

  if (msgError) {
    console.error('[evolution webhook] Error inserting message:', msgError)
    return
  }

  // 4. Atualizar o contador da conversa
  const unreadCount = isFromMe ? 0 : (conv?.unread_count ? conv.unread_count + 1 : 1)
  await supabaseAdmin()
    .from('conversations')
    .update({
      last_message_text: messageContent,
      last_message_at: new Date().toISOString(),
      unread_count: unreadCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  // Se for uma mensagem que nós enviamos (fromMe), não disparamos fluxos, automações ou IA!
  if (isFromMe) return

  // Contar para ver se é a primeira mensagem (como acabamos de inserir, vai ser 1 se for a primeira)
  const { count: priorCustomerMsgCount } = await supabaseAdmin()
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('sender_type', 'customer')
  const isFirstInboundMessage = (priorCustomerMsgCount ?? 0) <= 1

  // ============================================================
  // Disparo de Fluxos
  // ============================================================
  const flowResult = await dispatchInboundToFlows({
    accountId,
    userId: configOwnerUserId,
    contactId: contactId,
    conversationId: conversationId,
    message: {
      kind: 'text',
      text: messageContent,
      meta_message_id: messageId,
    },
    isFirstInboundMessage,
  })
  const flowConsumed = flowResult.consumed

  // ============================================================
  // Disparo de Automações
  // ============================================================
  const automationTriggers: (
    | 'new_contact_created'
    | 'first_inbound_message'
    | 'new_message_received'
    | 'keyword_match'
  )[] = []

  if (!flowConsumed) {
    automationTriggers.push('new_message_received', 'keyword_match')
  }

  // Se precisar de first_inbound_message:
  if (isFirstInboundMessage) automationTriggers.unshift('first_inbound_message')
  // Se fomos nós que criamos o contato agora:
  if (!existing) automationTriggers.unshift('new_contact_created')

  for (const triggerType of automationTriggers) {
    runAutomationsForTrigger({
      accountId,
      triggerType,
      contactId: contactId,
      context: {
        message_text: messageContent,
        conversation_id: conversationId,
      },
    }).catch((err) => console.error('[automations] dispatch failed:', err))
  }

  // 5. Chamar a IA (apenas se o fluxo não assumiu)
  if (!flowConsumed) {
    await dispatchInboundToAiReply({
      accountId,
      contactId: contactId,
      conversationId: conversationId,
      configOwnerUserId: configOwnerUserId,
    })
  }
}
