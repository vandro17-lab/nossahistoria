import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { reordenarFotos } from "@/lib/mutacoesCadastro";
import { casalIdDeCadastro } from "@/lib/lookups";
import { registrarLog } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { cadastroId: string } }) {
  const negado = exigirAdmin();
  if (negado) return negado;

  let body: { ordemIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }
  if (!Array.isArray(body.ordemIds)) {
    return NextResponse.json({ erro: "Ordem inválida." }, { status: 400 });
  }
  const r = await reordenarFotos(params.cadastroId, body.ordemIds);
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });
  await registrarLog("reordenar_fotos", await casalIdDeCadastro(params.cadastroId));
  return NextResponse.json({ ok: true });
}
