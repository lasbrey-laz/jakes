import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kblccvedafzagqlmdfee.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibGNjdmVkYWZ6YWdxbG1kZmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NzYyMzEsImV4cCI6MjA2NjM1MjIzMX0.FSFTj0AuprBjo3KpQryKTxybnZmXwYwsNMCC68f5dPQ'

const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibGNjdmVkYWZ6YWdxbG1kZmVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc3NjIzMSwiZXhwIjoyMDY2MzUyMjMxfQ.1ApF84ZCAQyfJXATQHEDI1yWYtjGACPlS-7JKkW8-AM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          is_vendor: boolean
          is_admin: boolean
          is_active: boolean
          is_verified: boolean
          vendor_status: string
          reputation_score: number
          vendor_type: string
          total_sales: number
          disputes_won: number
          disputes_lost: number
          open_orders: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          is_vendor?: boolean
          is_admin?: boolean
          is_active?: boolean
          is_verified?: boolean
          vendor_status?: string
          reputation_score?: number
          vendor_type?: string
          total_sales?: number
          disputes_won?: number
          disputes_lost?: number
          open_orders?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          is_vendor?: boolean
          is_admin?: boolean
          is_active?: boolean
          is_verified?: boolean
          vendor_status?: string
          reputation_score?: number
          vendor_type?: string
          total_sales?: number
          disputes_won?: number
          disputes_lost?: number
          open_orders?: number
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subcategories: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string
          icon: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description: string
          icon?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string
          icon?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          vendor_id: string
          title: string
          description: string
          price_btc: number
          price_usd: number | null
          price_gbp: number | null
          price_eur: number | null
          price_aud: number | null
          price_xmr: number | null
          accepts_monero: boolean
          category: string
          subcategory_id: string | null
          image_url: string
          stock_quantity: number
          is_available: boolean
          is_active: boolean
          shipping_from_country: string | null
          shipping_to_countries: string[] | null
          shipping_worldwide: boolean
          shipping_eu: boolean
          shipping_us: boolean
          shipping_uk: boolean
          shipping_cost_usd: number | null
          shipping_cost_btc: number | null
          shipping_cost_xmr: number | null
          shipping_methods: string[] | null
          shipping_method_costs: any | null
          minimum_order_amount_usd: number | null
          minimum_order_amount_xmr: number | null
          view_count: number
          listing_type: string
          unit_type: string
          refund_policy: string | null
          package_lost_policy: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          title: string
          description: string
          price_btc: number
          price_usd?: number | null
          price_gbp?: number | null
          price_eur?: number | null
          price_aud?: number | null
          price_xmr?: number | null
          accepts_monero?: boolean
          category: string
          subcategory_id?: string | null
          image_url?: string
          stock_quantity?: number
          is_available?: boolean
          is_active?: boolean
          shipping_from_country?: string | null
          shipping_to_countries?: string[] | null
          shipping_worldwide?: boolean
          shipping_eu?: boolean
          shipping_us?: boolean
          shipping_uk?: boolean
          shipping_cost_usd?: number | null
          shipping_cost_btc?: number | null
          shipping_cost_xmr?: number | null
          shipping_methods?: string[] | null
          shipping_method_costs?: any | null
          minimum_order_amount_usd?: number | null
          minimum_order_amount_xmr?: number | null
          view_count?: number
          listing_type?: string
          unit_type?: string
          refund_policy?: string | null
          package_lost_policy?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          title?: string
          description?: string
          price_btc?: number
          price_usd?: number | null
          price_gbp?: number | null
          price_eur?: number | null
          price_aud?: number | null
          price_xmr?: number | null
          accepts_monero?: boolean
          category?: string
          subcategory_id?: string | null
          image_url?: string
          stock_quantity?: number
          is_available?: boolean
          is_active?: boolean
          shipping_from_country?: string | null
          shipping_to_countries?: string[] | null
          shipping_worldwide?: boolean
          shipping_eu?: boolean
          shipping_us?: boolean
          shipping_uk?: boolean
          shipping_cost_usd?: number | null
          shipping_cost_btc?: number | null
          shipping_cost_xmr?: number | null
          shipping_methods?: string[] | null
          shipping_method_costs?: any | null
          minimum_order_amount_usd?: number | null
          minimum_order_amount_xmr?: number | null
          view_count?: number
          listing_type?: string
          unit_type?: string
          refund_policy?: string | null
          package_lost_policy?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          buyer_id: string
          vendor_id: string
          product_id: string
          quantity: number
          total_btc: number
          total_xmr: number | null
          total_usd: number | null
          total_gbp: number | null
          total_eur: number | null
          total_aud: number | null
          payment_method: string
          currency_used: string
          status: string
          shipping_method: string | null
          shipping_cost_btc: number | null
          shipping_address: any | null
          shipping_country: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          vendor_id: string
          product_id: string
          quantity: number
          total_btc: number
          total_xmr?: number | null
          total_usd?: number | null
          total_gbp?: number | null
          total_eur?: number | null
          total_aud?: number | null
          payment_method?: string
          currency_used?: string
          status?: string
          shipping_method?: string | null
          shipping_cost_btc?: number | null
          shipping_address?: any | null
          shipping_country?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          vendor_id?: string
          product_id?: string
          quantity?: number
          total_btc?: number
          total_xmr?: number | null
          total_usd?: number | null
          total_gbp?: number | null
          total_eur?: number | null
          total_aud?: number | null
          payment_method?: string
          currency_used?: string
          status?: string
          shipping_method?: string | null
          shipping_cost_btc?: number | null
          shipping_address?: any | null
          shipping_country?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}