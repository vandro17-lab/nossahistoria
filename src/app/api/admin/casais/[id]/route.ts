import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { carregarCasalDetalhe } from "@/lib/casalDetalhe";
import { removerArquivos } from "@/lib/media";
import { registrarLog } from "@/lib/log";
import type { Casal, Cadastro, Foto } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const negado = exigirAdmin();
  if (negado) return negado;
  const detalhe = await carregarCasalDetalhe(params.id);
  if (!detalhe) return NextResponse.json({ erro: "Casal não encontrado." }, { status: 404 });
  return NextResponse.json(detalhe);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const negado = exigirAdmin();
  if (negado) return negado;

  let body: Partial<Pick<Casal, "nome_1" | "nome_2" | "whatsapp_1" | "whatsapp_2" | "mesa" | "observacoes">>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  const patch: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
  for (const campo of ["nome_1", "nome_2", "whatsapp_1", "whatsapp_2", "mesa", "observacoes"] as const) {
    if (campo in body) {
      const v = (body[campo] ?? "") as string;
      patch[campo] = campo.startsWith("nome") ? v.trim() : v.trim() || null;
    }
  }
  if ((patch.nome_1 !== undefined && !patch.nome_1) || (patch.nome_2 !== undefined && !patch.nome_2)) {
    return NextResponse.json({ erro: "O nome não pode ficar vazio." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("casais")
    .update(patch)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ erro: "Não foi possível salvar. Tente de novo." }, { status: 500 });
  }
  await registrarLog("casal_editado", params.id, Object.keys(patch).filter((k) => k !== "atualizado_em").join(", "));
  return NextResponse.json({ casal: data });
}

// Apagar TUDO do casal (storage + registros). Exige confirmacao "APAGAR".
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const negado = exigirAdmin();
  if (negado) return negado;

  const confirmacao = req.nextUrl.searchParams.get("confirmacao");
  if (confirmacao !== "APAGAR") {
    return NextResponse.json(
      { erro: "Confirmação inválida. Digite APAGAR para confirmar." },
      { status: 400 }
    );
  }

  const sb = supabaseAdmin();
  const { data: casalRaw } = await sb.from("casais").select("*").eq("id", params.id).maybeSingle();
  const casal = casalRaw as Casal | null;
  if (!casal) return NextResponse.json({ erro: "Casal não encontrado." }, { status: 404 });

  const { data: cadRaw } = await sb.from("cadastros").select("*").eq("casal_id", params.id);
  const cadastros = (cadRaw as Cadastro[]) || [];
  const cadIds = cadastros.map((c) => c.id);

  // coletar caminhos de mídia
  let fotos: Foto[] = [];
  if (cadIds.length) {
    const { data: fotosRaw } = await sb.from("fotos").select("*").in("cadastro_id", cadIds);
    fotos = (fotosRaw as Foto[]) || [];
  }

  await removerArquivos("fotos", fotos.map((f) => f.url));
  await removerArquivos("musicas", cadastros.map((c) => c.musica_url));
  await removerArquivos("audios", cadastros.map((c) => c.audio_url));

  // apaga o casal — cascade remove cadastros e fotos
  const { error } = await sb.from("casais").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ erro: "Não foi possível apagar. Tente de novo." }, { status: 500 });
  }
  await registrarLog("casal_apagado", null, `${casal.nome_1} & ${casal.nome_2} (mesa ${casal.mesa || "—"})`);
  return NextResponse.json({ ok: true });
}
