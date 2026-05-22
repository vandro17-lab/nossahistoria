"use client";

import { useEffect, useRef, useState } from "react";

const FRASES = [
  "Estamos preparando a história de vocês…",
  "Cada detalhe sendo ajustado com cuidado.",
  "Um momento que vocês nunca vão esquecer.",
  "Quase pronto. Vale a espera.",
];

export default function TelaCarregamento({
  progresso,
  onPronto,
}: {
  progresso: number;
  onPronto: () => void;
}) {
  const [saindo, setSaindo] = useState(false);
  const [fraseIdx, setFraseIdx] = useState(0);
  const [fraseVisivel, setFraseVisivel] = useState(true);
  const chamouPronto = useRef(false);

  // Rotação suave das frases
  useEffect(() => {
    const t = setInterval(() => {
      setFraseVisivel(false);
      setTimeout(() => {
        setFraseIdx((i) => (i + 1) % FRASES.length);
        setFraseVisivel(true);
      }, 500);
    }, 3800);
    return () => clearInterval(t);
  }, []);

  // Quando progresso bate 100%, fade out e avisa o pai
  useEffect(() => {
    if (progresso < 100 || chamouPronto.current) return;
    chamouPronto.current = true;
    const t1 = setTimeout(() => setSaindo(true), 300);
    const t2 = setTimeout(onPronto, 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [progresso, onPronto]);

  // Partículas flutuantes (mesmo estilo da experiência)
  const petalas = useRef(
    Array.from({ length: 10 }).map((_, i) => ({
      left: 5 + Math.random() * 90,
      delay: Math.random() * 14,
      dur: 12 + Math.random() * 8,
      size: 6 + Math.random() * 10,
      sway: 18 + Math.random() * 30,
      op: 0.08 + Math.random() * 0.18,
    }))
  ).current;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#080503",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        zIndex: 9999,
        opacity: saindo ? 0 : 1,
        transition: "opacity 1.2s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}
    >
      {/* Partículas */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {petalas.map((p, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: "-5%",
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 1.3,
              background: "linear-gradient(160deg,#c97b4a,#7a2418)",
              borderRadius: "50% 0 50% 50%",
              opacity: p.op,
              filter: "blur(0.5px)",
              animation: `fall ${p.dur}s linear ${p.delay}s infinite, sway ${p.dur / 2}s ease-in-out ${p.delay}s infinite alternate`,
              ["--sway" as any]: `${p.sway}px`,
            }}
          />
        ))}
      </div>

      {/* Brilho radial suave no centro */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 60% 50% at 50% 55%, rgba(120,60,20,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Conteúdo centralizado */}
      <div style={{ textAlign: "center", zIndex: 1, padding: "0 32px", maxWidth: 480 }}>
        {/* Selo */}
        <p
          style={{
            letterSpacing: "0.38em",
            fontSize: 11,
            color: "#9c8266",
            textTransform: "uppercase",
            fontFamily: "var(--font-cormorant),serif",
            marginBottom: 48,
            opacity: 0,
            animation: "softUp 1.2s ease 0.2s forwards",
          }}
        >
          A R A Ç Á &nbsp; G R I L L
        </p>

        {/* Frase rotativa */}
        <p
          style={{
            fontFamily: "var(--font-cormorant),serif",
            fontStyle: "italic",
            fontSize: "clamp(20px,4vw,28px)",
            color: "#f0e3d2",
            lineHeight: 1.65,
            minHeight: 80,
            opacity: fraseVisivel ? 1 : 0,
            transform: fraseVisivel ? "translateY(0)" : "translateY(6px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          {FRASES[fraseIdx]}
        </p>

        {/* Barra de progresso dourada */}
        <div
          style={{
            width: 260,
            height: 1,
            background: "rgba(233,198,154,0.12)",
            margin: "52px auto 0",
            position: "relative",
            borderRadius: 1,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${progresso}%`,
              background: "linear-gradient(90deg, rgba(200,146,79,0.6), #e9c69a)",
              borderRadius: 1,
              transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: "0 0 14px rgba(233,198,154,0.4)",
            }}
          />
          {/* Ponto brilhante na ponta */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${progresso}%`,
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#e9c69a",
              transform: "translate(-50%,-50%)",
              boxShadow: "0 0 8px #e9c69a",
              transition: "left 0.5s cubic-bezier(0.4,0,0.2,1)",
              opacity: progresso > 2 && progresso < 99 ? 1 : 0,
            }}
          />
        </div>

        {/* Percentual discreto */}
        <p
          style={{
            marginTop: 14,
            fontSize: 11,
            letterSpacing: "0.25em",
            color: "rgba(156,130,102,0.5)",
            fontFamily: "var(--font-cormorant),serif",
          }}
        >
          {Math.round(progresso)}%
        </p>
      </div>
    </div>
  );
}
