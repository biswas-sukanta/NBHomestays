-- V60: Fix verification_status enum values to uppercase
-- The Java enum expects uppercase values but database has lowercase

UPDATE users SET verification_status = 'UNVERIFIED' WHERE verification_status = 'unverified';
UPDATE users SET verification_status = 'PENDING' WHERE verification_status = 'pending';
UPDATE users SET verification_status = 'VERIFIED' WHERE verification_status = 'verified';
UPDATE users SET verification_status = 'SUSPENDED' WHERE verification_status = 'suspended';
