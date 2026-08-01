import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Workshop {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  imageUrl: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  location: string;
  teacher: string | null;
  priceCents: number;
  totalSpots: number;
  spotsTaken: number;
  isSoldOut: boolean;
  allowsWaitlist: boolean;
  glazingAvailable: boolean;
  glazingPriceCents: number;
  notes: string | null;
  isPublished: boolean;
}

export const mapWorkshop = (r: any): Workshop => ({
  id: r.id,
  title: r.title,
  slug: r.slug,
  summary: r.summary,
  description: r.description,
  imageUrl: r.image_url,
  eventDate: r.event_date,
  startTime: r.start_time,
  endTime: r.end_time,
  durationMinutes: r.duration_minutes ?? null,
  location: r.location,
  teacher: r.teacher,
  priceCents: r.price_cents,
  totalSpots: r.total_spots,
  spotsTaken: r.spots_taken,
  isSoldOut: r.is_sold_out || r.spots_taken >= r.total_spots,
  allowsWaitlist: r.allows_waitlist,
  glazingAvailable: r.glazing_available,
  glazingPriceCents: r.glazing_price_cents,
  notes: r.notes,
  isPublished: r.is_published,
});

export const formatWorkshopDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}`;
};

export const formatWorkshopDateLong = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export const useWorkshops = () =>
  useQuery({
    queryKey: ["workshops"],
    queryFn: async (): Promise<Workshop[]> => {
      const { data, error } = await supabase
        .from("workshops")
        .select("*")
        .order("event_date");
      if (error) throw error;
      return data.map(mapWorkshop);
    },
  });

export const useWorkshop = (slug?: string) =>
  useQuery({
    queryKey: ["workshop", slug],
    enabled: !!slug,
    queryFn: async (): Promise<Workshop | null> => {
      const { data, error } = await supabase
        .from("workshops")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data ? mapWorkshop(data) : null;
    },
  });

export const useMyRegistrations = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-registrations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshop_registrations")
        .select("*, workshops(title,event_date,slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};
