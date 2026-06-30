grant select on public.countries to anon, authenticated;
grant select on public.administrative_regions to anon, authenticated;
grant select on public.cities to anon, authenticated;

drop policy if exists "Enable public read for active countries" on public.countries;
drop policy if exists "Enable public read for active administrative regions" on public.administrative_regions;
drop policy if exists "Enable public read for active cities" on public.cities;

create policy "Enable public read for active countries"
on public.countries
for select
to anon, authenticated
using (is_active = true);

create policy "Enable public read for active administrative regions"
on public.administrative_regions
for select
to anon, authenticated
using (is_active = true);

create policy "Enable public read for active cities"
on public.cities
for select
to anon, authenticated
using (is_active = true);
