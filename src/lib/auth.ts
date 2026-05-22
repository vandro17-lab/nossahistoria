import { cookies } from "next/headers";
import { validarSessao } from "./token";

export const COOKIE_SESSAO = "araca_admin";
export const COOKIE_OPERADOR = "araca_operador";

// Verifica a sessão do admin a partir dos cookies. Usar em rotas de API e páginas server.
export function adminAutenticado(): boolean {
  const c = cookies();
  return validarSessao(c.get(COOKIE_SESSAO)?.value);
}

export function operadorAtual(): string {
  const c = cookies();
  return c.get(COOKIE_OPERADOR)?.value || "equipe";
}

// Helper p/ rotas de API: retorna Response 401 se não autenticado, senão null.
export function exigirAdmin(): Response | null {
  if (!adminAutenticado()) {
    return new Response(
      JSON.stringify({ erro: "Sessão expirada. Entre de novo no painel." }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
  }
  return null;
}
