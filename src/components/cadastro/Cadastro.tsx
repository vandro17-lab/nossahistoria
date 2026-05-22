"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import GravadorVoz from "@/components/GravadorVoz";

// ============================================================
//  CADASTRO — tela do casal (tom de carta, nunca formulário)
//  Linguagem 100% sem gênero: sempre o nome da pessoa.
// ============================================================

type Etapa = "abertura" | "musica" | "fotos" | "audio" | "aviso" | "final";
interface FotoEdit {
  id: string;
  src: string;
  mensagem: string;
}

const base = "#080503";
const ouro = "#e9c69a";
const ouroF = "#c8924f";
const creme = "#f0e3d2";
const areia = "#cdb89e";
const fraco = "#9c8266";

function Botao({ children, onClick, disabled, big }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; big?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        marginTop: 8,
        padding: big ? "16px 40px" : "13px 32px",
        fontFamily: "var(--font-cormorant),serif",
        fontSize: big ? 21 : 18,
        fontStyle: "italic",
        letterSpacing: "0.03em",
        color: disabled ? "#7a6448" : "#1a0f08",
        background: disabled ? "rgba(233,198,154,0.2)" : "linear-gradient(135deg,#e9c69a,#c8924f)",
        border: "none",
        borderRadius: 999,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 8px 30px rgba(200,146,79,0.3)",
      }}
    >
      {children}
    </button>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-cormorant),serif", fontSize: "clamp(22px,5vw,32px)", color: creme, lineHeight: 1.5, fontStyle: "italic", margin: "0 0 8px" }}>
      {children}
    </p>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100dvh", background: base, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 22px" }}>
      <div style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>{children}</div>
    </main>
  );
}

const campoEstilo: React.CSSProperties = {
  width: "100%",
  padding: "13px 15px",
  fontSize: 16,
  color: creme,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(233,198,154,0.25)",
  borderRadius: 14,
  outline: "none",
  fontFamily: "inherit",
};

export default function Cadastro(props: {
  casalId: string;
  pessoa: 1 | 2;
  nomePessoa: string;
  nomeParceiro: string;
  musicaTitulo: string;
  temMusica: boolean;
  mensagemFinal: string;
  temAudio: boolean;
  fotosIniciais: FotoEdit[];
}) {
  const { casalId, pessoa, nomePessoa, nomeParceiro } = props;
  const api = `/api/cadastro/${casalId}/${pessoa}`;

  const [etapa, setEtapa] = useState<Etapa>("abertura");
  const [erro, setErro] = useState<string | null>(null);

  // música
  const [musTitulo, setMusTitulo] = useState(props.musicaTitulo);
  const [temMusica, setTemMusica] = useState(props.temMusica);

  // fotos
  const [fotos, setFotos] = useState<FotoEdit[]>(props.fotosIniciais);
  const [subindoFoto, setSubindoFoto] = useState(false);
  const [progressoFoto, setProgressoFoto] = useState<{ atual: number; total: number } | null>(null);

  // áudio
  const [temAudio, setTemAudio] = useState(props.temAudio);
  const [enviandoAudio, setEnviandoAudio] = useState(false);

  // mensagem final
  const [mensagemFinal, setMensagemFinal] = useState(props.mensagemFinal);

  const [salvando, setSalvando] = useState(false);

  // ---------- música ----------
  async function continuarMusica() {
    if (!musTitulo.trim()) {
      setErro("Conta pra gente o nome da música.");
      return;
    }
    setSalvando(true);
    const fd = new FormData();
    fd.append("titulo", musTitulo);
    try {
      const r = await fetch(`${api}/musica`, { method: "POST", body: fd });
      if (!r.ok) throw new Error();
      setEtapa("fotos");
    } catch {
      setErro("Não consegui salvar a música. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  // ---------- fotos ----------
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
      } catch (err: any) {
        setErro(err?.message || `Não consegui enviar a foto ${i + 1}. As demais foram salvas.`);
      }
    }
    setSubindoFoto(false);
    setProgressoFoto(null);
  }

  async function salvarLegenda(foto: FotoEdit) {
    try {
      await fetch(`${api}/foto/${foto.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mensagem: foto.mensagem }),
      });
    } catch {
      /* salva de novo no continuar */
    }
  }

  async function apagarFoto(id: string) {
    try {
      await fetch(`${api}/foto/${id}`, { method: "DELETE" });
      setFotos((f) => f.filter((x) => x.id !== id));
    } catch {
      setErro("Não consegui remover. Tente de novo.");
    }
  }

  async function moverFoto(idx: number, dir: -1 | 1) {
    const novo = idx + dir;
    if (novo < 0 || novo >= fotos.length) return;
    const arr = [...fotos];
    [arr[idx], arr[novo]] = [arr[novo], arr[idx]];
    setFotos(arr);
    try {
      await fetch(`${api}/reordenar`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ordemIds: arr.map((f) => f.id) }),
      });
    } catch {
      /* ordem visual já aplicada */
    }
  }

  async function continuarFotos() {
    if (fotos.length === 0) {
      setErro("Escolha pelo menos um momento de vocês.");
      return;
    }
    setSalvando(true);
    await Promise.all(fotos.map(salvarLegenda));
    setSalvando(false);
    setEtapa("audio");
  }

  // ---------- áudio ----------
  async function enviarAudio(blob: Blob) {
    setEnviandoAudio(true);
    const fd = new FormData();
    fd.append("file", blob, "voz.webm");
    try {
      const r = await fetch(`${api}/audio`, { method: "POST", body: fd });
      if (!r.ok) throw new Error();
      setTemAudio(true);
    } catch {
      setErro("Não consegui enviar o áudio. Tente de novo.");
    } finally {
      setEnviandoAudio(false);
    }
  }

  // ---------- conclusão ----------
  async function concluir() {
    setSalvando(true);
    try {
      const r = await fetch(`${api}/concluir`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mensagem_final: mensagemFinal }),
      });
      if (!r.ok) throw new Error();
      setEtapa("final");
    } catch {
      setErro("Algo deu errado ao finalizar. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  // ============================================================

  const Toast = erro ? <ToastBox msg={erro} onClose={() => setErro(null)} /> : null;

  if (etapa === "abertura") {
    return (
      <Wrap>
        {pessoa === 1 ? (
          <>
            <Titulo>O Araçá Grill preparou algo especial para vocês dois.</Titulo>
            <Titulo>Uma homenagem que só existe porque vocês existem juntos.</Titulo>
            <p style={{ color: areia, fontSize: 18, marginTop: 14 }}>Vamos começar?</p>
          </>
        ) : (
          <>
            <Titulo><strong style={{ color: ouro }}>{nomeParceiro}</strong> já esteve aqui.</Titulo>
            <Titulo>Deixou algo lindo pra você — mas isso é surpresa.</Titulo>
            <p style={{ color: areia, fontSize: 18, marginTop: 14 }}>Agora é a sua vez de fazer o mesmo.</p>
          </>
        )}
        <div><Botao big onClick={() => setEtapa("musica")}>Sim, vamos</Botao></div>
        {Toast}
      </Wrap>
    );
  }

  if (etapa === "musica") {
    return (
      <Wrap>
        <Titulo>
          Tem uma música que, quando toca, você pensa em <strong style={{ color: ouro }}>{nomeParceiro}</strong> antes de qualquer coisa. Qual é ela?
        </Titulo>
        <div style={{ marginTop: 18, textAlign: "left" }}>
          <input value={musTitulo} onChange={(e) => setMusTitulo(e.target.value)} placeholder="Nome da música e do artista" style={campoEstilo} />
        </div>
        <div><Botao onClick={continuarMusica} disabled={salvando}>{salvando ? "Salvando…" : "Continuar"}</Botao></div>
        {Toast}
      </Wrap>
    );
  }

  if (etapa === "fotos") {
    return (
      <Wrap>
        <Titulo>Agora escolha até 10 momentos que contam a história de vocês.</Titulo>
        <p style={{ color: areia, fontSize: 16, marginBottom: 18 }}>
          Pode ser uma risada, uma viagem, um dia simples que ficou na memória.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
          {fotos.map((foto, idx) => (
            <div key={foto.id} style={{ display: "flex", gap: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(233,198,154,0.18)", borderRadius: 14, padding: 10 }}>
              <div style={{ width: 70, height: 70, borderRadius: 10, flexShrink: 0, background: foto.src ? `url("${foto.src}") center/cover` : "#2a1c10" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <textarea
                  value={foto.mensagem}
                  onChange={(e) => setFotos((f) => f.map((x) => (x.id === foto.id ? { ...x, mensagem: e.target.value } : x)))}
                  onBlur={() => salvarLegenda(foto)}
                  placeholder="O que esse momento significa pra você?"
                  rows={2}
                  style={{ ...campoEstilo, fontSize: 14, padding: "8px 10px" }}
                />
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <MiniB onClick={() => moverFoto(idx, -1)} disabled={idx === 0}>↑</MiniB>
                  <MiniB onClick={() => moverFoto(idx, 1)} disabled={idx === fotos.length - 1}>↓</MiniB>
                  <MiniB onClick={() => apagarFoto(foto.id)} perigo>remover</MiniB>
                </div>
              </div>
            </div>
          ))}
        </div>

        {fotos.length < 10 && (
          <label style={{ display: "inline-block", marginTop: 16, padding: "12px 24px", borderRadius: 999, border: "1px solid rgba(233,198,154,0.3)", color: ouro, cursor: subindoFoto ? "not-allowed" : "pointer", fontSize: 16 }}>
            {subindoFoto && progressoFoto ? `Enviando ${progressoFoto.atual}/${progressoFoto.total}…` : "+ Adicionar fotos"}
            <input type="file" accept="image/*" multiple onChange={adicionarFoto} style={{ display: "none" }} disabled={subindoFoto} />
          </label>
        )}

        <div><Botao onClick={continuarFotos} disabled={salvando || subindoFoto}>{salvando ? "Salvando…" : "Continuar"}</Botao></div>
        {Toast}
      </Wrap>
    );
  }

  if (etapa === "audio") {
    return (
      <Wrap>
        <Titulo>
          Agora fale com <strong style={{ color: ouro }}>{nomeParceiro}</strong>.
        </Titulo>
        <p style={{ color: areia, fontSize: 16, marginBottom: 20 }}>
          Pode ser um segredo, uma lembrança, um te amo. Só a voz já diz tudo.
        </p>

        <GravadorVoz onArquivo={enviarAudio} enviando={enviandoAudio} />
        {temAudio && <p style={{ color: "#7bbf8a", fontSize: 14, marginTop: 10 }}>Áudio recebido ✓</p>}

        <div style={{ marginTop: 24, textAlign: "left" }}>
          <label style={{ display: "block", fontSize: 14, color: fraco, marginBottom: 8 }}>
            Se quiser, deixe também algumas palavras escritas (opcional):
          </label>
          <textarea
            value={mensagemFinal}
            onChange={(e) => setMensagemFinal(e.target.value)}
            placeholder="Uma frase que você gostaria que ficasse guardada…"
            rows={3}
            style={campoEstilo}
          />
        </div>

        <div><Botao onClick={() => setEtapa("aviso")} disabled={!temAudio}>{temAudio ? "Continuar" : "Grave ou envie um áudio"}</Botao></div>
        {Toast}
      </Wrap>
    );
  }

  if (etapa === "aviso") {
    return (
      <Wrap>
        <p style={{ fontFamily: "var(--font-cormorant),serif", fontSize: "clamp(19px,4.4vw,26px)", color: creme, lineHeight: 1.6, fontStyle: "italic" }}>
          Cada foto que você enviou passa por um olhar cuidadoso da nossa equipe antes da experiência ir ao ar — só para deixar tudo perfeito.
          <br /><br />
          Depois, só vocês dois verão o resultado. Estamos aqui para cuidar de cada detalhe com carinho.
        </p>
        <div><Botao onClick={concluir} disabled={salvando}>{salvando ? "Finalizando…" : "Concluir minha parte"}</Botao></div>
        {Toast}
      </Wrap>
    );
  }

  // final
  return (
    <Wrap>
      <Titulo>Que lindo o que você preparou.</Titulo>
      <Titulo>
        <strong style={{ color: ouro }}>{nomeParceiro}</strong> não vai saber o que vai encontrar.
      </Titulo>
      <p style={{ color: areia, fontSize: 18, marginTop: 14 }}>E isso é o mais bonito de tudo.</p>
      <p style={{ marginTop: 28, letterSpacing: "0.3em", textTransform: "uppercase", fontSize: 13, color: ouroF }}>Araçá Grill</p>
    </Wrap>
  );
}

function MiniB({ children, onClick, perigo, disabled }: { children: React.ReactNode; onClick?: () => void; perigo?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "5px 12px",
        fontSize: 13,
        borderRadius: 8,
        border: `1px solid ${perigo ? "rgba(224,122,106,0.5)" : "rgba(233,198,154,0.25)"}`,
        background: "transparent",
        color: perigo ? "#e07a6a" : ouro,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

function ToastBox({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        background: "#1f1408",
        border: "1px solid rgba(233,198,154,0.25)",
        color: creme,
        padding: "12px 20px",
        borderRadius: 14,
        fontSize: 15,
        maxWidth: "90vw",
        cursor: "pointer",
        zIndex: 50,
      }}
    >
      {msg}
    </div>
  );
}
