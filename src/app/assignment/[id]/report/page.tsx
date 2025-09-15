"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ReportTable from '@/components/ReportTable';

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/report?assignmentId=${params.id}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    load();
  }, [params.id]);

  function downloadCSV() {
    if (!data) return;
    const rows = data.rows || [];
    const header = ['student_name', 'total_score', 'total_max'];
    const csvRows = [header.join(',')];
    for (const r of rows) {
      csvRows.push([r.student_name, r.total_score, r.total_max].join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'report.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div>Loading report…</div>;
  if (!data) return <div>Report failed to load.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Report — {data.assignment?.title}</h1>
        <button onClick={downloadCSV} className="rounded border px-3 py-1">Download CSV</button>
      </div>
      <ReportTable problems={data.problems || []} rows={data.rows || []} />
    </div>
  );
}


