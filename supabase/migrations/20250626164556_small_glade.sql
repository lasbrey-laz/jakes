/*
  # Complete Marketplace Database Schema

  1. New Tables
    - `profiles` (user profiles with admin and vendor capabilities)
    - `categories` (product categories)
    - `products` (marketplace products)
    - `orders` (purchase orders)

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for users, vendors, and admins
    - Secure data access based on user roles

  3. Relationships
    - Products belong to vendors (profiles)
    - Products belong to categories
    - Orders connect buyers, vendors, and products
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  is_vendor boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  vendor_status text DEFAULT 'pending',
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  reputation_score decimal(3,2) DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text DEFAULT '📦',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price_btc decimal(16,8) NOT NULL,
  category text NOT NULL,
  image_url text,
  stock_quantity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 1,
  total_btc decimal(16,8) NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_vendor ON profiles(is_vendor);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON profiles;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Only admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Vendors can view their own products" ON products;
DROP POLICY IF EXISTS "Vendors can create products" ON products;
DROP POLICY IF EXISTS "Vendors can update their own products" ON products;
DROP POLICY IF EXISTS "Vendors can delete their own products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;
DROP POLICY IF EXISTS "Buyers can view their own orders" ON orders;
DROP POLICY IF EXISTS "Vendors can view orders for their products" ON orders;
DROP POLICY IF EXISTS "Buyers can create orders" ON orders;
DROP POLICY IF EXISTS "Vendors can update order status" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update order status" ON orders;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update user profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Categories policies
CREATE POLICY "Categories are viewable by everyone"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Products policies
CREATE POLICY "Active products are viewable by everyone"
  ON products
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Vendors can view their own products"
  ON products
  FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can create products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update their own products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can delete their own products"
  ON products
  FOR DELETE
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Admins can manage all products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Orders policies
CREATE POLICY "Buyers can view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Vendors can view orders for their products"
  ON orders
  FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Buyers can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Vendors can update order status"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Admins can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update order status"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Insert default categories
INSERT INTO categories (name, description, icon) VALUES
  ('Digital Assets', 'Software, licenses, digital content', '💾'),
  ('Security Tools', 'VPNs, encryption, privacy tools', '🔒'),
  ('Electronics', 'Phones, computers, gadgets', '📱'),
  ('Books & Media', 'E-books, courses, tutorials', '📚'),
  ('Services', 'Consulting, development, support', '⚙️'),
  ('Collectibles', 'Rare items, art, memorabilia', '🎭')
ON CONFLICT (name) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO profiles (id, username, email, is_vendor, is_admin, vendor_status, reputation_score) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'admin@securemarket.com', false, true, 'approved', 5.0),
  ('00000000-0000-0000-0000-000000000002', 'CryptoGuard', 'vendor1@securemarket.com', true, false, 'approved', 4.9),
  ('00000000-0000-0000-0000-000000000003', 'SecureComms', 'vendor2@securemarket.com', true, false, 'approved', 4.8)
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO products (vendor_id, title, description, price_btc, category, stock_quantity) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Premium VPN Service', 'Military-grade encryption VPN service with global servers', 0.0045, 'Security Tools', 100),
  ('00000000-0000-0000-0000-000000000003', 'Encrypted Messaging App', 'End-to-end encrypted messaging with disappearing messages', 0.0023, 'Security Tools', 50),
  ('00000000-0000-0000-0000-000000000002', 'Privacy Handbook 2025', 'Complete guide to digital privacy and security', 0.0012, 'Books & Media', 200),
  ('00000000-0000-0000-0000-000000000003', 'Hardware Wallet', 'Secure cryptocurrency hardware wallet', 0.0234, 'Electronics', 25)
ON CONFLICT DO NOTHING;