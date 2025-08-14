/*
  # Add Multi-Currency Support and Availability System

  1. Table Updates
    - Add multiple currency pricing (USD, GBP, EUR, AUD)
    - Replace stock_quantity with availability boolean
    - Add shipping location options (Worldwide, EU, etc.)
    - Add minimum order amounts
    - Add vendor statistics and ratings

  2. New Fields
    - Multi-currency pricing support
    - Availability checkbox system
    - Enhanced shipping options
    - Vendor performance metrics
    - Product viewing statistics

  3. Security
    - Maintain existing RLS policies
    - Update policies to include new fields
*/

-- Add multi-currency pricing fields to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_usd decimal(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_gbp decimal(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_eur decimal(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_aud decimal(12,2);

-- Replace stock_quantity with availability
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS minimum_order_amount_usd decimal(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS minimum_order_amount_xmr decimal(16,12);

-- Add enhanced shipping options
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_worldwide boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_eu boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_us boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_uk boolean DEFAULT false;

-- Add product statistics
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'standard';

-- Add vendor performance fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vendor_type text DEFAULT 'standard';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_sales integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disputes_won integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disputes_lost integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS open_orders integer DEFAULT 0;

-- Add refund policy and package lost policy to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS refund_policy text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_lost_policy text;

-- Add unit type for products
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_type text DEFAULT 'piece';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_shipping_worldwide ON products(shipping_worldwide);
CREATE INDEX IF NOT EXISTS idx_products_shipping_eu ON products(shipping_eu);
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count);
CREATE INDEX IF NOT EXISTS idx_profiles_vendor_type ON profiles(vendor_type);
CREATE INDEX IF NOT EXISTS idx_profiles_total_sales ON profiles(total_sales);

-- Add multi-currency support to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency_used text DEFAULT 'btc';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_gbp decimal(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_eur decimal(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_aud decimal(12,2);

-- Update sample products with new fields
UPDATE products SET 
  price_usd = CASE 
    WHEN price_btc IS NOT NULL THEN price_btc * 45000 -- Approximate BTC to USD conversion
    ELSE NULL 
  END,
  price_gbp = CASE 
    WHEN price_btc IS NOT NULL THEN price_btc * 35000 -- Approximate BTC to GBP conversion
    ELSE NULL 
  END,
  price_eur = CASE 
    WHEN price_btc IS NOT NULL THEN price_btc * 42000 -- Approximate BTC to EUR conversion
    ELSE NULL 
  END,
  price_aud = CASE 
    WHEN price_btc IS NOT NULL THEN price_btc * 65000 -- Approximate BTC to AUD conversion
    ELSE NULL 
  END,
  is_available = CASE 
    WHEN stock_quantity > 0 THEN true 
    ELSE false 
  END,
  shipping_worldwide = true,
  shipping_eu = true,
  shipping_us = true,
  shipping_uk = true,
  minimum_order_amount_usd = 10.00,
  listing_type = 'escrow',
  unit_type = 'piece',
  view_count = floor(random() * 1000) + 100
WHERE price_btc IS NOT NULL;

-- Update sample vendor profiles
UPDATE profiles SET 
  vendor_type = 'escrow',
  total_sales = floor(random() * 500) + 50,
  disputes_won = floor(random() * 10),
  disputes_lost = floor(random() * 3),
  open_orders = floor(random() * 20) + 5
WHERE is_vendor = true;