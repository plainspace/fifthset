-- Fifth Set Database Schema

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Cities
create table cities (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  timezone text not null default 'America/New_York',
  created_at timestamptz default now()
);

-- Regions (boroughs, neighborhoods, areas)
create table regions (
  id uuid primary key default uuid_generate_v4(),
  city_id uuid references cities(id) on delete cascade,
  slug text not null,
  name text not null,
  unique(city_id, slug)
);

-- Venues
create table venues (
  id uuid primary key default uuid_generate_v4(),
  city_id uuid references cities(id) on delete cascade,
  region_id uuid references regions(id),
  name text not null,
  slug text not null,
  address text,
  neighborhood text,
  lat double precision,
  lng double precision,
  website text,
  phone text,
  photo_url text,
  sponsor_tier text not null default 'free' check (sponsor_tier in ('free', 'spotlight', 'marquee')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(city_id, slug)
);

-- Artists
create table artists (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  website text,
  photo_url text,
  created_at timestamptz default now()
);

-- Events (individual shows/sets)
create table events (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid references venues(id) on delete cascade,
  artist_id uuid references artists(id) on delete set null,
  date date not null,
  start_time time not null,
  end_time time,
  description text,
  source_url text,
  is_boosted boolean default false,
  created_at timestamptz default now()
);

-- User favorites (Phase 2)
create table user_favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  venue_id uuid references venues(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, venue_id)
);

-- User preferences (Phase 2)
create table user_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique,
  home_city_id uuid references cities(id),
  default_region_id uuid references regions(id),
  default_time_filter text,
  notification_prefs jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User alerts (Phase 3)
create table user_alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  alert_type text not null check (alert_type in ('venue', 'artist', 'filter')),
  target_id uuid,
  filter_config jsonb,
  active boolean default true,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index idx_events_date on events(date);
create index idx_events_venue_date on events(venue_id, date);
create index idx_events_artist on events(artist_id);
create index idx_venues_city on venues(city_id);
create index idx_venues_sponsor on venues(sponsor_tier) where sponsor_tier != 'free';
create index idx_regions_city on regions(city_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger venues_updated_at
  before update on venues
  for each row execute function update_updated_at();

create trigger user_preferences_updated_at
  before update on user_preferences
  for each row execute function update_updated_at();

-- Seed data: Cities
insert into cities (slug, name, lat, lng, timezone) values
  ('nyc', 'New York City', 40.7128, -74.0060, 'America/New_York'),
  ('chicago', 'Chicago', 41.8781, -87.6298, 'America/Chicago'),
  ('nola', 'New Orleans', 29.9511, -90.0715, 'America/Chicago'),
  ('la', 'Los Angeles', 34.0522, -118.2437, 'America/Los_Angeles'),
  ('sf', 'San Francisco', 37.7749, -122.4194, 'America/Los_Angeles');

-- Seed data: Regions
insert into regions (city_id, slug, name)
select c.id, r.slug, r.name
from cities c
cross join lateral (
  values
    ('manhattan', 'Manhattan'),
    ('brooklyn', 'Brooklyn'),
    ('queens', 'Queens'),
    ('bronx', 'Bronx'),
    ('staten-island', 'Staten Island')
) as r(slug, name)
where c.slug = 'nyc';

insert into regions (city_id, slug, name)
select c.id, r.slug, r.name
from cities c
cross join lateral (
  values
    ('south-side', 'South Side'),
    ('west-side', 'West Side'),
    ('north-side', 'North Side'),
    ('loop', 'The Loop')
) as r(slug, name)
where c.slug = 'chicago';

insert into regions (city_id, slug, name)
select c.id, r.slug, r.name
from cities c
cross join lateral (
  values
    ('french-quarter', 'French Quarter'),
    ('marigny', 'Marigny'),
    ('treme', 'Tremé'),
    ('cbd', 'CBD'),
    ('uptown', 'Uptown')
) as r(slug, name)
where c.slug = 'nola';

insert into regions (city_id, slug, name)
select c.id, r.slug, r.name
from cities c
cross join lateral (
  values
    ('hollywood', 'Hollywood'),
    ('downtown', 'Downtown'),
    ('leimert-park', 'Leimert Park'),
    ('santa-monica', 'Santa Monica'),
    ('south-la', 'South LA')
) as r(slug, name)
where c.slug = 'la';

insert into regions (city_id, slug, name)
select c.id, r.slug, r.name
from cities c
cross join lateral (
  values
    ('fillmore', 'Fillmore'),
    ('north-beach', 'North Beach'),
    ('soma', 'SoMa'),
    ('mission', 'Mission')
) as r(slug, name)
where c.slug = 'sf';

-- Row Level Security (Phase 2)
-- Uncomment when adding auth:
-- alter table user_favorites enable row level security;
-- alter table user_preferences enable row level security;
-- alter table user_alerts enable row level security;
-- create policy "Users can manage own favorites" on user_favorites for all using (auth.uid() = user_id);
-- create policy "Users can manage own preferences" on user_preferences for all using (auth.uid() = user_id);
-- create policy "Users can manage own alerts" on user_alerts for all using (auth.uid() = user_id);
