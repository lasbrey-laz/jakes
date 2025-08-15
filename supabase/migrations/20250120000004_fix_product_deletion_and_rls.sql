-- Migration to fix product deletion issues and add proper RLS policies

-- First, let's create the deleted_products table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.deleted_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_product_id UUID NOT NULL,
  product_data JSONB NOT NULL,
  deleted_by TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deletion_reason TEXT,
  can_be_restored BOOLEAN DEFAULT true,
  restored_at TIMESTAMP WITH TIME ZONE,
  restored_by TEXT
);

-- Create indexes for the deleted_products table
CREATE INDEX IF NOT EXISTS idx_deleted_products_original_id ON public.deleted_products(original_product_id);
CREATE INDEX IF NOT EXISTS idx_deleted_products_deleted_at ON public.deleted_products(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deleted_products_can_be_restored ON public.deleted_products(can_be_restored);

-- First, let's create the move_product_to_deleted function
CREATE OR REPLACE FUNCTION move_product_to_deleted(
  p_product_id UUID,
  p_deletion_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_product_data JSONB;
  v_deleted_by TEXT;
  v_user_id UUID;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if user is admin or super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = v_user_id AND (is_admin = true OR is_super_admin = true)
  ) THEN
    RAISE EXCEPTION 'Only admins can delete products';
  END IF;
  
  -- Get the product data before deletion
  SELECT to_jsonb(p.*) INTO v_product_data
  FROM public.products p
  WHERE p.id = p_product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  -- Get the username of who's deleting
  SELECT username INTO v_deleted_by
  FROM public.profiles
  WHERE id = v_user_id;
  
  -- Insert into deleted_products table
  INSERT INTO public.deleted_products (
    original_product_id,
    product_data,
    deleted_by,
    deleted_at,
    deletion_reason,
    can_be_restored
  ) VALUES (
    p_product_id,
    v_product_data,
    COALESCE(v_deleted_by, 'Unknown'),
    NOW(),
    p_deletion_reason,
    true
  );
  
  -- Mark the product as inactive instead of deleting
  UPDATE public.products 
  SET is_active = false, updated_at = NOW()
  WHERE id = p_product_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION move_product_to_deleted(UUID, TEXT) TO authenticated;

-- Create function to restore deleted products
CREATE OR REPLACE FUNCTION restore_deleted_product(
  p_deleted_product_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted_product RECORD;
  v_user_id UUID;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if user is admin or super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = v_user_id AND (is_admin = true OR is_super_admin = true)
  ) THEN
    RAISE EXCEPTION 'Only admins can restore products';
  END IF;
  
  -- Get the deleted product record
  SELECT * INTO v_deleted_product
  FROM public.deleted_products
  WHERE id = p_deleted_product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deleted product not found';
  END IF;
  
  IF NOT v_deleted_product.can_be_restored THEN
    RAISE EXCEPTION 'This product cannot be restored';
  END IF;
  
  -- Restore the product by setting it active again
  UPDATE public.products 
  SET is_active = true, updated_at = NOW()
  WHERE id = v_deleted_product.original_product_id;
  
  -- Mark the deleted product as restored
  UPDATE public.deleted_products
  SET 
    can_be_restored = false,
    restored_at = NOW(),
    restored_by = (SELECT username FROM public.profiles WHERE id = v_user_id)
  WHERE id = p_deleted_product_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the restore function
GRANT EXECUTE ON FUNCTION restore_deleted_product(UUID) TO authenticated;

-- Create function to permanently delete products
CREATE OR REPLACE FUNCTION permanently_delete_product(
  p_deleted_product_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = v_user_id AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Only super admins can permanently delete products';
  END IF;
  
  -- Delete the deleted product record
  DELETE FROM public.deleted_products
  WHERE id = p_deleted_product_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the permanent delete function
GRANT EXECUTE ON FUNCTION permanently_delete_product(UUID) TO authenticated;

-- Now let's fix the RLS policies for the products table
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view products" ON public.products;
DROP POLICY IF EXISTS "Vendors can insert products" ON public.products;
DROP POLICY IF EXISTS "Vendors can update own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can delete own products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

-- Create new policies that support admin operations
-- Everyone can view active products
CREATE POLICY "Users can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Vendors can view their own products (including inactive ones)
CREATE POLICY "Vendors can view own products" ON public.products
    FOR SELECT USING (
        vendor_id = auth.uid() OR is_active = true
    );

-- Vendors can insert products
CREATE POLICY "Vendors can insert products" ON public.products
    FOR INSERT WITH CHECK (
        vendor_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_vendor = true
        )
    );

-- Vendors can update their own products
CREATE POLICY "Vendors can update own products" ON public.products
    FOR UPDATE USING (
        vendor_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_vendor = true
        )
    );

-- Admins and super admins can view all products
CREATE POLICY "Admins can view all products" ON public.products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
        )
    );

-- Admins and super admins can update all products
CREATE POLICY "Admins can update all products" ON public.products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
        )
    );

-- Admins and super admins can insert products
CREATE POLICY "Admins can insert products" ON public.products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
        )
    );

-- Ensure the products table has RLS enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- Also fix the deleted_products table RLS policies if they exist
DROP POLICY IF EXISTS "Users can view deleted products" ON public.deleted_products;
DROP POLICY IF EXISTS "Admins can view deleted products" ON public.deleted_products;

-- Create policy for deleted_products table
CREATE POLICY "Admins can view deleted products" ON public.deleted_products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
        )
    );

CREATE POLICY "Admins can insert deleted products" ON public.deleted_products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
        )
    );

CREATE POLICY "Admins can update deleted products" ON public.deleted_products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
        )
    );

CREATE POLICY "Admins can delete deleted products" ON public.deleted_products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
        )
    );

-- Ensure the deleted_products table has RLS enabled
ALTER TABLE public.deleted_products ENABLE ROW LEVEL SECURITY;
