import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { salvarMusicaTitulo, salvarMensagemFinal } from "@/lib/mutacoesCadastro";
import { casalIdDeCadastro } from "@/lib/lookups";
import { registrarLog } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { cadastroId: string } }
) {
  const negado = exigirAdmin();
  if (negado) return negado;

  let body: { campo?: string; valor?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  const valor = body.valor ?? "";
  let r;
  if (body.campo === "musica_titulo") r = await salvarMusicaTitulo(params.cadastroId, valor);
  else if (body.campo === "mensagem_final") r = await salvarMensagemFinal(params.cadastroId, valor);
  else return NextResponse.json({ erro: "Campo inválido." }, { status: 400 });

  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });
  await registrarLog("editar_texto", await casalIdDeCadastro(params.cadastroId), body.campo);
  return NextResponse.json({ ok: true });
}
