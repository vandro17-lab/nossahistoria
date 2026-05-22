import { randomUUID } from "crypto";
import { supabaseAdmin } from "./supabaseAdmin";
import { subirArquivo, removerArquivos, Bucket } from "./media";
import { sincronizarStatus } from "./casalStatus";
import type { Cadastro, Foto } from "./types";

type Res = { ok: true } | { erro: string };

async function pegarCadastro(cadastroId: string): Promise<Cadastro | null> {
  const { data } = await supabaseAdmin().from("cadastros").select("*").eq("id", cadastroId).maybeSingle();
  return (data as Cadastro) || null;
}

function extDe(contentType: string, fallback: string): string {
  const mapa: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
  };
  return mapa[contentType] || fallback;
}

async function toques(cadastroId: string) {
  await supabaseAdmin()
    .from("cadastros")
    .update({ atualizado_em: new Date().toISOString() })
    .eq("id", cadastroId);
}

// ---------- Texto ----------

export async function salvarMusicaTitulo(cadastroId: string, titulo: string): Promise<Res> {
  const { error } = await supabaseAdmin()
    .from("cadastros")
    .update({ musica_titulo: titulo.trim() || null, atualizado_em: new Date().toISOString() })
    .eq("id", cadastroId);
  return error ? { erro: "Não foi possível salvar o título da música." } : { ok: true };
}

export async function salvarMensagemFinal(cadastroId: string, msg: string): Promise<Res> {
  const { error } = await supabaseAdmin()
    .from("cadastros")
    .update({ mensagem_final: msg.trim() || null, atualizado_em: new Date().toISOString() })
    .eq("id", cadastroId);
  return error ? { erro: "Não foi possível salvar a mensagem." } : { ok: true };
}

// ---------- Música (MP3) ----------

export async function subirMusica(
  cadastroId: string,
  corpo: Buffer,
  contentType: string,
  titulo?: string
): Promise<Res> {
  const cad = await pegarCadastro(cadastroId);
  if (!cad) return { erro: "Cadastro não encontrado." };
  const ext = extDe(contentType, "mp3");
  const caminho = `${cad.casal_id}/${cad.pessoa}/musica-${randomUUID()}.${ext}`;
  const up = await subirArquivo("musicas", caminho, corpo, contentType || "audio/mpeg");
  if ("erro" in up) return { erro: "Não foi possível enviar a música." };
  // remove a anterior
  if (cad.musica_url) await removerArquivos("musicas", [cad.musica_url]);
  const patch: Record<string, unknown> = { musica_url: caminho, atualizado_em: new Date().toISOString() };
  if (titulo !== undefined) patch.musica_titulo = titulo.trim() || null;
  await supabaseAdmin().from("cadastros").update(patch).eq("id", cadastroId);
  return { ok: true };
}

export async function removerMusica(cadastroId: string): Promise<Res> {
  const cad = await pegarCadastro(cadastroId);
  if (!cad) return { erro: "Cadastro não encontrado." };
  if (cad.musica_url) await removerArquivos("musicas", [cad.musica_url]);
  await supabaseAdmin()
    .from("cadastros")
    .update({ musica_url: null, atualizado_em: new Date().toISOString() })
    .eq("id", cadastroId);
  return { ok: true };
}

// ---------- Voz (áudio) ----------

export async function subirAudio(cadastroId: string, corpo: Buffer, contentType: string): Promise<Res> {
  const cad = await pegarCadastro(cadastroId);
  if (!cad) return { erro: "Cadastro não encontrado." };
  const ext = extDe(contentType, "webm");
  const caminho = `${cad.casal_id}/${cad.pessoa}/voz-${randomUUID()}.${ext}`;
  const up = await subirArquivo("audios", caminho, corpo, contentType || "audio/webm");
  if ("erro" in up) return { erro: "Não foi possível enviar o áudio." };
  if (cad.audio_url) await removerArquivos("audios", [cad.audio_url]);
  await supabaseAdmin()
    .from("cadastros")
    .update({ audio_url: caminho, atualizado_em: new Date().toISOString() })
    .eq("id", cadastroId);
  return { ok: true };
}

export async function removerAudio(cadastroId: string): Promise<Res> {
  const cad = await pegarCadastro(cadastroId);
  if (!cad) return { erro: "Cadastro não encontrado." };
  if (cad.audio_url) await removerArquivos("audios", [cad.audio_url]);
  await supabaseAdmin()
    .from("cadastros")
    .update({ audio_url: null, atualizado_em: new Date().toISOString() })
    .eq("id", cadastroId);
  return { ok: true };
}

// ---------- Fotos ----------

const MAX_FOTOS = 10;

export async function adicionarFoto(
  cadastroId: string,
  corpo: Buffer,
  contentType: string,
  mensagem?: string
): Promise<Res> {
  const cad = await pegarCadastro(cadastroId);
  if (!cad) return { erro: "Cadastro não encontrado." };

  const sb = supabaseAdmin();
  const { data: existentes } = await sb.from("fotos").select("id,ordem").eq("cadastro_id", cadastroId);
  const lista = (existentes as Pick<Foto, "id" | "ordem">[]) || [];
  if (lista.length >= MAX_FOTOS) return { erro: `Limite de ${MAX_FOTOS} fotos atingido.` };

  const ext = extDe(contentType, "jpg");
  const caminho = `${cad.casal_id}/${cad.pessoa}/foto-${randomUUID()}.${ext}`;
  const up = await subirArquivo("fotos", caminho, corpo, contentType || "image/jpeg");
  if ("erro" in up) return { erro: "Não foi possível enviar a foto." };

  const proximaOrdem = lista.reduce((m, f) => Math.max(m, f.ordem), -1) + 1;
  const { error } = await sb.from("fotos").insert({
    cadastro_id: cadastroId,
    url: caminho,
    mensagem: mensagem?.trim() || null,
    ordem: proximaOrdem,
  });
  if (error) {
    await removerArquivos("fotos", [caminho]);
    return { erro: "Não foi possível salvar a foto." };
  }
  await toques(cadastroId);
  return { ok: true };
}

export async function editarFotoMensagem(fotoId: string, mensagem: string): Promise<Res> {
  const { error } = await supabaseAdmin()
    .from("fotos")
    .update({ mensagem: mensagem.trim() || null })
    .eq("id", fotoId);
  return error ? { erro: "Não foi possível salvar a legenda." } : { ok: true };
}

export async function alternarOcultaFoto(fotoId: string, oculta: boolean): Promise<Res> {
  const { error } = await supabaseAdmin().from("fotos").update({ oculta }).eq("id", fotoId);
  return error ? { erro: "Não foi possível alterar a foto." } : { ok: true };
}

export async function apagarFoto(fotoId: string): Promise<Res> {
  const sb = supabaseAdmin();
  const { data } = await sb.from("fotos").select("*").eq("id", fotoId).maybeSingle();
  const foto = data as Foto | null;
  if (!foto) return { erro: "Foto não encontrada." };
  await removerArquivos("fotos", [foto.url]);
  const { error } = await sb.from("fotos").delete().eq("id", fotoId);
  return error ? { erro: "Não foi possível apagar a foto." } : { ok: true };
}

export async function substituirFoto(fotoId: string, corpo: Buffer, contentType: string): Promise<Res> {
  const sb = supabaseAdmin();
  const { data } = await sb.from("fotos").select("*").eq("id", fotoId).maybeSingle();
  const foto = data as Foto | null;
  if (!foto) return { erro: "Foto não encontrada." };

  const { data: cadRaw } = await sb.from("cadastros").select("*").eq("id", foto.cadastro_id).maybeSingle();
  const cad = cadRaw as Cadastro | null;
  if (!cad) return { erro: "Cadastro não encontrado." };

  const ext = extDe(contentType, "jpg");
  const caminho = `${cad.casal_id}/${cad.pessoa}/foto-${randomUUID()}.${ext}`;
  const up = await subirArquivo("fotos", caminho, corpo, contentType || "image/jpeg");
  if ("erro" in up) return { erro: "Não foi possível enviar a foto." };

  await removerArquivos("fotos", [foto.url]);
  const { error } = await sb.from("fotos").update({ url: caminho }).eq("id", fotoId);
  return error ? { erro: "Não foi possível substituir a foto." } : { ok: true };
}

export async function reordenarFotos(cadastroId: string, ordemIds: string[]): Promise<Res> {
  const sb = supabaseAdmin();
  for (let i = 0; i < ordemIds.length; i++) {
    await sb.from("fotos").update({ ordem: i }).eq("id", ordemIds[i]).eq("cadastro_id", cadastroId);
  }
  await toques(cadastroId);
  return { ok: true };
}

// ---------- Conclusão (fluxo público) ----------

export async function marcarCompleto(cadastroId: string): Promise<Res> {
  const cad = await pegarCadastro(cadastroId);
  if (!cad) return { erro: "Cadastro não encontrado." };
  await supabaseAdmin()
    .from("cadastros")
    .update({ completo: true, bloqueado: true, atualizado_em: new Date().toISOString() })
    .eq("id", cadastroId);
  await sincronizarStatus(cad.casal_id);
  return { ok: true };
}
