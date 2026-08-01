export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          personalization_text: string | null
          product_id: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          personalization_text?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          personalization_text?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_complement: string | null
          address_line: string | null
          address_number: string | null
          city: string | null
          created_at: string
          customer_document: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          gift_message: string | null
          gift_wrap_cents: number
          id: string
          installments: number
          is_gift: boolean
          neighborhood: string | null
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_payload: Json | null
          payment_provider_id: string | null
          payment_status: string
          postal_code: string | null
          shipping_cents: number
          shipping_status: string
          state: string | null
          stock_committed: boolean
          subtotal_cents: number
          total_cents: number
          tracking_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_complement?: string | null
          address_line?: string | null
          address_number?: string | null
          city?: string | null
          created_at?: string
          customer_document?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          gift_message?: string | null
          gift_wrap_cents?: number
          id?: string
          installments?: number
          is_gift?: boolean
          neighborhood?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_payload?: Json | null
          payment_provider_id?: string | null
          payment_status?: string
          postal_code?: string | null
          shipping_cents?: number
          shipping_status?: string
          state?: string | null
          stock_committed?: boolean
          subtotal_cents?: number
          total_cents?: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_complement?: string | null
          address_line?: string | null
          address_number?: string | null
          city?: string | null
          created_at?: string
          customer_document?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          gift_message?: string | null
          gift_wrap_cents?: number
          id?: string
          installments?: number
          is_gift?: boolean
          neighborhood?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_payload?: Json | null
          payment_provider_id?: string | null
          payment_status?: string
          postal_code?: string | null
          shipping_cents?: number
          shipping_status?: string
          state?: string | null
          stock_committed?: boolean
          subtotal_cents?: number
          total_cents?: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          position: number
          product_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          position?: number
          product_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_personalization_fields: {
        Row: {
          created_at: string
          extra_price_cents: number
          field_type: Database["public"]["Enums"]["personalization_field_type"]
          help_text: string | null
          id: string
          is_required: boolean
          label: string
          max_length: number
          options: string[]
          position: number
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          extra_price_cents?: number
          field_type?: Database["public"]["Enums"]["personalization_field_type"]
          help_text?: string | null
          id?: string
          is_required?: boolean
          label: string
          max_length?: number
          options?: string[]
          position?: number
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          extra_price_cents?: number
          field_type?: Database["public"]["Enums"]["personalization_field_type"]
          help_text?: string | null
          id?: string
          is_required?: boolean
          label?: string
          max_length?: number
          options?: string[]
          position?: number
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_personalization_fields_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          dimensions: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_new: boolean
          is_personalizable: boolean
          long_description: string | null
          materials: string | null
          max_installments: number
          name: string
          personalization_label: string | null
          personalization_max_length: number
          price_cents: number
          slug: string
          stock_quantity: number
          updated_at: string
          weight_grams: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_personalizable?: boolean
          long_description?: string | null
          materials?: string | null
          max_installments?: number
          name: string
          personalization_label?: string | null
          personalization_max_length?: number
          price_cents: number
          slug: string
          stock_quantity?: number
          updated_at?: string
          weight_grams?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_personalizable?: boolean
          long_description?: string | null
          materials?: string | null
          max_installments?: number
          name?: string
          personalization_label?: string | null
          personalization_max_length?: number
          price_cents?: number
          slug?: string
          stock_quantity?: number
          updated_at?: string
          weight_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          document: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shipping_rates: {
        Row: {
          cep_end: string
          cep_start: string
          created_at: string
          delivery_days: number
          free_above_cents: number | null
          id: string
          is_active: boolean
          price_cents: number
          region_name: string
          updated_at: string
        }
        Insert: {
          cep_end: string
          cep_start: string
          created_at?: string
          delivery_days?: number
          free_above_cents?: number | null
          id?: string
          is_active?: boolean
          price_cents?: number
          region_name: string
          updated_at?: string
        }
        Update: {
          cep_end?: string
          cep_start?: string
          created_at?: string
          delivery_days?: number
          free_above_cents?: number | null
          id?: string
          is_active?: boolean
          price_cents?: number
          region_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_registrations: {
        Row: {
          created_at: string
          dietary_restriction: string
          full_name: string
          id: string
          instagram: string | null
          is_waitlist: boolean
          notes: string | null
          order_id: string | null
          phone: string
          status: string
          updated_at: string
          user_id: string | null
          wants_glazing: boolean
          workshop_id: string
        }
        Insert: {
          created_at?: string
          dietary_restriction?: string
          full_name: string
          id?: string
          instagram?: string | null
          is_waitlist?: boolean
          notes?: string | null
          order_id?: string | null
          phone: string
          status?: string
          updated_at?: string
          user_id?: string | null
          wants_glazing?: boolean
          workshop_id: string
        }
        Update: {
          created_at?: string
          dietary_restriction?: string
          full_name?: string
          id?: string
          instagram?: string | null
          is_waitlist?: boolean
          notes?: string | null
          order_id?: string | null
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          wants_glazing?: boolean
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_registrations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_registrations_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          allows_waitlist: boolean
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          glazing_available: boolean
          glazing_price_cents: number
          id: string
          image_url: string | null
          is_published: boolean
          is_sold_out: boolean
          location: string
          notes: string | null
          price_cents: number
          slug: string
          spots_taken: number
          start_time: string | null
          summary: string | null
          teacher: string | null
          title: string
          total_spots: number
          updated_at: string
        }
        Insert: {
          allows_waitlist?: boolean
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          glazing_available?: boolean
          glazing_price_cents?: number
          id?: string
          image_url?: string | null
          is_published?: boolean
          is_sold_out?: boolean
          location?: string
          notes?: string | null
          price_cents: number
          slug: string
          spots_taken?: number
          start_time?: string | null
          summary?: string | null
          teacher?: string | null
          title: string
          total_spots?: number
          updated_at?: string
        }
        Update: {
          allows_waitlist?: boolean
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          glazing_available?: boolean
          glazing_price_cents?: number
          id?: string
          image_url?: string | null
          is_published?: boolean
          is_sold_out?: boolean
          location?: string
          notes?: string | null
          price_cents?: number
          slug?: string
          spots_taken?: number
          start_time?: string | null
          summary?: string | null
          teacher?: string | null
          title?: string
          total_spots?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      place_guest_order: {
        Args: { _items: Json; _order: Json }
        Returns: {
          id: string
          order_number: string
        }[]
      }
      register_workshop_guest: {
        Args: {
          _dietary_restriction?: string
          _full_name: string
          _instagram?: string
          _is_waitlist?: boolean
          _notes?: string
          _phone: string
          _wants_glazing?: boolean
          _workshop_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      personalization_field_type:
        | "initial"
        | "text"
        | "color"
        | "image"
        | "choice"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      personalization_field_type: [
        "initial",
        "text",
        "color",
        "image",
        "choice",
      ],
    },
  },
} as const
