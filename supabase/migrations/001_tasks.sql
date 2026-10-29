-- ToolHive: tasks table (run once in the Supabase SQL editor)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null check (char_length(title) between 1 and 200),
  notes text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  completed boolean not null default false,
  tool_id uuid references public.tools(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_idx on public.tasks (user_id, completed, due_date);

alter table public.tasks enable row level security;

create policy "tasks: owner can read"   on public.tasks for select using (auth.uid() = user_id);
create policy "tasks: owner can insert" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks: owner can update" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks: owner can delete" on public.tasks for delete using (auth.uid() = user_id);
