-- ============================================================
--  Araçá Grill · "Nossa História" — schema Supabase
--  Rode este arquivo no SQL Editor do Supabase (uma vez).
-- ============================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
--  TABELAS
-- ----------------------------------------------------------------

create table if not exists casais (
  id uuid primary key default uuid_generate_v4(),
  token text unique not null,            -- segredo do link da experiência
  nome_1 text not null,
  nome_2 text not null,
  whatsapp_1 text,
  whatsapp_2 text,
  mesa text,
  status text not null default 'aguardando_1',
    -- 'aguardando_1' | 'aguardando_2' | 'completo' | 'aprovado'
  observacoes text,
  previa_vista boolean default false,    -- operador já pré-visualizou? (trava de aprovar)
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create table if not exists cadastros (
  id uuid primary key default uuid_generate_v4(),
  casal_id uuid references casais(id) on delete cascade,
  pessoa integer not null check (pessoa in (1,2)),
  musica_titulo text,
  musica_url text,                       -- caminho do objeto no Storage (bucket musicas)
  mensagem_final text,
  audio_url text,                        -- caminho do objeto no Storage (bucket audios)
  completo boolean default false,
  bloqueado boolean default false,       -- operador reabre p/ pessoa refazer
  atualizado_em timestamptz default now(),
  unique (casal_id, pessoa)
);

create table if not exists fotos (
  id uuid primary key default uuid_generate_v4(),
  cadastro_id uuid references cadastros(id) on delete cascade,
  url text not null,                     -- caminho do objeto no Storage (bucket fotos)
  mensagem text,
  ordem integer default 0,
  oculta boolean default false
);

create table if not exists log_admin (
  id uuid primary key default uuid_generate_v4(),
  casal_id uuid references casais(id) on delete set null,
  operador text,
  acao text not null,
  detalhe text,
  criado_em timestamptz default now()
);

create index if not exists idx_cadastros_casal on cadastros (casal_id);
create index if not exists idx_fotos_cadastro on fotos (cadastro_id);
create index if not exists idx_casais_token on casais (token);

-- ----------------------------------------------------------------
--  RLS — tudo passa por rotas de API server-side (service role).
--  Habilitamos RLS sem políticas públicas: o anon/authenticated
--  não acessa nada direto. A service role ignora RLS.
-- ----------------------------------------------------------------

alter table casais     enable row level security;
alter table cadastros  enable row level security;
alter table fotos      enable row level security;
alter table log_admin  enable row level security;

-- (sem create policy: nenhum acesso pelo client; só service role server-side)

-- ----------------------------------------------------------------
--  STORAGE — buckets privados
--  Crie no painel (Storage) OU rode abaixo. Buckets PRIVADOS:
--  a mídia é servida só por URL assinada gerada no servidor.
-- ----------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('audios', 'audios', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('musicas', 'musicas', false)
on conflict (id) do nothing;
