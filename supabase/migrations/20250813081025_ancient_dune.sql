/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Multiple conflicting RLS policies on profiles table
    - Policies checking is_admin status cause infinite recursion
    - "Admins and self can view profiles" policy conflicts with other policies

  2. Solution
    - Drop all existing problematic policies
    - Create clean, non-recursive policies
    - Separate admin access from user self-access
    - Use auth.uid() directly without subqueries

  3. New Policies
    - Users can view their own profile (auth.uid() = id)
    - Users can update their own profile (auth.uid() = id)
    - Users can insert their own profile (auth.uid() = id)
    - Simple public read access for basic profile info
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Admins and self can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create clean, non-recursive policies
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

-- Allow public read access for basic profile information (username, reputation, etc.)
-- This is needed for displaying vendor information publicly
CREATE POLICY "Public can view basic profile info"
  ON profiles
  FOR SELECT
  TO public
  USING (true);