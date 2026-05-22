import { supabaseAdmin } from "./supabaseAdmin";
import type { Cadastro, Foto } from "./types";

export async function casalIdDeCadastro(cadastroId: string): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from("cadastros")
    .select("casal_id")
    .eq("id", cadastroId)
    .maybeSingle();
  return (data as Pick<Cadastro, "casal_id"> | null)?.casal_id ?? null;
}

export async function casalIdDeFoto(fotoId: string): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from("fotos")
    .select("cadastro_id")
    .eq("id", fotoId)
    .maybeSingle();
  const cadId = (data as Pick<Foto, "cadastro_id"> | null)?.cadastro_id;
  if (!cadId) return null;
  return casalIdDeCadastro(cadId);
}
