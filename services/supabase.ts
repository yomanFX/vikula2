
import { createClient } from '@supabase/supabase-js';

// Hardcoded keys for plug-and-play as requested
const supabaseUrl = 'https://amwljqdeydyzfhzvzjnz.supabase.co';
const supabaseKey = 'sb_publishable_IiDl2xsV_sU_Rex8UZilUQ_9ghgIaTa';

export const supabase = createClient(supabaseUrl, supabaseKey);
