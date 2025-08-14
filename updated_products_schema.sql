-- Updated Products Table Schema
-- This fixes issues with default values and ensures proper array handling

-- Drop existing table if needed (BE CAREFUL - this will delete all data!)
-- DROP TABLE IF EXISTS public.products CASCADE;

-- Create updated products table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price_btc numeric(16, 8) NOT NULL,
  price_usd numeric(10, 2) NULL,
  category_id uuid NULL,
  vendor_id uuid NOT NULL,
  image_url text NULL,
  is_active boolean NULL DEFAULT true,
  is_featured boolean NULL DEFAULT false,
  stock_quantity integer NULL DEFAULT 0,
  digital_content text NULL,
  tags text[] NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  category text NULL,
  subcategory_id uuid NULL,
  shipping_from_country text NULL,
  shipping_to_countries text[] NULL DEFAULT '{}'::text[],
  price_xmr numeric(16, 12) NULL,
  accepts_monero boolean NULL DEFAULT false,
  shipping_cost_usd numeric(10, 2) NULL,
  shipping_cost_btc numeric(16, 8) NULL,
  shipping_cost_xmr numeric(16, 12) NULL,
  price_gbp numeric(12, 2) NULL,
  price_eur numeric(12, 2) NULL,
  price_aud numeric(12, 2) NULL,
  is_available boolean NULL DEFAULT true,
  minimum_order_amount_usd numeric(12, 2) NULL,
  minimum_order_amount_xmr numeric(16, 12) NULL,
  shipping_worldwide boolean NULL DEFAULT false,
  shipping_eu boolean NULL DEFAULT false,
  shipping_us boolean NULL DEFAULT false,
  shipping_uk boolean NULL DEFAULT false,
  view_count integer NULL DEFAULT 0,
  listing_type text NULL DEFAULT 'standard'::text,
  refund_policy text NULL,
  package_lost_policy text NULL,
  unit_type text NULL DEFAULT 'piece'::text,
  image_urls text[] NULL DEFAULT '{}'::text[],
  shipping_methods text[] NULL DEFAULT '{}'::text[],
  shipping_method_costs jsonb NULL DEFAULT '{}'::jsonb,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
  CONSTRAINT products_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES subcategories (id) ON DELETE SET NULL,
  CONSTRAINT products_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES profiles (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products USING btree (category_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products USING btree (vendor_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products USING btree (subcategory_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_shipping_from ON public.products USING btree (shipping_from_country) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_accepts_monero ON public.products USING btree (accepts_monero) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products USING btree (is_available) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_shipping_worldwide ON public.products USING btree (shipping_worldwide) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_shipping_eu ON public.products USING btree (shipping_eu) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_shipping_us ON public.products USING btree (shipping_us) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_shipping_uk ON public.products USING btree (shipping_uk) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_view_count ON public.products USING btree (view_count) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_price_gbp ON public.products USING btree (price_gbp) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_price_eur ON public.products USING btree (price_eur) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_price_aud ON public.products USING btree (price_aud) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_image_urls ON public.products USING gin (image_urls) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products USING btree (category) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_shipping_methods ON public.products USING gin (shipping_methods) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_products_shipping_method_costs ON public.products USING gin (shipping_method_costs) TABLESPACE pg_default;

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to read products
CREATE POLICY "Allow authenticated users to read products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow vendors to insert their own products
CREATE POLICY "Allow vendors to insert their own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

-- Allow vendors to update their own products
CREATE POLICY "Allow vendors to update their own products" ON public.products
  FOR UPDATE USING (auth.uid() = vendor_id);

-- Allow vendors to delete their own products
CREATE POLICY "Allow vendors to delete their own products" ON public.products
  FOR DELETE USING (auth.uid() = vendor_id);

-- Allow admins to do everything
CREATE POLICY "Allow admins full access" ON public.products
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data if needed
-- INSERT INTO public.products (title, description, price_btc, vendor_id, category) 
-- VALUES ('Sample Product', 'This is a sample product', 0.001, 'your-vendor-uuid', 'Electronics');
