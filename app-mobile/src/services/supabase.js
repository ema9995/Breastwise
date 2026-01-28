import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gqnhuofcrmgzjhuxenca.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxbmh1b2Zjcm1nempodXhlbmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzgzNjMsImV4cCI6MjA4MDM1NDM2M30.qgTzk6k-YcZ55u-P4sbKSJJDc2KWiNsabfwGyK-JDA8';

if (!supabaseUrl || supabaseUrl === 'VOTRE_SUPABASE_URL') {
  console.warn('⚠️ Supabase URL non configurée. Veuillez mettre à jour src/services/supabase.js');
}

if (!supabaseAnonKey || supabaseAnonKey === 'VOTRE_SUPABASE_ANON_KEY') {
  console.warn('⚠️ Supabase Anon Key non configurée. Veuillez mettre à jour src/services/supabase.js');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
