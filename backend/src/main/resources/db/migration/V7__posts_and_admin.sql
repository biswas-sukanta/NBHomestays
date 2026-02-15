-- Add admin user
INSERT INTO users (id, first_name, last_name, email, password, role, enabled)
VALUES ('99999999-9999-9999-9999-999999999999', 'Admin', 'User', 'admin@example.com',
        '$2a$10$JigZhmJ9jpcL17kFY.MTl.JjYMwX5RUSXPUe4WIsdWQWBQMBCunVm', 'ROLE_ADMIN', true)
ON CONFLICT (email) DO NOTHING;

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    location_name VARCHAR(255) NOT NULL,
    text_content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create post images table
CREATE TABLE IF NOT EXISTS post_images (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL
);
