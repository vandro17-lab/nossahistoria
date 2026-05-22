import { randomBytes, createHmac, timingSafeEqual } from "crypto";

// Token secreto do link da experiência: longo, aleatório, url-safe (~43 chars).
export function gerarToken(): string {
  return randomBytes(32).toString("base64url");
}

// ----- Cookie de sessão do admin (HMAC, sem store) -----

function segredo(): string {
  // Deriva o segredo de assinatura a partir da senha do admin.
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) throw new Error("ADMIN_PASSWORD não configurada.");
  return pwd;
}

export function assinarSessao(): string {
  // Valor opaco: hmac de uma constante. Só quem tem a senha consegue gerar/validar.
  const h = createHmac("sha256", segredo()).update("araca-admin-v1").digest("base64url");
  return h;
}

export function validarSessao(valor: string | undefined): boolean {
  if (!valor) return false;
  let esperado: string;
  try {
    esperado = assinarSessao();
  } catch {
    return false;
  }
  const a = Buffer.from(valor);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function senhaConfere(tentativa: string): boolean {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) return false;
  const a = Buffer.from(tentativa);
  const b = Buffer.from(pwd);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
