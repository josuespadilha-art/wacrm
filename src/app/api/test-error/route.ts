import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { engineSendText } from '@/lib/automations/meta-send'

export async function GET() {
  const db = supabaseAdmin()
  const { data: contact } = await db
    .from('contacts')
    .select('id, account_id, name, phone')
    .eq('name', 'Josue Padilha')
    .limit(1)
    .single()
    
  if (!contact) return NextResponse.json({ error: 'Contact not found' })
  
  const { data: conv } = await db
    .from('conversations')
    .select('id')
    .eq('account_id', contact.account_id)
    .eq('contact_id', contact.id)
    .limit(1)
    .single()

  try {
    const res = await engineSendText({
      accountId: contact.account_id,
      userId: 'test-user',
      contactId: contact.id,
      conversationId: conv!.id,
      text: 'Mensagem de teste de erro',
    })
    return NextResponse.json({ success: true, res })
  } catch (e: any) {
    return NextResponse.json({
      error: 'Caught error',
      message: e.message,
      stack: e.stack,
      name: e.name,
      json: JSON.stringify(e, Object.getOwnPropertyNames(e))
    })
  }
}
