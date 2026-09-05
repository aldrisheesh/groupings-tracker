import { createHmac, timingSafeEqual } from 'node:crypto';

const signature = (value) => createHmac('sha256', process.env.ADMIN_PASSWORD).update(value).digest('hex');
export function sessionCookie() {
  const expires = String(Date.now() + 8 * 60 * 60 * 1000);
  return `groupings_admin=${expires}.${signature(expires)}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=28800`;
}
export function isAdminRequest(request) {
  if (!process.env.ADMIN_PASSWORD) return false;
  const token = request.headers.cookie?.split('; ').find(value => value.startsWith('groupings_admin='))?.split('=')[1];
  if (!token) return false;
  const [expires, digest] = token.split('.');
  if (!/^\d+$/.test(expires) || Number(expires) <= Date.now() || !/^[a-f0-9]{64}$/.test(digest || '')) return false;
  return timingSafeEqual(Buffer.from(digest), Buffer.from(signature(expires)));
}
