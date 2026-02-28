-- Update reviews table for categorical ratings
ALTER TABLE reviews ADD COLUMN atmosphere_rating INTEGER;
ALTER TABLE reviews ADD COLUMN service_rating INTEGER;
ALTER TABLE reviews ADD COLUMN accuracy_rating INTEGER;
ALTER TABLE reviews ADD COLUMN value_rating INTEGER;
