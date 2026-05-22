import { carregarCadastroPublico } from "@/lib/cadastro";
import Cadastro from "@/components/cadastro/Cadastro";
import MensagemTela from "@/components/experiencia/Mensagem";

export const dynamic = "force-dynamic";

export default async function CadastroPage({
  params,
}: {
  params: { id: string; pessoa: string };
}) {
  const pessoa = params.pessoa === "2" ? 2 : params.pessoa === "1" ? 1 : null;
  if (!pessoa) {
    return <MensagemTela titulo="Hmm…" texto="Link inválido. Confira com a equipe do Araçá Grill." />;
  }

  const estado = await carregarCadastroPublico(params.id, pessoa);
  if (!estado) {
    return <MensagemTela titulo="Hmm…" texto="Link inválido. Confira com a equipe do Araçá Grill." />;
  }
  if (estado.jaPreenchido) {
    return (
      <MensagemTela
        titulo="Tudo certo 🤍"
        texto="Você já deixou sua homenagem com a gente. Agora é só esperar pelo dia 12."
      />
    );
  }

  return (
    <Cadastro
      casalId={estado.casal.id}
      pessoa={pessoa}
      nomePessoa={estado.nomePessoa}
      nomeParceiro={estado.nomeParceiro}
      musicaTitulo={estado.cadastro.musica_titulo || ""}
      temMusica={!!estado.cadastro.musica_url}
      mensagemFinal={estado.cadastro.mensagem_final || ""}
      temAudio={!!estado.audioSrc}
      fotosIniciais={estado.fotos.map((f) => ({ id: f.id, src: f.src, mensagem: f.mensagem || "" }))}
    />
  );
}
