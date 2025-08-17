-- Add more currency columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS price_cad DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS price_jpy DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS price_cny DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS price_inr DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS price_brl DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS price_mxn DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS price_ngn DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS price_ghs DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS price_kes DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS price_zar DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS price_rub DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS price_try DECIMAL(15,2);

-- Create indexes for the new currency columns for better query performance
CREATE INDEX IF NOT EXISTS idx_products_price_cad ON public.products(price_cad) WHERE price_cad IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_jpy ON public.products(price_jpy) WHERE price_jpy IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_cny ON public.products(price_cny) WHERE price_cny IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_inr ON public.products(price_inr) WHERE price_inr IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_brl ON public.products(price_brl) WHERE price_brl IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_mxn ON public.products(price_mxn) WHERE price_mxn IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_ngn ON public.products(price_ngn) WHERE price_ngn IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_ghs ON public.products(price_ghs) WHERE price_ghs IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_kes ON public.products(price_kes) WHERE price_kes IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_zar ON public.products(price_zar) WHERE price_zar IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_rub ON public.products(price_rub) WHERE price_rub IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_try ON public.products(price_try) WHERE price_try IS NOT NULL;

-- Add comments to document the new columns
COMMENT ON COLUMN public.products.price_cad IS 'Price in Canadian Dollar (CAD)';
COMMENT ON COLUMN public.products.price_jpy IS 'Price in Japanese Yen (JPY)';
COMMENT ON COLUMN public.products.price_cny IS 'Price in Chinese Yuan (CNY)';
COMMENT ON COLUMN public.products.price_inr IS 'Price in Indian Rupee (INR)';
COMMENT ON COLUMN public.products.price_brl IS 'Price in Brazilian Real (BRL)';
COMMENT ON COLUMN public.products.price_mxn IS 'Price in Mexican Peso (MXN)';
COMMENT ON COLUMN public.products.price_ngn IS 'Price in Nigerian Naira (NGN)';
COMMENT ON COLUMN public.products.price_ghs IS 'Price in Ghanaian Cedi (GHS)';
COMMENT ON COLUMN public.products.price_kes IS 'Price in Kenyan Shilling (KES)';
COMMENT ON COLUMN public.products.price_zar IS 'Price in South African Rand (ZAR)';
COMMENT ON COLUMN public.products.price_rub IS 'Price in Russian Ruble (RUB)';
COMMENT ON COLUMN public.products.price_try IS 'Price in Turkish Lira (TRY)';
