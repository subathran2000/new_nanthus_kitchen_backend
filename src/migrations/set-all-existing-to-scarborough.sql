-- Migration: Set all existing data to Scarborough location
-- Purpose: All items and opening hours created before the two-location split
--          should belong to Scarborough (the original/primary location).
--
-- Run this ONCE against your PostgreSQL database.
-- Safe to re-run (idempotent steps where noted).

BEGIN;

-- ─── 1. MENU ITEMS ───────────────────────────────────────────────────────────
-- Set every menu item to scarborough-only availability.
-- locationAvailability values: 'both' | 'scarborough' | 'markham'
UPDATE menu_items
SET location_availability = 'scarborough'
WHERE location_availability != 'scarborough';

-- Verify
DO $$
DECLARE
  non_scarborough_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO non_scarborough_count
  FROM menu_items
  WHERE location_availability != 'scarborough';

  IF non_scarborough_count > 0 THEN
    RAISE EXCEPTION 'menu_items update failed: % rows still not set to scarborough', non_scarborough_count;
  END IF;
  RAISE NOTICE 'menu_items: all rows now set to scarborough';
END $$;


-- ─── 2. OPENING HOURS ────────────────────────────────────────────────────────
-- The unique constraint UQ_opening_hours_day_location prevents two rows
-- with the same (dayOfWeek, location).
--
-- Strategy (safe for all cases):
--   a) Where a Scarborough record already exists for a given day,
--      delete the Markham record for that same day (Scarborough takes priority).
--   b) Where only a Markham record exists, update it to Scarborough.

-- Step 2a: Delete markham rows that would conflict with existing scarborough rows
DELETE FROM opening_hours oh_markham
WHERE oh_markham.location = 'markham'
  AND EXISTS (
    SELECT 1 FROM opening_hours oh_scar
    WHERE oh_scar.location  = 'scarborough'
      AND oh_scar."dayOfWeek" = oh_markham."dayOfWeek"
  );

-- Step 2b: Update remaining markham rows to scarborough
UPDATE opening_hours
SET location = 'scarborough'
WHERE location = 'markham';

-- Verify no markham records remain
DO $$
DECLARE
  markham_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO markham_count
  FROM opening_hours
  WHERE location = 'markham';

  IF markham_count > 0 THEN
    RAISE EXCEPTION 'opening_hours update failed: % markham rows still remain', markham_count;
  END IF;
  RAISE NOTICE 'opening_hours: all rows now set to scarborough';
END $$;


-- ─── SUMMARY ─────────────────────────────────────────────────────────────────
DO $$
DECLARE
  menu_count   INTEGER;
  hours_count  INTEGER;
BEGIN
  SELECT COUNT(*) INTO menu_count  FROM menu_items      WHERE location_availability = 'scarborough';
  SELECT COUNT(*) INTO hours_count FROM opening_hours   WHERE location = 'scarborough';
  RAISE NOTICE '=== Migration complete ===';
  RAISE NOTICE 'menu_items   → scarborough: %', menu_count;
  RAISE NOTICE 'opening_hours → scarborough: %', hours_count;
END $$;

COMMIT;
