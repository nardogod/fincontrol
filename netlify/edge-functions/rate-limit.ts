/**
 * Fase 3 - Rate limiting (opcional).
 * Só aplica limite se UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN estiverem definidos.
 * Caso contrário, ou em qualquer erro, deixa a requisição seguir (return undefined).
 *
 * Para ativar:
 * 1. Crie uma conta e um Redis em https://upstash.com
 * 2. No Netlify: Site settings > Environment variables >
 *    UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 * 3. Em netlify.toml, adicione:
 *
 *    [[edge_functions]]
 *      function = "rate-limit"
 *      path = "/api/*"
 *
 * Limite: 100 requisições por IP por minuto (ajustável abaixo).
 */
import type { Context } from "@netlify/edge-functions";

const RATE_LIMIT = 100;
const WINDOW_SEC = 60;

export default async (request: Request, context: Context) => {
  const url = Netlify.env.get("UPSTASH_REDIS_REST_URL");
  const token = Netlify.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (!url || !token) {
    return; // pass-through: rate limit desativado
  }

  const ip = context.ip ?? "unknown";
  const key = `rate:${ip.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  try {
    const resIncr = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["INCR", key]),
    });
    if (!resIncr.ok) return;

    const data = (await resIncr.json()) as { result?: number };
    const count = Number(data.result ?? 0);

    if (count === 1) {
      await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["EXPIRE", key, String(WINDOW_SEC)]),
      });
    }

    if (count > RATE_LIMIT) {
      return new Response("Too Many Requests", { status: 429 });
    }
  } catch {
    return; // pass-through em erro
  }

  return; // pass-through: dentro do limite
};
