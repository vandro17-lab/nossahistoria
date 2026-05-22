# Nossa História · Araçá Grill

Experiência digital premium de Dia dos Namorados. Cada casal recebe um QR na mesa
que abre uma homenagem cinematográfica construída pelos dois — sem que um saiba o
que o outro preparou.

Quatro partes:

- **Experiência** (`/experiencia/[token]`) — o que o casal vê. Link secreto.
- **Cadastro** (`/cadastro/[id]/1` e `/cadastro/[id]/2`) — cada pessoa monta a parte dela.
- **Painel admin** (`/admin`) — centro de controle da equipe, em etapas.
- **QR + cartão físico** — gerado dentro do painel (PNG para impressão).

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase — Postgres + Storage (buckets privados)
- Tailwind CSS + animações CSS (fonte da verdade: o protótipo)
- Fonte **Cormorant Garamond** (via `next/font`)
- `qrcode` (QR) + canvas (cartão) + `jszip` (baixar tudo) + `browser-image-compression`

---

## 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
   Isso cria as tabelas (`casais`, `cadastros`, `fotos`, `log_admin`), os índices,
   habilita RLS e cria os **buckets privados** `fotos`, `audios`, `musicas`.
3. Confirme em **Storage** que os três buckets existem e estão **privados**
   (não públicos). A mídia é servida só por **URL assinada** gerada no servidor.

> **Segurança:** RLS fica habilitada **sem políticas públicas** — nada é acessível
> direto pelo client. Todas as operações passam por **rotas de API server-side** que
> usam a `SUPABASE_SERVICE_ROLE_KEY` (que ignora RLS). A service role **nunca** vai
> para o navegador.

## 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=        # Settings > API > Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Settings > API > anon public
SUPABASE_SERVICE_ROLE_KEY=       # Settings > API > service_role (secreta!)
ADMIN_PASSWORD=                  # senha FORTE do painel
```

> A senha do painel é compartilhada pela equipe. Ao entrar, cada operador digita o
> **próprio nome**, gravado em `log_admin` em toda ação — sabemos quem fez o quê.

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000/admin`, entre com seu nome + a `ADMIN_PASSWORD`,
cadastre um casal e siga os links gerados.

## 4. Deploy no Vercel

1. Suba o repositório no GitHub.
2. No [Vercel](https://vercel.com), **Import Project** apontando para o repo.
3. Em **Settings > Environment Variables**, adicione as 4 variáveis acima.
4. Deploy. O Vercel detecta Next.js automaticamente.

---

## Fluxo da noite (resumo para a equipe)

1. **Cadastrar casal** no painel → gera 3 links (cadastro de cada pessoa + experiência).
2. Enviar os links de cadastro no **WhatsApp** (botão pronto no painel).
3. Cada pessoa preenche **música + fotos + voz** (sem ver a parte do outro).
4. No painel, o **card do casal** mostra a experiência **em etapas** (✓ pronta / ⚠ faltando).
   Conserte qualquer ponto: trocar foto, editar legenda, ocultar, regravar voz etc.
5. **Pré-visualizar** a experiência (libera a trava de aprovação).
6. **Aprovar** — só ativa quando os dois cadastros estão completos **e** já foi
   pré-visualizado. Enquanto falta, o botão mostra o checklist do que falta.
7. **QR / cartão** — imprimir e deixar na mesa.
8. Depois do evento: **Baixar tudo** (zip) de presente; **Apagar tudo** quando quiser
   (o painel lembra dos casais com mais de 30 dias).

## Prevenção de erro humano (material sensível)

- Toda confirmação destrutiva mostra **nome dos dois + mesa** (nunca "Confirmar?").
- Fotos **rotuladas por pessoa** com cor distinta; ao subir, confirma o bloco.
- **Aprovar** travado até estar tudo completo + pré-visualizado (com checklist).
- **Apagar** é direto (sem lixeira), com confirmação forte; apagar o casal inteiro
  exige digitar **APAGAR**. **Ocultar** (reversível) é mais acessível que apagar.

## Privacidade

- **Link secreto:** a experiência abre por um `token` longo e aleatório, não pelo id.
- **Mídia por URL assinada** com expiração curta (gerada sob demanda no servidor).
- **Exclusão de verdade:** apagar remove arquivos do Storage **e** os registros.
- O material fica disponível por **pelo menos 30 dias**; depois o painel lembra de apagar.

---

## Estrutura

```
src/
  app/
    page.tsx                       # capa
    experiencia/[token]/           # a experiência (público, exige aprovado)
    cadastro/[id]/[pessoa]/        # cadastro de cada pessoa
    admin/                         # painel (login, overview, card do casal, prévia)
    api/
      admin/...                    # rotas protegidas (senha) — CRUD, mídia, aprovar, zip
      cadastro/[id]/[pessoa]/...   # rotas do fluxo público (trava bloqueado)
  components/
    experiencia/Experiencia.tsx    # portado do protótipo, com dados/áudio reais
    cadastro/Cadastro.tsx          # fluxo do casal (tom de carta)
    admin/                         # painel em etapas, QR/cartão, links/WhatsApp
    GravadorVoz.tsx                # gravação + upload (fallback iOS/Safari)
  lib/                             # supabase (service role), auth, mídia, status, etc.
supabase/schema.sql                # banco + buckets
```

## Decisões e simplificações

- **Reordenar fotos** usa setas ↑/↓ (mais confiável no celular, na correria) em vez
  de arrastar.
- A **música** é um **MP3 próprio** hospedado no Supabase (toca sempre, sem login),
  com **fade-in/fade-out** durante as fotos — não usamos link de terceiros.
- A **voz** usa `MediaRecorder` quando o aparelho suporta; o **upload** fica sempre
  visível como alternativa (iOS/Safari). Teste em iPhone real antes do dia 12.
- Nenhum sistema é "impossível de invadir": isto entrega rigor proporcional a uma
  homenagem de evento. Use senha forte e cuide de quem opera.
