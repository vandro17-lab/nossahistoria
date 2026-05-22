import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { carregarCasalDetalhe } from "@/lib/casalDetalhe";
import { calcularStatus } from "@/lib/casalStatus";
import { registrarLog } from "@/lib/log";
import type { Cadastro } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const negado = exigirAdmin();
  if (negado) return negado;

  let body: { aprovar?: boolean };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const aprovar = body.aprovar !== false;

  const sb = supabaseAdmin();

  if (aprovar) {
    // trava: só aprova se nada estiver faltando (4.5c)
    const detalhe = await carregarCasalDetalhe(params.id);
    if (!detalhe) return NextResponse.json({ erro: "Casal não encontrado." }, { status: 404 });
    if (!detalhe.analise.podeAprovar) {
      return NextResponse.json(
        { erro: `Ainda não dá para aprovar. Falta: ${detalhe.analise.faltando.join(", ")}.` },
        { status: 400 }
      );
    }
    const { error } = await sb
      .from("casais")
      .update({ status: "aprovado", atualizado_em: new Date().toISOString() })
      .eq("id", params.id);
    if (error) return NextResponse.json({ erro: "Não foi possível aprovar." }, { status: 500 });
    await registrarLog("casal_aprovado", params.id);
    return NextResponse.json({ ok: true, status: "aprovado" });
  }

  // desaprovar: volta ao status calculado
  const { data: cadRaw } = await sb.from("cadastros").select("*").eq("casal_id", params.id);
  const cadastros = (cadRaw as Cadastro[]) || [];
  const novo = calcularStatus(
    cadastros.find((c) => c.pessoa === 1),
    cadastros.find((c) => c.pessoa === 2)
  );
  const { error } = await sb
    .from("casais")
    .update({ status: novo, atualizado_em: new Date().toISOString() })
    .eq("id", params.id);
  if (error) return NextResponse.json({ erro: "Não foi possível desaprovar." }, { status: 500 });
  await registrarLog("casal_desaprovado", params.id);
  return NextResponse.json({ ok: true, status: novo });
}
