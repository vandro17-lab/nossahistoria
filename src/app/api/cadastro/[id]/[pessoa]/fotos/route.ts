import { NextRequest, NextResponse } from "next/server";
import { liberarCadastroPublico } from "@/lib/acessoCadastro";
import { adicionarFoto } from "@/lib/mutacoesCadastro";
import { urlAssinada } from "@/lib/media";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LIMITE, tamanhoOk } from "@/lib/limites";
import type { Foto } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; pessoa: string } }
) {
  const acesso = await liberarCadastroPublico(params.id, params.pessoa);
  if (!acesso.ok) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const mensagem = (form.get("mensagem") as string | null) || "";

  if (!file || file.size === 0) {
    return NextResponse.json({ erro: "Escolha uma foto para enviar." }, { status: 400 });
  }
  if (!tamanhoOk(file.size, LIMITE.fotoBytes)) {
    return NextResponse.json({ erro: "A foto está muito grande. Tente outra." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const r = await adicionarFoto(acesso.cadastro.id, buf, file.type, mensagem);
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 400 });

  // devolve a foto recém-criada (última) com URL assinada
  const { data } = await supabaseAdmin()
    .from("fotos")
    .select("*")
    .eq("cadastro_id", acesso.cadastro.id)
    .order("ordem", { ascending: false })
    .limit(1);
  const nova = (data as Foto[])?.[0];
  const foto = nova
    ? { id: nova.id, src: (await urlAssinada("fotos", nova.url)) || "", mensagem: nova.mensagem, ordem: nova.ordem }
    : null;

  return NextResponse.json({ ok: true, foto });
}
