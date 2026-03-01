-- V35: Add post_tags table for @ElementCollection on Post.tags
-- Maps to: @CollectionTable(name = "post_tags", joinColumns = @JoinColumn(name = "post_id"))

CREATE TABLE post_tags (
    post_id UUID NOT NULL,
    tag     VARCHAR(255) NOT NULL,
    CONSTRAINT fk_post_tags_post
        FOREIGN KEY (post_id)
        REFERENCES posts (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_post_tags_post_id ON post_tags (post_id);
CREATE INDEX idx_post_tags_tag ON post_tags (tag);
