"use client";
import { useMemo, useState } from 'react';

type Problem = { id: string; order: number; prompt_text: string };
type Row = {
  student_id: string;
  student_name: string;
  problem_scores: { problem_id: string; score: number; max: number }[];
  total_score: number;
  total_max: number;
  artifacts: { problem_id: string; image_url: string }[];
};

export default function ReportTable({ problems, rows }: { problems: Problem[]; rows: Row[] }) {
  const [openRow, setOpenRow] = useState<Row | null>(null);
  const problemById = useMemo(() => Object.fromEntries(problems.map(p => [p.id, p])), [problems]);

  return (
    <div className="mt-4">
      <div className="overflow-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Student</th>
              {problems.map(p => (
                <th key={p.id} className="px-3 py-2 text-left font-medium">P{p.order}</th>
              ))}
              <th className="px-3 py-2 text-left font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.student_id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setOpenRow(r)}>
                <td className="px-3 py-2">{r.student_name}</td>
                {problems.map(p => {
                  const score = r.problem_scores.find(s => s.problem_id === p.id);
                  return <td key={p.id} className="px-3 py-2">{score ? `${score.score}/${score.max}` : '-'}</td>;
                })}
                <td className="px-3 py-2 font-medium">{r.total_score}/{r.total_max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openRow && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpenRow(null)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{openRow.student_name}</h3>
              <button onClick={() => setOpenRow(null)} className="rounded border px-2 py-1">Close</button>
            </div>
            <div className="mt-4 space-y-6">
              {openRow.artifacts.map(a => (
                <div key={a.problem_id} className="rounded border p-3">
                  <div className="text-sm text-gray-600">P{problemById[a.problem_id]?.order}: {problemById[a.problem_id]?.prompt_text}</div>
                  <div className="mt-2">
                    <img src={a.image_url} alt="submission" className="max-w-full rounded border" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


