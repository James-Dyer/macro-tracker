-- Add thumbnail_path column for optimized image loading
-- Thumbnails are 400px max dimension, ~100KB for fast mobile loading
ALTER TABLE meal ADD COLUMN thumbnail_path TEXT;

-- Create index for thumbnail queries (combined with photo_path for efficiency)
CREATE INDEX idx_meal_photos ON meal(photo_path, thumbnail_path)
WHERE photo_path IS NOT NULL;
