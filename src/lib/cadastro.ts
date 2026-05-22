import { supabaseAdmin } from "./supabaseAdmin";
import { urlAssinada } from "./media";
import type { Casal, Cadastro, Foto, FotoView } from "./types";

// Garante que existe a linha de cadastro para (casal, pessoa). Retorna a linha.
export async function garantirCadastro(casalId: string, pessoa: 1 | 2): Promise<Cadastro> {
  const sb = supabaseAdmin();
  const { data: existente } = await sb
    .from("cadastros")
    .select("*")
    .eq("casal_id", casalId)
    .eq("pessoa", pessoa)
    .maybeSingle();
  if (existente) return existente as Cadastro;

  const { data: criado } = await sb
    .from("cadastros")
    .insert({ casal_id: casalId, pessoa })
    .select("*")
    .single();
  return criado as Cadastro;
}

export interface EstadoCadastroPublico {
  casal: Pick<Casal, "id" | "nome_1" | "nome_2">;
  pessoa: 1 | 2;
  nomePessoa: string;
  nomeParceiro: string;
  cadastro: Cadastro;
  fotos: FotoView[];
  musicaSrc: string | null;
  audioSrc: string | null;
  // Tela "já preenchido": completo e ainda bloqueado (não reaberto)
  jaPreenchido: boolean;
}

export async function carregarCadastroPublico(
  casalId: string,
  pessoa: 1 | 2
): Promise<EstadoCadastroPublico | null> {
  const sb = supabaseAdmin();
  const { data: casalRaw } = await sb
    .from("casais")
    .select("id,nome_1,nome_2")
    .eq("id", casalId)
    .maybeSingle();
  const casal = casalRaw as Pick<Casal, "id" | "nome_1" | "nome_2"> | null;
  if (!casal) return null;

  const cadastro = await garantirCadastro(casalId, pessoa);

  const { data: fotosRaw } = await sb
    .from("fotos")
    .select("*")
    .eq("cadastro_id", cadastro.id)
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

  const nomePessoa = pessoa === 1 ? casal.nome_1 : casal.nome_2;
  const nomeParceiro = pessoa === 1 ? casal.nome_2 : casal.nome_1;

  return {
    casal,
    pessoa,
    nomePessoa,
    nomeParceiro,
    cadastro,
    fotos,
    musicaSrc: await urlAssinada("musicas", cadastro.musica_url),
    audioSrc: await urlAssinada("audios", cadastro.audio_url),
    jaPreenchido: cadastro.bloqueado,
  };
}
