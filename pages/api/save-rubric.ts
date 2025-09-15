import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { problemId, rubricJson } = req.body || {};
  if (!problemId || !rubricJson) return res.status(400).json({ error: 'Missing fields' });
  try {
    const supa = getServiceClient();
    const { error } = await supa.from('problems').update({ rubric_json: rubricJson }).eq('id', problemId);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}


