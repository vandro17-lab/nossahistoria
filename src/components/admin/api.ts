// Helpers de chamada para o painel. Mensagens de erro sempre humanas.

export interface Resp<T> {
  ok: boolean;
  data?: T;
  erro?: string;
}

async function tratar<T>(r: Response): Promise<Resp<T>> {
  let json: any = null;
  try {
    json = await r.json();
  } catch {
    /* sem corpo */
  }
  if (!r.ok) {
    return { ok: false, erro: json?.erro || "Algo deu errado. Tente de novo." };
  }
  return { ok: true, data: json as T };
}

export async function getJSON<T>(url: string): Promise<Resp<T>> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    return tratar<T>(r);
  } catch {
    return { ok: false, erro: "Sem conexão. Verifique a internet e tente de novo." };
  }
}

export async function enviarJSON<T>(
  url: string,
  metodo: "POST" | "PATCH" | "DELETE",
  corpo?: unknown
): Promise<Resp<T>> {
  try {
    const r = await fetch(url, {
      method: metodo,
      headers: corpo !== undefined ? { "content-type": "application/json" } : undefined,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
    return tratar<T>(r);
  } catch {
    return { ok: false, erro: "Sem conexão. Verifique a internet e tente de novo." };
  }
}

export async function enviarArquivo<T>(
  url: string,
  metodo: "POST",
  form: FormData
): Promise<Resp<T>> {
  try {
    const r = await fetch(url, { method: metodo, body: form });
    return tratar<T>(r);
  } catch {
    return { ok: false, erro: "Sem conexão. O envio falhou — tente de novo." };
  }
}
