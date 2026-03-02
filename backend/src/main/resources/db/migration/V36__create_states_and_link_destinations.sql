-- V36: Create states table and link destinations to states
-- Supports: State (1) -> (N) Destination (1) -> (N) Homestay

-- 1. Create the states table
CREATE TABLE states (
    id              UUID PRIMARY KEY,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    hero_image_name VARCHAR(255)
);

CREATE INDEX idx_states_slug ON states (slug);

-- 2. Seed the initial states
INSERT INTO states (id, slug, name, description, hero_image_name) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'west-bengal',
     'West Bengal',
     'From the snow-capped peaks of Sandakphu to the tea gardens of Darjeeling and the riverside hamlets of Kalimpong — West Bengal''s northern hills offer unmatched diversity in a single state.',
     'state-west-bengal.webp'),
    ('a1000000-0000-0000-0000-000000000002', 'sikkim',
     'Sikkim',
     'India''s least populous state is a paradise of monasteries, alpine meadows, and sacred lakes tucked beneath the mighty Kanchenjunga.',
     'state-sikkim.webp'),
    ('a1000000-0000-0000-0000-000000000003', 'assam',
     'Assam',
     'The gateway to the Northeast — Assam is a land of rolling tea estates, mighty Brahmaputra river cruises, and the one-horned rhino of Kaziranga.',
     'state-assam.webp'),
    ('a1000000-0000-0000-0000-000000000004', 'meghalaya',
     'Meghalaya',
     'The Abode of Clouds — Meghalaya is famed for its living root bridges, the wettest place on earth at Mawsynram, and crystal-clear rivers.',
     'state-meghalaya.webp');

-- 3. Add state_id FK to destinations (district column is KEPT untouched)
ALTER TABLE destinations ADD COLUMN state_id UUID;

-- 4. Backfill: Map all existing destinations to West Bengal
UPDATE destinations SET state_id = 'a1000000-0000-0000-0000-000000000001';

-- 5. Enforce NOT NULL after backfill
ALTER TABLE destinations ALTER COLUMN state_id SET NOT NULL;

-- 6. Add FK constraint and index
ALTER TABLE destinations ADD CONSTRAINT fk_destinations_state
    FOREIGN KEY (state_id) REFERENCES states (id);

CREATE INDEX idx_destinations_state_id ON destinations (state_id);
