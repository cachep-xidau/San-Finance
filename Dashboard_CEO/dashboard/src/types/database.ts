export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          code: string
          name: string
          parent_category: string | null
          expense_type: 'fixed' | 'variable' | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          parent_category?: string | null
          expense_type?: 'fixed' | 'variable' | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          parent_category?: string | null
          expense_type?: 'fixed' | 'variable' | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          role: 'ceo' | 'c_suite' | 'clinic_manager'
          clinic_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'ceo' | 'c_suite' | 'clinic_manager'
          clinic_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'ceo' | 'c_suite' | 'clinic_manager'
          clinic_id?: string | null
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          clinic_id: string
          category_id: string
          year: number
          month: number | null
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          category_id: string
          year: number
          month?: number | null
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          category_id?: string
          year?: number
          month?: number | null
          amount?: number
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          clinic_id: string
          category_id: string
          date: string
          description: string | null
          amount: number
          source_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          category_id: string
          date: string
          description?: string | null
          amount: number
          source_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          category_id?: string
          date?: string
          description?: string | null
          amount?: number
          source_type?: string | null
          created_at?: string
        }
      }
      revenue: {
        Row: {
          id: string
          clinic_id: string
          date: string
          cash: number
          card: number
          card_net: number
          transfer: number
          installment: number
          deposit: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          date: string
          cash?: number
          card?: number
          card_net?: number
          transfer?: number
          installment?: number
          deposit?: number
          total: number
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          date?: string
          cash?: number
          card?: number
          card_net?: number
          transfer?: number
          installment?: number
          deposit?: number
          total?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Clinic = Database['public']['Tables']['clinics']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type Revenue = Database['public']['Tables']['revenue']['Row']
