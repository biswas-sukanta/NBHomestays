CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    location VARCHAR(255),
    bio TEXT,
    is_verified_host BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    display_name VARCHAR(100),
    languages TEXT[],
    interests TEXT[],
    traveller_type VARCHAR(50),
    show_email BOOLEAN NOT NULL DEFAULT FALSE,
    allow_messages BOOLEAN NOT NULL DEFAULT TRUE,
    marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'UNVERIFIED',
    social_links JSONB DEFAULT '{}'::jsonb,
    community_points INTEGER NOT NULL DEFAULT 0,
    total_xp INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hero_image_name VARCHAR(255)
);

CREATE TABLE destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(255),
    hero_title VARCHAR(255),
    description TEXT,
    local_image_name VARCHAR(255),
    state_id UUID NOT NULL REFERENCES states(id)
);

CREATE TABLE homestays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id),
    price_per_night INTEGER NOT NULL,
    status VARCHAR(50),
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    amenities JSONB,
    policies JSONB DEFAULT '[]'::jsonb,
    quick_facts JSONB DEFAULT '{}'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    host_details JSONB DEFAULT '{}'::jsonb,
    vibe_score DOUBLE PRECISION,
    avg_atmosphere_rating DOUBLE PRECISION,
    avg_service_rating DOUBLE PRECISION,
    avg_accuracy_rating DOUBLE PRECISION,
    avg_value_rating DOUBLE PRECISION,
    total_reviews INTEGER DEFAULT 0,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    meal_config JSONB DEFAULT '{}'::jsonb,
    meta JSONB DEFAULT '{}'::jsonb,
    destination_id UUID REFERENCES destinations(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    view_count BIGINT NOT NULL DEFAULT 0,
    inquiry_count BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE trip_board_saves (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    homestay_id UUID NOT NULL REFERENCES homestays(id) ON DELETE CASCADE,
    saved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, homestay_id)
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    homestay_id UUID NOT NULL REFERENCES homestays(id),
    user_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    atmosphere_rating INTEGER,
    service_rating INTEGER,
    accuracy_rating INTEGER,
    value_rating INTEGER
);

CREATE TABLE review_photos (
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    photo_url VARCHAR(255)
);

CREATE TABLE homestay_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    homestay_id UUID NOT NULL REFERENCES homestays(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE homestay_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES homestay_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    location_name VARCHAR(255) NOT NULL,
    text_content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    homestay_id UUID REFERENCES homestays(id),
    destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
    original_post_id UUID REFERENCES posts(id),
    love_count INTEGER NOT NULL DEFAULT 0,
    share_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    helpful_count INTEGER NOT NULL DEFAULT 0,
    last_computed_xp INTEGER NOT NULL DEFAULT 0,
    post_priority INTEGER DEFAULT 0,
    text_length INTEGER,
    media_count INTEGER,
    post_category VARCHAR(64),
    post_type VARCHAR(32),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_editorial BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_trending BOOLEAN NOT NULL DEFAULT FALSE,
    view_count INTEGER NOT NULL DEFAULT 0,
    trending_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    trending_computed_at TIMESTAMPTZ,
    editorial_score DOUBLE PRECISION NOT NULL DEFAULT 0
);

CREATE TABLE post_images (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL
);

CREATE TABLE post_tags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag VARCHAR(255) NOT NULL
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    helpful_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE comment_images (
    comment_id UUID NOT NULL REFERENCES comments(id),
    image_url VARCHAR(255)
);

CREATE TABLE post_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    liked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE media_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url VARCHAR(255) NOT NULL,
    file_id VARCHAR(255),
    post_id UUID REFERENCES posts(id),
    homestay_id UUID REFERENCES homestays(id),
    comment_id UUID REFERENCES comments(id),
    width INTEGER,
    height INTEGER
);

CREATE TABLE media_uploads (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    file_id VARCHAR(255) NOT NULL,
    url VARCHAR(1024) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    attached_at TIMESTAMPTZ,
    attached_entity_type VARCHAR(50),
    attached_entity_id VARCHAR(36)
);

CREATE TABLE post_timelines_global (
    id BIGSERIAL PRIMARY KEY,
    post_id UUID NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    author_id UUID NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_avatar_url TEXT,
    author_role VARCHAR(255) NOT NULL,
    author_verified_host BOOLEAN NOT NULL DEFAULT FALSE,
    text_content TEXT,
    homestay_id UUID,
    homestay_name VARCHAR(255),
    original_post_id UUID,
    like_count INTEGER NOT NULL DEFAULT 0,
    share_count INTEGER NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE post_trending_history (
    id BIGSERIAL PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    trending_score DOUBLE PRECISION NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE async_jobs (
    id UUID PRIMARY KEY,
    job_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_follows (
    follower_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_user_id, followed_user_id),
    CONSTRAINT chk_user_follows_no_self_follow CHECK (follower_user_id <> followed_user_id)
);

CREATE TABLE badge_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    badge_type VARCHAR(50) NOT NULL,
    icon_url TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    stage_number INTEGER,
    min_xp_threshold INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE user_badges_legacy (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id, badge)
);

CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE RESTRICT,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    award_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id)
);

CREATE TABLE user_xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    source_id UUID,
    xp_delta INTEGER NOT NULL,
    reason TEXT,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE helpful_votes (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE destination_tags (
    destination_id UUID NOT NULL REFERENCES destinations(id),
    tag VARCHAR(255)
);

CREATE INDEX idx_users_is_deleted ON users(is_deleted);
CREATE INDEX idx_users_location ON users(location);
CREATE INDEX idx_users_verification_status ON users(verification_status);
CREATE INDEX idx_users_social_links ON users USING GIN (social_links);

CREATE INDEX idx_destinations_state_id ON destinations(state_id);

CREATE INDEX idx_homestays_destination_id ON homestays(destination_id);
CREATE INDEX idx_homestays_owner_id ON homestays(owner_id);
CREATE INDEX idx_homestays_status_deleted ON homestays(status, is_deleted);
CREATE INDEX idx_homestays_featured ON homestays(featured) WHERE featured = TRUE;
CREATE INDEX idx_homestays_price ON homestays(price_per_night);

CREATE INDEX idx_hq_homestay_id ON homestay_questions(homestay_id);
CREATE INDEX idx_hq_created_at ON homestay_questions(created_at DESC);
CREATE INDEX idx_homestay_questions_is_deleted ON homestay_questions(is_deleted);

CREATE INDEX idx_ha_question_id ON homestay_answers(question_id);
CREATE INDEX idx_ha_created_at ON homestay_answers(created_at DESC);
CREATE INDEX idx_homestay_answers_is_deleted ON homestay_answers(is_deleted);

CREATE INDEX idx_reviews_is_deleted ON reviews(is_deleted);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_comments_post_id_created_at ON comments(post_id, created_at);
CREATE INDEX idx_comments_is_deleted ON comments(is_deleted);

CREATE UNIQUE INDEX uq_post_likes_post_user ON post_likes(post_id, user_id);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);

CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag ON post_tags(tag);

CREATE INDEX idx_posts_active_created_at_id_desc ON posts(created_at DESC, id DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_posts_feed_covering ON posts(created_at DESC, id DESC)
    INCLUDE (user_id, text_content, homestay_id, original_post_id, love_count, share_count)
    WHERE is_deleted = FALSE;
CREATE INDEX idx_posts_user_created_at ON posts(user_id, created_at DESC);
CREATE INDEX idx_posts_homestay_id ON posts(homestay_id) WHERE homestay_id IS NOT NULL;
CREATE INDEX idx_posts_destination_id ON posts(destination_id);
CREATE INDEX idx_posts_original_post_id ON posts(original_post_id) WHERE original_post_id IS NOT NULL;
CREATE INDEX idx_posts_trending ON posts(trending_score DESC, created_at DESC);

CREATE INDEX idx_media_post_id ON media_resources(post_id);
CREATE INDEX idx_media_homestay_id ON media_resources(homestay_id);
CREATE INDEX idx_media_comment_id ON media_resources(comment_id);

CREATE INDEX idx_media_uploads_status ON media_uploads(status);
CREATE INDEX idx_media_uploads_created_at ON media_uploads(created_at);
CREATE INDEX idx_media_uploads_file_id ON media_uploads(file_id);

CREATE INDEX idx_timeline_global_post_id ON post_timelines_global(post_id);
CREATE INDEX idx_timeline_global_created_at_post_id ON post_timelines_global(created_at DESC, post_id DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_timeline_global_feed_covering ON post_timelines_global(created_at DESC, post_id DESC)
    INCLUDE (author_id, author_name, author_avatar_url, author_role, author_verified_host, text_content, homestay_id, homestay_name, original_post_id, like_count, share_count)
    WHERE is_deleted = FALSE;

CREATE INDEX idx_post_trending_history_post_id_computed_at ON post_trending_history(post_id, computed_at DESC);
CREATE INDEX idx_post_trending_history_computed_at ON post_trending_history(computed_at DESC);

CREATE INDEX idx_async_jobs_status_created_at ON async_jobs(status, created_at);
CREATE INDEX idx_async_jobs_type_status ON async_jobs(job_type, status);

CREATE INDEX idx_user_follows_followed_user ON user_follows(followed_user_id, created_at DESC);
CREATE INDEX idx_user_follows_follower_user ON user_follows(follower_user_id, created_at DESC);

CREATE INDEX idx_user_badges_pinned ON user_badges(user_id, is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_xp_history_user_id ON user_xp_history(user_id, created_at DESC);
CREATE INDEX idx_user_xp_history_source ON user_xp_history(source_type, source_id);

CREATE INDEX idx_helpful_votes_user_id ON helpful_votes(user_id, voted_at DESC);
