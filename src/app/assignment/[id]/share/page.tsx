"use client";
import { useParams } from 'next/navigation';

export default function SharePage() {
  const params = useParams<{ id: string }>();
  const base = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const universal = `${base}/?a=${params.id}`;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Share</h1>
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="text-sm text-gray-700">Give students this single link. They’ll enter their name and start on Problem 1.</div>
        <div className="mt-1 flex gap-2">
          <input className="w-full rounded border p-2" value={universal} readOnly />
          <button className="btn-primary" onClick={() => navigator.clipboard.writeText(universal)}>Copy</button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-700">Next step</div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-gray-600">Once students submit, open the Report to monitor scores.</div>
          <a href={`/assignment/${params.id}/report`} className="btn-secondary">Open Report</a>
        </div>
      </div>
    </div>
  );
}


