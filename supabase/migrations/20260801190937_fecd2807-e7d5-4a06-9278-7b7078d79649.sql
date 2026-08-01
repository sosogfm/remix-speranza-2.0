
-- 1. Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  author_name text,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Blocos de informação dos produtos
CREATE TABLE public.product_info_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_info_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_info_blocks TO authenticated;
GRANT ALL ON public.product_info_blocks TO service_role;
ALTER TABLE public.product_info_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Info blocks are viewable by everyone" ON public.product_info_blocks FOR SELECT USING (true);
CREATE POLICY "Admins manage info blocks" ON public.product_info_blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER product_info_blocks_updated_at BEFORE UPDATE ON public.product_info_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Tipos de experiência para eventos privativos
CREATE TABLE public.private_event_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.private_event_experiences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.private_event_experiences TO authenticated;
GRANT ALL ON public.private_event_experiences TO service_role;
ALTER TABLE public.private_event_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Experiences are viewable by everyone" ON public.private_event_experiences FOR SELECT USING (true);
CREATE POLICY "Admins manage experiences" ON public.private_event_experiences FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER private_event_experiences_updated_at BEFORE UPDATE ON public.private_event_experiences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.private_event_experiences (value, label, description, position) VALUES
  ('decalque', 'Decalque', 'Experiência com aplicação de decalques em porcelana', 0),
  ('pintura', 'Pintura à mão', 'Pintura livre em porcelana com tintas próprias', 1),
  ('kit-presente', 'Kit presente personalizado', 'Encomenda de kits personalizados para o seu evento', 2);

-- 4. Promoções e estoque baixo
ALTER TABLE public.products
  ADD COLUMN sale_price_cents integer,
  ADD COLUMN sale_starts_at timestamptz,
  ADD COLUMN sale_ends_at timestamptz,
  ADD COLUMN low_stock_threshold integer NOT NULL DEFAULT 3;

-- 5. Imagens por opção + preços de tamanho absolutos
ALTER TABLE public.product_personalization_fields
  ADD COLUMN option_images jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.product_personalization_fields f
SET option_prices = (
  SELECT jsonb_object_agg(kv.key, (kv.value)::int + p.price_cents)
  FROM jsonb_each_text(f.option_prices) AS kv(key, value)
)
FROM public.products p
WHERE p.id = f.product_id
  AND f.field_type = 'size'
  AND f.option_prices <> '{}'::jsonb;

-- 6. Limpeza automática de oficinas vencidas
CREATE OR REPLACE FUNCTION public.cleanup_past_workshops()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.workshops
  SET is_published = false
  WHERE event_date < current_date AND is_published = true;

  DELETE FROM public.workshops
  WHERE event_date < current_date - interval '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.workshop_registrations r WHERE r.workshop_id = workshops.id
    );
END;
$$;
