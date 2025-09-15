"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Problem = { id: string; order: number; prompt_text: string; rubric_json: any };

export default function BuildPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = params.id;
  const [problems, setProblems] = useState<Problem[]>([]);
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);

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
    const type = 'vision_numeric';
    const res = await fetch('/api/rubric', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problemId: problem.id, promptText: problem.prompt_text, type }) });
    const json = await res.json();
    if (res.ok) {
      setProblems(ps => ps.map(p => p.id === problem.id ? { ...p, rubric_json: json.rubricJson } : p));
    } else {
      alert(json.error || 'Rubric failed');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Build Assignment</h1>
      <div className="rounded border bg-white p-4 space-y-3">
        <label className="block text-sm font-medium">Add Problem</label>
        <textarea value={promptText} onChange={e => setPromptText(e.target.value)} className="w-full rounded border p-2" rows={3} placeholder="Enter problem prompt" />
        <button disabled={loading || !promptText.trim()} onClick={addProblem} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">Add</button>
      </div>

      <div className="space-y-4">
        {problems.map(p => (
          <div key={p.id} className="rounded border bg-white p-4 space-y-2">
            <div className="text-sm text-gray-600">Problem {p.order}</div>
            <div className="font-medium">{p.prompt_text}</div>
            <div>
              <button onClick={() => genRubric(p)} className="rounded border px-3 py-1">Generate Rubric</button>
            </div>
            {p.rubric_json && (
              <textarea className="w-full rounded border p-2 text-xs" rows={6} value={JSON.stringify(p.rubric_json, null, 2)} onChange={(e) => setProblems(ps => ps.map(x => x.id === p.id ? { ...x, rubric_json: safeJson(e.target.value) } : x))} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return text as any; }
}


