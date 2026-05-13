const SUPABASE_URL = 'https://yygfvcnryefyjifzyepp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4d4ZrjhFm4p26zWrwaUnlw_keSmeWzi';

// Usar o objeto global da biblioteca
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
