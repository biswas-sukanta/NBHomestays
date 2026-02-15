-- Robust clean up
TRUNCATE TABLE users, homestays, reviews, bookings, questions, review_photos, homestay_photos CASCADE;

INSERT INTO users (id, first_name, last_name, email, password, role, enabled) 
VALUES 
('11111111-1111-1111-1111-111111111111', 'Host', 'User', 'host@example.com', '$2a$10$JigZhmJ9jpcL17kFY.MTl.JjYMwX5RUSXPUe4WIsdWQWBQMBCunVm', 'ROLE_HOST', true),
('22222222-2222-2222-2222-222222222222', 'Guest', 'User', 'guest@example.com', '$2a$10$JigZhmJ9jpcL17kFY.MTl.JjYMwX5RUSXPUe4WIsdWQWBQMBCunVm', 'ROLE_USER', true);

-- Insert Homestays
INSERT INTO homestays (id, name, description, price_per_night, location, amenities, vibe_score, status, owner_id)
VALUES 
('33333333-3333-3333-3333-333333333333', 'Misty Mountain Retreat', 'A cozy wooden cottage with best view of Kanchenjunga.', 2500, ST_SetSRID(ST_MakePoint(88.2627, 27.0360), 4326), '{"wifi": true, "parking": true, "breakfast": true}', 4.8, 'APPROVED', '11111111-1111-1111-1111-111111111111'),
('44444444-4444-4444-4444-444444444444', 'Tea Garden Bungalow', 'Stay inside a 100-year old colonial bungalow.', 4500, ST_SetSRID(ST_MakePoint(88.2500, 27.0400), 4326), '{"wifi": true, "pool": false, "fireplace": true}', 4.5, 'APPROVED', '11111111-1111-1111-1111-111111111111'),
('55555555-5555-5555-5555-555555555555', 'River Side Camp', 'Experience the Teesta river up close.', 1500, ST_SetSRID(ST_MakePoint(88.4500, 27.1000), 4326), '{"wifi": false, "campfire": true, "trekking": true}', 4.2, 'APPROVED', '11111111-1111-1111-1111-111111111111');

-- Insert Photos (Assuming table exists from previous migrations or auto-generated)
INSERT INTO homestay_photos (homestay_id, photo_url)
VALUES
('33333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1585543805890-6051f7829f98?auto=format&fit=crop&q=80'),
('33333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1518732639961-d703758a362e?auto=format&fit=crop&q=80'),
('44444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80'),
('55555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=80');
