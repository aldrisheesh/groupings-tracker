import { createHash, timingSafeEqual } from "node:crypto";
import { sessionCookie } from './_lib/admin-session.js';

const hash = (value) => createHash("sha256").update(value).digest();

export default function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method === 'DELETE') {
    response.setHeader('Set-Cookie', 'groupings_admin=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0');
    return response.status(200).json({ authenticated: false });
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, DELETE");
    return response.status(405).json({ authenticated: false });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("ADMIN_PASSWORD is not configured");
    return response.status(503).json({ authenticated: false });
  }

  let body = request.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      return response.status(400).json({ authenticated: false });
    }
  }
  const candidate = typeof body?.password === "string" ? body.password : "";
  const authenticated = candidate.length <= 256 && timingSafeEqual(hash(candidate), hash(adminPassword));
  if (authenticated) response.setHeader('Set-Cookie', sessionCookie());

  return response.status(authenticated ? 200 : 401).json({ authenticated });
}
