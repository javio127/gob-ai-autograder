create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid,
  role text check (role in ('teacher','student')) not null,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  created_at timestamptz default now()
);

create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  "order" int not null,
  prompt_text text not null,
  rubric_json jsonb not null
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  work_text text,
  answer_image_url text not null,
  created_at timestamptz default now()
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  score_numeric numeric not null,
  score_max numeric not null,
  feedback_text text,
  graded_by text check (graded_by in ('vision')) not null,
  created_at timestamptz default now()
);

create index if not exists assignments_teacher_idx on public.assignments (teacher_id);
create index if not exists problems_assignment_order_idx on public.problems (assignment_id, "order");
create index if not exists submissions_problem_student_idx on public.submissions (problem_id, student_id);
-- Enforce one submission per student per problem for MVP
create unique index if not exists submissions_unique_problem_student on public.submissions (problem_id, student_id);
create index if not exists grades_submission_idx on public.grades (submission_id);


