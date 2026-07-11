const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const URL = envConfig.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/messages?select=*&order=created_at.desc&limit=5';
const KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY;

fetch(URL, {
  headers: {
    'apikey': KEY,
    'Authorization': 'Bearer ' + KEY
  }
}).then(r => r.json()).then(data => {
  console.log("Last 5 messages:");
  console.log(data);
});

fetch(envConfig.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/whatsapp_config?select=*', {
  headers: {
    'apikey': KEY,
    'Authorization': 'Bearer ' + KEY
  }
}).then(r => r.json()).then(data => {
  console.log("Configs:");
  console.log(data);
});
