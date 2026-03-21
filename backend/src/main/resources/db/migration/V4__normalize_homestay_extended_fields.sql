ALTER TABLE homestays
    ADD COLUMN IF NOT EXISTS spaces JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS attractions JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS offers JSONB DEFAULT '{}'::jsonb;

ALTER TABLE homestays
    ALTER COLUMN spaces SET DEFAULT '[]'::jsonb,
    ALTER COLUMN spaces DROP NOT NULL,
    ALTER COLUMN videos SET DEFAULT '[]'::jsonb,
    ALTER COLUMN videos DROP NOT NULL,
    ALTER COLUMN attractions SET DEFAULT '[]'::jsonb,
    ALTER COLUMN attractions DROP NOT NULL,
    ALTER COLUMN offers SET DEFAULT '{}'::jsonb,
    ALTER COLUMN offers DROP NOT NULL;
