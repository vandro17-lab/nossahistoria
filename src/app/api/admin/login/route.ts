import { NextRequest, NextResponse } from "next/server";
import { senhaConfere, assinarSessao } from "@/lib/token";
import { COOKIE_SESSAO, COOKIE_OPERADOR } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: { senha?: string; operador?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  const senha = (body.senha || "").trim();
  const operador = (body.operador || "").trim();

  if (!operador) {
    return NextResponse.json({ erro: "Diga seu nome para sabermos quem está operando." }, { status: 400 });
  }
  if (!senhaConfere(senha)) {
    return NextResponse.json({ erro: "Senha incorreta. Tente de novo." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const trintaDias = 60 * 60 * 24 * 30;
  res.cookies.set(COOKIE_SESSAO, assinarSessao(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: trintaDias,
  });
  res.cookies.set(COOKIE_OPERADOR, operador, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: trintaDias,
  });
  return res;
}
