-- Create saved_items table for wishlists
CREATE TABLE saved_items (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    homestay_id UUID NOT NULL REFERENCES homestays(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_homestay UNIQUE (user_id, homestay_id)
);
