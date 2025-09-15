"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [title, setTitle] = useState('Untitled Assignment');
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/assignments');
      const j = await res.json();
      if (res.ok) setList(j.assignments || []);
    }
    load();
  }, []);

  async function createAssignment() {
    setLoading(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || 'Untitled Assignment' })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create assignment');
      router.push(`/assignment/${json.id}/build`);
    } catch (e: any) {
      alert(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Teacher Dashboard</h1>
      <div className="rounded-xl border bg-white p-5">
        <p className="text-sm text-gray-600">
          Create a new assignment and share with students. Add problems, generate/edit a rubric, then track scores.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            className="min-w-[260px] flex-1 rounded border p-2"
            placeholder="Assignment title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            onClick={createAssignment}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating…' : 'New Assignment'}
          </button>
        </div>
      </div>
      <div className="space-y-2">
      <h2 className="text-lg font-medium">Your assignments</h2>
      <div className="rounded-xl border bg-white">
        {list.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No assignments yet. Create one above.</div>
        ) : (
          <ul className="divide-y">
            {list.map(a => (
              <li key={a.id} className="flex items-center justify-between p-3 text-sm">
                <div className="font-medium">{a.title}</div>
                <div className="flex gap-2">
                  <a href={`/assignment/${a.id}/build`} className="btn-secondary">Build</a>
                  <a href={`/assignment/${a.id}/share`} className="btn-secondary">Share</a>
                  <a href={`/assignment/${a.id}/report`} className="btn-secondary">Report</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
    </div>
  );
}


