import { redirect } from "next/navigation";
import { carregarExperiencia } from "@/lib/experiencia";
import { adminAutenticado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { registrarLog } from "@/lib/log";
import Experiencia from "@/components/experiencia/Experiencia";
import MensagemTela from "@/components/experiencia/Mensagem";

export const dynamic = "force-dynamic";

// Rota de pré-visualização (operador): ignora status e marca previa_vista=true.
export default async function PreviaPage({
  params,
}: {
  params: { token: string };
}) {
  if (!adminAutenticado()) {
    redirect("/admin");
  }

  const r = await carregarExperiencia(params.token, true);

  if (r.estado === "nao_encontrado") {
    return <MensagemTela titulo="Hmm…" texto="Casal não encontrado para pré-visualizar." />;
  }
  if (r.estado === "pendente") {
    // não acontece com ignorarStatus=true, mas por segurança
    return <MensagemTela texto="Sua homenagem está sendo preparada com carinho. 🤍" />;
  }

  // marca previa_vista (libera a trava de aprovação)
  if (!r.casal.previa_vista) {
    await supabaseAdmin()
      .from("casais")
      .update({ previa_vista: true, atualizado_em: new Date().toISOString() })
      .eq("id", r.casal.id);
    await registrarLog("previa_vista", r.casal.id, "Operador pré-visualizou a experiência");
  }

  return <Experiencia data={r.data} />;
}
