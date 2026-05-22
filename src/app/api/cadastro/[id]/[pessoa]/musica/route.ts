import { NextRequest, NextResponse } from "next/server";
import { liberarCadastroPublico } from "@/lib/acessoCadastro";
import { subirMusica, salvarMusicaTitulo } from "@/lib/mutacoesCadastro";
import { LIMITE, tamanhoOk } from "@/lib/limites";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; pessoa: string } }
) {
  const acesso = await liberarCadastroPublico(params.id, params.pessoa);
  if (!acesso.ok) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });

  const form = await req.formData();
  const titulo = (form.get("titulo") as string | null) || "";
  const file = form.get("file") as File | null;

  if (file && file.size > 0) {
    if (!tamanhoOk(file.size, LIMITE.musicaBytes)) {
      return NextResponse.json(
        { erro: "O arquivo de música está muito grande. Envie um trecho de até 15MB." },
        { status: 400 }
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const r = await subirMusica(acesso.cadastro.id, buf, file.type, titulo);
    if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const r = await salvarMusicaTitulo(acesso.cadastro.id, titulo);
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 500 });
  return NextResponse.json({ ok: true });
}
