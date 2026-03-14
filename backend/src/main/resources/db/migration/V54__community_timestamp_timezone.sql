DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'posts'
          AND column_name = 'created_at'
          AND data_type = 'timestamp without time zone'
    ) THEN
        EXECUTE 'ALTER TABLE posts ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE ''UTC''';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'comments'
          AND column_name = 'created_at'
          AND data_type = 'timestamp without time zone'
    ) THEN
        EXECUTE 'ALTER TABLE comments ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE ''UTC''';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'post_likes'
          AND column_name = 'liked_at'
          AND data_type = 'timestamp without time zone'
    ) THEN
        EXECUTE 'ALTER TABLE post_likes ALTER COLUMN liked_at TYPE TIMESTAMP WITH TIME ZONE USING liked_at AT TIME ZONE ''UTC''';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'post_timelines_global'
          AND column_name = 'created_at'
          AND data_type = 'timestamp without time zone'
    ) THEN
        EXECUTE 'ALTER TABLE post_timelines_global ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE ''UTC''';
    END IF;
END $$;
