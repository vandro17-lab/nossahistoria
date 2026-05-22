export const LIMITE = {
  fotoBytes: 10 * 1024 * 1024, // 10MB (já comprimida no client)
  audioBytes: 20 * 1024 * 1024, // 20MB
  musicaBytes: 15 * 1024 * 1024, // 15MB
  maxFotos: 10,
};

export function tamanhoOk(bytes: number, max: number): boolean {
  return bytes > 0 && bytes <= max;
}
