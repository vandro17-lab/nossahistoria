"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getJSON, enviarJSON, enviarArquivo } from "./api";
import { BotaoOuro, BotaoLinha, Campo, Cartao, Selo, Toast, Modal, Salvando, cor } from "./ui";
import LinksCasal from "./LinksCasal";
import QRCartao from "./QRCartao";
import GravadorVoz from "@/components/GravadorVoz";
import type { CasalDetalhe as Detalhe, CadastroDetalhe } from "@/lib/casalDetalhe";
import type { FotoView } from "@/lib/types";

const corP1 = "#e0a458"; // âmbar
const corP2 = "#d98c8c"; // rosé

export default function CasalDetalhe({ id }: { id: string }) {
  const router = useRouter();
  const [d, setD] = useState<Detalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "links" | "qr" | "dados" | "apagar">(null);

  const carregar = useCallback(async () => {
    const r = await getJSON<Detalhe>(`/api/admin/casais/${id}`);
    if (r.ok && r.data) setD(r.data);
    else setErro(r.erro || "Não foi possível carregar o casal.");
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const aviso = (m: string) => setToast(m);

  if (!d) {
    return (
      <main style={{ minHeight: "100dvh", background: cor.fundo, display: "flex", alignItems: "center", justifyContent: "center", color: cor.fraco }}>
        Carregando…
        {erro && <Toast msg={erro} onClose={() => setErro(null)} />}
      </main>
    );
  }

  const { casal, pessoa1, pessoa2, analise } = d;
  const aprovado = casal.status === "aprovado";

  async function aprovar(aprovar: boolean) {
    const r = await enviarJSON<{ status: string }>(`/api/admin/casais/${id}/aprovar`, "POST", { aprovar });
    if (!r.ok) {
      setErro(r.erro || "Não foi possível.");
      return;
    }
    aviso(aprovar ? "Casal aprovado ✓" : "Aprovação removida");
    carregar();
  }

  return (
    <main style={{ minHeight: "100dvh", background: cor.fundo, paddingBottom: 60 }}>
      {/* topo fixo: nomes + mesa sempre à vista */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(14,10,6,0.96)",
          borderBottom: `1px solid ${cor.borda}`,
          padding: "12px 14px",
          backdropFilter: "blur(6px)",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/admin")} style={{ background: "none", border: "none", color: cor.ouro, fontSize: 22, cursor: "pointer", padding: 0 }}>
            ‹
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: cor.texto, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {casal.nome_1} <span style={{ color: cor.ouroForte }}>&amp;</span> {casal.nome_2}
            </div>
            <div style={{ fontSize: 12.5, color: cor.fraco }}>Mesa {casal.mesa || "—"}</div>
          </div>
          {aprovado ? <Selo tipo="aprovado">Aprovado ✓</Selo> : analise.podeAprovar ? <Selo tipo="ok">Pronto</Selo> : <Selo tipo="alerta">Faltando</Selo>}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* controles principais */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <BotaoLinha cheio onClick={() => setModal("links")}>Links & WhatsApp</BotaoLinha>
          <BotaoLinha cheio onClick={() => setModal("qr")}>QR / cartão</BotaoLinha>
          <BotaoLinha cheio onClick={() => window.open(`/admin/previa/${casal.token}`, "_blank")}>
            Pré-visualizar
          </BotaoLinha>
          <BotaoLinha cheio onClick={() => setModal("dados")}>Editar dados</BotaoLinha>
        </div>

        {/* aprovação */}
        <Cartao>
          {aprovado ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ color: cor.ok, fontSize: 15 }}>Esta experiência está no ar para o casal. 🤍</div>
              <BotaoLinha onClick={() => aprovar(false)}>Desaprovar (volta a esconder)</BotaoLinha>
            </div>
          ) : (
            <div>
              <BotaoOuro cheio disabled={!analise.podeAprovar} onClick={() => aprovar(true)}>
                {analise.podeAprovar ? "Aprovar e liberar p/ o casal" : "Aprovar (ainda falta algo)"}
              </BotaoOuro>
              {!analise.podeAprovar && (
                <div style={{ marginTop: 10, fontSize: 13.5, color: cor.suave }}>
                  <strong style={{ color: cor.alerta }}>Falta para aprovar:</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    {analise.faltando.map((f, i) => (
                      <li key={i} style={{ marginBottom: 2 }}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Cartao>

        {/* linha de etapas */}
        <h2 style={{ color: cor.fraco, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", margin: "8px 0 0" }}>
          A experiência, em etapas
        </h2>

        <EtapaAuto titulo="1 · Abertura" descricao="Nomes do casal em caligrafia (automático)" />

        <BlocoPessoa
          numeroBase={2}
          nome={casal.nome_1}
          accent={corP1}
          cad={pessoa1}
          onMudou={carregar}
          onErro={setErro}
          onAviso={aviso}
        />

        <EtapaAuto titulo="5 · Transição" descricao="Passagem para a outra pessoa (automático)" />

        <BlocoPessoa
          numeroBase={6}
          nome={casal.nome_2}
          accent={corP2}
          cad={pessoa2}
          onMudou={carregar}
          onErro={setErro}
          onAviso={aviso}
        />

        <EtapaAuto titulo="9 · Final / Mural" descricao="Mosaico das fotos + mensagem do Araçá Grill (automático)" />

        {/* reabrir / bloquear */}
        <Cartao>
          <div style={{ fontSize: 13, color: cor.fraco, marginBottom: 10 }}>Reabrir cadastro (deixa a pessoa refazer)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <ReabrirBotao id={id} pessoa={1} nome={casal.nome_1} bloqueado={!!pessoa1?.bloqueado} onMudou={carregar} onErro={setErro} onAviso={aviso} />
            <ReabrirBotao id={id} pessoa={2} nome={casal.nome_2} bloqueado={!!pessoa2?.bloqueado} onMudou={carregar} onErro={setErro} onAviso={aviso} />
          </div>
        </Cartao>

        {/* observações */}
        <ObservacoesCard id={id} valorInicial={casal.observacoes || ""} onErro={setErro} />

        {/* downloads e apagar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <a
            href={`/api/admin/casais/${id}/baixar`}
            style={{ textAlign: "center", padding: "12px", borderRadius: 12, border: `1px solid ${cor.borda}`, color: cor.ouro, textDecoration: "none", fontWeight: 600 }}
          >
            Baixar tudo do casal (zip)
          </a>
          <BotaoLinha cheio perigo onClick={() => setModal("apagar")}>
            Apagar tudo do casal
          </BotaoLinha>
        </div>
      </div>

      {modal === "links" && (
        <Modal titulo="Links & WhatsApp" onFechar={() => setModal(null)}>
          <LinksCasal casal={casal} />
        </Modal>
      )}
      {modal === "qr" && (
        <Modal titulo="QR & cartão físico" onFechar={() => setModal(null)}>
          <QRCartao casal={casal} />
        </Modal>
      )}
      {modal === "dados" && (
        <Modal titulo="Editar dados do casal" onFechar={() => setModal(null)}>
          <EditarDados
            id={id}
            inicial={casal}
            onSalvo={() => {
              setModal(null);
              aviso("Dados salvos ✓");
              carregar();
            }}
            onErro={setErro}
          />
        </Modal>
      )}
      {modal === "apagar" && (
        <Modal titulo="Apagar tudo do casal" onFechar={() => setModal(null)}>
          <ApagarTudo casal={casal} onErro={setErro} onApagado={() => router.push("/admin")} />
        </Modal>
      )}

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      {erro && <Toast msg={erro} onClose={() => setErro(null)} />}
    </main>
  );
}

// ---------------- Etapas automáticas ----------------

function EtapaAuto({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <Cartao style={{ opacity: 0.85 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 600, color: cor.texto }}>{titulo}</div>
          <div style={{ fontSize: 12.5, color: cor.fraco, marginTop: 2 }}>{descricao}</div>
        </div>
        <Selo tipo="ok">✓</Selo>
      </div>
    </Cartao>
  );
}

// ---------------- Bloco de uma pessoa (música, fotos, voz) ----------------

function BlocoPessoa({
  numeroBase,
  nome,
  accent,
  cad,
  onMudou,
  onErro,
  onAviso,
}: {
  numeroBase: number;
  nome: string;
  accent: string;
  cad: CadastroDetalhe | null;
  onMudou: () => void;
  onErro: (e: string) => void;
  onAviso: (m: string) => void;
}) {
  if (!cad) {
    return (
      <Cartao>
        <div style={{ color: cor.fraco }}>Cadastro de {nome} ainda não iniciado.</div>
      </Cartao>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, borderLeft: `3px solid ${accent}`, paddingLeft: 10 }}>
      <MusicaEtapa numero={numeroBase} nome={nome} cad={cad} onMudou={onMudou} onErro={onErro} onAviso={onAviso} />
      <FotosEtapa numero={numeroBase + 1} nome={nome} accent={accent} cad={cad} onMudou={onMudou} onErro={onErro} onAviso={onAviso} />
      <VozEtapa numero={numeroBase + 2} nome={nome} cad={cad} onMudou={onMudou} onErro={onErro} onAviso={onAviso} />
    </div>
  );
}

function CabecalhoEtapa({ numero, titulo, ok }: { numero: number; titulo: string; ok: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <div style={{ fontWeight: 600, color: cor.texto }}>
        {numero} · {titulo}
      </div>
      {ok ? <Selo tipo="ok">✓ pronta</Selo> : <Selo tipo="alerta">⚠ faltando</Selo>}
    </div>
  );
}

// ---- Música ----
function MusicaEtapa({
  numero,
  nome,
  cad,
  onMudou,
  onErro,
  onAviso,
}: {
  numero: number;
  nome: string;
  cad: CadastroDetalhe;
  onMudou: () => void;
  onErro: (e: string) => void;
  onAviso: (m: string) => void;
}) {
  const [titulo, setTitulo] = useState(cad.musica_titulo || "");
  const [estado, setEstado] = useState<"salvando" | "salvo" | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function salvarTitulo() {
    setEstado("salvando");
    const r = await enviarJSON(`/api/admin/cadastros/${cad.id}/texto`, "PATCH", { campo: "musica_titulo", valor: titulo });
    if (!r.ok) {
      setEstado(null);
      onErro(r.erro || "Erro ao salvar.");
      return;
    }
    setEstado("salvo");
    setTimeout(() => setEstado(null), 1500);
    onMudou();
  }

  async function trocarMp3(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    fd.append("titulo", titulo);
    setEstado("salvando");
    const r = await enviarArquivo(`/api/admin/cadastros/${cad.id}/musica`, "POST", fd);
    if (!r.ok) {
      setEstado(null);
      onErro(r.erro || "Não foi possível enviar.");
      return;
    }
    setEstado("salvo");
    setTimeout(() => setEstado(null), 1500);
    onAviso("Música atualizada ✓");
    onMudou();
  }

  return (
    <Cartao>
      <CabecalhoEtapa numero={numero} titulo={`Música de ${nome}`} ok={!!cad.musica_titulo && !!cad.musica_url} />
      <Campo label="Título da música" valor={titulo} onChange={setTitulo} placeholder="ex.: La Vie en Rose — Édith Piaf" />
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <BotaoLinha onClick={salvarTitulo}>Salvar título</BotaoLinha>
        <BotaoLinha onClick={() => fileRef.current?.click()}>{cad.musica_url ? "Trocar MP3" : "Enviar MP3"}</BotaoLinha>
        <Salvando estado={estado} />
        <input ref={fileRef} type="file" accept="audio/mpeg,audio/mp3,audio/*" onChange={trocarMp3} style={{ display: "none" }} />
      </div>
      {cad.musica_src && <audio src={cad.musica_src} controls style={{ width: "100%", marginTop: 12 }} />}
    </Cartao>
  );
}

// ---- Fotos ----
function FotosEtapa({
  numero,
  nome,
  accent,
  cad,
  onMudou,
  onErro,
  onAviso,
}: {
  numero: number;
  nome: string;
  accent: string;
  cad: CadastroDetalhe;
  onMudou: () => void;
  onErro: (e: string) => void;
  onAviso: (m: string) => void;
}) {
  const addRef = useRef<HTMLInputElement | null>(null);
  const visiveis = cad.fotos.filter((f) => !f.oculta).length;

  async function adicionar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!confirm(`Subir esta foto no bloco de ${nome}? Confira se é a pessoa certa.`)) {
      e.target.value = "";
      return;
    }
    const fd = new FormData();
    fd.append("file", f);
    const r = await enviarArquivo(`/api/admin/cadastros/${cad.id}/fotos`, "POST", fd);
    e.target.value = "";
    if (!r.ok) {
      onErro(r.erro || "Não foi possível enviar.");
      return;
    }
    onAviso("Foto adicionada ✓");
    onMudou();
  }

  async function reordenar(idx: number, dir: -1 | 1) {
    const ids = cad.fotos.map((f) => f.id);
    const novo = idx + dir;
    if (novo < 0 || novo >= ids.length) return;
    [ids[idx], ids[novo]] = [ids[novo], ids[idx]];
    const r = await enviarJSON(`/api/admin/cadastros/${cad.id}/reordenar`, "POST", { ordemIds: ids });
    if (!r.ok) {
      onErro(r.erro || "Não foi possível reordenar.");
      return;
    }
    onMudou();
  }

  return (
    <Cartao style={{ borderColor: accent + "55" }}>
      <CabecalhoEtapa numero={numero} titulo={`Fotos de ${nome}`} ok={visiveis > 0} />
      <div style={{ fontSize: 12, color: accent, fontWeight: 600, marginBottom: 10 }}>
        ● Bloco de {nome} — {visiveis} foto(s) visível(is)
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cad.fotos.length === 0 && <div style={{ color: cor.fraco, fontSize: 14 }}>Nenhuma foto ainda.</div>}
        {cad.fotos.map((foto, idx) => (
          <FotoLinha
            key={foto.id}
            foto={foto}
            idx={idx}
            total={cad.fotos.length}
            nome={nome}
            onReordenar={reordenar}
            onMudou={onMudou}
            onErro={onErro}
            onAviso={onAviso}
          />
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <BotaoLinha cheio onClick={() => addRef.current?.click()}>+ Subir foto nova</BotaoLinha>
        <input ref={addRef} type="file" accept="image/*" onChange={adicionar} style={{ display: "none" }} />
      </div>
    </Cartao>
  );
}

function FotoLinha({
  foto,
  idx,
  total,
  nome,
  onReordenar,
  onMudou,
  onErro,
  onAviso,
}: {
  foto: FotoView;
  idx: number;
  total: number;
  nome: string;
  onReordenar: (idx: number, dir: -1 | 1) => void;
  onMudou: () => void;
  onErro: (e: string) => void;
  onAviso: (m: string) => void;
}) {
  const [msg, setMsg] = useState(foto.mensagem || "");
  const [estado, setEstado] = useState<"salvando" | "salvo" | null>(null);
  const subsRef = useRef<HTMLInputElement | null>(null);

  async function salvarMsg() {
    setEstado("salvando");
    const r = await enviarJSON(`/api/admin/fotos/${foto.id}`, "PATCH", { mensagem: msg });
    if (!r.ok) {
      setEstado(null);
      onErro(r.erro || "Erro ao salvar.");
      return;
    }
    setEstado("salvo");
    setTimeout(() => setEstado(null), 1500);
    onMudou();
  }

  async function alternarOculta() {
    const r = await enviarJSON(`/api/admin/fotos/${foto.id}`, "PATCH", { oculta: !foto.oculta });
    if (!r.ok) {
      onErro(r.erro || "Erro.");
      return;
    }
    onMudou();
  }

  async function apagar() {
    if (!confirm(`Apagar esta foto de ${nome}? Não dá para desfazer.`)) return;
    const r = await enviarJSON(`/api/admin/fotos/${foto.id}`, "DELETE");
    if (!r.ok) {
      onErro(r.erro || "Erro ao apagar.");
      return;
    }
    onAviso("Foto apagada");
    onMudou();
  }

  async function substituir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    const r = await enviarArquivo(`/api/admin/fotos/${foto.id}/substituir`, "POST", fd);
    e.target.value = "";
    if (!r.ok) {
      onErro(r.erro || "Erro ao substituir.");
      return;
    }
    onAviso("Foto substituída ✓");
    onMudou();
  }

  return (
    <div style={{ display: "flex", gap: 10, padding: 10, background: cor.fundo, borderRadius: 12, border: `1px solid ${cor.borda}`, opacity: foto.oculta ? 0.55 : 1 }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 10,
          flexShrink: 0,
          background: foto.src ? `url("${foto.src}") center/cover` : "#2a1c10",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="O que esse momento significa…"
          rows={2}
          style={{ width: "100%", fontSize: 14, color: cor.texto, background: "transparent", border: `1px solid ${cor.borda}`, borderRadius: 8, padding: "6px 8px", resize: "vertical", fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6, alignItems: "center" }}>
          <MiniBtn onClick={salvarMsg}>Salvar</MiniBtn>
          <MiniBtn onClick={() => onReordenar(idx, -1)} disabled={idx === 0}>↑</MiniBtn>
          <MiniBtn onClick={() => onReordenar(idx, 1)} disabled={idx === total - 1}>↓</MiniBtn>
          <MiniBtn onClick={alternarOculta}>{foto.oculta ? "Reexibir" : "Ocultar"}</MiniBtn>
          <MiniBtn onClick={() => subsRef.current?.click()}>Trocar</MiniBtn>
          <MiniBtn onClick={apagar} perigo>Apagar</MiniBtn>
          <Salvando estado={estado} />
          <input ref={subsRef} type="file" accept="image/*" onChange={substituir} style={{ display: "none" }} />
        </div>
      </div>
    </div>
  );
}

function MiniBtn({ children, onClick, perigo, disabled }: { children: React.ReactNode; onClick?: () => void; perigo?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "5px 10px",
        fontSize: 12.5,
        borderRadius: 8,
        border: `1px solid ${perigo ? "rgba(224,122,106,0.5)" : cor.borda}`,
        background: "transparent",
        color: perigo ? cor.perigo : cor.ouro,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

// ---- Voz ----
function VozEtapa({
  numero,
  nome,
  cad,
  onMudou,
  onErro,
  onAviso,
}: {
  numero: number;
  nome: string;
  cad: CadastroDetalhe;
  onMudou: () => void;
  onErro: (e: string) => void;
  onAviso: (m: string) => void;
}) {
  const [gravarAberto, setGravarAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(blob: Blob) {
    setEnviando(true);
    const fd = new FormData();
    fd.append("file", blob, "voz.webm");
    const r = await enviarArquivo(`/api/admin/cadastros/${cad.id}/audio`, "POST", fd);
    setEnviando(false);
    if (!r.ok) {
      onErro(r.erro || "Não foi possível enviar.");
      return;
    }
    setGravarAberto(false);
    onAviso("Voz atualizada ✓");
    onMudou();
  }

  async function apagar() {
    if (!confirm(`Apagar a voz de ${nome}? Não dá para desfazer.`)) return;
    const r = await enviarJSON(`/api/admin/cadastros/${cad.id}/audio`, "DELETE");
    if (!r.ok) {
      onErro(r.erro || "Erro.");
      return;
    }
    onAviso("Voz apagada");
    onMudou();
  }

  return (
    <Cartao>
      <CabecalhoEtapa numero={numero} titulo={`Voz de ${nome}`} ok={!!cad.audio_url} />
      {cad.audio_src && <audio src={cad.audio_src} controls style={{ width: "100%", marginBottom: 10 }} />}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <BotaoLinha onClick={() => setGravarAberto((v) => !v)}>{gravarAberto ? "Fechar gravação" : "Gravar / enviar voz"}</BotaoLinha>
        {cad.audio_url && <BotaoLinha perigo onClick={apagar}>Apagar voz</BotaoLinha>}
      </div>
      {gravarAberto && (
        <div style={{ marginTop: 14 }}>
          <GravadorVoz onArquivo={enviar} enviando={enviando} />
          {enviando && <div style={{ textAlign: "center", color: cor.fraco, fontSize: 13, marginTop: 8 }}>enviando…</div>}
        </div>
      )}
    </Cartao>
  );
}

// ---------------- Reabrir/bloquear ----------------
function ReabrirBotao({
  id,
  pessoa,
  nome,
  bloqueado,
  onMudou,
  onErro,
  onAviso,
}: {
  id: string;
  pessoa: 1 | 2;
  nome: string;
  bloqueado: boolean;
  onMudou: () => void;
  onErro: (e: string) => void;
  onAviso: (m: string) => void;
}) {
  async function alternar() {
    const r = await enviarJSON(`/api/admin/casais/${id}/bloqueio`, "POST", { pessoa, bloqueado: !bloqueado });
    if (!r.ok) {
      onErro(r.erro || "Erro.");
      return;
    }
    onAviso(!bloqueado ? `Cadastro de ${nome} bloqueado` : `Cadastro de ${nome} reaberto`);
    onMudou();
  }
  return <BotaoLinha cheio onClick={alternar}>{bloqueado ? `Reabrir p/ ${nome}` : `Bloquear ${nome}`}</BotaoLinha>;
}

// ---------------- Observações ----------------
function ObservacoesCard({ id, valorInicial, onErro }: { id: string; valorInicial: string; onErro: (e: string) => void }) {
  const [v, setV] = useState(valorInicial);
  const [estado, setEstado] = useState<"salvando" | "salvo" | null>(null);
  async function salvar() {
    setEstado("salvando");
    const r = await enviarJSON(`/api/admin/casais/${id}`, "PATCH", { observacoes: v });
    if (!r.ok) {
      setEstado(null);
      onErro(r.erro || "Erro.");
      return;
    }
    setEstado("salvo");
    setTimeout(() => setEstado(null), 1500);
  }
  return (
    <Cartao>
      <Campo label="Anotações da equipe" valor={v} onChange={setV} multiline placeholder="ex.: confirmar foto do casamento com o garçom" />
      <div style={{ display: "flex", alignItems: "center" }}>
        <BotaoLinha onClick={salvar}>Salvar anotações</BotaoLinha>
        <Salvando estado={estado} />
      </div>
    </Cartao>
  );
}

// ---------------- Editar dados ----------------
function EditarDados({
  id,
  inicial,
  onSalvo,
  onErro,
}: {
  id: string;
  inicial: Detalhe["casal"];
  onSalvo: () => void;
  onErro: (e: string) => void;
}) {
  const [f, setF] = useState({
    nome_1: inicial.nome_1,
    nome_2: inicial.nome_2,
    whatsapp_1: inicial.whatsapp_1 || "",
    whatsapp_2: inicial.whatsapp_2 || "",
    mesa: inicial.mesa || "",
  });
  const [carregando, setCarregando] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  async function salvar() {
    if (!f.nome_1.trim() || !f.nome_2.trim()) {
      onErro("O nome não pode ficar vazio.");
      return;
    }
    setCarregando(true);
    const r = await enviarJSON(`/api/admin/casais/${id}`, "PATCH", f);
    setCarregando(false);
    if (!r.ok) {
      onErro(r.erro || "Erro ao salvar.");
      return;
    }
    onSalvo();
  }
  return (
    <div>
      <Campo label="Nome 1" valor={f.nome_1} onChange={set("nome_1")} />
      <Campo label="WhatsApp 1" valor={f.whatsapp_1} onChange={set("whatsapp_1")} tipo="tel" />
      <Campo label="Nome 2" valor={f.nome_2} onChange={set("nome_2")} />
      <Campo label="WhatsApp 2" valor={f.whatsapp_2} onChange={set("whatsapp_2")} tipo="tel" />
      <Campo label="Mesa" valor={f.mesa} onChange={set("mesa")} />
      <BotaoOuro cheio onClick={salvar} disabled={carregando}>
        {carregando ? "Salvando…" : "Salvar"}
      </BotaoOuro>
    </div>
  );
}

// ---------------- Apagar tudo ----------------
function ApagarTudo({
  casal,
  onErro,
  onApagado,
}: {
  casal: Detalhe["casal"];
  onErro: (e: string) => void;
  onApagado: () => void;
}) {
  const [txt, setTxt] = useState("");
  const [carregando, setCarregando] = useState(false);
  async function apagar() {
    setCarregando(true);
    const r = await enviarJSON(`/api/admin/casais/${casal.id}?confirmacao=APAGAR`, "DELETE");
    setCarregando(false);
    if (!r.ok) {
      onErro(r.erro || "Não foi possível apagar.");
      return;
    }
    onApagado();
  }
  return (
    <div>
      <p style={{ color: cor.suave, fontSize: 15, lineHeight: 1.5 }}>
        Você vai apagar <strong style={{ color: cor.texto }}>{casal.nome_1} &amp; {casal.nome_2}</strong>, Mesa {casal.mesa || "—"} — fotos, áudios e textos.
        <br />
        <strong style={{ color: cor.perigo }}>Isso não dá para desfazer.</strong>
      </p>
      <Campo label='Para confirmar, digite APAGAR' valor={txt} onChange={setTxt} placeholder="APAGAR" />
      <BotaoLinha cheio perigo disabled={txt !== "APAGAR" || carregando} onClick={apagar}>
        {carregando ? "Apagando…" : "Apagar definitivamente"}
      </BotaoLinha>
    </div>
  );
}
