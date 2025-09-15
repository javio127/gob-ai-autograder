import { getServiceClient, supabaseClient } from '@/lib/supabase';

export type UUID = string;

export async function createAssignment(teacherId: UUID, title: string) {
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('assignments')
    .insert({ teacher_id: teacherId, title })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as UUID;
}

export async function createProblem(
  assignmentId: UUID,
  order: number,
  promptText: string,
  rubricJson: unknown
) {
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('problems')
    .insert({ assignment_id: assignmentId, order, prompt_text: promptText, rubric_json: rubricJson })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as UUID;
}

export async function upsertStudent(displayName: string): Promise<UUID> {
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('users')
    .insert({ role: 'student', display_name: displayName })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as UUID;
}

export async function insertSubmission(
  problemId: UUID,
  studentId: UUID,
  workText: string | null,
  answerImageUrl: string
) {
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('submissions')
    .insert({ problem_id: problemId, student_id: studentId, work_text: workText, answer_image_url: answerImageUrl })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as UUID;
}

export async function insertGrade(
  submissionId: UUID,
  scoreNumeric: number,
  scoreMax: number,
  feedbackText: string
) {
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('grades')
    .insert({ submission_id: submissionId, score_numeric: scoreNumeric, score_max: scoreMax, feedback_text: feedbackText, graded_by: 'vision' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as UUID;
}

export async function getSubmissionWithProblem(submissionId: UUID) {
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('submissions')
    .select('id, work_text, answer_image_url, problem:problem_id ( id, prompt_text, rubric_json )')
    .eq('id', submissionId)
    .single();
  if (error) throw error;
  return data as any;
}

export async function getReportData(assignmentId: UUID) {
  const supa = getServiceClient();

  const [{ data: assignment }, { data: problems }, { data: rows } ] = await Promise.all([
    supa.from('assignments').select('id, title').eq('id', assignmentId).single(),
    supa.from('problems').select('id, order, prompt_text').eq('assignment_id', assignmentId).order('order'),
    supa.rpc('report_rows_by_assignment', { assignment_id_input: assignmentId }).select()
  ]).then(results => results.map(r => ({ data: (r as any).data })) as any);

  return { assignment, problems, rows };
}


