/*
  # Add Subcategories and USD Pricing Support

  1. New Tables
    - `subcategories` (subcategories for products)
    
  2. Table Updates
    - Add `subcategory_id` to products table
    - Add `price_usd` to products table
    - Add `parent_id` to categories for hierarchical structure

  3. Security
    - Enable RLS on subcategories table
    - Add policies for public read access
    - Add admin-only write policies

  4. Sample Data
    - Insert sample subcategories for existing categories
*/

-- Add parent_id to categories for hierarchical structure
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES categories(id) ON DELETE CASCADE;

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT '📦',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, name)
);

-- Add subcategory_id and price_usd to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES subcategories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_usd decimal(12,2);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Enable RLS on subcategories table
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Subcategories policies
CREATE POLICY "Subcategories are publicly viewable"
  ON subcategories
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert subcategories"
  ON subcategories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update subcategories"
  ON subcategories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can delete subcategories"
  ON subcategories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create trigger for subcategories updated_at
CREATE TRIGGER update_subcategories_updated_at 
  BEFORE UPDATE ON subcategories 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Insert sample subcategories
INSERT INTO subcategories (category_id, name, description, icon) 
SELECT c.id, sub.name, sub.description, sub.icon
FROM categories c
CROSS JOIN (
  VALUES 
    ('Digital Assets', 'Software Licenses', 'Commercial software licenses and keys', '🔑'),
    ('Digital Assets', 'Digital Art', 'NFTs, digital artwork, and graphics', '🎨'),
    ('Digital Assets', 'E-books', 'Digital books and publications', '📖'),
    ('Digital Assets', 'Music & Audio', 'Digital music, sound effects, and audio files', '🎵'),
    
    ('Security Tools', 'VPN Services', 'Virtual private network services', '🌐'),
    ('Security Tools', 'Encryption Software', 'File and communication encryption tools', '🔐'),
    ('Security Tools', 'Password Managers', 'Password management and security tools', '🔒'),
    ('Security Tools', 'Antivirus Software', 'Malware protection and security suites', '🛡️'),
    
    ('Electronics', 'Smartphones', 'Mobile phones and accessories', '📱'),
    ('Electronics', 'Computers', 'Laptops, desktops, and computer parts', '💻'),
    ('Electronics', 'Gaming', 'Gaming consoles, accessories, and peripherals', '🎮'),
    ('Electronics', 'Audio Equipment', 'Headphones, speakers, and audio gear', '🎧'),
    
    ('Books & Media', 'Technical Books', 'Programming, IT, and technical literature', '📚'),
    ('Books & Media', 'Online Courses', 'Educational courses and tutorials', '🎓'),
    ('Books & Media', 'Video Content', 'Movies, documentaries, and video files', '🎬'),
    ('Books & Media', 'Magazines', 'Digital magazines and periodicals', '📰'),
    
    ('Services', 'Web Development', 'Website design and development services', '🌐'),
    ('Services', 'Consulting', 'Business and technical consulting', '💼'),
    ('Services', 'Design Services', 'Graphic design and creative services', '🎨'),
    ('Services', 'Writing Services', 'Content writing and copywriting', '✍️'),
    
    ('Collectibles', 'Digital Collectibles', 'Rare digital items and NFTs', '💎'),
    ('Collectibles', 'Trading Cards', 'Physical and digital trading cards', '🃏'),
    ('Collectibles', 'Memorabilia', 'Collectible items and memorabilia', '🏆'),
    ('Collectibles', 'Art & Crafts', 'Handmade items and artistic creations', '🎭')
) AS sub(category_name, name, description, icon)
WHERE c.name = sub.category_name
ON CONFLICT (category_id, name) DO NOTHING;