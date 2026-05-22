"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { BotaoLinha, cor } from "./ui";
import type { Casal } from "@/lib/types";

export default function QRCartao({ casal }: { casal: Casal }) {
  const cardRef = useRef<HTMLCanvasElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  const url =
    (typeof window !== "undefined" ? window.location.origin : "") + `/experiencia/${casal.token}`;

  useEffect(() => {
    let cancelado = false;
    async function gerar() {
      // QR isolado (cores quentes sobre claro p/ leitura confiável)
      const qr = await QRCode.toDataURL(url, {
        margin: 1,
        width: 600,
        color: { dark: "#3a1f0e", light: "#f4ead9" },
      });
      if (cancelado) return;
      setQrDataUrl(qr);
      await desenharCartao(qr);
      if (!cancelado) setPronto(true);
    }
    gerar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  async function desenharCartao(qrUrl: string) {
    const canvas = cardRef.current;
    if (!canvas) return;
    const W = 1080;
    const H = 1500;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // fundo escuro com leve vinheta dourada
    ctx.fillStyle = "#080503";
    ctx.fillRect(0, 0, W, H);
    const grad = ctx.createRadialGradient(W / 2, H * 0.32, 80, W / 2, H * 0.32, H * 0.7);
    grad.addColorStop(0, "rgba(120,70,30,0.35)");
    grad.addColorStop(1, "rgba(8,5,3,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // moldura dourada
    ctx.strokeStyle = "rgba(233,198,154,0.5)";
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    ctx.textAlign = "center";

    // selo textual
    ctx.fillStyle = "#9c8266";
    ctx.font = "italic 32px Georgia, serif";
    ctx.letterSpacing = "6px";
    ctx.fillText("A R A Ç Á   G R I L L", W / 2, 160);

    // título
    ctx.fillStyle = "#e9c69a";
    ctx.font = "italic 88px Georgia, serif";
    ctx.fillText("Nossa História", W / 2, 350);

    // nomes do casal
    ctx.fillStyle = "#f0e3d2";
    ctx.font = "italic 64px Georgia, serif";
    ctx.fillText(`${casal.nome_1}  &  ${casal.nome_2}`, W / 2, 460);

    // data
    ctx.fillStyle = "#c8924f";
    ctx.font = "30px Georgia, serif";
    ctx.fillText("12 de junho", W / 2, 520);

    // QR em moldura clara
    const qrImg = await carregarImg(qrUrl);
    const qrSize = 520;
    const qrX = (W - qrSize) / 2;
    const qrY = 590;
    ctx.fillStyle = "#f4ead9";
    arredondado(ctx, qrX - 26, qrY - 26, qrSize + 52, qrSize + 52, 28);
    ctx.fill();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // frase
    ctx.fillStyle = "#f0e3d2";
    ctx.font = "italic 40px Georgia, serif";
    const frase = ["Esta noite foi preparada para vocês.", "Aproxime a câmera e descubram o porquê."];
    frase.forEach((l, i) => ctx.fillText(l, W / 2, 1270 + i * 56));

    // mesa
    if (casal.mesa) {
      ctx.fillStyle = "#9c8266";
      ctx.font = "28px Georgia, serif";
      ctx.fillText(`Mesa ${casal.mesa}`, W / 2, 1410);
    }
  }

  function arredondado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function carregarImg(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function baixar(dataUrl: string, nome: string) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = nome;
    a.click();
  }

  const slug = `${casal.nome_1}-${casal.nome_2}`.replace(/\s+/g, "").toLowerCase();

  return (
    <div>
      <canvas
        ref={cardRef}
        style={{ width: "100%", borderRadius: 12, border: `1px solid ${cor.borda}`, marginBottom: 12, display: "block" }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <BotaoLinha
          cheio
          disabled={!pronto}
          onClick={() => {
            const c = cardRef.current;
            if (c) baixar(c.toDataURL("image/png"), `cartao-${slug}.png`);
          }}
        >
          Baixar cartão (PNG)
        </BotaoLinha>
        <BotaoLinha cheio disabled={!qrDataUrl} onClick={() => qrDataUrl && baixar(qrDataUrl, `qr-${slug}.png`)}>
          Baixar só o QR
        </BotaoLinha>
      </div>
    </div>
  );
}
