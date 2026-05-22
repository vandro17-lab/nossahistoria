import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { garantirCadastro } from "@/lib/cadastro";
import { registrarLog } from "@/lib/log";

export const dynamic = "force-dynamic";

// Bloquear (true) = trava edição da pessoa. Reabrir (false) = pessoa pode refazer.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const negado = exigirAdmin();
  if (negado) return negado;

  let body: { pessoa?: number; bloqueado?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }
  const pessoa = body.pessoa === 2 ? 2 : 1;
  const bloqueado = !!body.bloqueado;

  const cad = await garantirCadastro(params.id, pessoa);
  // Ao reabrir (bloqueado=false), também zera completo para que a pessoa
  // precise re-concluir — evita qualquer leitura de estado inconsistente.
  const patch = bloqueado
    ? { bloqueado: true, atualizado_em: new Date().toISOString() }
    : { bloqueado: false, completo: false, atualizado_em: new Date().toISOString() };

  const { error } = await supabaseAdmin()
    .from("cadastros")
    .update(patch)
    .eq("id", cad.id);

  if (error) return NextResponse.json({ erro: "Não foi possível alterar." }, { status: 500 });
  await registrarLog(bloqueado ? "cadastro_bloqueado" : "cadastro_reaberto", params.id, `pessoa ${pessoa}`);
  return NextResponse.json({ ok: true });
}
