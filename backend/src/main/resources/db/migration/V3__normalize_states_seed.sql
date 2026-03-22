INSERT INTO states (slug, name, hero_image_name)
VALUES
    ('west-bengal', 'West Bengal', 'hero-west-bengal.webp'),
    ('sikkim', 'Sikkim', 'hero-sikkim.webp'),
    ('assam', 'Assam', 'hero-assam.webp'),
    ('meghalaya', 'Meghalaya', 'hero-meghalaya.webp'),
    ('arunachal-pradesh', 'Arunachal Pradesh', 'hero-arunachal-pradesh.png')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    hero_image_name = EXCLUDED.hero_image_name;
