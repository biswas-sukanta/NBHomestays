-- Enable PostGIS for location features
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100)
);

CREATE INDEX idx_user_email ON users(email);

-- 2. Homestays Table
CREATE TABLE homestays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_per_night DECIMAL(19, 2) NOT NULL,
    location geometry(Point, 4326),
    amenities JSONB,
    owner_id UUID NOT NULL REFERENCES users(id),
    vibe_score DOUBLE PRECISION,
    status VARCHAR(50)
);

CREATE INDEX idx_homestay_location ON homestays USING GIST (location);
CREATE INDEX idx_homestay_text_search ON homestays USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- 3. Reviews & Photos
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    homestay_id UUID NOT NULL REFERENCES homestays(id),
    user_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_photos (
    review_id UUID NOT NULL REFERENCES reviews(id),
    photo_url VARCHAR(255)
);

CREATE TABLE homestay_photos (
    homestay_id UUID NOT NULL REFERENCES homestays(id),
    photo_url VARCHAR(255)
);

-- 4. Bookings & Questions
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    homestay_id UUID NOT NULL REFERENCES homestays(id),
    user_id UUID NOT NULL REFERENCES users(id),
    check_in_date DATE,
    check_out_date DATE,
    total_price DECIMAL(19, 2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    guests INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    homestay_id UUID NOT NULL REFERENCES homestays(id),
    user_id UUID NOT NULL REFERENCES users(id),
    question_text TEXT NOT NULL,
    answer_text TEXT,
    answered_by_owner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Community Posts
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    location_name VARCHAR(255) NOT NULL,
    text_content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE post_images (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL
);

-- 6. Seed Data
-- Users (Password is 'password' or similar hash from V5)
INSERT INTO users (id, first_name, last_name, email, password, role, enabled) 
VALUES 
('11111111-1111-1111-1111-111111111111', 'Host', 'User', 'host@nbh.com', '$2a$10$JigZhmJ9jpcL17kFY.MTl.JjYMwX5RUSXPUe4WIsdWQWBQMBCunVm', 'ROLE_HOST', true),
('22222222-2222-2222-2222-222222222222', 'Guest', 'User', 'guest@nbh.com', '$2a$10$JigZhmJ9jpcL17kFY.MTl.JjYMwX5RUSXPUe4WIsdWQWBQMBCunVm', 'ROLE_USER', true),
('99999999-9999-9999-9999-999999999999', 'Admin', 'User', 'admin@nbh.com', '$2a$10$JigZhmJ9jpcL17kFY.MTl.JjYMwX5RUSXPUe4WIsdWQWBQMBCunVm', 'ROLE_ADMIN', true);

-- Homestays
INSERT INTO homestays (id, name, description, price_per_night, location, amenities, vibe_score, status, owner_id)
VALUES 
-- 1. Misty Mountain
('33333333-3333-3333-3333-333333333333', 'Misty Mountain Retreat', 'A cozy wooden cottage with best view of Kanchenjunga. Located in the heart of North Bengal.', 2500, ST_SetSRID(ST_MakePoint(88.2627, 27.0360), 4326), '{"wifi": true, "parking": true, "breakfast": true}', 4.8, 'APPROVED', '11111111-1111-1111-1111-111111111111'),
-- 2. Tea Garden
('44444444-4444-4444-4444-444444444444', 'Tea Garden Bungalow', 'Stay inside a 100-year old colonial bungalow. A hidden gem perfect for tea lovers.', 4500, ST_SetSRID(ST_MakePoint(88.2500, 27.0400), 4326), '{"wifi": true, "pool": false, "fireplace": true}', 4.9, 'APPROVED', '11111111-1111-1111-1111-111111111111'),
-- 3. River Side
('55555555-5555-5555-5555-555555555555', 'River Side Camp', 'Experience the Teesta river up close. Adventure awaits.', 1500, ST_SetSRID(ST_MakePoint(88.4500, 27.1000), 4326), '{"wifi": false, "campfire": true, "trekking": true}', 4.5, 'APPROVED', '11111111-1111-1111-1111-111111111111'),
-- 4. Sittong Orange Villa
('66666666-6666-6666-6666-666666666666', 'Sittong Orange Villa', 'Surrounded by orange orchards in the quiet hamlet of Sittong.', 1800, ST_SetSRID(ST_MakePoint(88.3600, 26.9200), 4326), '{"wifi": true, "organic_food": true}', 4.6, 'APPROVED', '11111111-1111-1111-1111-111111111111'),
-- 5. Darjeeling Cloud View
('77777777-7777-7777-7777-777777777777', 'Darjeeling Cloud View', 'Modern stay near the Mall Road with panoramic cloud views.', 3200, ST_SetSRID(ST_MakePoint(88.2650, 27.0380), 4326), '{"wifi": true, "heating": true, "elevator": true}', 4.7, 'APPROVED', '11111111-1111-1111-1111-111111111111');

-- Photos
INSERT INTO homestay_photos (homestay_id, photo_url)
VALUES
('33333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'),
('44444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'),
('55555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=80'),
('66666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'),
('77777777-7777-7777-7777-777777777777', 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80');
