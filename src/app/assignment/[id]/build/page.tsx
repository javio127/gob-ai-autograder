"use client";
import { useEffect, useState } from 'react';
import RubricEditor from '@/components/RubricEditor';
import { supabaseClient } from '@/lib/supabase';
import { useParams } from 'next/navigation';

type Problem = { id: string; order: number; prompt_text: string; rubric_json: any };

export default function BuildPage() {
  const params = useParams<{ id: string }>();
  // Guard against potential null/array types from useParams during build/static analysis
  const rawId = (params as any)?.id;
  const assignmentId = Array.isArray(rawId) ? (rawId[0] as string) : (rawId as string | undefined) || '';
  const [problems, setProblems] = useState<Problem[]>([]);
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [rubricType, setRubricType] = useState<'vision_numeric' | 'vision_one_of' | 'vision_text'>('vision_numeric');
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  // Load problems on mount (and when assignment changes)
  useEffect(() => {
    async function load() {
      if (!assignmentId) return;
      const { data, error } = await supabaseClient
        .from('problems')
        .select('id, order, prompt_text, rubric_json')
        .eq('assignment_id', assignmentId)
        .order('order');
      if (!error && data) setProblems(data as any);
    }
    load();
  }, [assignmentId]);

  async function addProblem() {
    setLoading(true);
    try {
      const res = await fetch('/api/problems', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignmentId, order: problems.length + 1, promptText }) });
      const json = await res.json();
      if (res.ok) {
        setProblems([...problems, { id: json.id, order: problems.length + 1, prompt_text: promptText, rubric_json: {} }]);
        setPromptText('');
      } else {
        alert(json.error || 'Failed to add');
      }
    } finally {
      setLoading(false);
    }
  }

  async function genRubric(problem: Problem) {
    try {
      const type = rubricType;
      const res = await fetch('/api/rubric', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problemId: problem.id, promptText: problem.prompt_text, type }) });
      const text = await res.text();
      let json: any = {};
      try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON error page */ }
      if (res.ok) {
        setProblems(ps => ps.map(p => p.id === problem.id ? { ...p, rubric_json: json.rubricJson } : p));
      } else {
        const hint = 'Check OPENROUTER_API_KEY, model env vars, and SUPABASE_SERVICE_ROLE_KEY are set in .env.local';
        alert(json.error ? `Rubric failed: ${json.error}` : `Rubric failed. ${hint}`);
      }
    } catch (e: any) {
      alert(e?.message || 'Rubric generation failed.');
    }
  }

  async function suggestRubric(problem: Problem) {
    try {
      const type = rubricType;
      const res = await fetch('/api/rubric-suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ promptText: problem.prompt_text, type }) });
      const text = await res.text();
      let out: any = {};
      try { out = text ? JSON.parse(text) : {}; } catch { /* HTML or other non-JSON */ }
      if (!res.ok) throw new Error(out.error || 'Suggest failed. Check OpenRouter key/model.');
      setProblems(ps => ps.map(p => p.id === problem.id ? { ...p, rubric_json: out.rubricJson } : p));
      setExplanations(ex => ({ ...ex, [problem.id]: out.explanation }));
    } catch (e: any) {
      const hint = 'Make sure OPENROUTER_API_KEY and OPENROUTER_*_MODEL are set and the model is available.';
      alert(e?.message ? `${e.message}\n\n${hint}` : `Rubric suggestion failed. ${hint}`);
    }
  }

  return (
    <div className="space-y-6">
      {!assignmentId && <div>Loading…</div>}
      {/* Step indicator */}
      <div className="flex items-center gap-3 text-sm">
        <StepDot done>1</StepDot><span>Create</span>
        <div className="h-px w-6 bg-gray-300" />
        <StepDot active>2</StepDot><span>Add problems</span>
        <div className="h-px w-6 bg-gray-300" />
        <StepDot>3</StepDot><span>Share</span>
        <div className="h-px w-6 bg-gray-300" />
        <StepDot>4</StepDot><span>Report</span>
      </div>

      <h1 className="text-xl font-semibold">Build Assignment</h1>

      {/* Teacher guidance */}
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm font-medium">Add Problem</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
          <li>Enter the student-facing question only. Do not include the answer.</li>
          <li>One problem per entry. Add more problems individually.</li>
          <li>Use the rubric fields below to define the expected answer and partial credit.</li>
        </ul>
        <div className="mt-3">
          <textarea value={promptText} onChange={e => setPromptText(e.target.value)} className="w-full rounded border p-2" rows={3} placeholder="e.g., Solve for x: 3x + 5 = 20." />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-600">Rubric style:</label>
            <select className="rounded border p-1" value={rubricType} onChange={e => setRubricType(e.target.value as any)}>
              <option value="vision_numeric">Numeric answer (e.g., x = 5 ± tolerance)</option>
              <option value="vision_one_of">Exact word/phrase (pick from accepted strings)</option>
              <option value="vision_text">Short explanation (check reasoning cues)</option>
            </select>
          </div>
          <button disabled={loading || !promptText.trim()} onClick={addProblem} className="btn-primary">Add problem</button>
        </div>
      </div>

      {/* Rubric explainer */}
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm font-medium">What is a rubric?</div>
        <p className="mt-2 text-sm text-gray-600">
          The rubric tells the AI exactly how to grade each problem. It encodes the expected answer (or acceptable phrases),
          what to look for in the whiteboard image, and any partial‑credit rules. Generate one per problem, then edit it to fit
          your class. Clear rubrics make grading consistent and fast.
        </p>
      </div>

      <div className="space-y-4">
        {problems.map(p => (
          <div key={p.id} className="rounded-xl border bg-white p-4 space-y-2">
            <div className="text-sm text-gray-600">Problem {p.order}</div>
            <div className="font-medium">{p.prompt_text}</div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Rubric: edit the fields below to define grading.</span>
              <button
                className="ml-auto text-xs text-red-600 underline"
                onClick={async () => {
                  if (!confirm('Delete this problem? This cannot be undone.')) return;
                  await fetch('/api/delete-problem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problemId: p.id }) });
                  setProblems(ps => ps.filter(x => x.id !== p.id));
                  // Refresh to reflect ordering from DB
                  const { data } = await supabaseClient
                    .from('problems')
                    .select('id, order, prompt_text, rubric_json')
                    .eq('assignment_id', assignmentId)
                    .order('order');
                  if (data) setProblems(data as any);
                }}
              >
                Delete problem
              </button>
            </div>
            {explanations[p.id] && (
              <div className="rounded border bg-gray-50 p-3 text-sm text-gray-700">How this rubric grades: <span className="whitespace-pre-wrap">{explanations[p.id]}</span></div>
            )}
            <RubricEditor
              problemId={p.id}
              initial={p.rubric_json || null}
              onChange={async (rubric) => {
                setProblems(ps => ps.map(x => x.id === p.id ? { ...x, rubric_json: rubric } : x));
                await fetch('/api/save-rubric', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problemId: p.id, rubricJson: rubric }) });
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <a href={`/assignment/${assignmentId}/share`} className="btn-primary">Next: Share</a>
      </div>
    </div>
  );
}

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return text as any; }
}

function StepDot({ children, active, done }: { children: any; active?: boolean; done?: boolean }) {
  const cls = done ? 'bg-brandGreen text-white' : active ? 'bg-brandBlue text-white' : 'bg-gray-200 text-gray-600';
  return <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${cls}`}>{children}</span>;
}


