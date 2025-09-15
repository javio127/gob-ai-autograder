import type { NextApiRequest, NextApiResponse } from 'next';
import { insertSubmission } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { problemId, studentId, workText, answerImageUrl } = req.body || {};
  if (!problemId || !studentId || !answerImageUrl) return res.status(400).json({ error: 'Missing fields' });
  try {
    const submissionId = await insertSubmission(problemId, studentId, workText || null, answerImageUrl);
    return res.status(200).json({ submissionId });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}


