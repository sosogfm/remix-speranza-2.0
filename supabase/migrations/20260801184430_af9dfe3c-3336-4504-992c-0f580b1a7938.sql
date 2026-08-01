ALTER TYPE public.personalization_field_type ADD VALUE IF NOT EXISTS 'addon';
ALTER TYPE public.personalization_field_type ADD VALUE IF NOT EXISTS 'size';

ALTER TABLE public.product_personalization_fields
  ADD COLUMN IF NOT EXISTS option_prices jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_quote_only boolean NOT NULL DEFAULT false;

INSERT INTO public.user_roles (user_id, role)
VALUES ('36bbde25-c037-4b3f-a166-1c386d7afd33'::uuid, 'admin')
ON CONFLICT DO NOTHING;