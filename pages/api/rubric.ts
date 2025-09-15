import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceClient } from '@/lib/supabase';
import { generateRubric } from '@/lib/openrouter';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { problemId, promptText, type } = req.body || {};
  if (!problemId || !promptText || !type) return res.status(400).json({ error: 'Missing fields' });

  try {
    const rubricJson = await generateRubric({ promptText, desiredType: type });
    const supa = getServiceClient();
    const { error } = await supa.from('problems').update({ rubric_json: rubricJson }).eq('id', problemId);
    if (error) throw error;
    return res.status(200).json({ rubricJson });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}


