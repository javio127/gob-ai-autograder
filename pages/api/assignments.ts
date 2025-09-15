import type { NextApiRequest, NextApiResponse } from 'next';
import { createAssignment } from '@/lib/db';

// For demo: create an assignment for a demo teacher if query ?demoCreate=1
const DEMO_TEACHER_ID = '11111111-1111-1111-1111-111111111111';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { title, teacherId } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Missing title' });
    try {
      const id = await createAssignment(teacherId || DEMO_TEACHER_ID, title);
      return res.status(200).json({ id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'GET' && req.query.demoCreate) {
    try {
      const id = await createAssignment(DEMO_TEACHER_ID, 'Demo Assignment');
      return res.status(200).json({ id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


