# Goblins Auto-Grader (Vision-Only) — MVP

This app lets a teacher create an assignment (1–N problems), auto-generate & edit an LLM rubric, share a link with students, and view a report of scores. A student opens the link, solves on a whiteboard (pen/eraser), presses Submit & Next, gets a score per problem, and finishes. Grading uses a vision model on the saved PNG plus the rubric (no live AI tutoring). Everything persists in Supabase; deploy on Vercel. This creates repeat value for free-tier users without cannibalizing premium real-time feedback.

## Tech Stack
- Next.js (App Router, TypeScript, Tailwind)
- Supabase: Postgres + Storage (bucket: `submission-images`)
- OpenRouter: vision model with structured JSON output
- Hosted on Vercel

## Environment
Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=...

# Optional models
OPENROUTER_VISION_MODEL=meta-llama/llama-3.2-90b-vision-instruct
OPENROUTER_RUBRIC_MODEL=meta-llama/llama-3.2-90b-vision-instruct
```

## Database Migration
Run in Supabase SQL editor:

```
create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid,
  role text check (role in ('teacher','student')) not null,
  display_name text,
  created_at timestamptz default now()
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  created_at timestamptz default now()
);

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  "order" int not null,
  prompt_text text not null,
  rubric_json jsonb not null
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  work_text text,
  answer_image_url text not null,
  created_at timestamptz default now()
);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  score_numeric numeric not null,
  score_max numeric not null,
  feedback_text text,
  graded_by text check (graded_by in ('vision')) not null,
  created_at timestamptz default now()
);

create index on public.assignments (teacher_id);
create index on public.problems (assignment_id, "order");
create index on public.submissions (problem_id, student_id);
create index on public.grades (submission_id);
```

### Schema Explanation
- `users`: teachers and students; `auth_id` can link to Supabase Auth for teachers.
- `assignments`: teacher-owned containers.
- `problems`: ordered prompts with `rubric_json`.
- `submissions`: student × problem; stores PNG URL.
- `grades`: numeric score and brief rationale from the model.

RLS: disabled for MVP. Later, enable RLS and add policies (examples included in comments of migration section in the issue).

## Storage
Create bucket `submission-images`. For MVP, set to public (or keep private and return signed URLs server-side).

## Rubric JSON (strict)
```
{
  "type": "vision_numeric" | "vision_one_of" | "vision_text",
  "expected": { "value_numeric": 5, "tolerance": 0 },
  "acceptable_strings": ["5","five"],
  "instructions": "What to check in the image (units, final box, etc.)",
  "partial_credit_rules": [
    {"condition":"correct method but arithmetic slip","score":0.5}
  ]
}
```

## Grade JSON (strict)
```
{ "score": 0 | 0.5 | 1, "score_max": 1, "rationale": "<one sentence>" }
```

## User Journeys
- Teacher: Dashboard → New Assignment → Add problems → Generate Rubric (LLM) → Save → Share link → Report (scores + thumbnails + rationale); Download CSV.
- Student: Start (name) → Problem page: Whiteboard (Pen/Eraser/Save) → Submit & Next → sees score → Finish → Totals.

Student banner copy: “Heads up: AI feedback is OFF. You’ll see your score after submit. Use the whiteboard to show your work.”

## API Contracts
- POST `/api/assignments` → { title } → { id }
- POST `/api/problems` → { assignmentId, order, promptText } → { id }
- POST `/api/rubric` → { problemId, promptText, type } → { rubricJson }
- POST `/api/join-as-student` → { assignmentId, displayName } → { studentId }
- POST `/api/submit` → { problemId, studentId, workText, answerImageUrl } → { submissionId }
- POST `/api/grade` → { submissionId } → { gradeId, score, max, feedback, gradedBy }
- GET `/api/report?assignmentId=...` → report JSON (assignment, problems, rows[])

## Pages
- Dashboard: minimal CTA to create demo assignment
- Build: add problems, generate/edit rubric JSON
- Share: copy student link
- Start: student name input + banner
- Problem: prompt, whiteboard, optional notes, Submit & Next with score
- Report: students × problems grid, thumbnails drawer, CSV

## Instrumentation (minimal)
Console-level or DB events: `assignment_created`, `rubric_generated`, `student_joined`, `submission_created`, `graded_vision`, `report_viewed`.

## Acceptance Criteria
- Teacher can create assignment, add ≥1 problem, generate & edit a rubric
- Student can join via link, draw on whiteboard, submit, and see a score
- Teacher can open Report elsewhere and see persisted scores + PNG thumbnails + rationale
- Rubric & grading use a vision model via OpenRouter with structured JSON
- Deployed on Vercel; README documents env, schema, journeys, API, and acceptance criteria

## Develop & Deploy
```
pnpm i # or npm i / yarn
pnpm dev # http://localhost:3000
```

On Vercel: set the same env vars; add Supabase URL/keys and OpenRouter key.


