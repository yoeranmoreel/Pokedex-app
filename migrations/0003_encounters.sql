ALTER TABLE sightings ADD COLUMN encounters INTEGER NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sightings_unique_species ON sightings(user_id, lower(coalesce(nullif(trim(scientific_name), ''), trim(species))));
