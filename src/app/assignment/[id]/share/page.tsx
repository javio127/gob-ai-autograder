"use client";
import { useParams } from 'next/navigation';

export default function SharePage() {
  const params = useParams<{ id: string }>();
  const startUrl = typeof window !== 'undefined' ? `${window.location.origin}/assignment/${params.id}/start` : '';
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Share Link</h1>
      <div className="rounded border bg-white p-4">
        <div className="text-sm">Student start link:</div>
        <div className="mt-2 flex gap-2">
          <input className="w-full rounded border p-2" value={startUrl} readOnly />
          <button className="rounded bg-black px-3 py-2 text-white" onClick={() => navigator.clipboard.writeText(startUrl)}>Copy</button>
        </div>
      </div>
    </div>
  );
}


