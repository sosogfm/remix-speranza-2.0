export interface GuestOrderItem {
  id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  personalization_text: string | null;
}

export interface GuestOrder {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  address_line: string;
  address_number: string;
  neighborhood: string;
  city: string;
  state: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  installments: number;
  payment_method: string;
  order_items: GuestOrderItem[];
}

const ORDERS_KEY = "speranza-pedidos";
const WORKSHOPS_KEY = "speranza-inscricoes";

const read = <T>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignora quota */
  }
};

export const getGuestOrders = () => read<GuestOrder>(ORDERS_KEY);

export const saveGuestOrder = (order: GuestOrder) =>
  write(ORDERS_KEY, [order, ...getGuestOrders().filter((o) => o.id !== order.id)]);

export const getGuestOrder = (id?: string) =>
  id ? getGuestOrders().find((o) => o.id === id) ?? null : null;

export interface GuestRegistration {
  id: string;
  workshop_id: string;
  workshop_title: string;
  workshop_date: string | null;
  full_name: string;
  phone: string;
  is_waitlist: boolean;
  total_cents: number;
  created_at: string;
}

export const getGuestRegistrations = () =>
  read<GuestRegistration>(WORKSHOPS_KEY);

export const saveGuestRegistration = (registration: GuestRegistration) =>
  write(WORKSHOPS_KEY, [registration, ...getGuestRegistrations()]);
