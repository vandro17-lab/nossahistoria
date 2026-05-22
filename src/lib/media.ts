import { supabaseAdmin } from "./supabaseAdmin";

export type Bucket = "fotos" | "audios" | "musicas";

const EXPIRA_PADRAO = 60 * 60; // 1 hora — curto, regenerado sob demanda

// Gera URL assinada para um caminho de objeto no Storage.
// Retorna null se o caminho for vazio ou o objeto não existir.
export async function urlAssinada(
  bucket: Bucket,
  caminho: string | null | undefined,
  expira: number = EXPIRA_PADRAO
): Promise<string | null> {
  if (!caminho) return null;
  const { data, error } = await supabaseAdmin()
    .storage.from(bucket)
    .createSignedUrl(caminho, expira);
  if (error || !data) return null;
  return data.signedUrl;
}

// Sobe um arquivo (Buffer/Blob) e retorna o caminho salvo.
export async function subirArquivo(
  bucket: Bucket,
  caminho: string,
  corpo: Buffer | ArrayBuffer | Uint8Array,
  contentType: string
): Promise<{ caminho: string } | { erro: string }> {
  const { error } = await supabaseAdmin()
    .storage.from(bucket)
    .upload(caminho, corpo as any, { contentType, upsert: true });
  if (error) return { erro: error.message };
  return { caminho };
}

// Remove uma lista de objetos de um bucket (ignora vazios).
export async function removerArquivos(bucket: Bucket, caminhos: (string | null | undefined)[]) {
  const limpos = caminhos.filter((c): c is string => !!c);
  if (limpos.length === 0) return;
  await supabaseAdmin().storage.from(bucket).remove(limpos);
}

// Baixa um objeto como Buffer (para zip / cartão).
export async function baixarArquivo(bucket: Bucket, caminho: string): Promise<Buffer | null> {
  const { data, error } = await supabaseAdmin().storage.from(bucket).download(caminho);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}
