import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { editarFotoMensagem, alternarOcultaFoto, apagarFoto } from "@/lib/mutacoesCadastro";
import { casalIdDeFoto } from "@/lib/lookups";
import { registrarLog } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { fotoId: string } }) {
  const negado = exigirAdmin();
  if (negado) return negado;

  let body: { mensagem?: string; oculta?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  if (typeof body.oculta === "boolean") {
    const r = await alternarOcultaFoto(params.fotoId, body.oculta);
    if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });
    await registrarLog(body.oculta ? "ocultar_foto" : "reexibir_foto", await casalIdDeFoto(params.fotoId));
    return NextResponse.json({ ok: true });
  }

  if (body.mensagem !== undefined) {
    const r = await editarFotoMensagem(params.fotoId, body.mensagem);
    if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });
    await registrarLog("editar_legenda", await casalIdDeFoto(params.fotoId));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ erro: "Nada para atualizar." }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { fotoId: string } }) {
  const negado = exigirAdmin();
  if (negado) return negado;
  const casalId = await casalIdDeFoto(params.fotoId);
  const r = await apagarFoto(params.fotoId);
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });
  await registrarLog("apagar_foto", casalId);
  return NextResponse.json({ ok: true });
}
