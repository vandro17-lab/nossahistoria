import { supabaseAdmin } from "./supabaseAdmin";
import { urlAssinada } from "./media";
import type { Casal, Cadastro, Foto, BlocoView, ExperienciaView } from "./types";

export type ResultadoExperiencia =
  | { estado: "nao_encontrado" }
  | { estado: "pendente" }
  | { estado: "ok"; casal: Casal; data: ExperienciaView };

async function montarBloco(
  cadastro: Cadastro | undefined,
  nome: string,
  parceiro: string
): Promise<BlocoView> {
  if (!cadastro) {
    return {
      nome,
      parceiro,
      musica_titulo: null,
      musica_src: null,
      audio_src: null,
      mensagem_final: null,
      fotos: [],
    };
  }

  const { data: fotosRaw } = await supabaseAdmin()
    .from("fotos")
    .select("*")
    .eq("cadastro_id", cadastro.id)
    .eq("oculta", false)
    .order("ordem", { ascending: true });

  const fotos = await Promise.all(
    ((fotosRaw as Foto[]) || []).map(async (f) => ({
      id: f.id,
      src: (await urlAssinada("fotos", f.url)) || "",
      mensagem: f.mensagem,
      ordem: f.ordem,
      oculta: f.oculta,
    }))
  );

  return {
    nome,
    parceiro,
    musica_titulo: cadastro.musica_titulo,
    musica_src: await urlAssinada("musicas", cadastro.musica_url),
    audio_src: await urlAssinada("audios", cadastro.audio_url),
    mensagem_final: cadastro.mensagem_final,
    fotos,
  };
}

// Carrega a experiência por token. `ignorarStatus` = rota de pré-visualização.
export async function carregarExperiencia(
  token: string,
  ignorarStatus = false
): Promise<ResultadoExperiencia> {
  const { data: casalRaw } = await supabaseAdmin()
    .from("casais")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  const casal = casalRaw as Casal | null;
  if (!casal) return { estado: "nao_encontrado" };

  if (!ignorarStatus && casal.status !== "aprovado") {
    return { estado: "pendente" };
  }

  const { data: cadRaw } = await supabaseAdmin()
    .from("cadastros")
    .select("*")
    .eq("casal_id", casal.id);

  const cadastros = (cadRaw as Cadastro[]) || [];
  const c1 = cadastros.find((c) => c.pessoa === 1);
  const c2 = cadastros.find((c) => c.pessoa === 2);

  const bloco_1 = await montarBloco(c1, casal.nome_1, casal.nome_2);
  const bloco_2 = await montarBloco(c2, casal.nome_2, casal.nome_1);

  return {
    estado: "ok",
    casal,
    data: { nome_1: casal.nome_1, nome_2: casal.nome_2, bloco_1, bloco_2 },
  };
}
