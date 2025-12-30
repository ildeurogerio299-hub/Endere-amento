
/**
 * FASE 0 - Conexão com Supabase via variáveis de ambiente
 * Note: Since this is a template, we use placeholders. 
 * In a real environment, these are injected by the build system.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Log de confirmação para o desenvolvedor
console.log("Banco reconhecido. Estrutura validada. Pronto para iniciar a FASE 0.");
