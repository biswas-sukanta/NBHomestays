CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    homestay_id UUID NOT NULL REFERENCES homestays(id),
    user_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY,
    homestay_id UUID NOT NULL REFERENCES homestays(id),
    user_id UUID NOT NULL REFERENCES users(id),
    check_in_date DATE,
    check_out_date DATE,
    total_price DECIMAL(19, 2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    id UUID PRIMARY KEY,
    homestay_id UUID NOT NULL REFERENCES homestays(id),
    user_id UUID NOT NULL REFERENCES users(id),
    question_text TEXT NOT NULL,
    answer_text TEXT,
    answered_by_owner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_photos (
    review_id UUID NOT NULL REFERENCES reviews(id),
    photo_url VARCHAR(255)
);

CREATE TABLE homestay_photos (
    homestay_id UUID NOT NULL REFERENCES homestays(id),
    photo_url VARCHAR(255)
);
