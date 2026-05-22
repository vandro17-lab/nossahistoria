import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { subirAudio, removerAudio } from "@/lib/mutacoesCadastro";
import { casalIdDeCadastro } from "@/lib/lookups";
import { registrarLog } from "@/lib/log";
import { LIMITE, tamanhoOk } from "@/lib/limites";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { cadastroId: string } }) {
  const negado = exigirAdmin();
  if (negado) return negado;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ erro: "Nenhum áudio recebido." }, { status: 400 });
  }
  if (!tamanhoOk(file.size, LIMITE.audioBytes)) {
    return NextResponse.json({ erro: "Áudio muito grande (máx. 20MB)." }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const r = await subirAudio(params.cadastroId, buf, file.type);
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });
  await registrarLog("trocar_voz", await casalIdDeCadastro(params.cadastroId));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { cadastroId: string } }) {
  const negado = exigirAdmin();
  if (negado) return negado;
  const r = await removerAudio(params.cadastroId);
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });
  await registrarLog("apagar_voz", await casalIdDeCadastro(params.cadastroId));
  return NextResponse.json({ ok: true });
}
