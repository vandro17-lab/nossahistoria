"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Upload, Play, Pause } from "lucide-react";

export default function GravadorVoz({
  onArquivo,
  enviando,
  corOuro = "#e9c69a",
  corFraco = "#9c8266",
  corBorda = "rgba(233,198,154,0.22)",
}: {
  onArquivo: (blob: Blob) => void;
  enviando?: boolean;
  corOuro?: string;
  corFraco?: string;
  corBorda?: string;
}) {
  const [gravando, setGravando] = useState(false);
  const [previa, setPrevia] = useState<string | null>(null);
  const [tocando, setTocando] = useState(false);
  const [suportado] = useState(
    typeof window !== "undefined" && typeof (window as any).MediaRecorder !== "undefined"
  );
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function iniciar() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setPrevia(url);
        onArquivo(blob);
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recRef.current = rec;
      setGravando(true);
    } catch {
      alert("Não consegui acessar o microfone. Você pode enviar um áudio do aparelho abaixo.");
    }
  }

  function parar() {
    recRef.current?.stop();
    setGravando(false);
  }

  function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setPrevia(URL.createObjectURL(f));
      onArquivo(f);
    }
  }

  function togglePrevia() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) { el.play(); setTocando(true); }
    else { el.pause(); setTocando(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>

      {/* Botão de gravação */}
      {suportado && (
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Anel pulsante enquanto grava */}
          {gravando && (
            <motion.div aria-hidden
              style={{
                position: "absolute", width: 120, height: 120, borderRadius: "50%",
                border: "1px solid rgba(224,122,106,0.3)",
              }}
              animate={{ scale: [1, 1.22, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <motion.button
            onClick={gravando ? parar : iniciar}
            disabled={enviando}
            whileHover={enviando ? {} : { scale: 1.06 }}
            whileTap={enviando ? {} : { scale: 0.93 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            style={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              border: `1px solid ${gravando ? "rgba(224,122,106,0.55)" : corBorda}`,
              background: gravando
                ? "radial-gradient(circle at 40% 35%, rgba(224,122,106,0.18) 0%, rgba(8,5,3,0.7) 100%)"
                : "radial-gradient(circle at 40% 35%, rgba(233,198,154,0.08) 0%, rgba(8,5,3,0.6) 100%)",
              color: gravando ? "#e07a6a" : corOuro,
              cursor: enviando ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(10px)",
              boxShadow: gravando
                ? "0 0 32px rgba(224,122,106,0.15), 0 8px 32px rgba(0,0,0,0.5)"
                : "0 8px 32px rgba(0,0,0,0.4)",
              transition: "border-color 0.3s, background 0.3s",
            }}
          >
            <AnimatePresence mode="wait">
              {gravando
                ? <motion.span key="stop" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }}>
                    <Square size={24} strokeWidth={1.5} />
                  </motion.span>
                : <motion.span key="mic" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }}>
                    <Mic size={28} strokeWidth={1.2} />
                  </motion.span>
              }
            </AnimatePresence>
          </motion.button>
        </div>
      )}

      {/* Label de estado */}
      <motion.p
        key={gravando ? "grav" : "idle"}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          fontSize: 13, color: gravando ? "#e07a6a" : corFraco,
          fontFamily: "var(--font-cormorant),serif", fontStyle: "italic",
          letterSpacing: "0.05em",
        }}
      >
        {gravando ? "Gravando… toque para parar" : suportado ? "Toque para gravar" : "Gravação indisponível"}
      </motion.p>

      {/* Preview do áudio gravado/enviado */}
      <AnimatePresence>
        {previa && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.45 }}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(233,198,154,0.18)", borderRadius: 999,
              padding: "10px 20px 10px 12px",
            }}
          >
            <motion.button onClick={togglePrevia}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                border: `1px solid ${corBorda}`,
                background: "rgba(233,198,154,0.08)",
                color: corOuro, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {tocando ? <Pause size={14} strokeWidth={1.5} /> : <Play size={14} strokeWidth={1.5} />}
            </motion.button>
            <span style={{ fontSize: 14, color: corOuro, fontFamily: "var(--font-cormorant),serif", fontStyle: "italic" }}>
              Áudio pronto
            </span>
            {/* elemento de áudio oculto */}
            <audio ref={audioRef} src={previa} onEnded={() => setTocando(false)} style={{ display: "none" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divisor */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", maxWidth: 280 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(233,198,154,0.1)" }} />
        <span style={{ fontSize: 11, color: "rgba(156,130,102,0.5)", letterSpacing: "0.15em" }}>ou</span>
        <div style={{ flex: 1, height: 1, background: "rgba(233,198,154,0.1)" }} />
      </div>

      {/* Upload de arquivo */}
      <motion.label
        whileHover={{ scale: 1.03, borderColor: "rgba(233,198,154,0.45)" }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          fontSize: 14, color: corOuro,
          border: `1px solid ${corBorda}`, borderRadius: 999,
          padding: "10px 22px", cursor: enviando ? "not-allowed" : "pointer",
          fontFamily: "var(--font-cormorant),serif", fontStyle: "italic",
          background: "rgba(233,198,154,0.03)",
          transition: "border-color 0.3s",
        }}
      >
        <Upload size={14} strokeWidth={1.5} />
        Enviar um áudio do aparelho
        <input type="file" accept="audio/*" onChange={aoEscolher} style={{ display: "none" }} disabled={enviando} />
      </motion.label>
    </div>
  );
}
