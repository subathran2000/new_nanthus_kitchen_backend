-- Migration: add per-location availability and pricing to menu_items
-- Run this script once against your PostgreSQL database.

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS location_availability VARCHAR(20) NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS price_scarborough     DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS price_markham         DECIMAL(10, 2);

CREATE INDEX IF NOT EXISTS idx_menu_items_location
  ON menu_items(location_availability);

-- Existing items keep 'both' which means they appear at both locations
-- with the same base price (price_scarborough and price_markham are NULL = use base price).
