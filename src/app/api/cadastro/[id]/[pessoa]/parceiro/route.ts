import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { registrarLog } from "@/lib/log";

export const dynamic = "force-dynamic";

// Pessoa 1 informa o nome e WhatsApp do parceiro/parceira antes de começar o cadastro.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; pessoa: string } }
) {
  if (params.pessoa !== "1") {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });
  }

  let body: { nome?: string; whatsapp?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  const nome = (body.nome || "").trim().toUpperCase();
  const whatsapp = (body.whatsapp || "").trim() || null;

  if (!nome) {
    return NextResponse.json({ erro: "Informe o nome do parceiro ou parceira." }, { status: 400 });
  }

  const { data: casal } = await supabaseAdmin()
    .from("casais")
    .select("id,nome_2")
    .eq("id", params.id)
    .maybeSingle();

  if (!casal) {
    return NextResponse.json({ erro: "Link inválido." }, { status: 404 });
  }

  const { error } = await supabaseAdmin()
    .from("casais")
    .update({ nome_2: nome, whatsapp_2: whatsapp, atualizado_em: new Date().toISOString() })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ erro: "Não foi possível salvar. Tente de novo." }, { status: 500 });
  }

  await registrarLog("parceiro_cadastrado", params.id, nome);
  return NextResponse.json({ ok: true });
}
