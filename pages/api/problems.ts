import type { NextApiRequest, NextApiResponse } from 'next';
import { createProblem } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { assignmentId, order, promptText } = req.body || {};
  if (!assignmentId || order == null || !promptText) return res.status(400).json({ error: 'Missing fields' });
  try {
    const id = await createProblem(assignmentId, Number(order), String(promptText), { type: 'vision_numeric', expected: { value_numeric: 0, tolerance: 0 }, acceptable_strings: null, instructions: 'Teacher to edit rubric', partial_credit_rules: [] });
    return res.status(200).json({ id });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}


