INSERT INTO states (slug, name)
VALUES
    ('west-bengal', 'West Bengal'),
    ('sikkim', 'Sikkim'),
    ('assam', 'Assam'),
    ('meghalaya', 'Meghalaya'),
    ('arunachal-pradesh', 'Arunachal Pradesh')
ON CONFLICT (slug) DO NOTHING;
