/*
  # Add Multiple Image URLs Support

  1. New Fields
    - Add image_urls array field to products table for multiple images
    - Keep existing image_url for backward compatibility

  2. Security
    - Maintain existing RLS policies
    - No changes to existing security structure

  3. Indexes
    - Add index for image_urls array field
*/

-- Add image_urls array field to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls text[];

-- Add index for image_urls array field
CREATE INDEX IF NOT EXISTS idx_products_image_urls ON products USING GIN(image_urls);

-- Update existing products to populate image_urls from image_url
UPDATE products 
SET image_urls = CASE 
  WHEN image_url IS NOT NULL AND image_url != '' THEN ARRAY[image_url]
  ELSE NULL
END
WHERE image_urls IS NULL AND image_url IS NOT NULL;