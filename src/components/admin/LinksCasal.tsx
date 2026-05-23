"use client";

import { useState } from "react";
import { cor } from "./ui";
import type { Casal } from "@/lib/types";

function origem(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function soDigitos(s: string | null | undefined): string {
  return (s || "").replace(/\D/g, "");
}

function LinhaLink({
  rotulo,
  url,
  whatsapp,
  mensagemWa,
}: {
  rotulo: string;
  url: string;
  whatsapp?: string | null;
  mensagemWa?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const tel = soDigitos(whatsapp);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* noop */
    }
  }

  const waHref = tel
    ? `https://wa.me/${tel.startsWith("55") ? tel : "55" + tel}?text=${encodeURIComponent((mensagemWa || "") + " " + url)}`
    : null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12.5, color: cor.fraco, marginBottom: 4 }}>{rotulo}</div>
      <div
        style={{
          fontSize: 12.5,
          color: cor.suave,
          background: cor.fundo,
          border: `1px solid ${cor.borda}`,
          borderRadius: 10,
          padding: "8px 10px",
          wordBreak: "break-all",
          marginBottom: 6,
        }}
      >
        {url}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={copiar}
          style={{ flex: 1, padding: "9px", borderRadius: 10, border: `1px solid ${cor.borda}`, background: "transparent", color: cor.ouro, fontSize: 13.5, cursor: "pointer", fontWeight: 600 }}
        >
          {copiado ? "Copiado ✓" : "Copiar"}
        </button>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid rgba(123,191,138,0.4)", background: "rgba(123,191,138,0.1)", color: cor.ok, fontSize: 13.5, textAlign: "center", textDecoration: "none", fontWeight: 600 }}
          >
            Enviar no WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

const MSG_WA = (nome: string) =>
  `Olá, ${nome}! 🌹 O Araçá Grill está preparando uma surpresa personalizada para o Dia dos Namorados e precisa da sua ajuda. São só alguns minutinhos — perguntas simples, tudo guiado passo a passo. O que você compartilhar vai aparecer como um presente especial para quem você ama no jantar do dia 12. Quem estará com você não vai saber o que você respondeu 😉 Toque no link para fazer a sua parte:`;

export default function LinksCasal({ casal }: { casal: Casal }) {
  const base = origem();
  const link1 = `${base}/cadastro/${casal.id}/1`;
  const link2 = `${base}/cadastro/${casal.id}/2`;
  const linkExp = `${base}/experiencia/${casal.token}`;
  const nomeP2 = casal.nome_2?.trim() || "parceiro/a";

  return (
    <div>
      <LinhaLink
        rotulo={`Cadastro de ${casal.nome_1}`}
        url={link1}
        whatsapp={casal.whatsapp_1}
        mensagemWa={MSG_WA(casal.nome_1)}
      />
      <LinhaLink
        rotulo={`Cadastro de ${nomeP2}`}
        url={link2}
        whatsapp={casal.whatsapp_2}
        mensagemWa={MSG_WA(nomeP2)}
      />
      <LinhaLink rotulo="Experiência (link secreto — QR)" url={linkExp} />
    </div>
  );
}
