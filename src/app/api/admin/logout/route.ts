import { NextResponse } from "next/server";
import { COOKIE_SESSAO, COOKIE_OPERADOR } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESSAO, "", { path: "/", maxAge: 0 });
  res.cookies.set(COOKIE_OPERADOR, "", { path: "/", maxAge: 0 });
  return res;
}
