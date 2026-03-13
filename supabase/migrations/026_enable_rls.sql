-- Enable Row Level Security on user tables
alter table user_favorites enable row level security;
alter table user_preferences enable row level security;
alter table user_alerts enable row level security;

create policy "Users can manage own favorites"
  on user_favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own preferences"
  on user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own alerts"
  on user_alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Enable RLS on public tables with open read access
alter table cities enable row level security;
alter table regions enable row level security;
alter table venues enable row level security;
alter table artists enable row level security;
alter table events enable row level security;

create policy "Public read access" on cities for select using (true);
create policy "Public read access" on regions for select using (true);
create policy "Public read access" on venues for select using (true);
create policy "Public read access" on artists for select using (true);
create policy "Public read access" on events for select using (true);
