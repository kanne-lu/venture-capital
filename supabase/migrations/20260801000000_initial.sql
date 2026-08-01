create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('investor', 'fa', 'government', 'project', 'admin')),
  account_status text not null default 'pending_email' check (account_status in ('pending_email', 'pending_review', 'approved', 'rejected', 'suspended')),
  admin_role text check (admin_role in ('super_admin', 'reviewer')),
  subject_name text not null default '待完善主体',
  contact_name text,
  phone text,
  public_bio text,
  public_visible boolean not null default false,
  email_verified_at timestamptz,
  approval_reason text,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  terms_version text not null default '2026-08-01',
  terms_accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references public.profiles(id) on delete cascade,
  role text not null check (role in ('investor', 'fa', 'government', 'project')),
  name text not null,
  slug text unique,
  location text,
  logo_path text,
  verification_status text not null default 'unsubmitted' check (verification_status in ('unsubmitted', 'pending', 'verified', 'rejected')),
  verification_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.profile_contacts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email text,
  phone text,
  contact_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.investor_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  institution_type text,
  industries text[] not null default '{}',
  stages text[] not null default '{}',
  regions text[] not null default '{}',
  ticket_min numeric(18, 2),
  ticket_max numeric(18, 2),
  introduction text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.fa_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  industries text[] not null default '{}',
  regions text[] not null default '{}',
  specialties text[] not null default '{}',
  cases jsonb not null default '[]'::jsonb,
  introduction text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.government_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  department text,
  region text,
  focus_industries text[] not null default '{}',
  policy_text text,
  introduction text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.project_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  company_description text,
  registration_number text,
  team_summary text,
  introduction text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'archived')),
  review_reason text,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  company text not null,
  summary text not null,
  industry text not null,
  stage text not null,
  city text not null,
  amount numeric(18, 2),
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'published', 'revision_requested', 'rejected', 'archived')),
  review_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  body text not null,
  status text not null default 'pending_review' check (status in ('draft', 'pending_review', 'published', 'rejected', 'archived')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bp_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  version integer not null check (version > 0),
  status text not null default 'active' check (status in ('active', 'archived', 'pending_delete')),
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.bp_access_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'revoked', 'expired')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, requested_by, status)
);

create table public.collaboration_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  government_opportunity_id uuid,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_organization_id uuid not null references public.organizations(id) on delete cascade,
  request_type text not null check (request_type in ('investment_intent', 'fa_service', 'government_landing')),
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (project_id is not null or government_opportunity_id is not null)
);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, project_id)
);

create table public.investor_pipeline_items (
  id uuid primary key default gen_random_uuid(),
  investor_user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  stage text not null default 'to_review' check (stage in ('to_review', 'contacted', 'due_diligence', 'decision', 'completed')),
  private_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (investor_user_id, project_id)
);

create table public.government_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  region text not null,
  industries text[] not null default '{}',
  requirements text not null,
  policy_support text,
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'published', 'revision_requested', 'rejected', 'archived')),
  review_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.fa_recommendations (
  id uuid primary key default gen_random_uuid(),
  fa_organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  investor_organization_id uuid references public.organizations(id) on delete set null,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'completed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  detail text not null,
  kind text not null default 'system',
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.content_entries (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('platform_page', 'announcement', 'insight', 'help')),
  slug text not null unique,
  title text not null,
  summary text,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  content_entry_id uuid references public.content_entries(id) on delete cascade,
  reason text not null,
  detail text,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolution text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  check (project_id is not null or organization_id is not null or content_entry_id is not null)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.data_export_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'expired', 'rejected')),
  download_path text,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  processed_by uuid references public.profiles(id) on delete set null
);

create table public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  terms_version text not null,
  accepted_at timestamptz not null default timezone('utc', now()),
  unique (user_id, terms_version)
);

create index organizations_owner_user_id_idx on public.organizations (owner_user_id);
create index organizations_role_status_idx on public.organizations (role, verification_status);
create index verification_documents_organization_id_idx on public.verification_documents (organization_id);
create index verification_documents_status_idx on public.verification_documents (status);
create index projects_organization_id_idx on public.projects (organization_id);
create index projects_status_created_at_idx on public.projects (status, created_at desc, id desc);
create index projects_industry_stage_city_idx on public.projects (industry, stage, city);
create index project_updates_project_id_idx on public.project_updates (project_id);
create index bp_assets_project_id_idx on public.bp_assets (project_id);
create index bp_access_requests_project_id_idx on public.bp_access_requests (project_id);
create index bp_access_requests_requested_by_idx on public.bp_access_requests (requested_by);
create index collaboration_requests_project_id_idx on public.collaboration_requests (project_id);
create index collaboration_requests_recipient_organization_id_idx on public.collaboration_requests (recipient_organization_id);
create index government_opportunities_organization_id_idx on public.government_opportunities (organization_id);
create index government_opportunities_status_created_at_idx on public.government_opportunities (status, created_at desc, id desc);
create index fa_recommendations_project_id_idx on public.fa_recommendations (project_id);
create index notifications_recipient_created_at_idx on public.notifications (recipient_user_id, created_at desc, id desc);
create index content_entries_type_status_idx on public.content_entries (content_type, status);
create index reports_status_created_at_idx on public.reports (status, created_at desc, id desc);
create index audit_logs_actor_created_at_idx on public.audit_logs (actor_user_id, created_at desc, id desc);
create index data_export_requests_user_id_idx on public.data_export_requests (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger profile_contacts_set_updated_at before update on public.profile_contacts for each row execute function public.set_updated_at();
create trigger investor_profiles_set_updated_at before update on public.investor_profiles for each row execute function public.set_updated_at();
create trigger fa_profiles_set_updated_at before update on public.fa_profiles for each row execute function public.set_updated_at();
create trigger government_profiles_set_updated_at before update on public.government_profiles for each row execute function public.set_updated_at();
create trigger project_profiles_set_updated_at before update on public.project_profiles for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger project_updates_set_updated_at before update on public.project_updates for each row execute function public.set_updated_at();
create trigger collaboration_requests_set_updated_at before update on public.collaboration_requests for each row execute function public.set_updated_at();
create trigger investor_pipeline_set_updated_at before update on public.investor_pipeline_items for each row execute function public.set_updated_at();
create trigger government_opportunities_set_updated_at before update on public.government_opportunities for each row execute function public.set_updated_at();
create trigger fa_recommendations_set_updated_at before update on public.fa_recommendations for each row execute function public.set_updated_at();
create trigger content_entries_set_updated_at before update on public.content_entries for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and admin_role in ('super_admin', 'reviewer')
  );
$$;

create or replace function public.is_public_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = profile_id
      and account_status = 'approved'
      and public_visible
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'project');
  v_subject_name text := nullif(trim(new.raw_user_meta_data ->> 'subject_name'), '');
  v_contact_name text := nullif(trim(new.raw_user_meta_data ->> 'contact_name'), '');
  v_phone text := nullif(trim(new.raw_user_meta_data ->> 'phone'), '');
  v_organization_id uuid;
begin
  if v_role not in ('investor', 'fa', 'government', 'project') then
    v_role := 'project';
  end if;

  insert into public.profiles (
    id, role, account_status, subject_name, contact_name, phone,
    email_verified_at, terms_version, terms_accepted_at
  ) values (
    new.id,
    v_role,
    case when new.email_confirmed_at is null then 'pending_email' else 'pending_review' end,
    coalesce(v_subject_name, '待完善主体'),
    v_contact_name,
    v_phone,
    new.email_confirmed_at,
    coalesce(new.raw_user_meta_data ->> 'terms_version', '2026-08-01'),
    case when coalesce(new.raw_user_meta_data ->> 'terms_accepted', 'false') = 'true' then timezone('utc', now()) else null end
  );

  insert into public.organizations (owner_user_id, role, name)
  values (new.id, v_role, coalesce(v_subject_name, '待完善主体'))
  returning id into v_organization_id;

  insert into public.profile_contacts (user_id, email, phone, contact_name)
  values (new.id, new.email, v_phone, v_contact_name);

  if v_role = 'investor' then
    insert into public.investor_profiles (organization_id) values (v_organization_id);
  elsif v_role = 'fa' then
    insert into public.fa_profiles (organization_id) values (v_organization_id);
  elsif v_role = 'government' then
    insert into public.government_profiles (organization_id) values (v_organization_id);
  else
    insert into public.project_profiles (organization_id) values (v_organization_id);
  end if;

  return new;
end;
$$;

create or replace function public.handle_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.profiles
    set account_status = case when account_status = 'pending_email' then 'pending_review' else account_status end,
        email_verified_at = new.email_confirmed_at
    where id = new.id;
  end if;
  return new;
end;
$$;

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) = old.id and not public.is_admin() then
    new.role = old.role;
    new.account_status = old.account_status;
    new.admin_role = old.admin_role;
    new.email_verified_at = old.email_verified_at;
    new.approved_at = old.approved_at;
    new.approved_by = old.approved_by;
  end if;
  return new;
end;
$$;

create trigger auth_users_after_insert
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger auth_users_after_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_email_confirmed();

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

create or replace function public.project_id_from_storage_path(object_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  first_part text := split_part(object_name, '/', 1);
begin
  if first_part !~ '^[0-9a-fA-F-]{36}$' then
    return null;
  end if;
  return first_part::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create or replace function public.can_manage_project_file(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
       from public.projects p
       join public.organizations o on o.id = p.organization_id
       join public.profiles profile on profile.id = o.owner_user_id
       where p.id = public.project_id_from_storage_path(object_name)
         and o.owner_user_id = (select auth.uid())
         and profile.account_status = 'approved'
    );
$$;

create or replace function public.can_view_project_file(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_project_file(object_name)
    or exists (
      select 1
       from public.bp_assets a
       join public.bp_access_requests r on r.project_id = a.project_id
       join public.profiles profile on profile.id = r.requested_by
       where a.storage_path = object_name
         and r.requested_by = (select auth.uid())
         and profile.account_status = 'approved'
        and r.status = 'approved'
        and (r.expires_at is null or r.expires_at > timezone('utc', now()))
    );
$$;

create or replace function public.guard_project_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and new.status = 'published' and old.status <> 'published' then
    raise exception 'Only an approved administrator can publish a project';
  end if;
  return new;
end;
$$;

create trigger projects_guard_publish
  before update on public.projects
  for each row execute function public.guard_project_publish();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bp-private',
  'bp-private',
  false,
  52428800,
  array['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.investor_profiles enable row level security;
alter table public.fa_profiles enable row level security;
alter table public.government_profiles enable row level security;
alter table public.project_profiles enable row level security;
alter table public.verification_documents enable row level security;
alter table public.projects enable row level security;
alter table public.project_updates enable row level security;
alter table public.bp_assets enable row level security;
alter table public.bp_access_requests enable row level security;
alter table public.collaboration_requests enable row level security;
alter table public.favorites enable row level security;
alter table public.investor_pipeline_items enable row level security;
alter table public.government_opportunities enable row level security;
alter table public.fa_recommendations enable row level security;
alter table public.notifications enable row level security;
alter table public.content_entries enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.data_export_requests enable row level security;
alter table public.terms_acceptances enable row level security;

create policy profiles_select_self_or_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy profiles_update_self_or_admin on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

create policy organizations_select_public_owner_admin on public.organizations
  for select to anon, authenticated
  using (
    (
      public.is_public_profile(owner_user_id)
      and verification_status = 'verified'
    )
    or owner_user_id = (select auth.uid())
    or public.is_admin()
  );

create policy organizations_insert_owner_or_admin on public.organizations
  for insert to authenticated
  with check (owner_user_id = (select auth.uid()) or public.is_admin());

create policy organizations_update_owner_or_admin on public.organizations
  for update to authenticated
  using (owner_user_id = (select auth.uid()) or public.is_admin())
  with check (owner_user_id = (select auth.uid()) or public.is_admin());

create policy profile_contacts_owner_or_admin on public.profile_contacts
  for all to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy investor_profiles_select_public_owner_admin on public.investor_profiles
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.organizations o
       where o.id = organization_id
         and ((o.owner_user_id = (select auth.uid())) or (public.is_public_profile(o.owner_user_id) and o.verification_status = 'verified'))
    )
  );

create policy investor_profiles_owner_admin on public.investor_profiles
  for all to authenticated
  using (public.is_admin() or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())))
  with check (public.is_admin() or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())));

create policy fa_profiles_select_public_owner_admin on public.fa_profiles
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.organizations o
       where o.id = organization_id
         and ((o.owner_user_id = (select auth.uid())) or (public.is_public_profile(o.owner_user_id) and o.verification_status = 'verified'))
    )
  );

create policy fa_profiles_owner_admin on public.fa_profiles
  for all to authenticated
  using (public.is_admin() or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())))
  with check (public.is_admin() or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())));

create policy government_profiles_select_public_owner_admin on public.government_profiles
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.organizations o
       where o.id = organization_id
         and ((o.owner_user_id = (select auth.uid())) or (public.is_public_profile(o.owner_user_id) and o.verification_status = 'verified'))
    )
  );

create policy government_profiles_owner_admin on public.government_profiles
  for all to authenticated
  using (public.is_admin() or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())))
  with check (public.is_admin() or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())));

create policy project_profiles_select_public_owner_admin on public.project_profiles
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.organizations o
       where o.id = organization_id
         and ((o.owner_user_id = (select auth.uid())) or (public.is_public_profile(o.owner_user_id) and o.verification_status = 'verified'))
    )
  );

create policy project_profiles_owner_admin on public.project_profiles
  for all to authenticated
  using (public.is_admin() or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())))
  with check (public.is_admin() or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())));

create policy verification_documents_owner_admin on public.verification_documents
  for all to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid()))
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid()))
  );

create policy projects_select_public_owner_admin on public.projects
  for select to anon, authenticated
  using (
    status = 'published'
    or public.is_admin()
    or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid()))
  );

create policy projects_insert_project_owner_admin on public.projects
  for insert to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.organizations o
      join public.profiles p on p.id = o.owner_user_id
      where o.id = organization_id and o.owner_user_id = (select auth.uid()) and p.role = 'project' and p.account_status = 'approved'
    )
  );

create policy projects_update_owner_admin on public.projects
  for update to authenticated
  using (public.is_admin() or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())))
  with check (public.is_admin() or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())));

create policy project_updates_owner_admin on public.project_updates
  for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.projects p
      join public.organizations o on o.id = p.organization_id
      where p.id = project_id and o.owner_user_id = (select auth.uid())
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.projects p
      join public.organizations o on o.id = p.organization_id
      where p.id = project_id and o.owner_user_id = (select auth.uid())
    )
  );

create policy bp_assets_owner_admin_or_authorized on public.bp_assets
  for select to authenticated
  using (public.can_view_project_file(storage_path));

create policy bp_assets_owner_admin_insert on public.bp_assets
  for insert to authenticated
  with check (public.can_manage_project_file(storage_path));

create policy bp_assets_owner_admin_update on public.bp_assets
  for update to authenticated
  using (public.can_manage_project_file(storage_path))
  with check (public.can_manage_project_file(storage_path));

create policy bp_access_requests_requester_owner_admin on public.bp_access_requests
  for select to authenticated
  using (
    requested_by = (select auth.uid())
    or public.is_admin()
    or exists (
      select 1 from public.projects p
      join public.organizations o on o.id = p.organization_id
      where p.id = project_id and o.owner_user_id = (select auth.uid())
    )
  );

create policy bp_access_requests_insert_verified_user on public.bp_access_requests
  for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and exists (
      select 1 from public.profiles requester
      where requester.id = (select auth.uid())
        and requester.account_status = 'approved'
        and requester.role in ('investor', 'fa', 'government')
    )
    and exists (select 1 from public.projects p where p.id = project_id and p.status = 'published')
  );

create policy bp_access_requests_owner_admin_update on public.bp_access_requests
  for update to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.projects p
      join public.organizations o on o.id = p.organization_id
      where p.id = project_id and o.owner_user_id = (select auth.uid())
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.projects p
      join public.organizations o on o.id = p.organization_id
      where p.id = project_id and o.owner_user_id = (select auth.uid())
    )
  );

create policy collaboration_requests_participants_admin on public.collaboration_requests
  for all to authenticated
  using (
    public.is_admin()
    or requester_id = (select auth.uid())
    or exists (select 1 from public.organizations o where o.id = recipient_organization_id and o.owner_user_id = (select auth.uid()))
  )
  with check (
    public.is_admin()
    or requester_id = (select auth.uid())
    or exists (select 1 from public.organizations o where o.id = recipient_organization_id and o.owner_user_id = (select auth.uid()))
  );

create policy favorites_owner_only on public.favorites
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy investor_pipeline_owner_only on public.investor_pipeline_items
  for all to authenticated
  using (investor_user_id = (select auth.uid()))
  with check (investor_user_id = (select auth.uid()));

create policy government_opportunities_select_public_owner_admin on public.government_opportunities
  for select to anon, authenticated
  using (
    status = 'published'
    or public.is_admin()
    or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid()))
  );

create policy government_opportunities_owner_admin_write on public.government_opportunities
  for all to authenticated
  using (public.is_admin() or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())))
  with check (public.is_admin() or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid())));

create policy fa_recommendations_participants_admin on public.fa_recommendations
  for all to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.organizations o where o.id = fa_organization_id and o.owner_user_id = (select auth.uid()))
    or exists (select 1 from public.organizations o where o.id = investor_organization_id and o.owner_user_id = (select auth.uid()))
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.organizations o where o.id = fa_organization_id and o.owner_user_id = (select auth.uid()))
  );

create policy notifications_owner_admin on public.notifications
  for all to authenticated
  using (recipient_user_id = (select auth.uid()) or public.is_admin())
  with check (recipient_user_id = (select auth.uid()) or public.is_admin());

create policy content_entries_public_or_admin on public.content_entries
  for select to anon, authenticated
  using (status = 'published' or public.is_admin());

create policy content_entries_admin_write on public.content_entries
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy reports_reporter_admin on public.reports
  for all to authenticated
  using (reporter_id = (select auth.uid()) or public.is_admin())
  with check (reporter_id = (select auth.uid()) or public.is_admin());

create policy audit_logs_admin_only on public.audit_logs
  for select to authenticated
  using (public.is_admin());

create policy data_export_requests_owner_admin on public.data_export_requests
  for all to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy terms_acceptances_owner_admin on public.terms_acceptances
  for all to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy bp_storage_select_authorized on storage.objects
  for select to authenticated
  using (bucket_id = 'bp-private' and public.can_view_project_file(name));

create policy bp_storage_insert_owner_admin on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bp-private' and public.can_manage_project_file(name));

create policy bp_storage_update_owner_admin on storage.objects
  for update to authenticated
  using (bucket_id = 'bp-private' and public.can_manage_project_file(name))
  with check (bucket_id = 'bp-private' and public.can_manage_project_file(name));

create policy bp_storage_delete_owner_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'bp-private' and public.can_manage_project_file(name));
