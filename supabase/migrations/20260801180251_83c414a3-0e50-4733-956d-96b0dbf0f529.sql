-- Allow logged-in customers to create their own orders/items directly
CREATE POLICY "orders own insert" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "order items own insert" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- Guest checkout via security definer function
CREATE OR REPLACE FUNCTION public.place_guest_order(_order jsonb, _items jsonb)
RETURNS TABLE (id uuid, order_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_id uuid;
  _number text;
BEGIN
  INSERT INTO public.orders (
    user_id, customer_name, customer_email, customer_phone, customer_document,
    address_line, address_number, address_complement, neighborhood, city, state,
    postal_code, notes, subtotal_cents, shipping_cents, total_cents, installments,
    payment_method, is_gift, gift_message, gift_wrap_cents
  ) VALUES (
    auth.uid(),
    _order->>'customer_name',
    _order->>'customer_email',
    _order->>'customer_phone',
    _order->>'customer_document',
    _order->>'address_line',
    _order->>'address_number',
    _order->>'address_complement',
    _order->>'neighborhood',
    _order->>'city',
    _order->>'state',
    _order->>'postal_code',
    _order->>'notes',
    COALESCE((_order->>'subtotal_cents')::int, 0),
    COALESCE((_order->>'shipping_cents')::int, 0),
    COALESCE((_order->>'total_cents')::int, 0),
    COALESCE((_order->>'installments')::int, 1),
    _order->>'payment_method',
    COALESCE((_order->>'is_gift')::boolean, false),
    _order->>'gift_message',
    COALESCE((_order->>'gift_wrap_cents')::int, 0)
  )
  RETURNING orders.id, orders.order_number INTO _new_id, _number;

  INSERT INTO public.order_items (order_id, product_id, product_name, unit_price_cents, quantity, personalization_text)
  SELECT _new_id,
         NULLIF(i->>'product_id','')::uuid,
         i->>'product_name',
         COALESCE((i->>'unit_price_cents')::int, 0),
         GREATEST(COALESCE((i->>'quantity')::int, 1), 1),
         i->>'personalization_text'
  FROM jsonb_array_elements(_items) AS i;

  RETURN QUERY SELECT _new_id, _number;
END;
$$;

REVOKE ALL ON FUNCTION public.place_guest_order(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_guest_order(jsonb, jsonb) TO anon, authenticated;

-- Guest workshop registration
CREATE OR REPLACE FUNCTION public.register_workshop_guest(
  _workshop_id uuid,
  _full_name text,
  _phone text,
  _instagram text DEFAULT NULL,
  _dietary_restriction text DEFAULT 'Nenhuma',
  _wants_glazing boolean DEFAULT false,
  _notes text DEFAULT NULL,
  _is_waitlist boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF coalesce(trim(_full_name), '') = '' OR coalesce(trim(_phone), '') = '' THEN
    RAISE EXCEPTION 'Nome e telefone são obrigatórios';
  END IF;

  INSERT INTO public.workshop_registrations (
    workshop_id, user_id, full_name, instagram, phone,
    dietary_restriction, wants_glazing, notes, is_waitlist, status
  ) VALUES (
    _workshop_id, auth.uid(), trim(_full_name), NULLIF(trim(_instagram), ''), trim(_phone),
    COALESCE(_dietary_restriction, 'Nenhuma'), COALESCE(_wants_glazing, false),
    NULLIF(trim(_notes), ''), COALESCE(_is_waitlist, false),
    CASE WHEN _is_waitlist THEN 'waitlist' ELSE 'pending' END
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.register_workshop_guest(uuid, text, text, text, text, boolean, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_workshop_guest(uuid, text, text, text, text, boolean, text, boolean) TO anon, authenticated;