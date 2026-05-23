import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { carregarOverview } from "@/lib/casalResumo";
import { garantirCadastro } from "@/lib/cadastro";
import { gerarToken } from "@/lib/token";
import { registrarLog } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function GET() {
  const negado = exigirAdmin();
  if (negado) return negado;
  const overview = await carregarOverview();
  return NextResponse.json(overview);
}

export async function POST(req: NextRequest) {
  const negado = exigirAdmin();
  if (negado) return negado;

  let body: {
    nome_1?: string;
    nome_2?: string;
    whatsapp_1?: string;
    whatsapp_2?: string;
    mesa?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  const nome_1 = (body.nome_1 || "").trim().toUpperCase();
  const nome_2 = (body.nome_2 || "").trim().toUpperCase();
  if (!nome_1) {
    return NextResponse.json({ erro: "Preencha pelo menos o nome da primeira pessoa." }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("casais")
    .insert({
      token: gerarToken(),
      nome_1,
      nome_2,
      whatsapp_1: (body.whatsapp_1 || "").trim() || null,
      whatsapp_2: (body.whatsapp_2 || "").trim() || null,
      mesa: (body.mesa || "").trim() || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { erro: "Não foi possível cadastrar o casal. Tente de novo." },
      { status: 500 }
    );
  }

  // já cria as duas linhas de cadastro para edição imediata
  await garantirCadastro(data.id as string, 1);
  await garantirCadastro(data.id as string, 2);

  await registrarLog("casal_criado", data.id as string, `${nome_1} & ${nome_2}`);

  return NextResponse.json({ casal: data });
}
