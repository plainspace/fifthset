-- Add regions for DC and Philadelphia (new scraper cities)

insert into regions (city_id, slug, name)
select c.id, r.slug, r.name
from cities c
cross join lateral (
  values
    ('u-street', 'U Street'),
    ('georgetown', 'Georgetown'),
    ('adams-morgan', 'Adams Morgan'),
    ('capitol-hill', 'Capitol Hill'),
    ('downtown', 'Downtown'),
    ('upper-nw', 'Upper NW'),
    ('southwest', 'Southwest'),
    ('takoma', 'Takoma'),
    ('maryland', 'Maryland'),
    ('virginia', 'Virginia')
) as r(slug, name)
where c.slug = 'dc';

insert into regions (city_id, slug, name)
select c.id, r.slug, r.name
from cities c
cross join lateral (
  values
    ('center-city', 'Center City'),
    ('south-broad', 'South Broad'),
    ('university-city', 'University City'),
    ('old-city', 'Old City'),
    ('germantown', 'Germantown'),
    ('main-line', 'Main Line')
) as r(slug, name)
where c.slug = 'philly';
