"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getJSON, enviarJSON } from "./api";
import { BotaoOuro, BotaoLinha, Campo, Cartao, Selo, Toast, Modal, cor } from "./ui";
import type { Casal } from "@/lib/types";
import type { OverviewAdmin, CasalResumo } from "@/lib/casalResumo";
import LinksCasal from "./LinksCasal";

type Filtro = "todos" | "faltando" | "prontos" | "aprovados";

export default function Overview({ operador }: { operador: string }) {
  const router = useRouter();
  const [dados, setDados] = useState<OverviewAdmin | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [novoAberto, setNovoAberto] = useState(false);
  const [criado, setCriado] = useState<Casal | null>(null);

  const carregar = useCallback(async () => {
    const r = await getJSON<OverviewAdmin>("/api/admin/casais");
    if (r.ok && r.data) setDados(r.data);
    else setErro(r.erro || "Não foi possível carregar.");
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    if (!dados) return [];
    const q = busca.trim().toLowerCase();
    return dados.resumos.filter((r) => {
      if (q) {
        const alvo = `${r.casal.nome_1} ${r.casal.nome_2} ${r.casal.mesa || ""}`.toLowerCase();
        if (!alvo.includes(q)) return false;
      }
      if (filtro === "aprovados") return r.casal.status === "aprovado";
      if (filtro === "faltando") return r.casal.status !== "aprovado";
      if (filtro === "prontos") return r.casal.status !== "aprovado" && r.analise.podeAprovar;
      return true;
    });
  }, [dados, filtro, busca]);

  async function sair() {
    await enviarJSON("/api/admin/logout", "POST");
    router.refresh();
  }

  const c = dados?.contadores;

  return (
    <main style={{ minHeight: "100dvh", background: cor.fundo, padding: "18px 14px 60px", maxWidth: 760, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <p style={{ color: cor.fraco, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>
            Araçá Grill · Nossa História
          </p>
          <h1 style={{ color: cor.ouro, fontSize: 24, margin: "2px 0 0", fontWeight: 600 }}>Centro de controle</h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: cor.suave, fontSize: 13 }}>{operador}</div>
          <button onClick={sair} style={{ background: "none", border: "none", color: cor.fraco, fontSize: 13, cursor: "pointer", padding: 0 }}>
            sair
          </button>
        </div>
      </header>

      {/* contadores */}
      {c && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 16 }}>
          {[
            { n: c.total, l: "total" },
            { n: c.aguardando_1, l: "aguard. 1" },
            { n: c.aguardando_2, l: "aguard. 2" },
            { n: c.completo, l: "completos" },
            { n: c.aprovado, l: "aprovados" },
          ].map((x) => (
            <div key={x.l} style={{ background: cor.cartao, border: `1px solid ${cor.borda}`, borderRadius: 12, padding: "10px 4px", textAlign: "center" }}>
              <div style={{ color: cor.ouro, fontSize: 22, fontWeight: 700 }}>{x.n}</div>
              <div style={{ color: cor.fraco, fontSize: 10.5 }}>{x.l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <BotaoOuro cheio onClick={() => setNovoAberto(true)}>
          + Cadastrar casal
        </BotaoOuro>
      </div>

      {/* filtros */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {([
          ["todos", "Todos"],
          ["faltando", "Faltando algo"],
          ["prontos", "Prontos p/ aprovar"],
          ["aprovados", "Aprovados"],
        ] as [Filtro, string][]).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: `1px solid ${cor.borda}`,
              background: filtro === f ? "linear-gradient(135deg,#e9c69a,#c8924f)" : "transparent",
              color: filtro === f ? "#1a0f08" : cor.suave,
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome ou mesa…"
        style={{
          width: "100%",
          padding: "12px 14px",
          fontSize: 16,
          color: cor.texto,
          background: cor.cartao,
          border: `1px solid ${cor.borda}`,
          borderRadius: 12,
          outline: "none",
          marginBottom: 16,
          fontFamily: "inherit",
        }}
      />

      {/* lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {!dados && <p style={{ color: cor.fraco, textAlign: "center" }}>Carregando…</p>}
        {dados && filtrados.length === 0 && (
          <p style={{ color: cor.fraco, textAlign: "center", padding: "20px 0" }}>Nenhum casal por aqui.</p>
        )}
        {filtrados.map((r) => (
          <CardCasal key={r.casal.id} resumo={r} onAbrir={() => router.push(`/admin/casal/${r.casal.id}`)} />
        ))}
      </div>

      {novoAberto && (
        <Modal titulo={criado ? "Casal cadastrado ✓" : "Cadastrar casal"} onFechar={() => { setNovoAberto(false); setCriado(null); carregar(); }}>
          {criado ? (
            <div>
              <LinksCasal casal={criado} />
              <div style={{ marginTop: 16 }}>
                <BotaoOuro cheio onClick={() => { setNovoAberto(false); setCriado(null); carregar(); }}>
                  Concluir
                </BotaoOuro>
              </div>
            </div>
          ) : (
            <FormNovoCasal
              onCriado={(casal) => setCriado(casal)}
              onErro={(e) => setErro(e)}
            />
          )}
        </Modal>
      )}

      {erro && <Toast msg={erro} onClose={() => setErro(null)} />}
    </main>
  );
}

function CardCasal({ resumo, onAbrir }: { resumo: CasalResumo; onAbrir: () => void }) {
  const { casal, analise, diasDesdeCriacao } = resumo;
  const aprovado = casal.status === "aprovado";
  return (
    <button
      onClick={onAbrir}
      style={{
        textAlign: "left",
        background: cor.cartao,
        border: `1px solid ${aprovado ? "rgba(233,198,154,0.4)" : cor.borda}`,
        borderRadius: 16,
        padding: 16,
        cursor: "pointer",
        color: cor.texto,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: cor.texto }}>
            {casal.nome_1} <span style={{ color: cor.ouroForte }}>&amp;</span> {casal.nome_2 || <span style={{ color: cor.fraco, fontStyle: "italic", fontWeight: 400 }}>a definir</span>}
          </div>
          <div style={{ fontSize: 13, color: cor.fraco, marginTop: 2 }}>Mesa {casal.mesa || "—"}</div>
        </div>
        {aprovado ? <Selo tipo="aprovado">Aprovado ✓</Selo> : analise.podeAprovar ? <Selo tipo="ok">Pronto p/ aprovar</Selo> : <Selo tipo="alerta">Faltando algo</Selo>}
      </div>
      {!aprovado && analise.faltando.length > 0 && (
        <div style={{ fontSize: 12.5, color: cor.suave, marginTop: 8 }}>
          Falta: {analise.faltando.slice(0, 3).join(", ")}
          {analise.faltando.length > 3 ? "…" : ""}
        </div>
      )}
      {diasDesdeCriacao >= 30 && (
        <div style={{ fontSize: 12, color: cor.alerta, marginTop: 8 }}>
          ⏳ Passou de 30 dias — considere apagar para liberar espaço.
        </div>
      )}
    </button>
  );
}

function FormNovoCasal({ onCriado, onErro }: { onCriado: (c: Casal) => void; onErro: (e: string) => void }) {
  const [f, setF] = useState({ nome_1: "", whatsapp_1: "", nome_2: "", whatsapp_2: "", mesa: "" });
  const [carregando, setCarregando] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  async function salvar() {
    if (!f.nome_1.trim()) {
      onErro("Preencha pelo menos o nome da primeira pessoa.");
      return;
    }
    setCarregando(true);
    const r = await enviarJSON<{ casal: Casal }>("/api/admin/casais", "POST", f);
    setCarregando(false);
    if (!r.ok || !r.data) {
      onErro(r.erro || "Não foi possível cadastrar.");
      return;
    }
    onCriado(r.data.casal);
  }

  return (
    <div>
      <Campo label="Nome 1" valor={f.nome_1} onChange={set("nome_1")} placeholder="ex.: Ana" />
      <Campo label="WhatsApp 1 (com DDD)" valor={f.whatsapp_1} onChange={set("whatsapp_1")} placeholder="ex.: 11999998888" tipo="tel" />
      <Campo label="Nome 2 (opcional — a pessoa pode informar depois)" valor={f.nome_2} onChange={set("nome_2")} placeholder="ex.: Silvio" />
      <Campo label="WhatsApp 2 (opcional)" valor={f.whatsapp_2} onChange={set("whatsapp_2")} placeholder="ex.: 11988887777" tipo="tel" />
      <Campo label="Mesa" valor={f.mesa} onChange={set("mesa")} placeholder="ex.: 12" />
      <div style={{ marginTop: 8 }}>
        <BotaoOuro cheio onClick={salvar} disabled={carregando}>
          {carregando ? "Salvando…" : "Cadastrar e gerar links"}
        </BotaoOuro>
      </div>
    </div>
  );
}
