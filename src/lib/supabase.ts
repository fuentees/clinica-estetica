import { createClient } from '@supabase/supabase-js';

// Essas variáveis vêm do seu arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- DEDO-DURO: Vai mostrar no console qual endereço ele está pegando ---
console.log("🛑 ENDEREÇO DO SUPABASE:", supabaseUrl);
// ----------------------------------------------------------------------

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam as variáveis de ambiente do Supabase no arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);



