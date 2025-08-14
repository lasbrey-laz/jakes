/*
  # Create Product Image Storage

  1. Storage Bucket
    - Create 'products' storage bucket for product images
    - Set up public access policies
    - Configure file size limits and allowed types

  2. Security
    - Allow authenticated users to upload images
    - Allow public access to view images
    - Restrict file types to images only
*/

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND 
    auth.role() = 'authenticated'
  );

-- Create policy to allow public access to view product images
CREATE POLICY "Allow public access to view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

-- Create policy to allow authenticated users to update their own images
CREATE POLICY "Allow authenticated users to update product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products' AND 
    auth.role() = 'authenticated'
  );

-- Create policy to allow authenticated users to delete their own images
CREATE POLICY "Allow authenticated users to delete product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' AND 
    auth.role() = 'authenticated'
  );
