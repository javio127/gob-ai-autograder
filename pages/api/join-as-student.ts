import type { NextApiRequest, NextApiResponse } from 'next';
import { upsertStudent } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { assignmentId, displayName } = req.body || {};
  if (!assignmentId || !displayName) return res.status(400).json({ error: 'Missing fields' });
  try {
    const studentId = await upsertStudent(displayName);
    return res.status(200).json({ studentId });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}


