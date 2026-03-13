create table pending_events (
  id uuid primary key default uuid_generate_v4(),
  artist text not null,
  venue text not null,
  date date not null,
  time text not null,
  city text not null,
  genre text,
  venue_url text,
  description text,
  submitter_email text not null,
  submitter_name text,
  submitter_role text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

alter table pending_events enable row level security;

create policy "Service role only"
  on pending_events for all
  using (false)
  with check (false);

create index idx_pending_events_status on pending_events(status);
create index idx_pending_events_created on pending_events(created_at desc);
