import { createHash, timingSafeEqual } from "node:crypto";

const hash = (value) => createHash("sha256").update(value).digest();

export default function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
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

  return response.status(authenticated ? 200 : 401).json({ authenticated });
}
