import { carregarExperiencia } from "@/lib/experiencia";
import Experiencia from "@/components/experiencia/Experiencia";
import MensagemTela from "@/components/experiencia/Mensagem";

export const dynamic = "force-dynamic";

export default async function ExperienciaPage({
  params,
}: {
  params: { token: string };
}) {
  const r = await carregarExperiencia(params.token);

  if (r.estado === "nao_encontrado") {
    return (
      <MensagemTela
        titulo="Hmm…"
        texto="Não encontramos esta homenagem. Confira o link com a equipe do Araçá Grill."
      />
    );
  }

  if (r.estado === "pendente") {
    return <MensagemTela texto="Sua homenagem está sendo preparada com carinho. 🤍" />;
  }

  return <Experiencia data={r.data} />;
}
