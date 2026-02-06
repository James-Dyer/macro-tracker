-- Add photo_path column to store storage paths (not URLs)
-- This enables signed URL generation for private bucket access
ALTER TABLE meal ADD COLUMN photo_path TEXT;

-- Create index for photo_path queries
CREATE INDEX idx_meal_photo_path ON meal(photo_path) WHERE photo_path IS NOT NULL;

-- Mark photo_url as deprecated (can drop later after migration)
COMMENT ON COLUMN meal.photo_url IS 'DEPRECATED: Use photo_path instead. Contains legacy public URLs.';;
