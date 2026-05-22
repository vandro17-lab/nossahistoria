import { redirect } from "next/navigation";
import { adminAutenticado } from "@/lib/auth";
import CasalDetalhe from "@/components/admin/CasalDetalhe";

export const dynamic = "force-dynamic";

export default function CasalPage({ params }: { params: { id: string } }) {
  if (!adminAutenticado()) {
    redirect("/admin");
  }
  return <CasalDetalhe id={params.id} />;
}
