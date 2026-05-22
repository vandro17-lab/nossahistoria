export type CasalStatus =
  | "aguardando_1"
  | "aguardando_2"
  | "completo"
  | "aprovado";

export interface Casal {
  id: string;
  token: string;
  nome_1: string;
  nome_2: string;
  whatsapp_1: string | null;
  whatsapp_2: string | null;
  mesa: string | null;
  status: CasalStatus;
  observacoes: string | null;
  previa_vista: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Cadastro {
  id: string;
  casal_id: string;
  pessoa: 1 | 2;
  musica_titulo: string | null;
  musica_url: string | null;
  mensagem_final: string | null;
  audio_url: string | null;
  completo: boolean;
  bloqueado: boolean;
  atualizado_em: string;
}

export interface Foto {
  id: string;
  cadastro_id: string;
  url: string;
  mensagem: string | null;
  ordem: number;
  oculta: boolean;
}

// Foto com URL já assinada, pronta para exibir
export interface FotoView {
  id: string;
  src: string;
  mensagem: string | null;
  ordem: number;
  oculta: boolean;
}

// Bloco de uma pessoa, como a experiência consome
export interface BlocoView {
  nome: string;
  parceiro: string;
  musica_titulo: string | null;
  musica_src: string | null;
  audio_src: string | null;
  mensagem_final: string | null;
  fotos: FotoView[];
}

// Payload completo da experiência
export interface ExperienciaView {
  nome_1: string;
  nome_2: string;
  bloco_1: BlocoView;
  bloco_2: BlocoView;
}
