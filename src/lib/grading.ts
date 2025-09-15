import { getSubmissionWithProblem, insertGrade } from '@/lib/db';
import { gradeVisionRequest } from '@/lib/openrouter';

export async function gradeSubmissionVision(submissionId: string) {
  const sub = await getSubmissionWithProblem(submissionId);
  const rubric = sub.problem.rubric_json;
  const promptText = sub.problem.prompt_text as string;
  const imageUrl = sub.answer_image_url as string;
  const workText = sub.work_text as string | null;

  // Deterministic shortcut: if a typed final was provided and matches rubric, award 1/1
  const typed = extractTypedFinal(workText);
  if (typed && rubric?.type) {
    const match = matchesRubric(typed, rubric);
    if (match) {
      const rationale = `Accepted typed final answer: ${typed}`;
      const gradeId = await insertGrade(submissionId, 1, 1, rationale);
      return { gradeId, score: 1, max: 1, feedback: rationale, gradedBy: 'vision' as const };
    }
  }

  const result = await gradeVisionRequest({ rubricJson: rubric, promptText, imageUrl, workText });
  const gradeId = await insertGrade(submissionId, result.score, result.score_max, result.rationale);
  return { gradeId, score: result.score, max: result.score_max, feedback: result.rationale, gradedBy: 'vision' as const };
}

function extractTypedFinal(workText?: string | null): string | null {
  if (!workText) return null;
  const m = workText.match(/Final answer \(typed\):\s*(.+)/i);
  if (m && m[1]) return m[1].trim();
  return null;
}

function matchesRubric(typed: string, rubric: any): boolean {
  if (!rubric) return false;
  const normalized = typed.replace(/\s+/g, '').replace(/[,;]+$/,'');
  if (rubric.type === 'vision_numeric' && rubric.expected) {
    const tol = Number(rubric.expected.tolerance ?? 0);
    const expected = Number(rubric.expected.value_numeric);
    const parsed = Number(normalized.replace(/\.$/, ''));
    if (Number.isFinite(parsed) && Number.isFinite(expected)) {
      return Math.abs(parsed - expected) <= tol;
    }
  }
  if (rubric.type === 'vision_one_of') {
    const list: string[] = rubric.acceptable_strings || [];
    const lower = typed.trim().toLowerCase();
    return Array.isArray(list) && list.some((s: string) => String(s).trim().toLowerCase() === lower);
  }
  return false;
}


