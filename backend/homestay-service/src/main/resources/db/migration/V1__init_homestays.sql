-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create Homestays Table
CREATE TABLE homestays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location_name VARCHAR(255) NOT NULL,
    location_point GEOMETRY(Point, 4326),
    price_per_night DECIMAL(19, 2) NOT NULL,
    amenities JSONB,
    search_vector TSVECTOR,
    status VARCHAR(50) NOT NULL,
    vibe_score DECIMAL(3, 1), 
    images TEXT[] -- Array of image URLs
);

-- Index for Full Text Search
CREATE INDEX idx_homestays_search ON homestays USING GIN(search_vector);

-- Index for JSONB Amenities
CREATE INDEX idx_homestays_amenities ON homestays USING GIN(amenities);

-- Index for Geospatial Search
CREATE INDEX idx_homestays_location ON homestays USING GIST(location_point);

-- Function to update search_vector automatically
CREATE OR REPLACE FUNCTION homestays_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', NEW.title), 'A') || 
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', NEW.location_name), 'C');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger to update search_vector
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON homestays FOR EACH ROW EXECUTE FUNCTION homestays_search_vector_update();
