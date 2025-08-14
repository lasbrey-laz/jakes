/*
  # Add Shipping Methods to Products

  1. Purpose
    - Add shipping method options to products table
    - Allow vendors to specify available shipping methods
    - Support multiple shipping methods per product

  2. New Fields
    - shipping_methods: Array of available shipping methods
    - shipping_method_costs: JSON object mapping methods to costs

  3. Shipping Methods
    - USPS Priority
    - Tracking Mail
    - Post Express with Tracking
    - Express Envelope
    - Express Satchel
    - Combined Shipping
*/

-- Add shipping methods array to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_methods text[] DEFAULT ARRAY['USPS Priority', 'Tracking Mail', 'Post Express with Tracking', 'Express Envelope', 'Express Satchel', 'Combined Shipping'];

-- Add shipping method costs JSON field
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_method_costs jsonb DEFAULT '{
  "USPS Priority": {"usd": 15.00, "btc": 0.0005, "xmr": 0.05},
  "Tracking Mail": {"usd": 8.00, "btc": 0.0003, "xmr": 0.03},
  "Post Express with Tracking": {"usd": 25.00, "btc": 0.0008, "xmr": 0.08},
  "Express Envelope": {"usd": 12.00, "btc": 0.0004, "xmr": 0.04},
  "Express Satchel": {"usd": 18.00, "btc": 0.0006, "xmr": 0.06},
  "Combined Shipping": {"usd": 5.00, "btc": 0.0002, "xmr": 0.02}
}';

-- Create index for shipping methods
CREATE INDEX IF NOT EXISTS idx_products_shipping_methods ON products USING GIN(shipping_methods);

-- Create index for shipping method costs
CREATE INDEX IF NOT EXISTS idx_products_shipping_method_costs ON products USING GIN(shipping_method_costs);

-- Add comment to document the new fields
COMMENT ON COLUMN products.shipping_methods IS 'Array of available shipping methods for this product';
COMMENT ON COLUMN products.shipping_method_costs IS 'JSON object mapping shipping methods to costs in different currencies';
