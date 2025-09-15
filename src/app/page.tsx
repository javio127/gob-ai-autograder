import Link from 'next/link';

export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Teacher Dashboard</h1>
      <div className="rounded border bg-white p-4">
        <p className="text-sm text-gray-600">
          Create a new assignment and share with students. Add problems, generate/edit a rubric, then track scores.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/api/assignments?demoCreate=1"
            className="rounded bg-black px-3 py-2 text-white hover:bg-gray-800"
          >
            Quick Demo: Create Assignment
          </Link>
        </div>
      </div>
    </div>
  );
}


