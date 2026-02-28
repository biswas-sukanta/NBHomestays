-- V32__create_destinations_table.sql
CREATE TABLE destinations (
    id UUID PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(255),
    hero_title VARCHAR(255),
    description TEXT,
    local_image_name VARCHAR(255)
);

CREATE TABLE destination_tags (
    destination_id UUID NOT NULL,
    tag VARCHAR(255),
    CONSTRAINT fk_destination_tags FOREIGN KEY (destination_id) REFERENCES destinations (id)
);

ALTER TABLE homestays ADD COLUMN destination_id UUID;
ALTER TABLE homestays ADD CONSTRAINT fk_homestays_destination FOREIGN KEY (destination_id) REFERENCES destinations (id);
