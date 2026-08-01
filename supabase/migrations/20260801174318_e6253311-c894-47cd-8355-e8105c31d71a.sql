-- ============ personalization fields ============
CREATE TYPE public.personalization_field_type AS ENUM ('initial','text','color','image','choice');

CREATE TABLE public.product_personalization_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label text NOT NULL,
  help_text text,
  field_type public.personalization_field_type NOT NULL DEFAULT 'text',
  options text[] NOT NULL DEFAULT '{}',
  max_length integer NOT NULL DEFAULT 40,
  is_required boolean NOT NULL DEFAULT false,
  extra_price_cents integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_personalization_fields TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_personalization_fields TO authenticated;
GRANT ALL ON public.product_personalization_fields TO service_role;
ALTER TABLE public.product_personalization_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personalization fields public read" ON public.product_personalization_fields FOR SELECT USING (true);
CREATE POLICY "personalization fields admin write" ON public.product_personalization_fields FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ppf_updated BEFORE UPDATE ON public.product_personalization_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_ppf_product ON public.product_personalization_fields(product_id, position);

-- ============ wishlists ============
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wishlist select" ON public.wishlists FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own wishlist insert" ON public.wishlists FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own wishlist delete" ON public.wishlists FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ workshops ============
CREATE TABLE public.workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text,
  description text,
  image_url text,
  event_date date NOT NULL,
  start_time text DEFAULT '14:00',
  end_time text DEFAULT '18:00',
  location text NOT NULL DEFAULT 'Videira – SC',
  teacher text,
  price_cents integer NOT NULL,
  total_spots integer NOT NULL DEFAULT 12,
  spots_taken integer NOT NULL DEFAULT 0,
  is_sold_out boolean NOT NULL DEFAULT false,
  allows_waitlist boolean NOT NULL DEFAULT true,
  glazing_available boolean NOT NULL DEFAULT false,
  glazing_price_cents integer NOT NULL DEFAULT 15000,
  notes text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workshops TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshops TO authenticated;
GRANT ALL ON public.workshops TO service_role;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workshops public read" ON public.workshops FOR SELECT
  USING (is_published = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "workshops admin write" ON public.workshops FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_workshops_updated BEFORE UPDATE ON public.workshops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ workshop registrations ============
CREATE TABLE public.workshop_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  instagram text,
  phone text NOT NULL,
  dietary_restriction text NOT NULL DEFAULT 'nenhuma',
  wants_glazing boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  is_waitlist boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshop_registrations TO authenticated;
GRANT ALL ON public.workshop_registrations TO service_role;
ALTER TABLE public.workshop_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "registrations own read" ON public.workshop_registrations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "registrations own insert" ON public.workshop_registrations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "registrations admin write" ON public.workshop_registrations FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_wreg_updated BEFORE UPDATE ON public.workshop_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ gift wrapping on orders ============
ALTER TABLE public.orders
  ADD COLUMN is_gift boolean NOT NULL DEFAULT false,
  ADD COLUMN gift_message text,
  ADD COLUMN gift_wrap_cents integer NOT NULL DEFAULT 0;

-- ============ seed workshops ============
INSERT INTO public.workshops (title, slug, summary, event_date, price_cents, teacher, notes, is_sold_out, glazing_available)
VALUES
 ('Pintura em porta joia G','pintura-porta-joia-g','Pintura à mão em porta joia tamanho G','2026-06-27',20000,'Júlia Brandalise',NULL,false,false),
 ('Confecção de uma bolsa de crochê','bolsa-de-croche','Aprenda a confeccionar sua bolsa de crochê','2026-07-25',25000,'Júlia Brandalise',NULL,false,false),
 ('Bordado em bastidor','bordado-em-bastidor-agosto','Bordado em bastidor','2026-08-22',20000,'Júlia Brandalise',NULL,true,false),
 ('Decalque em uma saladeira (24cm)','decalque-saladeira-24cm','Decalque em saladeira de 24cm','2026-09-19',30000,'Júlia Brandalise','Forno profissional',false,false),
 ('Bordado em bastidor','bordado-em-bastidor-outubro','Bordado em bastidor','2026-10-10',20000,'Júlia Brandalise',NULL,false,false),
 ('Pintura em uma imagem de Nossa Senhora','pintura-nossa-senhora','Pintura em imagem de Nossa Senhora','2026-10-24',29000,'Júlia Brandalise','Terá a coroa em ouro',false,false),
 ('Pintura e decalque de uma Panetoneira G','panetoneira-g','Pintura e decalque de panetoneira G','2026-11-21',35000,'Júlia Brandalise','Forno profissional',false,false),
 ('Pintura em 2 taças de champagne','tacas-de-champagne','Pintura em duas taças de champagne','2026-12-12',23000,'Júlia Brandalise',NULL,false,false);
