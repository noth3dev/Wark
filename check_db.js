const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: schedules } = await supabase.from('silmo_global_schedules').select('*');
  const { data: records } = await supabase.from('silmo_records').select('*');

  console.log('--- SCHEDULES ---');
  console.log(schedules.map(s => ({ id: s.id, title: s.title, is_round_game: s.is_round_game })));

  console.log('--- RECORDS ---');
  console.log(records.map(r => ({ id: r.id, title: r.title })));
}

run();
