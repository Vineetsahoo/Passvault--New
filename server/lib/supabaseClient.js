import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env');
}

// Server-side client, authenticated with the SERVICE ROLE key.
// This bypasses Row Level Security entirely — every query below must
// scope by user_id itself (RLS is your second line of defense, not the first,
// when this client is the one running the query).
//
// NEVER send SUPABASE_SERVICE_ROLE_KEY to the client. It only belongs here,
// in server/.env, and in your Railway environment variables.
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabaseAdmin;
