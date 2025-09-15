import { getSubmissionWithProblem, insertGrade } from '@/lib/db';
import { gradeVisionRequest } from '@/lib/openrouter';

export async function gradeSubmissionVision(submissionId: string) {
  const sub = await getSubmissionWithProblem(submissionId);
  const rubric = sub.problem.rubric_json;
  const promptText = sub.problem.prompt_text as string;
  const imageUrl = sub.answer_image_url as string;
  const workText = sub.work_text as string | null;

  const result = await gradeVisionRequest({ rubricJson: rubric, promptText, imageUrl, workText });
  const gradeId = await insertGrade(submissionId, result.score, result.score_max, result.rationale);
  return { gradeId, score: result.score, max: result.score_max, feedback: result.rationale, gradedBy: 'vision' as const };
}


