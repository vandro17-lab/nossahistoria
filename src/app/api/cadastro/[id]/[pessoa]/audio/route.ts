import { NextRequest, NextResponse } from "next/server";
import { liberarCadastroPublico } from "@/lib/acessoCadastro";
import { subirAudio, removerAudio } from "@/lib/mutacoesCadastro";
import { LIMITE, tamanhoOk } from "@/lib/limites";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; pessoa: string } }
) {
  const acesso = await liberarCadastroPublico(params.id, params.pessoa);
  if (!acesso.ok) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ erro: "Nenhum áudio recebido." }, { status: 400 });
  }
  if (!tamanhoOk(file.size, LIMITE.audioBytes)) {
    return NextResponse.json({ erro: "O áudio está muito grande. Grave um trecho mais curto." }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const r = await subirAudio(acesso.cadastro.id, buf, file.type);
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; pessoa: string } }
) {
  const acesso = await liberarCadastroPublico(params.id, params.pessoa);
  if (!acesso.ok) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const r = await removerAudio(acesso.cadastro.id);
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });
  return NextResponse.json({ ok: true });
}
