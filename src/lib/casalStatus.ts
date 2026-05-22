import { supabaseAdmin } from "./supabaseAdmin";
import type { Casal, Cadastro, CasalStatus } from "./types";

// Recalcula o status do casal a partir dos cadastros (sem mexer em 'aprovado').
export function calcularStatus(c1?: Cadastro, c2?: Cadastro): CasalStatus {
  const p1 = !!c1?.completo;
  const p2 = !!c2?.completo;
  if (p1 && p2) return "completo";
  if (p1 && !p2) return "aguardando_2";
  return "aguardando_1";
}

// Atualiza o status no banco se necessário (preserva 'aprovado').
export async function sincronizarStatus(casalId: string) {
  const sb = supabaseAdmin();
  const { data: casalRaw } = await sb.from("casais").select("*").eq("id", casalId).maybeSingle();
  const casal = casalRaw as Casal | null;
  if (!casal) return;
  if (casal.status === "aprovado") return; // não rebaixar aprovado automaticamente

  const { data: cadRaw } = await sb.from("cadastros").select("*").eq("casal_id", casalId);
  const cadastros = (cadRaw as Cadastro[]) || [];
  const novo = calcularStatus(
    cadastros.find((c) => c.pessoa === 1),
    cadastros.find((c) => c.pessoa === 2)
  );
  if (novo !== casal.status) {
    await sb
      .from("casais")
      .update({ status: novo, atualizado_em: new Date().toISOString() })
      .eq("id", casalId);
  }
}

export interface AnalisePessoa {
  pessoa: 1 | 2;
  nome: string;
  completo: boolean;
  bloqueado: boolean;
  temMusica: boolean;
  temFotos: boolean;
  temVoz: boolean;
  qtdFotos: number;
}

export interface AnaliseCasal {
  pessoas: AnalisePessoa[];
  faltando: string[]; // itens que faltam para poder aprovar
  podeAprovar: boolean;
}

// Analisa o casal para a linha de etapas e a trava de aprovação.
export function analisarCasal(
  casal: Casal,
  cadastros: Cadastro[],
  fotosPorCadastro: Record<string, number>
): AnaliseCasal {
  const nomes = { 1: casal.nome_1, 2: casal.nome_2 } as const;
  const pessoas: AnalisePessoa[] = [1, 2].map((p) => {
    const cad = cadastros.find((c) => c.pessoa === p);
    const qtd = cad ? fotosPorCadastro[cad.id] || 0 : 0;
    return {
      pessoa: p as 1 | 2,
      nome: nomes[p as 1 | 2],
      completo: !!cad?.completo,
      bloqueado: !!cad?.bloqueado,
      temMusica: !!cad?.musica_titulo,
      temFotos: qtd > 0,
      temVoz: !!cad?.audio_url,
      qtdFotos: qtd,
    };
  });

  const faltando: string[] = [];
  for (const p of pessoas) {
    if (!p.completo) faltando.push(`cadastro de ${p.nome}`);
    else {
      if (!p.temMusica) faltando.push(`música de ${p.nome}`);
      if (!p.temFotos) faltando.push(`fotos de ${p.nome}`);
      if (!p.temVoz) faltando.push(`voz de ${p.nome}`);
    }
  }
  if (!casal.previa_vista) faltando.push("pré-visualizar a experiência");

  const podeAprovar = faltando.length === 0;
  return { pessoas, faltando, podeAprovar };
}
