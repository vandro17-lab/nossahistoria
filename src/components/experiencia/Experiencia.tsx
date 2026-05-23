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

  const icoPlay = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
  const icoPause = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>';

  const petals = Array.from({ length: 14 }, (_, i) => {
    const left = ((i * 7.1) + Math.random() * 5).toFixed(1);
    const dur = (12 + Math.random() * 10).toFixed(1);
    const del = (Math.random() * 18).toFixed(1);
    const sz = (7 + Math.random() * 11).toFixed(1);
    const sw = (18 + Math.random() * 38).toFixed(0);
    const op = (0.1 + Math.random() * 0.22).toFixed(2);
    return `<div class="pt" style="left:${left}%;width:${sz}px;height:${(Number(sz)*1.3).toFixed(1)}px;opacity:${op};animation:fall ${dur}s linear -${del}s infinite,sway ${(Number(dur)/2).toFixed(1)}s ease-in-out -${del}s infinite alternate;--sw:${sw}px"></div>`;
  }).join("\n");

  const buildFotos = (fotos: { mensagem: string; b64: string }[]): string => {
    const v = fotos.filter(f => f.b64);
    if (!v.length) return "";
    const items = v.map((f, i) =>
      `<figure class="foto${i === 0 && v.length > 2 ? " foto-wide" : ""}"><img src="${f.b64}" alt="" loading="lazy"/>${f.mensagem ? `<figcaption>${esc(f.mensagem)}</figcaption>` : ""}</figure>`
    ).join("");
    return `<div class="fotos-sec reveal"><div class="fotos-grid">${items}</div></div>`;
  };

  const buildPlayer = (audio: string | null, nome: string, id: string): string => {
    if (!audio) return "";
    const bars = Array.from({ length: 18 }, (_, i) => `<span class="b${i + 1}"></span>`).join("");
    return `<div class="player-wrap reveal">
<p class="player-lbl">${esc(nome)} tem algo pra te dizer</p>
<div class="player" id="p-${id}" onclick="tp('${id}')">
  <div class="pbtn" id="btn-${id}">${icoPlay}</div>
  <div class="bars">${bars}</div>
  <p class="player-hint">toque para ouvir</p>
</div>
<audio id="aud-${id}" src="${audio}" preload="auto"></audio>
</div>`;
  };

  const buildBloco = (
    nome: string, para: string,
    musica: string | null | undefined,
    msg: string | null | undefined,
    fotos: { mensagem: string; b64: string }[],
    audio: string | null,
    id: string
  ): string =>
    `<section class="bloco">
<div class="bloco-topo reveal">
  <p class="bloco-de">de ${esc(nome)} para ${esc(para)}</p>
  <h2 class="bloco-nome">${esc(nome)}</h2>
</div>
${musica ? `<div class="musica-area reveal">
  <p class="mus-rot">a m&uacute;sica que ${esc(nome)} escolheu pra voc&ecirc;</p>
  <div class="vinil-ctr">
    <div class="vinil-halo"></div>
    <div class="vinil" id="vinil-${id}">
      <div class="vinil-c"><div class="vinil-f"></div></div>
    </div>
  </div>
  <p class="mus-tit">${esc(musica)}</p>
  <p class="mus-sub">&#9834;&nbsp;&nbsp;escolhida com carinho</p>
</div>` : ""}
${buildFotos(fotos)}
${msg ? `<div class="msg-area reveal"><blockquote class="msg">&ldquo;${esc(msg)}&rdquo;</blockquote></div>` : ""}
${buildPlayer(audio, nome, id)}
</section>`;

  const b1 = buildBloco(data.bloco_1.nome, data.bloco_2.nome, data.bloco_1.musica_titulo, data.bloco_1.mensagem_final, b1fotos, audio1, "b1");
  const b2 = buildBloco(data.bloco_2.nome, data.bloco_1.nome, data.bloco_2.musica_titulo, data.bloco_2.mensagem_final, b2fotos, audio2, "b2");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Nossa Hist&oacute;ria &mdash; ${esc(data.nome_1)} &amp; ${esc(data.nome_2)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#080503;color:#f0e3d2;font-family:"Cormorant Garamond",Garamond,Georgia,serif;min-height:100vh;overflow-x:hidden}
.grain{position:fixed;inset:0;z-index:9000;opacity:.036;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)'/%3E%3C/svg%3E")}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1);opacity:.55}50%{transform:scale(1.15);opacity:.22}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fall{from{transform:translateY(-6vh) rotate(0)}to{transform:translateY(108vh) rotate(430deg)}}
@keyframes sway{from{margin-left:0}to{margin-left:var(--sw,28px)}}
@keyframes bar{0%,100%{height:3px}50%{height:var(--h,14px)}}
@keyframes kb{from{transform:scale(1)}to{transform:scale(1.07)}}
.pt{position:fixed;top:0;border-radius:50% 0 50% 50%;background:linear-gradient(160deg,#c97b4a,#7a2418);pointer-events:none;z-index:2}
.reveal{opacity:0;transform:translateY(22px);transition:opacity 1.15s cubic-bezier(.16,1,.3,1),transform 1.15s cubic-bezier(.16,1,.3,1)}
.reveal.on{opacity:1;transform:none}
.reveal-slow{transition-delay:.25s;transition-duration:1.7s}
/* ── HEADER ── */
.hdr{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:60px 24px;position:relative;overflow:hidden;background:radial-gradient(ellipse 90% 80% at 50% 50%,rgba(100,50,15,.18) 0%,#080503 100%)}
.hdr::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 88% 78% at 50% 50%,transparent 28%,rgba(8,5,3,.65) 100%)}
.hdr-in{position:relative;z-index:1}
.hdr .selo{letter-spacing:.35em;text-transform:uppercase;font-size:11px;color:#5a4430;margin-bottom:28px;animation:fadeIn 2s ease .3s both}
.hdr .lh{width:1px;height:60px;background:linear-gradient(to bottom,transparent,rgba(200,146,79,.4),transparent);margin:0 auto 32px;animation:fadeIn 1.6s ease .55s both}
.hdr h1{font-size:clamp(50px,13vw,104px);color:#e9c69a;font-weight:400;font-style:italic;line-height:1.08;text-shadow:0 0 80px rgba(233,198,154,.18);animation:fadeUp 2s cubic-bezier(.22,1,.36,1) .75s both}
.hdr .amp{display:block;font-size:.48em;color:#c8924f;margin:8px 0;animation:fadeIn 1.6s ease 2s both}
.hdr .sub{margin-top:36px;font-style:italic;font-size:16px;color:#7a6448;letter-spacing:.08em;animation:fadeIn 1.4s ease 2.6s both}
.hdr .sh{margin-top:52px;display:flex;flex-direction:column;align-items:center;gap:8px;animation:fadeIn 1.4s ease 3.5s both}
.hdr .sh span{font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#3d2c1e}
.hdr .sh .arr{width:1px;height:34px;background:linear-gradient(to bottom,rgba(200,146,79,.4),transparent)}
/* ── BLOCO ── */
.bloco{max-width:740px;margin:0 auto}
.bloco-topo{text-align:center;padding:80px 24px 0}
.bloco-de{font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#5a4430;margin-bottom:14px}
.bloco-nome{font-size:clamp(40px,9vw,72px);color:#e9c69a;font-style:italic;font-weight:400;line-height:1.1;text-shadow:0 0 40px rgba(233,198,154,.1)}
/* ── MUSIC ── */
.musica-area{text-align:center;padding:48px 24px 44px}
.mus-rot{font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#5a4430;margin-bottom:30px}
.vinil-ctr{position:relative;display:inline-flex;align-items:center;justify-content:center;margin-bottom:26px}
.vinil-halo{position:absolute;width:192px;height:192px;border-radius:50%;background:radial-gradient(circle,rgba(200,146,79,.1) 0%,transparent 70%);animation:pulse 3.2s ease-in-out infinite}
.vinil{width:146px;height:146px;border-radius:50%;background:repeating-radial-gradient(#1e1408 0 1.5px,#0d0804 1.5px 3.5px);display:flex;align-items:center;justify-content:center;box-shadow:0 12px 48px rgba(0,0,0,.75),0 0 0 1px rgba(233,198,154,.07);animation:spin 10s linear infinite;animation-play-state:paused}
.vinil.sp{animation-play-state:running}
.vinil-c{width:44px;height:44px;border-radius:50%;background:conic-gradient(from 0deg,#e9c69a,#c8924f,#a06830,#e9c69a);box-shadow:inset 0 0 12px rgba(0,0,0,.4),0 0 0 1px rgba(233,198,154,.18);display:flex;align-items:center;justify-content:center}
.vinil-f{width:8px;height:8px;border-radius:50%;background:#0d0804}
.mus-tit{font-style:italic;font-size:clamp(19px,4.2vw,26px);color:#f0e3d2;line-height:1.42;max-width:320px;margin:0 auto 10px}
.mus-sub{font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#5a4430}
/* ── FOTOS ── */
.fotos-sec{padding:0 20px 8px}
.fotos-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.foto{position:relative;overflow:hidden;border-radius:10px;background:#0d0804;box-shadow:0 8px 40px rgba(0,0,0,.55)}
.foto img{width:100%;display:block;object-fit:cover;animation:kb 10s ease forwards}
.foto-wide{grid-column:1/-1}
.foto-wide img{aspect-ratio:16/9}
.foto:not(.foto-wide) img{aspect-ratio:1}
.foto::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 34%,rgba(8,5,3,.55) 100%)}
.foto figcaption{position:absolute;bottom:0;left:0;right:0;z-index:1;padding:48px 14px 14px;background:linear-gradient(to top,rgba(8,5,3,.92) 0%,transparent 100%);font-style:italic;font-size:13.5px;color:rgba(240,227,210,.88);line-height:1.52}
/* ── MENSAGEM ── */
.msg-area{padding:10px 36px 48px;text-align:center}
blockquote.msg{font-style:italic;font-size:clamp(18px,4vw,25px);color:#cdb89e;line-height:1.72;padding:18px 0;position:relative}
blockquote.msg::before{content:"";display:block;width:36px;height:1px;background:rgba(200,146,79,.35);margin:0 auto 20px}
blockquote.msg::after{content:"";display:block;width:36px;height:1px;background:rgba(200,146,79,.35);margin:20px auto 0}
/* ── PLAYER ── */
.player-wrap{padding:8px 24px 64px;text-align:center}
.player-lbl{font-style:italic;font-size:17px;color:#7a6448;margin-bottom:26px}
.player{display:inline-flex;flex-direction:column;align-items:center;gap:16px;cursor:pointer;padding:30px 42px;border:1px solid rgba(233,198,154,.16);border-radius:24px;background:rgba(255,255,255,.018);transition:border-color .4s,background .4s;user-select:none}
.player:hover{border-color:rgba(233,198,154,.32);background:rgba(233,198,154,.032)}
.pbtn{width:68px;height:68px;border-radius:50%;border:1px solid rgba(233,198,154,.26);background:radial-gradient(circle at 40% 35%,rgba(233,198,154,.1) 0%,rgba(8,5,3,.6) 100%);color:#e9c69a;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 1px rgba(233,198,154,.06),0 8px 32px rgba(0,0,0,.5);transition:transform .3s}
.player:hover .pbtn{transform:scale(1.08)}
.bars{display:flex;gap:3px;height:22px;align-items:center}
.bars span{width:2.5px;height:3px;border-radius:2px;background:rgba(200,146,79,.5);display:block;transition:height .4s}
.player.pl .bars span{animation:bar .9s ease-in-out infinite}
.bars .b1{--h:10px;animation-delay:.00s}.bars .b2{--h:16px;animation-delay:.04s}.bars .b3{--h:12px;animation-delay:.08s}.bars .b4{--h:20px;animation-delay:.12s}.bars .b5{--h:14px;animation-delay:.16s}.bars .b6{--h:18px;animation-delay:.20s}.bars .b7{--h:10px;animation-delay:.24s}.bars .b8{--h:16px;animation-delay:.28s}.bars .b9{--h:9px;animation-delay:.32s}.bars .b10{--h:19px;animation-delay:.36s}.bars .b11{--h:13px;animation-delay:.40s}.bars .b12{--h:21px;animation-delay:.44s}.bars .b13{--h:10px;animation-delay:.48s}.bars .b14{--h:15px;animation-delay:.52s}.bars .b15{--h:18px;animation-delay:.56s}.bars .b16{--h:9px;animation-delay:.60s}.bars .b17{--h:17px;animation-delay:.64s}.bars .b18{--h:12px;animation-delay:.68s}
.player-hint{font-style:italic;font-size:13px;color:#5a4430}
.player.pl .player-hint{display:none}
/* ── DIVISOR ── */
.div-entre{display:flex;align-items:center;gap:14px;padding:64px 44px;max-width:480px;margin:0 auto}
.div-line{flex:1;height:1px;background:linear-gradient(to right,transparent,rgba(200,146,79,.3),transparent)}
.div-d{width:5px;height:5px;background:#c8924f;transform:rotate(45deg);opacity:.55;flex-shrink:0}
/* ── FECHAMENTO ── */
.fech{text-align:center;padding:80px 24px 100px}
.fech::before{content:"";display:block;width:1px;height:72px;background:linear-gradient(to bottom,transparent,rgba(200,146,79,.4),transparent);margin:0 auto 56px}
.fech .p1{font-style:italic;font-size:clamp(21px,4.5vw,30px);color:#e9c69a;line-height:1.65;margin-bottom:10px}
.fech .p2{font-style:italic;font-size:clamp(21px,4.5vw,30px);color:#f0e3d2;line-height:1.65}
.fech .p2 span{color:#e9c69a}
.fech .seal{margin-top:56px;letter-spacing:.38em;text-transform:uppercase;font-size:12px;color:#c8924f;font-style:normal}
@media(max-width:480px){.fotos-grid{grid-template-columns:1fr}.foto-wide{grid-column:1}.foto img,.foto-wide img{aspect-ratio:4/3}}
</style>
</head>
<body>
<div class="grain" aria-hidden="true"></div>
${petals}
<header class="hdr">
  <div class="hdr-in">
    <p class="selo">Ara&ccedil;&aacute; Grill apresenta</p>
    <div class="lh"></div>
    <h1>${esc(data.nome_1)}<span class="amp">&amp;</span>${esc(data.nome_2)}</h1>
    <p class="sub">12 de junho &mdash; uma noite que ficou para sempre</p>
    <div class="sh" aria-hidden="true"><span>role para baixo</span><div class="arr"></div></div>
  </div>
</header>
${b1}
<div class="div-entre" aria-hidden="true">
  <div class="div-line"></div>
  <div class="div-d"></div>
  <div class="div-d" style="opacity:.28;transform:rotate(45deg) scale(.62)"></div>
  <div class="div-d"></div>
  <div class="div-line"></div>
</div>
${b2}
<section class="fech reveal reveal-slow">
  <p class="p1">Algumas hist&oacute;rias n&atilde;o precisam ser perfeitas.</p>
  <p class="p2">Elas s&oacute; precisam ser <span>verdadeiras.</span></p>
  <p class="seal">Ara&ccedil;&aacute; Grill</p>
</section>
<script>
(function(){
  var PLAY='${icoPlay}';
  var PAUSE='${icoPause}';
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target);}});},{threshold:0.07});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
  window.tp=function(id){
    var player=document.getElementById('p-'+id);
    var audio=document.getElementById('aud-'+id);
    var btn=document.getElementById('btn-'+id);
    var vinil=document.getElementById('vinil-'+id);
    if(!audio)return;
    if(audio.paused){
      document.querySelectorAll('.player.pl').forEach(function(p){
        var pid=p.id.replace('p-','');
        var a=document.getElementById('aud-'+pid);
        var b=document.getElementById('btn-'+pid);
        var v=document.getElementById('vinil-'+pid);
        if(a)a.pause();if(b)b.innerHTML=PLAY;if(v)v.classList.remove('sp');
        p.classList.remove('pl');
      });
      audio.play().catch(function(){});
      player.classList.add('pl');
      if(vinil)vinil.classList.add('sp');
      btn.innerHTML=PAUSE;
      audio.onended=function(){player.classList.remove('pl');if(vinil)vinil.classList.remove('sp');btn.innerHTML=PLAY;};
    }else{
      audio.pause();player.classList.remove('pl');if(vinil)vinil.classList.remove('sp');btn.innerHTML=PLAY;
    }
  };
})();
</script>
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
    const a = setTimeout(() => setFase(1), 6200);
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
          linhas={primeiro
            ? [`${bloco.nome} pensou em você.`, "Escolheu cada foto, cada palavra.", "", "Tudo. Só pra você."]
            : [`E agora foi a vez de ${bloco.nome}.`, "Cada escolha feita com cuidado.", "", "Com o mesmo amor."]}
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
