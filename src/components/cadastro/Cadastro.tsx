"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Music2, ImagePlus, ChevronUp, ChevronDown, Trash2, CheckCircle2, ArrowRight } from "lucide-react";
import imageCompression from "browser-image-compression";
import GravadorVoz from "@/components/GravadorVoz";

// ============================================================
//  CADASTRO — tela do casal (tom de carta, nunca formulário)
// ============================================================

type Etapa = "abertura" | "musica" | "fotos" | "audio" | "aviso" | "final";
interface FotoEdit { id: string; src: string; mensagem: string; }

const base = "#080503";
const ouro = "#e9c69a";
const ouroF = "#c8924f";
const creme = "#f0e3d2";
const areia = "#cdb89e";
const fraco = "#9c8266";

// Transição padrão entre etapas
const paginaVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.35, ease: "easeIn" as const } },
};

// ── Átomo: Botão premium com shimmer ──────────────────────────
function Botao({ children, onClick, disabled, big, perigo }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; big?: boolean; perigo?: boolean;
}) {
  if (disabled) {
    return (
      <button disabled style={{
        marginTop: 8, padding: big ? "16px 44px" : "13px 34px",
        fontFamily: "var(--font-cormorant),serif", fontSize: big ? 21 : 17,
        fontStyle: "italic", letterSpacing: "0.05em",
        color: "#5a4430", background: "rgba(233,198,154,0.08)",
        border: "1px solid rgba(233,198,154,0.12)", borderRadius: 999, cursor: "not-allowed",
      }}>
        {children}
      </button>
    );
  }
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      style={{
        marginTop: 8, padding: big ? "16px 44px" : "13px 34px",
        fontFamily: "var(--font-cormorant),serif", fontSize: big ? 21 : 17,
        fontStyle: "italic", letterSpacing: "0.05em",
        color: perigo ? "#f4ead9" : "#1a0f08",
        background: perigo
          ? "linear-gradient(135deg, #8b3a2a, #a04030)"
          : "linear-gradient(135deg, #edd9a3 0%, #d4a055 50%, #c8924f 100%)",
        border: "none", borderRadius: 999, cursor: "pointer",
        boxShadow: perigo
          ? "0 6px 24px rgba(160,64,48,0.35)"
          : "0 6px 28px rgba(200,146,79,0.38), inset 0 1px 0 rgba(255,255,255,0.18)",
        position: "relative", overflow: "hidden",
        display: "inline-flex", alignItems: "center", gap: 8,
      }}
    >
      <motion.span aria-hidden style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.16) 50%, transparent 65%)",
        backgroundSize: "200% 100%",
      }}
        animate={{ backgroundPositionX: ["200%", "-200%"] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
      />
      <span style={{ position: "relative" }}>{children}</span>
    </motion.button>
  );
}

// ── Átomo: wrapper de página ───────────────────────────────────
function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100dvh", background: base, color: "#fff", position: "relative", overflow: "hidden" }}>
      {/* Vinheta central suave */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(100,50,15,0.12) 0%, rgba(8,5,3,0.6) 100%)",
      }} />
      {/* Grain cinematográfico */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, zIndex: 0, opacity: 0.025, pointerEvents: "none",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }} />
      <div style={{
        position: "relative", zIndex: 1,
        minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 540, textAlign: "center" }}>{children}</div>
      </div>
    </main>
  );
}

// ── Átomo: título com fade in ──────────────────────────────────
function Titulo({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        fontFamily: "var(--font-cormorant),serif",
        fontSize: "clamp(21px,4.8vw,30px)",
        color: creme, lineHeight: 1.6, fontStyle: "italic",
        margin: "0 0 8px", letterSpacing: "0.01em",
      }}
    >
      {children}
    </motion.p>
  );
}

// ── Átomo: campo de formulário ─────────────────────────────────
const campoBase: React.CSSProperties = {
  width: "100%", padding: "14px 16px",
  color: creme, background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(233,198,154,0.2)", borderRadius: 14,
  outline: "none", fontFamily: "var(--font-cormorant),serif",
  fontSize: 17, lineHeight: 1.55,
  transition: "border-color 0.3s",
};

// ── Átomo: barra de progresso da etapa ────────────────────────
const ETAPAS_PROGRESSO: Etapa[] = ["musica", "fotos", "audio", "aviso"];
function BarraProgresso({ etapa }: { etapa: Etapa }) {
  const idx = ETAPAS_PROGRESSO.indexOf(etapa);
  if (idx === -1) return null;
  return (
    <div style={{ display: "flex", gap: 5, justifyContent: "center", marginBottom: 36 }}>
      {ETAPAS_PROGRESSO.map((_, i) => (
        <motion.div key={i}
          animate={{ opacity: i <= idx ? 1 : 0.2, scaleX: i === idx ? 1.3 : 1 }}
          transition={{ duration: 0.5 }}
          style={{ height: 2, width: 28, borderRadius: 2, background: i <= idx ? ouroF : "rgba(233,198,154,0.25)", transformOrigin: "left" }}
        />
      ))}
    </div>
  );
}

// ── Átomo: mini botão ─────────────────────────────────────────
function MiniB({ children, onClick, perigo, disabled }: {
  children: React.ReactNode; onClick?: () => void; perigo?: boolean; disabled?: boolean;
}) {
  return (
    <motion.button onClick={onClick} disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.08 }}
      whileTap={disabled ? {} : { scale: 0.93 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{
        padding: "5px 10px", fontSize: 12, borderRadius: 8,
        border: `1px solid ${perigo ? "rgba(224,122,106,0.45)" : "rgba(233,198,154,0.2)"}`,
        background: "transparent",
        color: perigo ? "#e07a6a" : ouro,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.3 : 1,
        display: "flex", alignItems: "center", gap: 3,
      }}
    >
      {children}
    </motion.button>
  );
}

// ── Átomo: toast ──────────────────────────────────────────────
function ToastBox({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <motion.div onClick={onClose}
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed", left: "50%", bottom: 28,
        transform: "translateX(-50%)",
        background: "rgba(20,10,4,0.9)", backdropFilter: "blur(16px)",
        border: "1px solid rgba(233,198,154,0.2)", color: creme,
        padding: "13px 22px", borderRadius: 16, fontSize: 15,
        maxWidth: "88vw", cursor: "pointer", zIndex: 50,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {msg}
    </motion.div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function Cadastro(props: {
  casalId: string; pessoa: 1 | 2;
  nomePessoa: string; nomeParceiro: string;
  musicaTitulo: string; temMusica: boolean;
  mensagemFinal: string; temAudio: boolean;
  fotosIniciais: FotoEdit[];
}) {
  const { casalId, pessoa, nomePessoa, nomeParceiro } = props;
  const api = `/api/cadastro/${casalId}/${pessoa}`;

  const [etapa, setEtapa] = useState<Etapa>("abertura");
  const [erro, setErro] = useState<string | null>(null);
  const [musTitulo, setMusTitulo] = useState(props.musicaTitulo);
  const [fotos, setFotos] = useState<FotoEdit[]>(props.fotosIniciais);
  const [subindoFoto, setSubindoFoto] = useState(false);
  const [progressoFoto, setProgressoFoto] = useState<{ atual: number; total: number } | null>(null);
  const [temAudio, setTemAudio] = useState(props.temAudio);
  const [enviandoAudio, setEnviandoAudio] = useState(false);
  const [mensagemFinal, setMensagemFinal] = useState(props.mensagemFinal);
  const [salvando, setSalvando] = useState(false);

  async function continuarMusica() {
    if (!musTitulo.trim()) { setErro("Conta pra gente o nome da música."); return; }
    setSalvando(true);
    const fd = new FormData();
    fd.append("titulo", musTitulo);
    try {
      const r = await fetch(`${api}/musica`, { method: "POST", body: fd });
      if (!r.ok) throw new Error();
      setEtapa("fotos");
    } catch { setErro("Não consegui salvar a música. Tente de novo."); }
    finally { setSalvando(false); }
  }

  async function adicionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const disponiveis = 10 - fotos.length;
    if (disponiveis <= 0) { setErro("Você já escolheu 10 momentos — lindos demais!"); return; }
    const lote = files.slice(0, disponiveis);
    if (files.length > disponiveis) setErro(`Só cabem mais ${disponiveis} foto${disponiveis > 1 ? "s" : ""}. Enviando as primeiras.`);
    setSubindoFoto(true);
    setProgressoFoto({ atual: 0, total: lote.length });
    for (let i = 0; i < lote.length; i++) {
      setProgressoFoto({ atual: i + 1, total: lote.length });
      try {
        const file = lote[i];
        const comp = await imageCompression(file, { maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true });
        const fd = new FormData();
        fd.append("file", comp, file.name);
        const r = await fetch(`${api}/fotos`, { method: "POST", body: fd });
        const json = await r.json();
        if (!r.ok) throw new Error(json?.erro);
        if (json.foto) setFotos((f) => [...f, { id: json.foto.id, src: json.foto.src, mensagem: json.foto.mensagem || "" }]);
      } catch (err: any) { setErro(err?.message || `Não consegui enviar a foto ${i + 1}.`); }
    }
    setSubindoFoto(false);
    setProgressoFoto(null);
  }

  async function salvarLegenda(foto: FotoEdit) {
    try {
      await fetch(`${api}/foto/${foto.id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ mensagem: foto.mensagem }),
      });
    } catch { /* salva no continuar */ }
  }

  async function apagarFoto(id: string) {
    try {
      await fetch(`${api}/foto/${id}`, { method: "DELETE" });
      setFotos((f) => f.filter((x) => x.id !== id));
    } catch { setErro("Não consegui remover. Tente de novo."); }
  }

  async function moverFoto(idx: number, dir: -1 | 1) {
    const novo = idx + dir;
    if (novo < 0 || novo >= fotos.length) return;
    const arr = [...fotos];
    [arr[idx], arr[novo]] = [arr[novo], arr[idx]];
    setFotos(arr);
    try {
      await fetch(`${api}/reordenar`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ordemIds: arr.map((f) => f.id) }),
      });
    } catch { /* ordem visual já aplicada */ }
  }

  async function continuarFotos() {
    if (fotos.length === 0) { setErro("Escolha pelo menos um momento de vocês."); return; }
    setSalvando(true);
    await Promise.all(fotos.map(salvarLegenda));
    setSalvando(false);
    setEtapa("audio");
  }

  async function enviarAudio(blob: Blob) {
    setEnviandoAudio(true);
    const fd = new FormData();
    fd.append("file", blob, "voz.webm");
    try {
      const r = await fetch(`${api}/audio`, { method: "POST", body: fd });
      if (!r.ok) throw new Error();
      setTemAudio(true);
    } catch { setErro("Não consegui enviar o áudio. Tente de novo."); }
    finally { setEnviandoAudio(false); }
  }

  async function concluir() {
    setSalvando(true);
    try {
      const r = await fetch(`${api}/concluir`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ mensagem_final: mensagemFinal }),
      });
      if (!r.ok) throw new Error();
      setEtapa("final");
    } catch { setErro("Algo deu errado ao finalizar. Tente de novo."); }
    finally { setSalvando(false); }
  }

  return (
    <Wrap>
      <BarraProgresso etapa={etapa} />
      <AnimatePresence mode="wait">

        {/* ── ABERTURA ── */}
        {etapa === "abertura" && (
          <motion.div key="abertura" variants={paginaVariants} initial="initial" animate="animate" exit="exit">
            {/* Selo */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.2 }}
              style={{ letterSpacing: "0.3em", fontSize: 11, color: fraco, textTransform: "uppercase", marginBottom: 32 }}>
              Araçá Grill
            </motion.p>

            {pessoa === 1 ? (
              <>
                <Titulo delay={0.3}>O Araçá Grill preparou algo especial para vocês dois.</Titulo>
                <Titulo delay={0.55}>Uma homenagem que só existe porque vocês existem juntos.</Titulo>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.9 }}
                  style={{ color: areia, fontSize: 18, marginTop: 10, fontFamily: "var(--font-cormorant),serif", fontStyle: "italic" }}>
                  Vai levar só alguns minutos.
                </motion.p>
              </>
            ) : (
              <>
                <Titulo delay={0.3}><strong style={{ color: ouro, fontStyle: "normal" }}>{nomeParceiro}</strong> já esteve aqui.</Titulo>
                <Titulo delay={0.55}>Deixou algo lindo pra você — mas isso é surpresa.</Titulo>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.9 }}
                  style={{ color: areia, fontSize: 18, marginTop: 10, fontFamily: "var(--font-cormorant),serif", fontStyle: "italic" }}>
                  Agora chegou a sua vez.
                </motion.p>
              </>
            )}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.2 }}>
              <Botao big onClick={() => setEtapa("musica")}>Sim, vamos <ArrowRight size={16} strokeWidth={1.5} /></Botao>
            </motion.div>
          </motion.div>
        )}

        {/* ── MÚSICA ── */}
        {etapa === "musica" && (
          <motion.div key="musica" variants={paginaVariants} initial="initial" animate="animate" exit="exit">
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
              style={{ marginBottom: 24, color: ouroF }}>
              <Music2 size={36} strokeWidth={1} style={{ margin: "0 auto" }} />
            </motion.div>
            <Titulo delay={0.15}>
              Tem uma música que, quando toca, você pensa em{" "}
              <strong style={{ color: ouro, fontStyle: "normal" }}>{nomeParceiro}</strong>{" "}
              antes de qualquer coisa. Qual é ela?
            </Titulo>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
              style={{ marginTop: 22, textAlign: "left" }}>
              <input
                value={musTitulo}
                onChange={(e) => setMusTitulo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && continuarMusica()}
                placeholder="Nome da música e do artista"
                style={campoBase}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(233,198,154,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(233,198,154,0.2)")}
              />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.55 }}>
              <Botao onClick={continuarMusica} disabled={salvando}>
                {salvando ? "Salvando…" : "Continuar"}
              </Botao>
            </motion.div>
          </motion.div>
        )}

        {/* ── FOTOS ── */}
        {etapa === "fotos" && (
          <motion.div key="fotos" variants={paginaVariants} initial="initial" animate="animate" exit="exit">
            <Titulo delay={0}>Escolha os momentos que ficaram. Podem ser até 10.</Titulo>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
              style={{ color: fraco, fontSize: 15, marginBottom: 8, fontFamily: "var(--font-cormorant),serif", fontStyle: "italic", lineHeight: 1.55 }}>
              Uma risada, uma viagem, um dia simples que ficou na memória.
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.45 }}
              style={{ color: "#5a4430", fontSize: 13, marginBottom: 22, fontFamily: "var(--font-cormorant),serif", fontStyle: "italic", lineHeight: 1.5 }}>
              Antes da experiência começar, nossa equipe dá uma olhada em cada foto para garantir que tudo fique lindo.
            </motion.p>

            <AnimatePresence>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
                {fotos.map((foto, idx) => (
                  <motion.div key={foto.id}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, scale: 0.97 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      display: "flex", gap: 12,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(233,198,154,0.14)",
                      borderRadius: 16, padding: 12,
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: 76, height: 76, borderRadius: 12, flexShrink: 0,
                      background: foto.src ? `url("${foto.src}") center/cover` : "#1a1008",
                      boxShadow: "inset 0 0 20px rgba(0,0,0,0.4)",
                      border: "1px solid rgba(233,198,154,0.1)",
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <textarea
                        value={foto.mensagem}
                        onChange={(e) => setFotos((f) => f.map((x) => x.id === foto.id ? { ...x, mensagem: e.target.value } : x))}
                        placeholder="O que esse momento significa pra você?"
                        rows={2}
                        style={{ ...campoBase, fontSize: 14, padding: "9px 11px", resize: "none" as any }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(233,198,154,0.45)")}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(233,198,154,0.2)"; salvarLegenda(foto); }}
                      />
                      <div style={{ display: "flex", gap: 5, marginTop: 7, alignItems: "center" }}>
                        <MiniB onClick={() => moverFoto(idx, -1)} disabled={idx === 0}>
                          <ChevronUp size={13} strokeWidth={1.5} />
                        </MiniB>
                        <MiniB onClick={() => moverFoto(idx, 1)} disabled={idx === fotos.length - 1}>
                          <ChevronDown size={13} strokeWidth={1.5} />
                        </MiniB>
                        <MiniB onClick={() => apagarFoto(foto.id)} perigo>
                          <Trash2 size={12} strokeWidth={1.5} /> remover
                        </MiniB>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            {fotos.length < 10 && (
              <motion.label
                whileHover={{ scale: 1.03, borderColor: "rgba(233,198,154,0.55)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  marginTop: 18, padding: "12px 26px", borderRadius: 999,
                  border: "1px solid rgba(233,198,154,0.28)", color: ouro,
                  cursor: subindoFoto ? "not-allowed" : "pointer", fontSize: 16,
                  fontFamily: "var(--font-cormorant),serif", fontStyle: "italic",
                  background: "rgba(233,198,154,0.04)",
                }}
              >
                <ImagePlus size={16} strokeWidth={1.5} />
                {subindoFoto && progressoFoto
                  ? `Enviando ${progressoFoto.atual}/${progressoFoto.total}…`
                  : "Adicionar fotos"}
                <input type="file" accept="image/*" multiple onChange={adicionarFoto} style={{ display: "none" }} disabled={subindoFoto} />
              </motion.label>
            )}

            <div style={{ marginTop: 8 }}>
              <Botao onClick={continuarFotos} disabled={salvando || subindoFoto}>
                {salvando ? "Salvando…" : "Continuar"}
              </Botao>
            </div>
          </motion.div>
        )}

        {/* ── ÁUDIO ── */}
        {etapa === "audio" && (
          <motion.div key="audio" variants={paginaVariants} initial="initial" animate="animate" exit="exit">
            <Titulo delay={0}>
              Agora fale com{" "}
              <strong style={{ color: ouro, fontStyle: "normal" }}>{nomeParceiro}</strong>.
            </Titulo>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.35 }}
              style={{ color: fraco, fontSize: 15, marginBottom: 28, fontFamily: "var(--font-cormorant),serif", fontStyle: "italic", lineHeight: 1.6 }}>
              Pode ser um segredo, uma memória, um te amo.<br />Não precisa ser perfeito — só precisa ser seu.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
              <GravadorVoz onArquivo={enviarAudio} enviando={enviandoAudio} />
            </motion.div>

            {temAudio && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#7bbf8a", fontSize: 14, marginTop: 14 }}>
                <CheckCircle2 size={15} strokeWidth={1.5} /> Áudio recebido
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.7 }}
              style={{ marginTop: 28, textAlign: "left" }}>
              <label style={{ display: "block", fontSize: 14, color: fraco, marginBottom: 10, fontFamily: "var(--font-cormorant),serif", fontStyle: "italic" }}>
                Se quiser, deixe também algumas palavras escritas (opcional):
              </label>
              <textarea
                value={mensagemFinal}
                onChange={(e) => setMensagemFinal(e.target.value)}
                placeholder="Uma frase que você gostaria que ficasse guardada…"
                rows={3}
                style={{ ...campoBase, resize: "none" as any }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(233,198,154,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(233,198,154,0.2)")}
              />
            </motion.div>

            <Botao onClick={() => setEtapa("aviso")} disabled={!temAudio}>
              {temAudio ? "Continuar" : "Grave ou envie um áudio"}
            </Botao>
          </motion.div>
        )}

        {/* ── AVISO ── */}
        {etapa === "aviso" && (
          <motion.div key="aviso" variants={paginaVariants} initial="initial" animate="animate" exit="exit">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              style={{ width: 1, height: 48, background: "linear-gradient(to bottom, transparent, rgba(200,146,79,0.4))", margin: "0 auto 28px" }}
            />
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }}
              style={{
                fontFamily: "var(--font-cormorant),serif",
                fontSize: "clamp(18px,4.2vw,26px)", color: creme, lineHeight: 1.75,
                fontStyle: "italic", marginBottom: 20,
              }}>
              Tudo pronto. Sua parte está feita.
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.7 }}
              style={{ fontFamily: "var(--font-cormorant),serif", fontSize: "clamp(17px,3.8vw,22px)", color: areia, lineHeight: 1.7, fontStyle: "italic" }}>
              Agora é só esperar a noite.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.2 }}>
              <Botao onClick={concluir} disabled={salvando}>
                {salvando ? "Finalizando…" : "Concluir minha parte"}
              </Botao>
            </motion.div>
          </motion.div>
        )}

        {/* ── FINAL ── */}
        {etapa === "final" && (
          <motion.div key="final" variants={paginaVariants} initial="initial" animate="animate" exit="exit">
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: 48, height: 1, background: "rgba(200,146,79,0.5)", margin: "0 auto 32px", transformOrigin: "center" }}
            />
            <Titulo delay={0.3}>Você fez algo muito bonito hoje.</Titulo>
            <Titulo delay={0.6}>
              <strong style={{ color: ouro, fontStyle: "normal" }}>{nomeParceiro}</strong> não tem a menor ideia do que está por vir.
            </Titulo>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 1 }}
              style={{ color: areia, fontSize: 18, marginTop: 14, fontFamily: "var(--font-cormorant),serif", fontStyle: "italic" }}>
              E isso é o mais bonito de tudo.
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 1.6 }}
              style={{ marginTop: 40, letterSpacing: "0.35em", textTransform: "uppercase", fontSize: 12, color: ouroF }}>
              Araçá Grill
            </motion.p>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {erro && <ToastBox msg={erro} onClose={() => setErro(null)} />}
      </AnimatePresence>
    </Wrap>
  );
}
