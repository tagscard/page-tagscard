const SUPABASE_URL = 'https://yygfvcnryefyjifzyepp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4d4ZrjhFm4p26zWrwaUnlw_keSmeWzi';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar para uso global
window.supabaseClient = supabase;
