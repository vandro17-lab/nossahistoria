"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enviarJSON } from "./api";
import { BotaoOuro, Campo, cor, Toast } from "./ui";

export default function Login() {
  const router = useRouter();
  const [operador, setOperador] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar() {
    if (carregando) return;
    setCarregando(true);
    const r = await enviarJSON("/api/admin/login", "POST", { operador, senha });
    setCarregando(false);
    if (!r.ok) {
      setErro(r.erro || "Não foi possível entrar.");
      return;
    }
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
        background: cor.fundo,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <p style={{ textAlign: "center", color: cor.fraco, letterSpacing: "0.25em", textTransform: "uppercase", fontSize: 12 }}>
          Araçá Grill
        </p>
        <h1 style={{ textAlign: "center", color: cor.ouro, fontStyle: "italic", fontSize: 36, margin: "8px 0 24px", fontWeight: 500 }}>
          Painel · Nossa História
        </h1>
        <Campo label="Seu nome (quem está operando)" valor={operador} onChange={setOperador} placeholder="ex.: Marina" />
        <Campo label="Senha do painel" valor={senha} onChange={setSenha} tipo="password" placeholder="••••••••" />
        <div style={{ marginTop: 8 }}>
          <BotaoOuro cheio onClick={entrar} disabled={carregando}>
            {carregando ? "Entrando…" : "Entrar"}
          </BotaoOuro>
        </div>
      </div>
      {erro && <Toast msg={erro} onClose={() => setErro(null)} />}
    </main>
  );
}
