import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://onjheswwngtgqwoeqlpl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uamhlc3d3bmd0Z3F3b2VxbHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDEwNTEsImV4cCI6MjA5NjA3NzA1MX0.YbzpYIKvGECp2Thf8Uyafa2NyAL2wI-QT_LDHMz7uI0';

if (!supabaseUrl || supabaseUrl === 'VOTRE_SUPABASE_URL') {
  console.warn('⚠️ Supabase URL non configurée. Veuillez mettre à jour src/services/supabase.js');
}

if (!supabaseAnonKey || supabaseAnonKey === 'VOTRE_SUPABASE_ANON_KEY') {
  console.warn('⚠️ Supabase Anon Key non configurée. Veuillez mettre à jour src/services/supabase.js');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
