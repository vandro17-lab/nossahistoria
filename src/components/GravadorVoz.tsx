"use client";

import { useRef, useState } from "react";

// Gravação de voz com MediaRecorder + upload SEMPRE visível (fallback iOS/Safari).
// Entrega um Blob via onArquivo. O pai decide para onde enviar.

export default function GravadorVoz({
  onArquivo,
  enviando,
  corOuro = "#e9c69a",
  corFraco = "#9c8266",
  corBorda = "rgba(233,198,154,0.25)",
}: {
  onArquivo: (blob: Blob) => void;
  enviando?: boolean;
  corOuro?: string;
  corFraco?: string;
  corBorda?: string;
}) {
  const [gravando, setGravando] = useState(false);
  const [previa, setPrevia] = useState<string | null>(null);
  const [suportado] = useState(
    typeof window !== "undefined" && typeof (window as any).MediaRecorder !== "undefined"
  );
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function iniciar() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        setPrevia(URL.createObjectURL(blob));
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

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {suportado && (
        <button
          onClick={gravando ? parar : iniciar}
          disabled={enviando}
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            border: `2px solid ${corBorda}`,
            background: gravando ? "rgba(224,122,106,0.18)" : "rgba(233,198,154,0.06)",
            color: gravando ? "#e07a6a" : corOuro,
            fontSize: 34,
            cursor: enviando ? "not-allowed" : "pointer",
          }}
        >
          {gravando ? "■" : "●"}
        </button>
      )}
      <div style={{ fontSize: 13, color: corFraco }}>
        {gravando ? "Gravando… toque para parar" : suportado ? "Toque para gravar agora" : "Gravação indisponível neste aparelho"}
      </div>

      {previa && (
        <audio src={previa} controls style={{ width: "100%", maxWidth: 320 }} />
      )}

      <label
        style={{
          fontSize: 14,
          color: corOuro,
          border: `1px solid ${corBorda}`,
          borderRadius: 999,
          padding: "10px 18px",
          cursor: "pointer",
        }}
      >
        Enviar um áudio do aparelho
        <input type="file" accept="audio/*" onChange={aoEscolher} style={{ display: "none" }} disabled={enviando} />
      </label>
    </div>
  );
}
