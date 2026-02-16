CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE homestays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_per_night DECIMAL(19, 2) NOT NULL,
    location geometry(Point, 4326),
    amenities JSONB,
    owner_id UUID NOT NULL,
    vibe_score DOUBLE PRECISION,
    status VARCHAR(50)
);

-- Index for spatial queries
CREATE INDEX idx_homestay_location ON homestays USING GIST (location);

-- Index for text search (simulating hybrid search)
CREATE INDEX idx_homestay_text_search ON homestays USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));
