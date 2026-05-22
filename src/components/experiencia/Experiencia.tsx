"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ExperienciaView, BlocoView, FotoView } from "@/lib/types";
import TelaCarregamento from "./TelaCarregamento";

// ---- preloading ----
function preloadUrls(urls: (string | null | undefined)[], onProgress: (p: number) => void) {
  const validos = urls.filter(Boolean) as string[];
  if (!validos.length) { onProgress(100); return; }
  let done = 0;
  const tick = () => { done++; onProgress(Math.round((done / validos.length) * 100)); };
  validos.forEach((url) => {
    if (/\.(jpe?g|png|webp|gif|avif)/i.test(url) || url.includes("fotos")) {
      const img = new Image();
      img.onload = img.onerror = tick;
      img.src = url;
    } else {
      const audio = new Audio();
      audio.oncanplaythrough = audio.onerror = tick;
      audio.preload = "auto";
      audio.src = url;
    }
  });
}

// ============================================================
//  ARAÇÁ GRILL · "Nossa História" — A EXPERIÊNCIA
//  Portado do protótipo experiencia-araca.jsx, com dados reais
//  do Supabase, música MP3 em fade e voz com ritual de play.
// ============================================================

// Fallback de fundo quando uma foto não carrega (nunca tela quebrada)
const gradFallback = (i: number) => {
  const tons = ["#4a2c1a", "#5c1f12", "#6b3410", "#3a2418", "#5a2410"];
  const a = tons[i % tons.length];
  return `radial-gradient(120% 120% at 30% 20%, ${a} 0%, #0a0604 100%)`;
};

// ============================================================
//  ÁTOMOS VISUAIS
// ============================================================

function Petalas({ count = 14 }: { count?: number }) {
  const petals = useRef(
    Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 12,
      dur: 11 + Math.random() * 9,
      size: 8 + Math.random() * 12,
      sway: 20 + Math.random() * 40,
      op: 0.15 + Math.random() * 0.35,
    }))
  ).current;

  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      {petals.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: "-5%",
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.3,
            background: "linear-gradient(160deg,#c97b4a,#7a2418)",
            borderRadius: "50% 0 50% 50%",
            opacity: p.op,
            filter: "blur(0.4px)",
            animation: `fall ${p.dur}s linear ${p.delay}s infinite, sway ${p.dur / 2}s ease-in-out ${p.delay}s infinite alternate`,
            ["--sway" as any]: `${p.sway}px`,
          }}
        />
      ))}
    </div>
  );
}

function NomeCaligrafia({ texto, delay = 0 }: { texto: string; delay?: number }) {
  return (
    <svg viewBox="0 0 600 140" style={{ width: "min(86vw,600px)", height: "auto", overflow: "visible" }}>
      <text
        x="300"
        y="95"
        textAnchor="middle"
        style={{
          fontFamily: "var(--font-cormorant), Georgia, serif",
          fontSize: 96,
          fontStyle: "italic",
          fontWeight: 500,
          fill: "transparent",
          stroke: "#e9c69a",
          strokeWidth: 0.8,
          strokeDasharray: 1200,
          strokeDashoffset: 1200,
          animation: `draw 2.6s ease ${delay}s forwards, fillIn 1.4s ease ${delay + 1.9}s forwards`,
        }}
      >
        {texto}
      </text>
    </svg>
  );
}

function TextoCarta({
  linhas,
  onDone,
  gap = 70,
}: {
  linhas: string[];
  onDone?: () => void;
  gap?: number;
}) {
  const palavras = linhas.flatMap((l, li) =>
    l
      .split(" ")
      .map((w, wi) => ({ w, key: `${li}-${wi}`, br: false }))
      .concat([{ w: "", key: `br-${li}`, br: true }])
  );
  useEffect(() => {
    if (!onDone) return;
    const t = setTimeout(onDone, palavras.length * gap + 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  let count = -1;
  return (
    <p
      style={{
        fontFamily: "var(--font-cormorant),serif",
        fontSize: "clamp(22px,4.6vw,34px)",
        lineHeight: 1.55,
        color: "#f0e3d2",
        textAlign: "center",
        maxWidth: 640,
        margin: "0 auto",
        fontWeight: 400,
      }}
    >
      {palavras.map((p) => {
        if (p.br) return <br key={p.key} />;
        count++;
        return (
          <span
            key={p.key}
            style={{
              opacity: 0,
              display: "inline-block",
              animation: `wordIn .9s ease ${count * (gap / 1000)}s forwards`,
              marginRight: "0.28em",
            }}
          >
            {p.w}
          </span>
        );
      })}
    </p>
  );
}

function Botao({
  children,
  onClick,
  big,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  big?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        marginTop: 38,
        padding: big ? "18px 46px" : "14px 36px",
        fontFamily: "var(--font-cormorant),serif",
        fontSize: big ? 22 : 18,
        fontStyle: "italic",
        letterSpacing: "0.04em",
        color: "#1a0f08",
        background: "linear-gradient(135deg,#e9c69a,#c8924f)",
        border: "none",
        borderRadius: 999,
        cursor: "pointer",
        boxShadow: "0 8px 30px rgba(200,146,79,0.35)",
        transition: "transform .3s, box-shadow .3s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(200,146,79,0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 8px 30px rgba(200,146,79,0.35)";
      }}
    >
      {children}
    </button>
  );
}

function Centro({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 22px",
        position: "relative",
        zIndex: 2,
      }}
    >
      {children}
    </div>
  );
}

function FullFoto({
  foto,
  idx,
  total,
}: {
  foto: FotoView;
  idx: number;
  total: number;
}) {
  const fundo = foto.src
    ? `url("${foto.src}")`
    : gradFallback(idx);
  return (
    <div
      style={{
        minHeight: "100dvh",
        position: "relative",
        zIndex: 2,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: fundo,
          backgroundSize: "cover",
          backgroundPosition: "center",
          animation: "kenburns 6s ease forwards",
          transformOrigin: "60% 40%",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(8,5,3,0.95) 0%, rgba(8,5,3,0.2) 50%, transparent 100%)",
        }}
      />
      <div style={{ position: "relative", padding: "0 28px 90px", maxWidth: 620, textAlign: "center" }}>
        {foto.mensagem && (
          <p
            style={{
              fontFamily: "var(--font-cormorant),serif",
              fontStyle: "italic",
              fontSize: "clamp(20px,4.4vw,28px)",
              color: "#f4ead9",
              lineHeight: 1.5,
              opacity: 0,
              animation: "subtitleIn 1.4s ease 0.8s forwards",
            }}
          >
            {foto.mensagem}
          </p>
        )}
        <div style={{ display: "flex", gap: 7, justifyContent: "center", marginTop: 26 }}>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              style={{
                width: i === idx ? 22 : 7,
                height: 7,
                borderRadius: 9,
                background: i === idx ? "#e9c69a" : "rgba(233,198,154,0.3)",
                transition: "width .5s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MusicaVinil({ titulo }: { titulo: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "28px 0" }}>
      <div
        style={{
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: "repeating-radial-gradient(#1a1109 0 2px,#0a0604 2px 4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "spin 6s linear infinite",
          boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#e9c69a,#c8924f)" }} />
      </div>
      <p
        style={{
          marginTop: 22,
          fontFamily: "var(--font-cormorant),serif",
          fontStyle: "italic",
          fontSize: 24,
          color: "#f0e3d2",
        }}
      >
        {titulo}
      </p>
      <p style={{ fontSize: 12, color: "#7a6448", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 4 }}>
        tocando em fade ·•·
      </p>
    </div>
  );
}

function PlayAudio({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "30px 0" }}>
      <button
        onClick={onToggle}
        style={{
          width: 86,
          height: 86,
          borderRadius: "50%",
          border: "1px solid rgba(233,198,154,0.4)",
          background: "rgba(233,198,154,0.06)",
          color: "#e9c69a",
          fontSize: 30,
          cursor: "pointer",
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            border: "1px solid rgba(233,198,154,0.25)",
            animation: playing ? "pulse 1.8s ease-out infinite" : "none",
          }}
        />
        {playing ? "❚❚" : "▶"}
      </button>
      <div style={{ display: "flex", gap: 3, height: 26, alignItems: "center", marginTop: 18 }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            style={{
              width: 3,
              borderRadius: 2,
              background: "#c8924f",
              height: playing ? `${20 + Math.sin(i) * 10}px` : 4,
              animation: playing ? `wave 1s ease-in-out ${i * 0.05}s infinite alternate` : "none",
              transition: "height .3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
//  CENAS
// ============================================================

function CenaEntrada({ onStart }: { onStart: () => void }) {
  return (
    <Centro>
      <div style={{ textAlign: "center" }}>
        {/* Brilho radial suave atrás do título */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(140,70,25,0.22) 0%, transparent 70%)",
        }} />

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "var(--font-cormorant),serif",
            fontStyle: "italic",
            color: "#9c8266",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            fontSize: 12,
            marginBottom: 24,
          }}
        >
          Araçá Grill apresenta
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "var(--font-cormorant),serif",
            fontSize: "clamp(52px,11vw,96px)",
            color: "#e9c69a",
            margin: "0 0 16px",
            fontWeight: 400,
            fontStyle: "italic",
            lineHeight: 1.1,
            textShadow: "0 0 60px rgba(233,198,154,0.25)",
          }}
        >
          Nossa História
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.6 }}
          style={{ color: "#9c8266", fontFamily: "var(--font-cormorant),serif", fontSize: 18, letterSpacing: "0.05em", marginBottom: 4 }}
        >
          Coloque o som no máximo.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 2.0 }}
          style={{ color: "#7a6448", fontFamily: "var(--font-cormorant),serif", fontStyle: "italic", fontSize: 17, marginBottom: 0 }}
        >
          Respire fundo.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 2.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Botao big onClick={onStart}>
            Tocar para começar
          </Botao>
        </motion.div>
      </div>
    </Centro>
  );
}

function CenaAbertura({ nome1, nome2, onNext }: { nome1: string; nome2: string; onNext: () => void }) {
  const [fase, setFase] = useState(0);
  useEffect(() => {
    const a = setTimeout(() => setFase(1), 4200);
    return () => clearTimeout(a);
  }, []);
  return (
    <Centro>
      {fase === 0 && (
        <TextoCarta linhas={["Há momentos que merecem", "ser vividos devagar.", "", "Este é um deles."]} />
      )}
      {fase === 1 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <NomeCaligrafia texto={nome1} delay={0.2} />
          <span
            style={{
              color: "#c8924f",
              fontSize: 40,
              fontFamily: "var(--font-cormorant),serif",
              opacity: 0,
              animation: "fillIn 1s ease 2.4s forwards",
            }}
          >
            &amp;
          </span>
          <NomeCaligrafia texto={nome2} delay={0.9} />
          <div style={{ opacity: 0, animation: "fillIn 1s ease 4.5s forwards" }}>
            <Botao onClick={onNext}>Começar a viver isso</Botao>
          </div>
        </div>
      )}
    </Centro>
  );
}

function CenaBloco({
  bloco,
  onNext,
  primeiro,
  onMusicaInicio,
  onMusicaFim,
  onVozToggle,
  vozTocando,
}: {
  bloco: BlocoView;
  onNext: () => void;
  primeiro: boolean;
  onMusicaInicio: (src: string | null) => void;
  onMusicaFim: () => void;
  onVozToggle: (src: string | null) => void;
  vozTocando: boolean;
}) {
  const [etapa, setEtapa] = useState<"transicao" | "musica" | "dedica" | "fotos" | "audio">(
    primeiro ? "musica" : "transicao"
  );
  const [fotoIdx, setFotoIdx] = useState(0);
  const fotos = bloco.fotos;

  // música começa na cena do vinil (logo após interação → navegador libera o áudio)
  // e silencia ao chegar na mensagem de voz
  useEffect(() => {
    if (etapa === "musica") onMusicaInicio(bloco.musica_src);
    if (etapa === "audio") onMusicaFim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa]);

  // avanço automático das fotos
  useEffect(() => {
    if (etapa !== "fotos") return;
    if (fotoIdx >= fotos.length) {
      setEtapa("audio");
      return;
    }
    const t = setTimeout(() => setFotoIdx((i) => i + 1), 4800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, fotoIdx]);

  if (etapa === "transicao") {
    return (
      <Centro>
        <TextoCarta
          linhas={[`Agora é a vez de ${bloco.nome}.`, "Tudo o que você vai ver", "foi escolhido pensando em você."]}
          onDone={() => setEtapa("musica")}
        />
      </Centro>
    );
  }

  if (etapa === "musica") {
    return (
      <Centro>
        <div style={{ textAlign: "center", animation: "softUp 1.2s ease forwards", opacity: 0 }}>
          <div
            style={{
              color: "#9c8266",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              fontSize: 12,
              fontFamily: "var(--font-cormorant),serif",
            }}
          >
            A música de {bloco.nome}
          </div>
          <MusicaVinil titulo={bloco.musica_titulo || "Uma canção especial"} />
          <Botao onClick={() => setEtapa("dedica")}>Continuar</Botao>
        </div>
      </Centro>
    );
  }

  if (etapa === "dedica") {
    return (
      <Centro>
        <TextoCarta
          linhas={[`${bloco.nome} pensou em você.`, "Escolheu cada foto,", "cada palavra, cada silêncio.", "", "Tudo isso é pra você."]}
          onDone={() => {
            setFotoIdx(0);
            setEtapa(fotos.length > 0 ? "fotos" : "audio");
          }}
        />
      </Centro>
    );
  }

  if (etapa === "fotos" && fotos.length > 0) {
    const f = fotos[Math.min(fotoIdx, fotos.length - 1)];
    return <FullFoto key={fotoIdx} foto={f} idx={Math.min(fotoIdx, fotos.length - 1)} total={fotos.length} />;
  }

  // áudio (voz)
  return (
    <Centro>
      <div style={{ textAlign: "center", maxWidth: 620 }}>
        {bloco.mensagem_final && (
          <p
            style={{
              fontFamily: "var(--font-cormorant),serif",
              fontStyle: "italic",
              fontSize: "clamp(20px,4.4vw,28px)",
              color: "#f0e3d2",
              lineHeight: 1.55,
              marginBottom: 26,
            }}
          >
            “{bloco.mensagem_final}”
          </p>
        )}
        {bloco.audio_src ? (
          <>
            <p
              style={{
                fontFamily: "var(--font-cormorant),serif",
                fontStyle: "italic",
                fontSize: "clamp(22px,4.5vw,30px)",
                color: "#f0e3d2",
              }}
            >
              {bloco.nome} gravou algo pra você ouvir.
            </p>
            <PlayAudio playing={vozTocando} onToggle={() => onVozToggle(bloco.audio_src)} />
          </>
        ) : (
          <p
            style={{
              fontFamily: "var(--font-cormorant),serif",
              fontStyle: "italic",
              fontSize: "clamp(20px,4.4vw,26px)",
              color: "#cdb89e",
            }}
          >
            Com todo o carinho de {bloco.nome}.
          </p>
        )}
        <div style={{ marginTop: 10 }}>
          <Botao onClick={onNext}>{primeiro ? "..." : "Ver o final"}</Botao>
        </div>
      </div>
    </Centro>
  );
}

function CenaFinal({ data }: { data: ExperienciaView }) {
  const todas = [...data.bloco_1.fotos, ...data.bloco_2.fotos];
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 28px",
        position: "relative",
        zIndex: 2,
      }}
    >
      {/* Mosaico de fotos animado */}
      {todas.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(todas.length, 4)}, 1fr)`,
            gap: 6,
            maxWidth: 440,
            width: "100%",
            marginBottom: 56,
          }}
        >
          {todas.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.15 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
              style={{
                aspectRatio: "1",
                borderRadius: 6,
                background: f.src ? `url("${f.src}") center/cover` : gradFallback(i),
                boxShadow: "inset 0 0 30px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.4)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* vignette por foto */}
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 40%, rgba(8,5,3,0.55) 100%)" }} />
            </motion.div>
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, delay: todas.length * 0.15 + 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: "center" }}
      >
        <p
          style={{
            fontFamily: "var(--font-cormorant),serif",
            fontStyle: "italic",
            fontSize: "clamp(22px,4.8vw,32px)",
            color: "#e9c69a",
            lineHeight: 1.6,
            marginBottom: 8,
          }}
        >
          Algumas histórias não precisam ser perfeitas.
        </p>
        <p
          style={{
            fontFamily: "var(--font-cormorant),serif",
            fontStyle: "italic",
            fontSize: "clamp(22px,4.8vw,32px)",
            color: "#f0e3d2",
            lineHeight: 1.6,
          }}
        >
          Elas só precisam ser <span style={{ color: "#e9c69a" }}>verdadeiras.</span>
        </p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: todas.length * 0.15 + 1.8 }}
          style={{ width: 60, height: 1, background: "rgba(200,146,79,0.5)", margin: "36px auto", transformOrigin: "center" }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: todas.length * 0.15 + 2.4 }}
          style={{ fontFamily: "var(--font-cormorant),serif", fontSize: 17, color: "#9c8266", lineHeight: 1.7 }}
        >
          É uma honra ter vocês aqui esta noite.<br />
          Que esse seja mais um momento<br />que vocês nunca esqueçam.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: todas.length * 0.15 + 3.8 }}
          style={{
            marginTop: 36,
            letterSpacing: "0.38em",
            textTransform: "uppercase",
            fontSize: 13,
            color: "#c8924f",
            fontFamily: "var(--font-cormorant),serif",
          }}
        >
          Araçá Grill
        </motion.p>
      </motion.div>
    </div>
  );
}

// ============================================================
//  ORQUESTRAÇÃO
// ============================================================

export default function Experiencia({ data }: { data: ExperienciaView }) {
  const [pronto, setPronto] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [cena, setCena] = useState<"entrada" | "abertura" | "b1" | "b2" | "final">("entrada");
  const musicaRef = useRef<HTMLAudioElement | null>(null);
  const vozRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [vozTocando, setVozTocando] = useState(false);
  const [mutado, setMutado] = useState(false);

  // Pré-carregar todas as imagens e áudios antes de mostrar a experiência
  useEffect(() => {
    const urls = [
      ...data.bloco_1.fotos.map((f) => f.src),
      ...data.bloco_2.fotos.map((f) => f.src),
      data.bloco_1.musica_src,
      data.bloco_2.musica_src,
      data.bloco_1.audio_src,
      data.bloco_2.audio_src,
    ];
    preloadUrls(urls, setProgresso);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const limparFade = () => {
    if (fadeTimer.current) {
      clearInterval(fadeTimer.current);
      fadeTimer.current = null;
    }
  };

  // Ramp de volume (fade in/out)
  const fade = useCallback((alvo: number, ms: number, aoFim?: () => void) => {
    const el = musicaRef.current;
    if (!el) return;
    limparFade();
    const inicio = el.volume;
    const passos = 30;
    const dt = ms / passos;
    let i = 0;
    fadeTimer.current = setInterval(() => {
      i++;
      const v = inicio + (alvo - inicio) * (i / passos);
      el.volume = Math.max(0, Math.min(1, v));
      if (i >= passos) {
        limparFade();
        aoFim?.();
      }
    }, dt);
  }, []);

  const tocarMusica = useCallback(
    (src: string | null) => {
      const el = musicaRef.current;
      if (!el || !src) return;
      // pausa a voz se estiver tocando
      if (vozRef.current) {
        vozRef.current.pause();
        setVozTocando(false);
      }
      if (el.src !== src) el.src = src;
      el.volume = 0;
      el.currentTime = 0;
      el.play().then(() => fade(0.55, 2500)).catch(() => {});
    },
    [fade]
  );

  const pararMusica = useCallback(() => {
    const el = musicaRef.current;
    if (!el) return;
    fade(0, 2200, () => {
      el.pause();
    });
  }, [fade]);

  const toggleMudo = useCallback(() => {
    setMutado((m) => {
      const novoMutado = !m;
      if (musicaRef.current) musicaRef.current.muted = novoMutado;
      return novoMutado;
    });
  }, []);

  // Destrava o áudio no gesto de entrada (iOS/Safari)
  // IMPORTANTE: o play() precisa ter um src válido para o iOS liberar o contexto de áudio.
  const desbloquearAudio = useCallback(() => {
    const musicaEl = musicaRef.current;
    if (musicaEl) {
      const primeiraSrc = data.bloco_1.musica_src || data.bloco_2.musica_src;
      if (primeiraSrc) musicaEl.src = primeiraSrc;
      musicaEl.muted = true;
      musicaEl.play()
        .then(() => { musicaEl.pause(); musicaEl.currentTime = 0; musicaEl.muted = false; })
        .catch(() => { musicaEl.muted = false; });
    }
    const vozEl = vozRef.current;
    if (vozEl) {
      vozEl.muted = true;
      vozEl.play()
        .then(() => { vozEl.pause(); vozEl.currentTime = 0; vozEl.muted = false; })
        .catch(() => { vozEl.muted = false; });
    }
  }, [data.bloco_1.musica_src, data.bloco_2.musica_src]);

  const alternarVoz = useCallback((src: string | null) => {
    const el = vozRef.current;
    if (!el || !src) return;
    if (el.src !== src) el.src = src;
    if (el.paused) {
      // abaixa a música para a voz aparecer
      if (musicaRef.current && !musicaRef.current.paused) {
        musicaRef.current.volume = 0.12;
      }
      el.play().then(() => setVozTocando(true)).catch(() => {});
    } else {
      el.pause();
      setVozTocando(false);
    }
  }, []);

  useEffect(() => {
    const el = vozRef.current;
    if (!el) return;
    const onEnded = () => setVozTocando(false);
    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  }, []);

  useEffect(() => () => limparFade(), []);

  const vars = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 1.1, ease: "easeInOut" as const } };

  return (
    <>
      {/* Tela de carregamento — fica por cima até estar tudo pronto */}
      {!pronto && <TelaCarregamento progresso={progresso} onPronto={() => setPronto(true)} />}

      <div style={{ background: "#080503", minHeight: "100dvh", color: "#fff", position: "relative", overflow: "hidden" }}>
        {/* Grão cinematográfico */}
        <div
          aria-hidden
          style={{
            position: "fixed", inset: 0, zIndex: 0, opacity: 0.04, pointerEvents: "none",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        <Petalas />

        {/* Áudio */}
        <audio ref={musicaRef} preload="auto" loop playsInline />
        <audio ref={vozRef} preload="auto" playsInline />

        {/* Cenas com crossfade cinematográfico */}
        <AnimatePresence mode="wait">
          {cena === "entrada" && (
            <motion.div key="entrada" {...vars}>
              <CenaEntrada onStart={() => { desbloquearAudio(); setCena("abertura"); }} />
            </motion.div>
          )}
          {cena === "abertura" && (
            <motion.div key="abertura" {...vars}>
              <CenaAbertura nome1={data.nome_1} nome2={data.nome_2} onNext={() => setCena("b1")} />
            </motion.div>
          )}
          {cena === "b1" && (
            <motion.div key="b1" {...vars}>
              <CenaBloco bloco={data.bloco_1} primeiro onNext={() => setCena("b2")}
                onMusicaInicio={tocarMusica} onMusicaFim={pararMusica}
                onVozToggle={alternarVoz} vozTocando={vozTocando} />
            </motion.div>
          )}
          {cena === "b2" && (
            <motion.div key="b2" {...vars}>
              <CenaBloco bloco={data.bloco_2} primeiro={false}
                onNext={() => { pararMusica(); setCena("final"); }}
                onMusicaInicio={tocarMusica} onMusicaFim={pararMusica}
                onVozToggle={alternarVoz} vozTocando={vozTocando} />
            </motion.div>
          )}
          {cena === "final" && (
            <motion.div key="final" {...vars}>
              <CenaFinal data={data} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão de mudo flutuante — aparece depois que a experiência começa */}
        {pronto && cena !== "entrada" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            onClick={toggleMudo}
            title={mutado ? "Ligar som" : "Silenciar"}
            style={{
              position: "fixed",
              bottom: 24,
              right: 20,
              zIndex: 100,
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "1px solid rgba(233,198,154,0.25)",
              background: "rgba(8,5,3,0.7)",
              backdropFilter: "blur(12px)",
              color: mutado ? "#7a6448" : "#e9c69a",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.3s, border-color 0.3s",
            }}
          >
            {mutado ? "🔇" : "🔊"}
          </motion.button>
        )}
      </div>
    </>
  );
}
