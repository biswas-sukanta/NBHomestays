-- Add aggregate rating caches to homestays
ALTER TABLE homestays ADD COLUMN avg_atmosphere_rating DOUBLE PRECISION;
ALTER TABLE homestays ADD COLUMN avg_service_rating DOUBLE PRECISION;
ALTER TABLE homestays ADD COLUMN avg_accuracy_rating DOUBLE PRECISION;
ALTER TABLE homestays ADD COLUMN avg_value_rating DOUBLE PRECISION;
ALTER TABLE homestays ADD COLUMN total_reviews INTEGER DEFAULT 0;
