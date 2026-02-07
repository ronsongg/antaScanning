import { createClient } from '@supabase/supabase-js';

// 从环境变量读取 Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rjirqmbhezbmmvadhlys.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqaXJxbWJoZXpibW12YWRobHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzMTI5NDcsImV4cCI6MjA1Mzg4ODk0N30.VqQg0vZxS5Xx9tDXDc4SvIqxGp1uiI2MJ1QE-1HsJTg';

if (!supabaseKey.startsWith('ey')) {
  console.warn('⚠️ Supabase Key Warning: The VITE_SUPABASE_ANON_KEY does not appear to be a valid JWT (should start with "ey"). CHECK YOUR .env.local FILE OR VERCEL ENVIRONMENT VARIABLES.');
}

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