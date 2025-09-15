import type { NextApiRequest, NextApiResponse } from 'next';
import { gradeSubmissionVision } from '@/lib/grading';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { submissionId } = req.body || {};
  if (!submissionId) return res.status(400).json({ error: 'Missing submissionId' });
  try {
    const result = await gradeSubmissionVision(submissionId);
    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}


