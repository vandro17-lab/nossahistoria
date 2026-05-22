import { adminAutenticado, operadorAtual } from "@/lib/auth";
import Login from "@/components/admin/Login";
import Overview from "@/components/admin/Overview";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  if (!adminAutenticado()) {
    return <Login />;
  }
  return <Overview operador={operadorAtual()} />;
}
