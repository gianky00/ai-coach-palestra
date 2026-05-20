const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function findUser() {
  const { data, error } = await supabase.from('training_logs').select('user_id').limit(1);
  if (error) console.error(error);
  if (data && data.length > 0) {
    console.log('USER_ID:' + data[0].user_id);
  } else {
    const { data: session } = await supabase.from('workout_sessions').select('user_id').limit(1);
    if (session && session.length > 0) {
      console.log('USER_ID:' + session[0].user_id);
    } else {
      console.log('NO_USER_FOUND');
    }
  }
}

findUser();
