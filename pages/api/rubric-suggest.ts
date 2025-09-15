import type { NextApiRequest, NextApiResponse } from 'next';
import { generateRubricWithExplanation } from '@/lib/openrouter';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { promptText, type } = req.body || {};
  if (!promptText || !type) return res.status(400).json({ error: 'Missing fields' });
  try {
    const out = await generateRubricWithExplanation({ promptText, desiredType: type });
    return res.status(200).json({ rubricJson: out.rubric, explanation: out.explanation });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}


