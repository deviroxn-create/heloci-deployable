create extension if not exists pgcrypto;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('government', 'ngo', 'homeowner', 'private'))
);

create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null unique,
  housing_goal text,
  status text not null default 'active'
);

create table if not exists eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  rules jsonb not null,
  unique (program_id)
);

create table if not exists question_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  question_group_id uuid not null references question_groups(id) on delete cascade,
  key text not null unique,
  label text not null,
  type text not null check (type in ('text', 'number', 'select', 'boolean')),
  options jsonb,
  is_universal boolean not null default false
);

create table if not exists program_questions (
  program_id uuid not null references programs(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  primary key (program_id, question_id)
);

create table if not exists user_profiles (
  user_id text primary key references public."User"(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public."User"(id) on delete cascade,
  program_id uuid not null references programs(id) on delete cascade,
  status text not null default 'submitted',
  data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists eligibility_results (
  user_id text not null references public."User"(id) on delete cascade,
  program_id uuid not null references programs(id) on delete cascade,
  is_eligible boolean,
  primary key (user_id, program_id)
);

-- Seed data

insert into organizations (id, name, type)
values ('11111111-1111-1111-1111-111111111111', 'Federal Housing Authority', 'government')
on conflict (id) do nothing;

insert into programs (id, organization_id, name, slug, housing_goal)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Rent-to-Own for Civil Servants',
  'rent-to-own-civil',
  'rent_to_own'
)
on conflict (slug) do nothing;

insert into question_groups (id, name, sort_order)
values
  ('33333333-3333-3333-3333-333333333333', 'Universal Profile', 1),
  ('44444444-4444-4444-4444-444444444444', 'Employment', 2)
on conflict (id) do nothing;

insert into questions (id, question_group_id, key, label, type, options, is_universal)
values
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'age', 'Age', 'number', null, true),
  ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'household_size', 'Household Size', 'number', null, true),
  ('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', 'employment_status', 'Employment Status', 'select', jsonb '[{"value":"gov_employee","label":"Government Employee"},{"value":"teacher","label":"Teacher"},{"value":"healthcare","label":"Healthcare"},{"value":"private","label":"Private Sector"}]', true),
  ('88888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', 'monthly_income', 'Monthly Income', 'number', null, true)
on conflict (id) do nothing;

insert into program_questions (program_id, question_id)
values
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555'),
  ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666'),
  ('22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777'),
  ('22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888')
on conflict do nothing;

insert into eligibility_rules (program_id, rules)
values (
  '22222222-2222-2222-2222-222222222222',
  '{"all": [{"==": [{"var": "employment_status"}, "gov_employee"]}, {">=": [{"var": "monthly_income"}, 2000]}]}'
)
on conflict (program_id) do nothing;
