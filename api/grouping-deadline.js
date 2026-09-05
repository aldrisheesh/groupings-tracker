import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from './_lib/admin-session.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }
  if (!isAdminRequest(request)) return response.status(401).json({ error: 'Please sign in to admin mode again.' });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return response.status(503).json({ error: 'Deadline settings are not configured on the server yet.' });
  }
  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    const { groupingId, deadline } = body || {};
    if (typeof groupingId !== 'string' || !/^[a-f0-9-]{36}$/i.test(groupingId) ||
        (deadline !== null && (typeof deadline !== 'string' || !Number.isFinite(Date.parse(deadline)) || Date.parse(deadline) <= Date.now()))) {
      return response.status(400).json({ error: 'Choose a valid future deadline.' });
    }
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data, error } = await db.rpc('configure_grouping_deadline', { target_id: groupingId, deadline });
    if (error) return response.status(400).json({ error: error.message });
    return response.status(200).json(data);
  } catch {
    return response.status(400).json({ error: 'Unable to save the deadline. Please try again.' });
  }
}
