import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { problemId } = req.body || {};
  if (!problemId) return res.status(400).json({ error: 'Missing problemId' });
  try {
    const supa = getServiceClient();
    const { error } = await supa.from('problems').delete().eq('id', problemId);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}


