import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const assignmentId = String(req.query.assignmentId || '');
  if (!assignmentId) return res.status(400).json({ error: 'Missing assignmentId' });

  const supa = getServiceClient();
  try {
    const { data: assignment, error: aerr } = await supa.from('assignments').select('id, title').eq('id', assignmentId).single();
    if (aerr) throw aerr;
    const { data: problems, error: perr } = await supa.from('problems').select('id, order, prompt_text').eq('assignment_id', assignmentId).order('order');
    if (perr) throw perr;

    // Scope submissions to the given assignment by joining through problem -> assignment
    const { data: submissions, error: serr } = await supa
      .from('submissions')
      .select('id, problem_id, student_id, answer_image_url, created_at, users:student_id ( display_name ), grades:grades ( score_numeric, score_max, feedback_text ), problem:problem_id ( assignment_id )')
      .eq('problem.assignment_id', assignmentId);
    if (serr) throw serr;

    const studentsMap = new Map<string, { student_id: string; student_name: string; problem_scores: any[]; total_score: number; total_max: number; artifacts: any[] }>();
    for (const s of submissions || []) {
      const student_id = s.student_id as string;
      const problem_id = s.problem_id as string;
      const student_name = (s as any).users?.display_name || 'Student';
      const score_numeric = (s as any).grades?.[0]?.score_numeric;
      const score_max = (s as any).grades?.[0]?.score_max;
      const artifact = { problem_id, image_url: s.answer_image_url };
      if (!studentsMap.has(student_id)) {
        studentsMap.set(student_id, { student_id, student_name, problem_scores: [], total_score: 0, total_max: 0, artifacts: [] });
      }
      const row = studentsMap.get(student_id)!;
      row.problem_scores.push({ problem_id, score: score_numeric ?? null, max: score_max ?? 1 });
      if (typeof score_numeric === 'number' && typeof score_max === 'number') {
        row.total_score += Number(score_numeric);
        row.total_max += Number(score_max);
      }
      row.artifacts.push(artifact);
    }

    return res.status(200).json({ assignment, problems, rows: Array.from(studentsMap.values()) });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}


