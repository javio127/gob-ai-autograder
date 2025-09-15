import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = String(req.query.id || '');
  if (!id) return res.status(400).json({ error: 'Missing id' });
  try {
    const supa = getServiceClient();
    const { data, error } = await supa.from('assignments').select('id, title').eq('id', id).single();
    if (error) throw error;
    return res.status(200).json({ assignment: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}


