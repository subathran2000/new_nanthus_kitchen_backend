-- Migration: Add unique constraint to opening_hours table
-- This ensures only one record per (dayOfWeek, location) combination

-- Step 1: Remove duplicate records (keep the most recent)
WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY "dayOfWeek", location 
               ORDER BY "createdAt" DESC
           ) as rn
    FROM opening_hours
)
DELETE FROM opening_hours
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Add unique constraint
ALTER TABLE opening_hours 
ADD CONSTRAINT "UQ_opening_hours_day_location" 
UNIQUE ("dayOfWeek", location);
