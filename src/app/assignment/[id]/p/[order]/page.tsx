"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Whiteboard from '@/components/Whiteboard';

type Problem = { id: string; order: number; prompt_text: string };

export default function ProblemPage() {
  const params = useParams<{ id: string; order: string }>();
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [current, setCurrent] = useState<Problem | null>(null);
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const studentId = typeof window !== 'undefined' ? sessionStorage.getItem(`student:${params.id}`) : null;

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/report?assignmentId=${params.id}`);
      const json = await res.json();
      const probs = json.problems as Problem[];
      setProblems(probs);
      const cur = probs.find(p => p.order === Number(params.order)) || null;
      setCurrent(cur);
    }
    load();
  }, [params.id, params.order]);

  async function submit() {
    try {
      if (!imageUrl) {
        alert('Please Save PNG first');
        return;
      }
      setStatus('Submitting…');
      const res1 = await fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problemId: current!.id, studentId, workText: notes, answerImageUrl: imageUrl }) });
      const j1 = await res1.json();
      if (!res1.ok) throw new Error(j1.error || 'Submit failed');
      setStatus('Grading…');
      const res2 = await fetch('/api/grade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId: j1.submissionId }) });
      const j2 = await res2.json();
      if (!res2.ok) throw new Error(j2.error || 'Grade failed');
      setStatus(`You scored ${j2.score}/${j2.max}.`);
    } catch (e: any) {
      setStatus('We’re processing your submission; your teacher will see the score shortly.');
    }
  }

  function next() {
    const idx = problems.findIndex(p => p.id === current?.id);
    if (idx >= 0 && idx < problems.length - 1) {
      router.push(`/assignment/${params.id}/p/${problems[idx + 1].order}`);
    } else {
      router.push(`/assignment/${params.id}/report`);
    }
  }

  if (!current) return <div>Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">Problem {current.order}</div>
      <div className="rounded border bg-white p-4">
        <div className="font-medium">{current.prompt_text}</div>
      </div>
      <Whiteboard assignmentId={params.id} studentId={studentId || 'unknown'} problemId={current.id} onSaved={setImageUrl} />
      <div className="rounded border bg-white p-4 space-y-2">
        <label className="block text-sm font-medium">Optional notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full rounded border p-2" rows={3} />
      </div>
      <div className="flex gap-3">
        <button onClick={submit} className="rounded bg-black px-3 py-2 text-white">Submit</button>
        <button onClick={next} className="rounded border px-3 py-2">Next</button>
      </div>
      {status && <div className="text-sm text-gray-700">{status}</div>}
      <div className="rounded border bg-yellow-50 p-3 text-xs">AI feedback is OFF; you’ll see your score after submit.</div>
    </div>
  );
}


