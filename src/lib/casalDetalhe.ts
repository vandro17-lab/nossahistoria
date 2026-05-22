import { supabaseAdmin } from "./supabaseAdmin";
import { urlAssinada } from "./media";
import { analisarCasal, AnaliseCasal } from "./casalStatus";
import type { Casal, Cadastro, Foto, FotoView } from "./types";

export interface CadastroDetalhe extends Cadastro {
  musica_src: string | null;
  audio_src: string | null;
  fotos: FotoView[];
}

export interface CasalDetalhe {
  casal: Casal;
  pessoa1: CadastroDetalhe | null;
  pessoa2: CadastroDetalhe | null;
  analise: AnaliseCasal;
}

async function montarCadastroDetalhe(cad: Cadastro): Promise<CadastroDetalhe> {
  const { data: fotosRaw } = await supabaseAdmin()
    .from("fotos")
    .select("*")
    .eq("cadastro_id", cad.id)
    .order("ordem", { ascending: true });

  const fotos: FotoView[] = await Promise.all(
    ((fotosRaw as Foto[]) || []).map(async (f) => ({
      id: f.id,
      src: (await urlAssinada("fotos", f.url)) || "",
      mensagem: f.mensagem,
      ordem: f.ordem,
      oculta: f.oculta,
    }))
  );

  return {
    ...cad,
    musica_src: await urlAssinada("musicas", cad.musica_url),
    audio_src: await urlAssinada("audios", cad.audio_url),
    fotos,
  };
}

export async function carregarCasalDetalhe(casalId: string): Promise<CasalDetalhe | null> {
  const sb = supabaseAdmin();
  const { data: casalRaw } = await sb.from("casais").select("*").eq("id", casalId).maybeSingle();
  const casal = casalRaw as Casal | null;
  if (!casal) return null;

  const { data: cadRaw } = await sb.from("cadastros").select("*").eq("casal_id", casalId);
  const cadastros = (cadRaw as Cadastro[]) || [];
  const c1 = cadastros.find((c) => c.pessoa === 1);
  const c2 = cadastros.find((c) => c.pessoa === 2);

  const pessoa1 = c1 ? await montarCadastroDetalhe(c1) : null;
  const pessoa2 = c2 ? await montarCadastroDetalhe(c2) : null;

  const fotosPorCadastro: Record<string, number> = {};
  if (pessoa1) fotosPorCadastro[pessoa1.id] = pessoa1.fotos.filter((f) => !f.oculta).length;
  if (pessoa2) fotosPorCadastro[pessoa2.id] = pessoa2.fotos.filter((f) => !f.oculta).length;

  const analise = analisarCasal(casal, cadastros, fotosPorCadastro);

  return { casal, pessoa1, pessoa2, analise };
}
