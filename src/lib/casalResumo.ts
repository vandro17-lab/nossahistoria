import { supabaseAdmin } from "./supabaseAdmin";
import { analisarCasal, AnaliseCasal } from "./casalStatus";
import type { Casal, Cadastro, Foto } from "./types";

export interface CasalResumo {
  casal: Casal;
  analise: AnaliseCasal;
  diasDesdeCriacao: number;
}

export interface OverviewAdmin {
  resumos: CasalResumo[];
  contadores: {
    total: number;
    aguardando_1: number;
    aguardando_2: number;
    completo: number;
    aprovado: number;
  };
}

export async function carregarOverview(): Promise<OverviewAdmin> {
  const sb = supabaseAdmin();
  const { data: casaisRaw } = await sb
    .from("casais")
    .select("*")
    .order("criado_em", { ascending: false });
  const casais = (casaisRaw as Casal[]) || [];

  const { data: cadRaw } = await sb.from("cadastros").select("*");
  const cadastros = (cadRaw as Cadastro[]) || [];

  const { data: fotosRaw } = await sb.from("fotos").select("id,cadastro_id,oculta");
  const fotos = (fotosRaw as Pick<Foto, "id" | "cadastro_id" | "oculta">[]) || [];

  const fotosPorCadastro: Record<string, number> = {};
  for (const f of fotos) {
    if (f.oculta) continue;
    fotosPorCadastro[f.cadastro_id] = (fotosPorCadastro[f.cadastro_id] || 0) + 1;
  }

  const agora = Date.now();
  const resumos: CasalResumo[] = casais.map((casal) => {
    const cad = cadastros.filter((c) => c.casal_id === casal.id);
    const analise = analisarCasal(casal, cad, fotosPorCadastro);
    const dias = Math.floor((agora - new Date(casal.criado_em).getTime()) / (1000 * 60 * 60 * 24));
    return { casal, analise, diasDesdeCriacao: dias };
  });

  const contadores = {
    total: casais.length,
    aguardando_1: casais.filter((c) => c.status === "aguardando_1").length,
    aguardando_2: casais.filter((c) => c.status === "aguardando_2").length,
    completo: casais.filter((c) => c.status === "completo").length,
    aprovado: casais.filter((c) => c.status === "aprovado").length,
  };

  return { resumos, contadores };
}
