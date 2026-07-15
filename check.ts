import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/contacts?select=id,name,phone&order=created_at.desc&limit=5`, {
    headers: { 'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!, 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}` }
  });
  const contacts = await r.json();

  const r2 = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/conversations?select=id,contact_id,last_message_text&order=created_at.desc&limit=5`, {
    headers: { 'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!, 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}` }
  });
  const convs = await r2.json();

  console.log('Contacts:', contacts);
  console.log('Conversations:', convs);
}
check();
