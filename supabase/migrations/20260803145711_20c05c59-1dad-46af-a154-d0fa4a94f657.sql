ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS sale_price_cents integer,
  ADD COLUMN IF NOT EXISTS sale_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS sale_ends_at timestamptz;