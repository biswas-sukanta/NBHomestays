-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    homestay_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    photos TEXT[],
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    wifi_speed INTEGER,
    cleanliness INTEGER,
    view_rating INTEGER
);

-- Index for Homestay Lookup
CREATE INDEX idx_reviews_homestay_id ON reviews(homestay_id);
