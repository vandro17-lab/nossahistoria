"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX, Play, Pause, ChevronRight } from "lucide-react";
import type { ExperienciaView, BlocoView, FotoView } from "@/lib/types";
import TelaCarregamento from "./TelaCarregamento";

// ============================================================
//  DOWNLOAD — tipos e gerador de HTML offline
// ============================================================

type DownloadEstado = "idle" | "baixando" | "pronto" | "erro";

function gerarHtmlExperiencia(
  data: ExperienciaView,
  b1fotos: { mensagem: string; b64: string }[],
  b2fotos: { mensagem: string; b64: string }[],
  audio1: string | null,
  audio2: string | null
): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const blocos = [
    { nome: data.bloco_1.nome, musica: data.bloco_1.musica_titulo, msg: data.bloco_1.mensagem_final, fotos: b1fotos, audio: audio1 },
    { nome: data.bloco_2.nome, musica: data.bloco_2.musica_titulo, msg: data.bloco_2.mensagem_final, fotos: b2fotos, audio: audio2 },
  ];

  const secoes = blocos
    .map(
      (bl) => `<section class="bloco">
  <div class="bloco-header">
    <span class="nome">${esc(bl.nome)}</span>
    ${bl.musica ? `<span class="musica">&#9834; ${esc(bl.musica)}</span>` : ""}
  </div>
  ${bl.msg ? `<blockquote class="mensagem">&ldquo;${esc(bl.msg)}&rdquo;</blockquote>` : ""}
  ${bl.audio ? `<div class="audio-bloco"><p class="audio-label">${esc(bl.nome)} tem algo pra te dizer</p><audio controls src="${bl.audio}"></audio></div>` : ""}
  <div class="fotos-grid">${bl.fotos
    .filter((f) => f.b64)
    .map(
      (f) =>
        `<figure class="foto"><img src="${f.b64}" alt="" loading="lazy" />${f.mensagem ? `<figcaption>${esc(f.mensagem)}</figcaption>` : ""}</figure>`
    )
    .join("")}</div>
</section>`
    )
    .join('\n<div class="divisor"></div>\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Nossa Historia &mdash; ${esc(data.nome_1)} &amp; ${esc(data.nome_2)}</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#080503;color:#f0e3d2;font-family:Georgia,"Times New Roman",serif;padding:0 0 80px}
    .header{text-align:center;padding:80px 24px 48px;border-bottom:1px solid rgba(233,198,154,.1)}
    .header .selo{letter-spacing:.32em;text-transform:uppercase;font-size:11px;color:#5a4430;margin-bottom:20px}
    .header h1{font-size:clamp(30px,7vw,64px);color:#e9c69a;font-weight:400;font-style:italic;line-height:1.15}
    .header .amp{color:#c8924f;margin:0 10px}
    .bloco{max-width:680px;margin:56px auto 0;padding:0 24px}
    .bloco-header{text-align:center;margin-bottom:28px}
    .bloco-header .nome{display:block;font-size:clamp(24px,4.5vw,34px);color:#e9c69a;font-style:italic;margin-bottom:8px}
    .bloco-header .musica{font-size:13px;color:#5a4430;letter-spacing:.05em}
    blockquote.mensagem{font-size:clamp(17px,3.5vw,22px);font-style:italic;color:#cdb89e;line-height:1.65;text-align:center;border:none;margin:0 0 28px;padding:0 12px}
    .audio-bloco{text-align:center;margin-bottom:28px}
    .audio-label{font-style:italic;font-size:14px;color:#7a6448;margin-bottom:10px}
    audio{width:100%;max-width:320px}
    .fotos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}
    figure.foto{margin:0}
    figure.foto img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block}
    figcaption{font-style:italic;font-size:12px;color:#7a6448;margin-top:6px;line-height:1.5;padding:0 4px}
    .divisor{width:48px;height:1px;background:rgba(200,146,79,.3);margin:56px auto}
    .footer{text-align:center;padding:48px 24px}
    .footer p{font-style:italic;font-size:15px;color:#5a4430;line-height:1.7}
    .footer .seal{margin-top:28px;letter-spacing:.36em;text-transform:uppercase;font-size:12px;color:#c8924f;font-style:normal}
  </style>
</head>
<body>
  <header class="header">
    <p class="selo">Araca Grill</p>
    <h1>${esc(data.nome_1)} <span class="amp">&amp;</span> ${esc(data.nome_2)}</h1>
  </header>
  ${secoes}
  <div class="divisor"></div>
  <footer class="footer">
    <p>Algumas historias nao precisam ser perfeitas.<br />Elas so precisam ser verdadeiras.</p>
    <p class="seal">Araca Grill</p>
  </footer>
</body>
</html>`;
}

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

function TextoCarta({ linhas, onDone }: { linhas: string[]; onDone?: () => void }) {
  type Item = { kind: "br" } | { kind: "linha"; texto: string; delay: number };

  const itens: Item[] = [];
  let t = 0;
  for (const l of linhas) {
    if (l.trim() === "") {
      itens.push({ kind: "br" });
      t += 0.38;
    } else {
      itens.push({ kind: "linha", texto: l, delay: t });
      t += 0.64;
    }
  }

  const textos = itens.filter(
    (it): it is { kind: "linha"; texto: string; delay: number } => it.kind === "linha"
  );
  const lastDelay = textos.length ? textos[textos.length - 1].delay : 0;
  const totalMs = Math.round((lastDelay + 1.15 + 0.9) * 1000);

  useEffect(() => {
    if (!onDone) return;
    const timer = setTimeout(onDone, totalMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto" }}>
      {itens.map((it, i) => {
        if (it.kind === "br") return <div key={i} style={{ height: "0.7em" }} />;
        return (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 16, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.15, delay: it.delay, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "var(--font-cormorant),serif",
              fontSize: "clamp(22px,4.6vw,34px)",
              lineHeight: 1.6,
              color: "#f0e3d2",
              margin: 0,
              fontWeight: 400,
            }}
          >
            {it.texto}
          </motion.p>
        );
      })}
    </div>
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
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      style={{
        marginTop: 38,
        padding: big ? "17px 52px" : "13px 38px",
        fontFamily: "var(--font-cormorant),serif",
        fontSize: big ? 21 : 17,
        fontStyle: "italic",
        letterSpacing: "0.06em",
        color: "#1a0f08",
        background: "linear-gradient(135deg, #edd9a3 0%, #d4a055 50%, #c8924f 100%)",
        border: "none",
        borderRadius: 999,
        cursor: "pointer",
        boxShadow: "0 6px 28px rgba(200,146,79,0.38), inset 0 1px 0 rgba(255,255,255,0.18)",
        position: "relative",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {/* shimmer interno */}
      <motion.span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPositionX: ["200%", "-200%"] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
      />
      <span style={{ position: "relative" }}>{children}</span>
    </motion.button>
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
  const fundo = foto.src ? `url("${foto.src}")` : gradFallback(idx);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
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
      {/* Foto com Ken Burns */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: fundo,
          backgroundSize: "cover",
          backgroundPosition: "center",
          animation: "kenburns 7s ease forwards",
          transformOrigin: "55% 45%",
          willChange: "transform",
        }}
      />

      {/* Vinheta cinematográfica nas 4 bordas */}
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 30%, rgba(8,5,3,0.55) 100%)",
        pointerEvents: "none",
      }} />
      {/* Gradiente inferior mais suave */}
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(8,5,3,0.92) 0%, rgba(8,5,3,0.3) 38%, transparent 62%)",
        pointerEvents: "none",
      }} />
      {/* Topo escuro sutil */}
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(8,5,3,0.45) 0%, transparent 22%)",
        pointerEvents: "none",
      }} />

      {/* Legenda e indicador */}
      <div style={{ position: "relative", padding: "0 32px 80px", maxWidth: 600, textAlign: "center", width: "100%" }}>
        {foto.mensagem && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "var(--font-cormorant),serif",
              fontStyle: "italic",
              fontSize: "clamp(19px,4.2vw,26px)",
              color: "rgba(244,234,217,0.92)",
              lineHeight: 1.6,
              textShadow: "0 2px 16px rgba(0,0,0,0.5)",
              letterSpacing: "0.01em",
            }}
          >
            {foto.mensagem}
          </motion.p>
        )}
        {/* Indicador de fotos — pontos minimalistas */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 20 }}>
          {Array.from({ length: total }).map((_, i) => (
            <motion.span
              key={i}
              animate={{ width: i === idx ? 20 : 5, opacity: i === idx ? 1 : 0.35 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                height: 2,
                borderRadius: 2,
                background: "#e9c69a",
                display: "block",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MusicaVinil({ titulo }: { titulo: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "32px 0" }}>
      {/* halo dourado suave atrás do disco */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div aria-hidden style={{
          position: "absolute",
          width: 200, height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,146,79,0.12) 0%, transparent 70%)",
          animation: "pulse 3s ease-in-out infinite",
        }} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          style={{
            width: 148,
            height: 148,
            borderRadius: "50%",
            background: "repeating-radial-gradient(#1e1408 0 1.5px, #0d0804 1.5px 3.5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 12px 48px rgba(0,0,0,0.75), 0 0 0 1px rgba(233,198,154,0.08)",
          }}
        >
          {/* centro do disco */}
          <div style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "conic-gradient(from 0deg, #e9c69a, #c8924f, #a06830, #e9c69a)",
            boxShadow: "inset 0 0 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(233,198,154,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0d0804" }} />
          </div>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.4 }}
        style={{
          marginTop: 24,
          fontFamily: "var(--font-cormorant),serif",
          fontStyle: "italic",
          fontSize: "clamp(20px,4.5vw,26px)",
          color: "#f0e3d2",
          letterSpacing: "0.01em",
          textAlign: "center",
          maxWidth: 300,
          lineHeight: 1.4,
        }}
      >
        {titulo}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.8 }}
        style={{ fontSize: 11, color: "#5a4430", letterSpacing: "0.28em", textTransform: "uppercase", marginTop: 8 }}
      >
        tocando agora ·•·
      </motion.p>
    </div>
  );
}

function PlayAudio({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "28px 0" }}>
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.93 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          border: "1px solid rgba(233,198,154,0.3)",
          background: "radial-gradient(circle at 40% 35%, rgba(233,198,154,0.1) 0%, rgba(8,5,3,0.6) 100%)",
          color: "#e9c69a",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 0 1px rgba(233,198,154,0.08), 0 8px 32px rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* anel pulsante quando tocando */}
        {playing && (
          <motion.span
            aria-hidden
            style={{
              position: "absolute",
              inset: -8,
              borderRadius: "50%",
              border: "1px solid rgba(233,198,154,0.2)",
            }}
            animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <AnimatePresence mode="wait">
          {playing
            ? <motion.span key="pause" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.2 }}><Pause size={22} strokeWidth={1.5} /></motion.span>
            : <motion.span key="play" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.2 }}><Play size={22} strokeWidth={1.5} /></motion.span>
          }
        </AnimatePresence>
      </motion.button>

      {/* barras de equalizador */}
      <div style={{ display: "flex", gap: 3, height: 22, alignItems: "center", marginTop: 16 }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.span
            key={i}
            style={{ width: 2.5, borderRadius: 2, background: "rgba(200,146,79,0.6)", display: "block" }}
            animate={playing
              ? { height: [4, 14 + Math.abs(Math.sin(i * 0.7)) * 8, 4] }
              : { height: 3 }}
            transition={playing
              ? { duration: 0.9 + (i % 3) * 0.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.04 }
              : { duration: 0.4 }}
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
        <TextoCarta linhas={["Talvez vocês não lembrem de todas as datas.", "Mas vão lembrar desse sentimento.", "", "Por muito tempo."]} />
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
          linhas={[`Agora é a vez de ${bloco.nome}.`, "Tudo o que você vai ver", "foi escolhido por quem mais te conhece."]}
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
            A música que {bloco.nome} escolheu pra você
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
          linhas={[`${bloco.nome} pensou em você.`, "Escolheu cada foto,", "cada palavra, cada silêncio.", "", "Tudo. Só pra você."]}
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
  const temMensagem = !!bloco.mensagem_final;
  return (
    <Centro>
      <div style={{ textAlign: "center", maxWidth: 620 }}>
        {bloco.mensagem_final && (
          <motion.p
            initial={{ opacity: 0, y: 14, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "var(--font-cormorant),serif",
              fontStyle: "italic",
              fontSize: "clamp(20px,4.4vw,28px)",
              color: "#f0e3d2",
              lineHeight: 1.58,
              marginBottom: 28,
            }}
          >
            &ldquo;{bloco.mensagem_final}&rdquo;
          </motion.p>
        )}
        {bloco.audio_src ? (
          <>
            <motion.p
              initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.1, delay: temMensagem ? 0.72 : 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: "var(--font-cormorant),serif",
                fontStyle: "italic",
                fontSize: "clamp(22px,4.5vw,30px)",
                color: "#f0e3d2",
              }}
            >
              {bloco.nome} tem algo pra te dizer.
            </motion.p>
            <PlayAudio playing={vozTocando} onToggle={() => onVozToggle(bloco.audio_src)} />
          </>
        ) : (
          <motion.p
            initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.1, delay: temMensagem ? 0.72 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "var(--font-cormorant),serif",
              fontStyle: "italic",
              fontSize: "clamp(20px,4.4vw,26px)",
              color: "#cdb89e",
            }}
          >
            Com amor, {bloco.nome}.
          </motion.p>
        )}
        <div style={{ marginTop: 10 }}>
          <Botao onClick={onNext}>{primeiro ? "Tem mais..." : "Ver o final"}</Botao>
        </div>
      </div>
    </Centro>
  );
}

function DownloadButton({ label, estado, onClick }: { label: string; estado: DownloadEstado; onClick: () => void }) {
  const busy = estado === "baixando";
  const done = estado === "pronto";
  return (
    <motion.button
      onClick={busy || done ? undefined : onClick}
      whileHover={busy || done ? {} : { scale: 1.04 }}
      whileTap={busy || done ? {} : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      style={{
        padding: "10px 24px", borderRadius: 999,
        border: `1px solid ${done ? "rgba(123,191,138,0.45)" : "rgba(233,198,154,0.3)"}`,
        background: done ? "rgba(123,191,138,0.08)" : "transparent",
        color: done ? "#7bbf8a" : estado === "erro" ? "#e07a6a" : "#e9c69a",
        fontFamily: "var(--font-cormorant),serif", fontStyle: "italic", fontSize: 16,
        cursor: busy || done ? "default" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
      }}
    >
      {busy ? "Preparando…" : done ? "✓ Salvo" : estado === "erro" ? "Tentar de novo" : label}
    </motion.button>
  );
}

function ModalDownload({
  data, onFechar, onBaixarZip, onBaixarHtml, estadoZip, estadoHtml,
}: {
  data: ExperienciaView; onFechar: () => void;
  onBaixarZip: () => void; onBaixarHtml: () => void;
  estadoZip: DownloadEstado; estadoHtml: DownloadEstado;
}) {
  const fotosN = data.bloco_1.fotos.length + data.bloco_2.fotos.length;
  const audiosN = [data.bloco_1.audio_src, data.bloco_2.audio_src].filter(Boolean).length;
  const mbEstimado = Math.round(fotosN * 1.5 + audiosN * 2);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(4,2,1,0.9)", backdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: "rgba(14,8,2,0.98)",
          border: "1px solid rgba(233,198,154,0.15)",
          borderRadius: 24, padding: "36px 28px",
          maxWidth: 480, width: "100%",
          maxHeight: "90dvh", overflowY: "auto",
          position: "relative",
        }}
      >
        <button onClick={onFechar} style={{
          position: "absolute", top: 16, right: 20,
          background: "none", border: "none", color: "#4a3828",
          fontSize: 24, cursor: "pointer", lineHeight: 1,
        }}>×</button>

        <p style={{ fontFamily: "var(--font-cormorant),serif", fontStyle: "italic", fontSize: 26, color: "#e9c69a", marginBottom: 6, textAlign: "center" }}>
          Guardar esta história
        </p>
        <p style={{ textAlign: "center", color: "#5a4430", fontSize: 13, fontFamily: "var(--font-cormorant),serif", fontStyle: "italic", marginBottom: 28 }}>
          {fotosN} foto{fotosN !== 1 ? "s" : ""} · {audiosN} áudio{audiosN !== 1 ? "s" : ""} · ~{mbEstimado} MB
        </p>

        <div style={{ height: 1, background: "rgba(233,198,154,0.1)", marginBottom: 22 }} />

        {/* ZIP */}
        <div style={{ border: "1px solid rgba(233,198,154,0.12)", borderRadius: 16, padding: "20px 22px", marginBottom: 14, background: "rgba(255,255,255,0.015)" }}>
          <p style={{ fontFamily: "var(--font-cormorant),serif", fontSize: 19, color: "#e9c69a", margin: "0 0 8px" }}>
            Só os arquivos (ZIP)
          </p>
          <p style={{ fontSize: 14, color: "#7a6448", lineHeight: 1.65, margin: "0 0 16px", fontFamily: "var(--font-cormorant),serif", fontStyle: "italic" }}>
            Todas as fotos e mensagens de voz num único arquivo compactado.
            Abre em qualquer celular ou computador, sem precisar de internet.
          </p>
          <DownloadButton label="Baixar ZIP" estado={estadoZip} onClick={onBaixarZip} />
        </div>

        {/* HTML */}
        <div style={{ border: "1px solid rgba(233,198,154,0.12)", borderRadius: 16, padding: "20px 22px", marginBottom: 28, background: "rgba(255,255,255,0.015)" }}>
          <p style={{ fontFamily: "var(--font-cormorant),serif", fontSize: 19, color: "#e9c69a", margin: "0 0 8px" }}>
            A experiência completa (HTML)
          </p>
          <p style={{ fontSize: 14, color: "#7a6448", lineHeight: 1.65, margin: "0 0 8px", fontFamily: "var(--font-cormorant),serif", fontStyle: "italic" }}>
            Um único arquivo que abre no navegador com todas as fotos, textos e áudios embutidos —
            sem precisar de internet. Funciona para sempre, guardado num lugar seguro.
          </p>
          <p style={{ fontSize: 12.5, color: "#3d2c1e", lineHeight: 1.6, margin: "0 0 16px", fontFamily: "var(--font-cormorant),serif", fontStyle: "italic" }}>
            As animações não estarão presentes nesta versão — uma limitação do formato HTML.
            Já estamos desenvolvendo algo ainda mais bonito para a próxima vez.
            Mas tudo o que importa já está aqui, guardado com cuidado.
          </p>
          <DownloadButton label="Baixar HTML" estado={estadoHtml} onClick={onBaixarHtml} />
        </div>

        <div style={{ height: 1, background: "rgba(233,198,154,0.07)", marginBottom: 20 }} />

        <p style={{ fontFamily: "var(--font-cormorant),serif", fontStyle: "italic", fontSize: 14, color: "#3d2c1e", textAlign: "center", lineHeight: 1.75 }}>
          Memórias merecem um lugar seguro.<br />
          Guarde onde só vocês tenham acesso.
        </p>
      </motion.div>
    </motion.div>
  );
}

function CenaFinal({ data, onReiniciar }: { data: ExperienciaView; onReiniciar: () => void }) {
  const todas = [...data.bloco_1.fotos, ...data.bloco_2.fotos];
  const [showDownload, setShowDownload] = useState(false);
  const [estadoZip, setEstadoZip] = useState<DownloadEstado>("idle");
  const [estadoHtml, setEstadoHtml] = useState<DownloadEstado>("idle");

  async function baixarZip() {
    setEstadoZip("baixando");
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const todasFotos = [...data.bloco_1.fotos, ...data.bloco_2.fotos];
      for (let i = 0; i < todasFotos.length; i++) {
        const f = todasFotos[i];
        if (!f.src) continue;
        const blob = await fetch(f.src).then((r) => r.blob());
        const ext = blob.type.includes("png") ? "png" : "jpg";
        zip.file(`fotos/foto_${String(i + 1).padStart(2, "0")}.${ext}`, blob);
      }
      for (const { src, nome } of [
        { src: data.bloco_1.audio_src, nome: data.bloco_1.nome },
        { src: data.bloco_2.audio_src, nome: data.bloco_2.nome },
      ]) {
        if (!src) continue;
        const blob = await fetch(src).then((r) => r.blob());
        zip.file(`audios/voz_${nome}.webm`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = "nossa-historia.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      setEstadoZip("pronto");
    } catch {
      setEstadoZip("erro");
    }
  }

  async function baixarHtml() {
    setEstadoHtml("baixando");
    try {
      const toBase64 = (url: string) =>
        fetch(url)
          .then((r) => r.blob())
          .then(
            (blob) =>
              new Promise<string>((res) => {
                const rd = new FileReader();
                rd.onload = () => res(rd.result as string);
                rd.readAsDataURL(blob);
              })
          );

      const b1fotos = await Promise.all(
        data.bloco_1.fotos.map(async (f) => ({ mensagem: f.mensagem ?? "", b64: f.src ? await toBase64(f.src) : "" }))
      );
      const b2fotos = await Promise.all(
        data.bloco_2.fotos.map(async (f) => ({ mensagem: f.mensagem ?? "", b64: f.src ? await toBase64(f.src) : "" }))
      );
      const audio1 = data.bloco_1.audio_src ? await toBase64(data.bloco_1.audio_src) : null;
      const audio2 = data.bloco_2.audio_src ? await toBase64(data.bloco_2.audio_src) : null;

      const html = gerarHtmlExperiencia(data, b1fotos, b2fotos, audio1, audio2);
      const blob = new Blob([html], { type: "text/html; charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "nossa-historia.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      setEstadoHtml("pronto");
    } catch {
      setEstadoHtml("erro");
    }
  }

  return (
    <>
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
          Que alegria ter vocês aqui esta noite.<br />
          Que essa noite fique guardada<br />para sempre.
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

        {/* Botões finais */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: todas.length * 0.15 + 5 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 44 }}
        >
          <Botao onClick={onReiniciar}>
            Ver novamente desde o início
          </Botao>
          <motion.button
            onClick={() => setShowDownload(true)}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            style={{
              padding: "11px 32px",
              fontFamily: "var(--font-cormorant),serif",
              fontSize: 16, fontStyle: "italic", letterSpacing: "0.05em",
              color: "#9c8266",
              background: "transparent",
              border: "1px solid rgba(233,198,154,0.18)",
              borderRadius: 999, cursor: "pointer",
              marginTop: 0,
            }}
          >
            Guardar esta história
          </motion.button>
        </motion.div>
      </motion.div>
    </div>

    <AnimatePresence>
      {showDownload && (
        <ModalDownload
          data={data}
          onFechar={() => setShowDownload(false)}
          onBaixarZip={baixarZip}
          onBaixarHtml={baixarHtml}
          estadoZip={estadoZip}
          estadoHtml={estadoHtml}
        />
      )}
    </AnimatePresence>
    </>
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

  const reiniciar = useCallback(() => {
    pararMusica();
    if (vozRef.current) { vozRef.current.pause(); vozRef.current.currentTime = 0; }
    setVozTocando(false);
    setCena("entrada");
  }, [pararMusica]);

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
              <CenaFinal data={data} onReiniciar={reiniciar} />
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
              bottom: 28,
              right: 22,
              zIndex: 100,
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: `1px solid ${mutado ? "rgba(233,198,154,0.1)" : "rgba(233,198,154,0.22)"}`,
              background: "rgba(8,5,3,0.72)",
              backdropFilter: "blur(16px)",
              color: mutado ? "#4a3828" : "#c8924f",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.35s, border-color 0.35s",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            <AnimatePresence mode="wait">
              {mutado
                ? <motion.span key="mute" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.2 }}><VolumeX size={16} strokeWidth={1.5} /></motion.span>
                : <motion.span key="on" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.2 }}><Volume2 size={16} strokeWidth={1.5} /></motion.span>
              }
            </AnimatePresence>
          </motion.button>
        )}
      </div>
    </>
  );
}
