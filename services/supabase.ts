import { createClient } from '@supabase/supabase-js';

// Access environment variables safely
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://amwljqdeydyzfhzvzjnz.supabase.co';

// Using the provided API key as default
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IiDl2xsV_sU_Rex8UZilUQ_9ghgIaTa';

export const supabase = createClient(supabaseUrl, supabaseKey);