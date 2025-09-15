"use client";
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function StartPage() {
  const params = useParams<{ id: string }>();
  const rawId = (params as any)?.id;
  const assignmentId = Array.isArray(rawId) ? (rawId[0] as string) : (rawId as string | undefined) || '';
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function join() {
    setLoading(true);
    try {
      if (!assignmentId) return;
      const res = await fetch('/api/join-as-student', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignmentId, displayName: name }) });
      const json = await res.json();
      if (res.ok) {
        sessionStorage.setItem(`student:${assignmentId}`, json.studentId);
        router.push(`/assignment/${assignmentId}/p/1`);
      } else {
        alert(json.error || 'Join failed');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-yellow-50 p-4 text-sm">Heads up: AI feedback is OFF. You’ll see your score after submit. Use the whiteboard to show your work.</div>
      <div className="rounded border bg-white p-4 space-y-3">
        <label className="block text-sm font-medium">Your name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded border p-2" placeholder="e.g., Ana" />
        <button disabled={!name.trim() || loading} onClick={join} className="btn-primary">Start</button>
      </div>
    </div>
  );
}


