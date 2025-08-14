/*
  # Add Shipping and Monero Support

  1. Table Updates
    - Add shipping fields to products table
    - Add Monero pricing support
    - Add shipping country fields

  2. Security
    - Update existing policies to include new fields
    - Maintain existing security structure

  3. Sample Data
    - No sample data changes needed
*/

-- Add shipping and payment fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_from_country text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_to_countries text[]; -- Array of country codes
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_xmr decimal(16,12); -- Monero pricing (higher precision)
ALTER TABLE products ADD COLUMN IF NOT EXISTS accepts_monero boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost_usd decimal(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost_btc decimal(16,8);
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost_xmr decimal(16,12);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_shipping_from ON products(shipping_from_country);
CREATE INDEX IF NOT EXISTS idx_products_accepts_monero ON products(accepts_monero);

-- Add Monero support to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'btc';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_xmr decimal(16,12);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_usd decimal(12,2);

-- Add shipping address to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_country text;

-- Add indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_country ON orders(shipping_country);