import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { adicionarFoto } from "@/lib/mutacoesCadastro";
import { casalIdDeCadastro } from "@/lib/lookups";
import { registrarLog } from "@/lib/log";
import { LIMITE, tamanhoOk } from "@/lib/limites";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { cadastroId: string } }) {
  const negado = exigirAdmin();
  if (negado) return negado;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const mensagem = (form.get("mensagem") as string | null) || "";

  if (!file || file.size === 0) {
    return NextResponse.json({ erro: "Escolha uma foto." }, { status: 400 });
  }
  if (!tamanhoOk(file.size, LIMITE.fotoBytes)) {
    return NextResponse.json({ erro: "Foto muito grande (máx. 10MB)." }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const r = await adicionarFoto(params.cadastroId, buf, file.type, mensagem);
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 400 });
  await registrarLog("subir_foto", await casalIdDeCadastro(params.cadastroId));
  return NextResponse.json({ ok: true });
}
