"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function UniversalStartPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [input, setInput] = useState('');
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const a = search?.get('a');
    if (a) setInput(a);
  }, [search]);

  const assignmentId = useMemo(() => extractAssignmentId(input), [input]);

  useEffect(() => {
    async function fetchAssignment() {
      if (!assignmentId) { setAssignment(null); return; }
      try {
        const res = await fetch(`/api/assignment?id=${assignmentId}`);
        const json = await res.json();
        if (res.ok) setAssignment(json.assignment);
        else setAssignment(null);
      } catch {
        setAssignment(null);
      }
    }
    fetchAssignment();
  }, [assignmentId]);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Join an assignment</h1>
      <div className="rounded-xl border bg-white p-5 space-y-3">
        <div className="text-sm text-gray-600">Paste your link or code. We’ll take you to the Start page.</div>
        <div className="flex items-center gap-3">
          <input className="w-full rounded border p-2" placeholder="Paste assignment link or code" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn-primary" disabled={!assignmentId} onClick={() => router.push(`/assignment/${assignmentId}/start`)}>Go</button>
        </div>
      </div>

      {assignmentId && (
        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm text-gray-600">Invitation preview</div>
          {assignment ? (
            <div className="mt-2">
              <div className="text-lg font-medium">{assignment.title}</div>
              <div className="text-sm text-gray-600">Assignment ID: <span className="font-mono">{assignmentId}</span></div>
              <div className="mt-3">
                <button className="btn-primary" onClick={() => router.push(`/assignment/${assignmentId}/start`)}>Continue</button>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-red-600">Couldn’t find this assignment. Double-check the link or code.</div>
          )}
        </div>
      )}

      <div className="rounded-xl border bg-yellow-50 p-4 text-sm">Heads up: AI feedback is OFF. You’ll see your score after submit. Use the whiteboard to show your work.</div>
    </div>
  );
}

function extractAssignmentId(text: string): string | null {
  if (!text) return null;
  const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
  const match = text.match(uuidRegex);
  if (match) return match[0];
  try {
    const u = new URL(text, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const a = u.searchParams.get('a');
    if (a && uuidRegex.test(a)) return a;
  } catch {}
  return null;
}


