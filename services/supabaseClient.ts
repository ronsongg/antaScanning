import { createClient } from '@supabase/supabase-js';

// NOTE: In a real environment, these are process.env.REACT_APP_SUPABASE_URL etc.
// For this demo generation, we handle the case where they might be missing.
const supabaseUrl = process.env.SUPABASE_URL || 'https://rjirqmbhezbmmvadhlys.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Zwt1f3ykQZH3cQQOivcstA_yWQkDpFT';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const TABLES = {
  PACKAGES: 'packages',
};