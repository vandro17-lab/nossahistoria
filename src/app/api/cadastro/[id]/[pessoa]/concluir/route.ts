import { NextRequest, NextResponse } from "next/server";
import { liberarCadastroPublico } from "@/lib/acessoCadastro";
import { salvarMensagemFinal, marcarCompleto } from "@/lib/mutacoesCadastro";
import { registrarLog } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; pessoa: string } }
) {
  const acesso = await liberarCadastroPublico(params.id, params.pessoa);
  if (!acesso.ok) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });

  let body: { mensagem_final?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (body.mensagem_final !== undefined) {
    await salvarMensagemFinal(acesso.cadastro.id, body.mensagem_final);
  }
  const r = await marcarCompleto(acesso.cadastro.id);
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });

  await registrarLog("cadastro_concluido", params.id, `pessoa ${params.pessoa}`);
  return NextResponse.json({ ok: true });
}
