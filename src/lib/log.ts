import { supabaseAdmin } from "./supabaseAdmin";
import { operadorAtual } from "./auth";

// Grava uma ação no log_admin. Nunca lança — log não pode quebrar a operação.
export async function registrarLog(
  acao: string,
  casalId: string | null,
  detalhe?: string
) {
  try {
    await supabaseAdmin()
      .from("log_admin")
      .insert({
        casal_id: casalId,
        operador: operadorAtual(),
        acao,
        detalhe: detalhe ?? null,
      });
  } catch {
    // silencioso de propósito
  }
}
