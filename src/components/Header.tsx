"use client";
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';

export default function Header() {
  const router = useRouter();
  const search = useSearchParams();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [joinInput, setJoinInput] = useState('');

  useEffect(() => {
    const a = search?.get('a');
    if (a) {
      setOpen(true);
      if (typeof window !== 'undefined') setJoinInput(window.location.href);
    }
  }, [search]);

  const assignmentId = useMemo(() => extractAssignmentId(joinInput), [joinInput]);

  return (
    <header className="bg-white border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Logo />
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => router.push('/start')}>I'm a student</button>
          <button className="btn-primary" onClick={() => router.push('/')}>{pathname === '/' ? 'New Assignment' : 'Go to Dashboard'}</button>
        </div>
      </div>
      {false && open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <div className="absolute left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold">Join an assignment</div>
            <p className="mt-1 text-sm text-gray-600">Paste your link or code. We’ll take you straight to the Start page.</p>
            <div className="mt-3 flex items-center gap-3">
              <input
                className="w-full rounded border p-2"
                placeholder="Paste assignment link or code"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-primary" disabled={!assignmentId} onClick={() => { if (assignmentId) { setOpen(false); router.push(`/assignment/${assignmentId}/start`); } }}>Join</button>
            </div>
            {joinInput && !assignmentId && (
              <div className="mt-2 text-xs text-red-600">Couldn’t find an assignment ID in that input.</div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function extractAssignmentId(text: string): string | null {
  if (!text) return null;
  const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
  const match = text.match(uuidRegex);
  if (match) return match[0];
  try {
    const u = new URL(text);
    const a = u.searchParams.get('a');
    if (a && uuidRegex.test(a)) return a;
  } catch {}
  return null;
}


