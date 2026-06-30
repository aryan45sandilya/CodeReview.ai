import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';
import ws from 'ws';

// Initialize Supabase client with WebSocket support for Node.js 20
export const supabase = createClient(
  config.supabase.url,
  config.supabase.key,
  {
    realtime: {
      transport: ws
    }
  }
);

console.log('✅ Supabase client initialized');
