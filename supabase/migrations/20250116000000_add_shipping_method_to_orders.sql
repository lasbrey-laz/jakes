/*
  # Add Shipping Method Fields to Orders Table

  1. Purpose
    - Add shipping method selection to orders
    - Store shipping method cost in orders
    - Support the shipping method selection UI in ProductDetail.tsx

  2. New Fields
    - shipping_method: The selected shipping method for the order
    - shipping_cost_btc: The shipping cost in Bitcoin for the order

  3. Dependencies
    - Requires shipping_methods and shipping_method_costs in products table
    - Supports the existing shipping method selection UI
*/

-- Add shipping method fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost_btc decimal(16,8);

-- Add index for shipping method queries
CREATE INDEX IF NOT EXISTS idx_orders_shipping_method ON orders(shipping_method);

-- Add comment to document the new fields
COMMENT ON COLUMN orders.shipping_method IS 'The selected shipping method for this order';
COMMENT ON COLUMN orders.shipping_cost_btc IS 'The shipping cost in Bitcoin for this order';
