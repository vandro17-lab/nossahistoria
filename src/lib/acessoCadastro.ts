import { supabaseAdmin } from "./supabaseAdmin";
import { garantirCadastro } from "./cadastro";
import type { Cadastro } from "./types";

export type AcessoPublico =
  | { ok: true; cadastro: Cadastro }
  | { ok: false; erro: string; status: number };

// Valida acesso do fluxo público de cadastro: casal existe e o cadastro está
// editável (não foi concluído-e-travado). Cria a linha se faltar.
export async function liberarCadastroPublico(
  casalId: string,
  pessoaRaw: string | number
): Promise<AcessoPublico> {
  const pessoa = Number(pessoaRaw) === 2 ? 2 : 1;
  const { data: casal } = await supabaseAdmin()
    .from("casais")
    .select("id")
    .eq("id", casalId)
    .maybeSingle();
  if (!casal) {
    return { ok: false, erro: "Link inválido. Confira com a equipe do Araçá Grill.", status: 404 };
  }
  const cadastro = await garantirCadastro(casalId, pessoa as 1 | 2);
  if (cadastro.completo && cadastro.bloqueado) {
    return {
      ok: false,
      erro: "Você já deixou sua homenagem com a gente. Agora é só esperar pelo dia 12.",
      status: 423,
    };
  }
  return { ok: true, cadastro };
}
