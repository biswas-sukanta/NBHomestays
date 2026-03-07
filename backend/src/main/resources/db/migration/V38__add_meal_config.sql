-- V38: Add meal_config JSONB column to homestays table
-- Stores: defaultMealPlan, mealsIncludedPerDay, mealPricePerGuest, dietTypes, extras
-- Rollback: ALTER TABLE homestays DROP COLUMN IF EXISTS meal_config;

ALTER TABLE homestays ADD COLUMN IF NOT EXISTS meal_config JSONB DEFAULT '{}'::jsonb;
