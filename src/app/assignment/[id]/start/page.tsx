"use client";
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function StartPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function join() {
    setLoading(true);
    try {
      const res = await fetch('/api/join-as-student', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignmentId: params.id, displayName: name }) });
      const json = await res.json();
      if (res.ok) {
        sessionStorage.setItem(`student:${params.id}`, json.studentId);
        router.push(`/assignment/${params.id}/p/1`);
      } else {
        alert(json.error || 'Join failed');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded border bg-yellow-50 p-4 text-sm">Heads up: AI feedback is OFF. You’ll see your score after submit. Use the whiteboard to show your work.</div>
      <div className="rounded border bg-white p-4 space-y-3">
        <label className="block text-sm font-medium">Your name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded border p-2" placeholder="e.g., Ana" />
        <button disabled={!name.trim() || loading} onClick={join} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">Start</button>
      </div>
    </div>
  );
}


