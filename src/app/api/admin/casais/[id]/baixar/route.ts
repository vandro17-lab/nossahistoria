import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { exigirAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { baixarArquivo } from "@/lib/media";
import { registrarLog } from "@/lib/log";
import type { Casal, Cadastro, Foto } from "@/lib/types";

export const dynamic = "force-dynamic";

function ext(caminho: string): string {
  const p = caminho.split(".").pop();
  return p ? `.${p}` : "";
}

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const negado = exigirAdmin();
  if (negado) return negado;

  const sb = supabaseAdmin();
  const { data: casalRaw } = await sb.from("casais").select("*").eq("id", params.id).maybeSingle();
  const casal = casalRaw as Casal | null;
  if (!casal) return NextResponse.json({ erro: "Casal não encontrado." }, { status: 404 });

  const { data: cadRaw } = await sb.from("cadastros").select("*").eq("casal_id", params.id);
  const cadastros = (cadRaw as Cadastro[]) || [];

  const zip = new JSZip();
  const linhasTexto: string[] = [`Nossa História — ${casal.nome_1} & ${casal.nome_2}`, `Mesa: ${casal.mesa || "—"}`, ""];

  for (const pessoa of [1, 2] as const) {
    const cad = cadastros.find((c) => c.pessoa === pessoa);
    const nome = pessoa === 1 ? casal.nome_1 : casal.nome_2;
    const pasta = zip.folder(`${pessoa}_${slug(nome)}`)!;
    linhasTexto.push(`== ${nome} ==`);
    if (!cad) {
      linhasTexto.push("(sem cadastro)", "");
      continue;
    }
    linhasTexto.push(`Música: ${cad.musica_titulo || "—"}`);
    linhasTexto.push(`Mensagem final: ${cad.mensagem_final || "—"}`);

    if (cad.musica_url) {
      const buf = await baixarArquivo("musicas", cad.musica_url);
      if (buf) pasta.file(`musica${ext(cad.musica_url)}`, buf);
    }
    if (cad.audio_url) {
      const buf = await baixarArquivo("audios", cad.audio_url);
      if (buf) pasta.file(`voz${ext(cad.audio_url)}`, buf);
    }

    const { data: fotosRaw } = await sb
      .from("fotos")
      .select("*")
      .eq("cadastro_id", cad.id)
      .order("ordem", { ascending: true });
    const fotos = (fotosRaw as Foto[]) || [];
    let i = 1;
    for (const f of fotos) {
      const buf = await baixarArquivo("fotos", f.url);
      if (buf) pasta.file(`foto_${String(i).padStart(2, "0")}${ext(f.url)}`, buf);
      linhasTexto.push(`  Foto ${i}${f.oculta ? " (oculta)" : ""}: ${f.mensagem || "—"}`);
      i++;
    }
    linhasTexto.push("");
  }

  zip.file("textos.txt", linhasTexto.join("\n"));

  const conteudo = await zip.generateAsync({ type: "uint8array" });
  await registrarLog("baixar_tudo", params.id);

  const nomeArquivo = `nossa-historia_${slug(casal.nome_1)}_${slug(casal.nome_2)}.zip`;
  return new NextResponse(Buffer.from(conteudo), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
