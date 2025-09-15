import type { NextApiRequest, NextApiResponse } from 'next';
import { createProblem } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { assignmentId, order, promptText } = req.body || {};
  if (!assignmentId || order == null || !promptText) return res.status(400).json({ error: 'Missing fields' });
  try {
    const id = await createProblem(assignmentId, Number(order), String(promptText), {
      type: 'vision_numeric',
      expected: { value_numeric: 0, tolerance: 0.05 },
      acceptable_strings: null,
      instructions: 'Find the final answer (boxed/circled/underlined or prefixed with "Final:"). Treat trailing punctuation as insignificant. Teacher may adjust.',
      partial_credit_rules: []
    });
    return res.status(200).json({ id });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}


