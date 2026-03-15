-- V61: Elevation Engine Fixes and Badge Seeding
-- Fixes comments table for helpful tracking and seeds all 30 badges

-- ============================================================
-- PART 1: Fix Comment helpful tracking
-- ============================================================

ALTER TABLE comments ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

-- ============================================================
-- PART 2: Seed the 10 Khazana Merit Badges
-- ============================================================

INSERT INTO badge_definitions (name, slug, description, badge_type, icon_url, xp_reward) VALUES 
('The Surya-Tilak (First Light)', 'surya-tilak', 'Publish your first post or review', 'ACHIEVEMENT', '/icons/badges/surya.svg', 10),
('The Margdarshak (The Guide)', 'margdarshak', '20 comments marked as helpful', 'ACHIEVEMENT', '/icons/badges/lantern.svg', 50),
('The Darpan (The Lens)', 'darpan', 'Photo post hit 1000 views and 50 likes', 'ACHIEVEMENT', '/icons/badges/lens.svg', 100),
('The Gupt-Khoj (Secret Discovery)', 'gupt-khoj', '3 high-quality offbeat stories', 'ACHIEVEMENT', '/icons/badges/map.svg', 100),
('The Kissa-Goi (The Storyteller)', 'kissa-goi', '5 high-engagement trip reports', 'ACHIEVEMENT', '/icons/badges/inkwell.svg', 100),
('The Atithi-Devo (Honored Guest)', 'atithi-devo', '5 detailed homestay reviews', 'ACHIEVEMENT', '/icons/badges/door.svg', 100),
('The Zaika Hunter (Flavor Seeker)', 'zaika-hunter', '10 highly-rated food posts', 'ACHIEVEMENT', '/icons/badges/momo.svg', 100),
('The Sangam (The Confluence)', 'sangam', 'Gain 100 followers', 'ACHIEVEMENT', '/icons/badges/river.svg', 200),
('The Agni-Shikha (Rising Flame)', 'agni-shikha', 'Hit the trending feed', 'ACHIEVEMENT', '/icons/badges/flame.svg', 150),
('The Raj-Mohar (Royal Seal)', 'raj-mohar', 'Editorial selection', 'SPECIAL', '/icons/badges/seal.svg', 500)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- ============================================================
-- PART 3: Replace Stage Badges (delete old, insert new)
-- ============================================================

DELETE FROM badge_definitions WHERE badge_type = 'STAGE';

INSERT INTO badge_definitions (name, slug, description, badge_type, stage_number, min_xp_threshold, icon_url) VALUES
('The Musafir (The Traveler)', 'stage-1', 'Just starting the journey', 'STAGE', 1, 0, '/icons/stages/1-musafir.svg'),
('The Banjara (The Nomad)', 'stage-2', 'Finding your footing', 'STAGE', 2, 50, '/icons/stages/2-banjara.svg'),
('The Ghumakkad (The Rover)', 'stage-3', 'An avid explorer', 'STAGE', 3, 150, '/icons/stages/3-ghumakkad.svg'),
('The Pagdandi Walker (Trail Tracker)', 'stage-4', 'Walking the offbeat paths', 'STAGE', 4, 300, '/icons/stages/4-pagdandi.svg'),
('The Dooars Ranger (Gateway Explorer)', 'stage-5', 'Entering the wild', 'STAGE', 5, 500, '/icons/stages/5-dooars.svg'),
('The Aranya Char (Forest Wanderer)', 'stage-6', 'Deep in the woods', 'STAGE', 6, 800, '/icons/stages/6-aranya.svg'),
('The Teesta Voyager (River Navigator)', 'stage-7', 'Following the mountain rivers', 'STAGE', 7, 1200, '/icons/stages/7-teesta.svg'),
('The Pahari Soul (Mountain Soul)', 'stage-8', 'One with the hills', 'STAGE', 8, 1800, '/icons/stages/8-pahari.svg'),
('The Megh-Doot (Cloud Messenger)', 'stage-9', 'Rising above the mist', 'STAGE', 9, 2500, '/icons/stages/9-megh.svg'),
('The Valley Shaman (Valley Mystic)', 'stage-10', 'Wisdom of the valleys', 'STAGE', 10, 3500, '/icons/stages/10-shaman.svg'),
('The Darra Pathfinder (Pass Explorer)', 'stage-11', 'Crossing the high passes', 'STAGE', 11, 5000, '/icons/stages/11-darra.svg'),
('The Him-Yatri (Snow Traveler)', 'stage-12', 'Braving the cold peaks', 'STAGE', 12, 7000, '/icons/stages/12-himyatri.svg'),
('The Shikhar Seeker (Peak Seeker)', 'stage-13', 'Aiming for the summits', 'STAGE', 13, 10000, '/icons/stages/13-shikhar.svg'),
('The Purvanchal Pioneer (Eastern Pioneer)', 'stage-14', 'Eastern Himalayan expert', 'STAGE', 14, 14000, '/icons/stages/14-purvanchal.svg'),
('The Yak Rider (High Altitude Regular)', 'stage-15', 'Comfortable in the thin air', 'STAGE', 15, 19000, '/icons/stages/15-yak.svg'),
('The Brahma Kamal (Sacred Lotus)', 'stage-16', 'A rare and beautiful sight', 'STAGE', 16, 25000, '/icons/stages/16-brahma.svg'),
('The Snow Leopard (Mountain Ghost)', 'stage-17', 'Elusive and highly respected', 'STAGE', 17, 32000, '/icons/stages/17-leopard.svg'),
('The Safar-E-Khas (Special Journey)', 'stage-18', 'An extraordinary traveler', 'STAGE', 18, 42000, '/icons/stages/18-safar.svg'),
('The Kanchenjunga Guardian (Peak Protector)', 'stage-19', 'Watcher of the great mountains', 'STAGE', 19, 55000, '/icons/stages/19-kanchenjunga.svg'),
('The Yatra-Guru (Master of the Journey)', 'stage-20', 'The ultimate traveler', 'STAGE', 20, 75000, '/icons/stages/20-guru.svg')
ON CONFLICT (slug) DO NOTHING;
