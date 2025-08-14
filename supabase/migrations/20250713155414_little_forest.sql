/*
  # Add Missing Multi-Currency and Availability Fields

  1. New Fields (only adding what's missing)
    - Add missing currency fields (GBP, EUR, AUD) to products
    - Add refund_policy and package_lost_policy text fields
    - Add view count increment function
    - Update sample data with new currency values

  2. Security
    - Maintain existing RLS policies
    - No changes to existing security structure

  3. Functions
    - Add view count increment function for analytics
*/

-- Add missing currency fields to products (USD, XMR, shipping fields already exist from previous migrations)
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_gbp decimal(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_eur decimal(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_aud decimal(12,2);

-- Add missing policy fields (if they don't exist)
ALTER TABLE products ADD COLUMN IF NOT EXISTS refund_policy text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_lost_policy text;

-- Add missing order currency fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_gbp decimal(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_eur decimal(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_aud decimal(12,2);

-- Create or replace the view count increment function
CREATE OR REPLACE FUNCTION increment_view_count(product_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = product_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_view_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_view_count(uuid) TO anon;

-- Add indexes for new currency fields
CREATE INDEX IF NOT EXISTS idx_products_price_gbp ON products(price_gbp);
CREATE INDEX IF NOT EXISTS idx_products_price_eur ON products(price_eur);
CREATE INDEX IF NOT EXISTS idx_products_price_aud ON products(price_aud);

-- Update existing products with sample multi-currency pricing (only if they don't have values)
UPDATE products SET 
  price_gbp = CASE 
    WHEN price_gbp IS NULL AND price_usd IS NOT NULL THEN ROUND(price_usd * 0.79, 2) -- USD to GBP conversion
    ELSE price_gbp
  END,
  price_eur = CASE 
    WHEN price_eur IS NULL AND price_usd IS NOT NULL THEN ROUND(price_usd * 0.93, 2) -- USD to EUR conversion  
    ELSE price_eur
  END,
  price_aud = CASE 
    WHEN price_aud IS NULL AND price_usd IS NOT NULL THEN ROUND(price_usd * 1.45, 2) -- USD to AUD conversion
    ELSE price_aud
  END,
  refund_policy = CASE 
    WHEN refund_policy IS NULL THEN 'Refunds available within 7 days if product is not as described. Customer must provide evidence.'
    ELSE refund_policy
  END,
  package_lost_policy = CASE 
    WHEN package_lost_policy IS NULL THEN 'If package is lost in transit and tracking shows no delivery after 14 days, we will provide 50% refund or reship at our discretion.'
    ELSE package_lost_policy
  END
WHERE price_usd IS NOT NULL;

-- Update vendor profiles with sample policy data if missing
UPDATE profiles SET 
  vendor_type = CASE 
    WHEN vendor_type IS NULL AND is_vendor = true THEN 'escrow'
    ELSE vendor_type
  END,
  total_sales = CASE 
    WHEN total_sales IS NULL AND is_vendor = true THEN floor(random() * 500) + 50
    ELSE total_sales
  END,
  disputes_won = CASE 
    WHEN disputes_won IS NULL AND is_vendor = true THEN floor(random() * 10)
    ELSE disputes_won
  END,
  disputes_lost = CASE 
    WHEN disputes_lost IS NULL AND is_vendor = true THEN floor(random() * 3)
    ELSE disputes_lost
  END,
  open_orders = CASE 
    WHEN open_orders IS NULL AND is_vendor = true THEN floor(random() * 20) + 5
    ELSE open_orders
  END
WHERE is_vendor = true;