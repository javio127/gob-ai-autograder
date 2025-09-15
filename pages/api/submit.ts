import type { NextApiRequest, NextApiResponse } from 'next';
import { insertSubmission } from '@/lib/db';
import { getServiceClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { problemId, studentId, workText, finalAnswerText, answerImageUrl } = req.body || {};
  if (!problemId || !studentId || !answerImageUrl) return res.status(400).json({ error: 'Missing fields' });
  try {
    // Upsert by (problem_id, student_id): if exists, update instead of inserting duplicate
    const supa = getServiceClient();
    const { data: existing } = await supa
      .from('submissions')
      .select('id')
      .eq('problem_id', problemId)
      .eq('student_id', studentId)
      .maybeSingle();
    let submissionId: string;
    if (existing?.id) {
      const { error } = await supa
        .from('submissions')
        .update({ work_text: mergeText(workText, finalAnswerText), answer_image_url: answerImageUrl })
        .eq('id', existing.id);
      if (error) throw error;
      submissionId = existing.id;
    } else {
      submissionId = await insertSubmission(problemId, studentId, mergeText(workText, finalAnswerText), answerImageUrl);
    }
    return res.status(200).json({ submissionId });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

function mergeText(notes?: string | null, finalAns?: string | null) {
  const n = (notes || '').trim();
  const f = (finalAns || '').trim();
  if (n && f) return `${n}\n\nFinal answer (typed): ${f}`;
  if (f) return `Final answer (typed): ${f}`;
  return n || null;
}


