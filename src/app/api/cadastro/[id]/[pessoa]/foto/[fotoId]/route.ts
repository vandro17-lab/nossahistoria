import { NextRequest, NextResponse } from "next/server";
import { liberarCadastroPublico } from "@/lib/acessoCadastro";
import { editarFotoMensagem, apagarFoto } from "@/lib/mutacoesCadastro";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Foto } from "@/lib/types";

export const dynamic = "force-dynamic";

// Confirma que a foto pertence a este cadastro (segurança do fluxo público).
async function fotoPertence(fotoId: string, cadastroId: string): Promise<boolean> {
  const { data } = await supabaseAdmin().from("fotos").select("cadastro_id").eq("id", fotoId).maybeSingle();
  const f = data as Pick<Foto, "cadastro_id"> | null;
  return !!f && f.cadastro_id === cadastroId;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; pessoa: string; fotoId: string } }
) {
  const acesso = await liberarCadastroPublico(params.id, params.pessoa);
  if (!acesso.ok) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  if (!(await fotoPertence(params.fotoId, acesso.cadastro.id))) {
    return NextResponse.json({ erro: "Foto não encontrada." }, { status: 404 });
  }

  let body: { mensagem?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }
  const r = await editarFotoMensagem(params.fotoId, body.mensagem || "");
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; pessoa: string; fotoId: string } }
) {
  const acesso = await liberarCadastroPublico(params.id, params.pessoa);
  if (!acesso.ok) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  if (!(await fotoPertence(params.fotoId, acesso.cadastro.id))) {
    return NextResponse.json({ erro: "Foto não encontrada." }, { status: 404 });
  }
  const r = await apagarFoto(params.fotoId);
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });
  return NextResponse.json({ ok: true });
}
