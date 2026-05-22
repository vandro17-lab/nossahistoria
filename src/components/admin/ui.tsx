"use client";

import React, { useEffect } from "react";

export const cor = {
  fundo: "#0e0a06",
  cartao: "#171008",
  cartao2: "#1f1408",
  borda: "rgba(233,198,154,0.16)",
  ouro: "#e9c69a",
  ouroForte: "#c8924f",
  texto: "#f0e3d2",
  suave: "#cdb89e",
  fraco: "#9c8266",
  ok: "#7bbf8a",
  alerta: "#e0a458",
  perigo: "#e07a6a",
};

export function BotaoOuro({
  children,
  onClick,
  disabled,
  tipo = "button",
  cheio,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tipo?: "button" | "submit";
  cheio?: boolean;
}) {
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: cheio ? "100%" : undefined,
        padding: "14px 22px",
        fontSize: 16,
        fontWeight: 600,
        color: disabled ? "#7a6448" : "#1a0f08",
        background: disabled
          ? "rgba(233,198,154,0.18)"
          : "linear-gradient(135deg,#e9c69a,#c8924f)",
        border: "none",
        borderRadius: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        minHeight: 50,
      }}
    >
      {children}
    </button>
  );
}

export function BotaoLinha({
  children,
  onClick,
  perigo,
  ativo,
  cheio,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  perigo?: boolean;
  ativo?: boolean;
  cheio?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: cheio ? "100%" : undefined,
        padding: "11px 16px",
        fontSize: 15,
        fontWeight: 500,
        color: perigo ? cor.perigo : ativo ? "#1a0f08" : cor.ouro,
        background: ativo ? "linear-gradient(135deg,#e9c69a,#c8924f)" : "transparent",
        border: `1px solid ${perigo ? "rgba(224,122,106,0.5)" : cor.borda}`,
        borderRadius: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        minHeight: 44,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function Campo({
  label,
  valor,
  onChange,
  placeholder,
  tipo = "text",
  multiline,
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tipo?: string;
  multiline?: boolean;
}) {
  const estilo: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    fontSize: 16,
    color: cor.texto,
    background: cor.fundo,
    border: `1px solid ${cor.borda}`,
    borderRadius: 12,
    outline: "none",
    fontFamily: "inherit",
  };
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 13, color: cor.fraco, marginBottom: 6, letterSpacing: "0.02em" }}>
        {label}
      </span>
      {multiline ? (
        <textarea
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...estilo, resize: "vertical" }}
        />
      ) : (
        <input type={tipo} value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={estilo} />
      )}
    </label>
  );
}

export function Selo({ tipo, children }: { tipo: "ok" | "alerta" | "info" | "aprovado"; children: React.ReactNode }) {
  const mapa = {
    ok: { c: cor.ok, b: "rgba(123,191,138,0.15)" },
    alerta: { c: cor.alerta, b: "rgba(224,164,88,0.15)" },
    info: { c: cor.suave, b: "rgba(205,184,158,0.12)" },
    aprovado: { c: "#1a0f08", b: cor.ouro },
  }[tipo];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 12.5,
        fontWeight: 600,
        color: mapa.c,
        background: mapa.b,
        padding: "4px 10px",
        borderRadius: 999,
      }}
    >
      {children}
    </span>
  );
}

export function Cartao({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: cor.cartao,
        border: `1px solid ${cor.borda}`,
        borderRadius: 18,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        zIndex: 100,
        background: cor.cartao2,
        border: `1px solid ${cor.borda}`,
        color: cor.texto,
        padding: "12px 20px",
        borderRadius: 14,
        fontSize: 15,
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        maxWidth: "90vw",
        textAlign: "center",
      }}
    >
      {msg}
    </div>
  );
}

export function Salvando({ estado }: { estado: "salvando" | "salvo" | null }) {
  if (!estado) return null;
  return (
    <span style={{ fontSize: 13, color: estado === "salvo" ? cor.ok : cor.fraco, marginLeft: 8 }}>
      {estado === "salvando" ? "salvando…" : "salvo ✓"}
    </span>
  );
}

export function Modal({
  titulo,
  children,
  onFechar,
}: {
  titulo: string;
  children: React.ReactNode;
  onFechar: () => void;
}) {
  return (
    <div
      onClick={onFechar}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="admin-scroll"
        style={{
          background: cor.cartao,
          border: `1px solid ${cor.borda}`,
          borderRadius: 20,
          padding: 22,
          width: "100%",
          maxWidth: 480,
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <h3 style={{ margin: "0 0 14px", color: cor.ouro, fontSize: 20, fontWeight: 600 }}>{titulo}</h3>
        {children}
      </div>
    </div>
  );
}
