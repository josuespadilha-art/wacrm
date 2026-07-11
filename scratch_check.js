const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));

const supabase = createClient(
  envConfig.NEXT_PUBLIC_SUPABASE_URL,
  envConfig.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: messages, error: err1 } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Last messages:', messages);
  
  const { data: contacts, error: err2 } = await supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Last contacts:', contacts);
  
  const { data: configs, error: err3 } = await supabase.from('whatsapp_config').select('*').limit(5);
  console.log('Configs:', configs);
}

check().catch(console.error);
