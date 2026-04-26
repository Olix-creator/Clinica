-- Migration 0014 — Clinic geolocation and proximity search
--
-- Adds coordinates and metadata to clinics, then exposes a secure RPC
-- for public proximity search used by /search map and near-me flows.

alter table public.clinics
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_source text,
  add column if not exists location_accuracy_m integer,
  add column if not exists last_geocoded_at timestamptz;

alter table public.clinics
  drop constraint if exists clinics_latitude_range,
  drop constraint if exists clinics_longitude_range,
  drop constraint if exists clinics_location_source_check,
  drop constraint if exists clinics_location_accuracy_positive;

alter table public.clinics
  add constraint clinics_latitude_range
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  add constraint clinics_longitude_range
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  add constraint clinics_location_source_check
    check (
      location_source is null or location_source in ('map_pin', 'address_geocode', 'manual_coords')
    ),
  add constraint clinics_location_accuracy_positive
    check (location_accuracy_m is null or location_accuracy_m >= 0);

create index if not exists clinics_geo_lookup_idx
  on public.clinics (status, city, specialty, latitude, longitude);

create index if not exists clinics_latitude_idx
  on public.clinics (latitude)
  where latitude is not null;

create index if not exists clinics_longitude_idx
  on public.clinics (longitude)
  where longitude is not null;

create or replace function public.haversine_km(
  p_lat1 double precision,
  p_lon1 double precision,
  p_lat2 double precision,
  p_lon2 double precision
)
returns double precision
language sql
immutable
as $$
  select 6371.0 * acos(
    least(
      1.0,
      greatest(
        -1.0,
        cos(radians(p_lat1)) * cos(radians(p_lat2)) * cos(radians(p_lon2 - p_lon1))
        + sin(radians(p_lat1)) * sin(radians(p_lat2))
      )
    )
  );
$$;

create or replace function public.search_clinics_nearby(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km double precision default 10,
  p_city text default null,
  p_specialty text default null,
  p_query text default null,
  p_limit integer default 48
)
returns table (
  id uuid,
  name text,
  phone text,
  address text,
  city text,
  specialty text,
  description text,
  status text,
  latitude double precision,
  longitude double precision,
  distance_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  with scoped as (
    select
      c.*,
      public.haversine_km(p_latitude, p_longitude, c.latitude, c.longitude) as distance_km
    from public.clinics c
    where c.status = 'approved'
      and c.latitude is not null
      and c.longitude is not null
      and (p_city is null or lower(c.city) like '%' || lower(p_city) || '%')
      and (p_specialty is null or lower(c.specialty) like '%' || lower(p_specialty) || '%')
      and (
        p_query is null
        or lower(c.name) like '%' || lower(p_query) || '%'
        or lower(c.description) like '%' || lower(p_query) || '%'
        or lower(c.specialty) like '%' || lower(p_query) || '%'
      )
  )
  select
    s.id,
    s.name,
    s.phone,
    s.address,
    s.city,
    s.specialty,
    s.description,
    s.status::text,
    s.latitude,
    s.longitude,
    s.distance_km
  from scoped s
  where s.distance_km <= greatest(0.5, least(coalesce(p_radius_km, 10), 100))
  order by s.distance_km asc, s.id asc
  limit greatest(1, least(coalesce(p_limit, 48), 100));
$$;

grant execute on function public.search_clinics_nearby(
  double precision,
  double precision,
  double precision,
  text,
  text,
  text,
  integer
) to anon, authenticated;
