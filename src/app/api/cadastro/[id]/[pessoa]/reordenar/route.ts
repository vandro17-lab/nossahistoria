import { NextRequest, NextResponse } from "next/server";
import { liberarCadastroPublico } from "@/lib/acessoCadastro";
import { reordenarFotos } from "@/lib/mutacoesCadastro";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; pessoa: string } }
) {
  const acesso = await liberarCadastroPublico(params.id, params.pessoa);
  if (!acesso.ok) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });

  let body: { ordemIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }
  if (!Array.isArray(body.ordemIds)) {
    return NextResponse.json({ erro: "Ordem inválida." }, { status: 400 });
  }
  const r = await reordenarFotos(acesso.cadastro.id, body.ordemIds);
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });
  return NextResponse.json({ ok: true });
}
