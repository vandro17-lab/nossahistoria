import { createClient } from "@supabase/supabase-js";

// Cliente server-side com service role. NUNCA importar no client.
// Ignora RLS — toda operação sensível passa por aqui, atrás das rotas de API.

// Schema permissivo: tipamos as linhas com `as` nos pontos de uso (lib/types.ts).
type Tabela = { Row: any; Insert: any; Update: any; Relationships: [] };
type Schema = {
  public: {
    Tables: {
      casais: Tabela;
      cadastros: Tabela;
      fotos: Tabela;
      log_admin: Tabela;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached: ReturnType<typeof createClient<Schema>> | null = null;

export function supabaseAdmin() {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  if (!cached) {
    cached = createClient<Schema>(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
