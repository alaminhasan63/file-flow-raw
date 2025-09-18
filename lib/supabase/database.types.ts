export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: 'customer' | 'admin' | 'ops'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'admin' | 'ops'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'admin' | 'ops'
          created_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          owner_id: string
          legal_name: string
          dba: string | null
          formation_state: string
          entity_type: 'LLC' | 'CORP' | 'NONPROFIT' | 'OTHER'
          foreign_qual_state: string | null
          formation_package_id: string | null
          status: 'draft' | 'active' | 'suspended'
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          legal_name: string
          dba?: string | null
          formation_state: string
          entity_type: 'LLC' | 'CORP' | 'NONPROFIT' | 'OTHER'
          foreign_qual_state?: string | null
          formation_package_id?: string | null
          status?: 'draft' | 'active' | 'suspended'
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          legal_name?: string
          dba?: string | null
          formation_state?: string
          entity_type?: 'LLC' | 'CORP' | 'NONPROFIT' | 'OTHER'
          foreign_qual_state?: string | null
          formation_package_id?: string | null
          status?: 'draft' | 'active' | 'suspended'
          created_at?: string
        }
      }
      filings: {
        Row: {
          id: string
          business_id: string
          stage: 'intake' | 'ready' | 'queued' | 'submitting' | 'submitted' | 'approved' | 'rejected' | 'needs_info' | 'failed'
          state_code: string
          filing_type: 'LLC_FORMATION' | 'ANNUAL_REPORT' | 'EIN' | 'AMENDMENT'
          quoted_total_cents: number
          paid_total_cents: number
          external_ref: Json | null
          ein_service: boolean
          mail_forwarding: boolean
          registered_agent_address: string
          use_fileflow_registered_agent: boolean
          ein_status: 'pending' | 'queued' | 'submitting' | 'submitted' | 'approved' | 'failed'
          ein_payload: Json
          mail_forwarding_status: 'pending' | 'queued' | 'active' | 'paused' | 'canceled' | 'failed'
          mail_forwarding_payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          stage?: 'intake' | 'ready' | 'queued' | 'submitting' | 'submitted' | 'approved' | 'rejected' | 'needs_info' | 'failed'
          state_code: string
          filing_type: 'LLC_FORMATION' | 'ANNUAL_REPORT' | 'EIN' | 'AMENDMENT'
          quoted_total_cents: number
          paid_total_cents?: number
          external_ref?: Json | null
          ein_service?: boolean
          mail_forwarding?: boolean
          registered_agent_address?: string
          use_fileflow_registered_agent?: boolean
          ein_status?: 'pending' | 'queued' | 'submitting' | 'submitted' | 'approved' | 'failed'
          ein_payload?: Json
          mail_forwarding_status?: 'pending' | 'queued' | 'active' | 'paused' | 'canceled' | 'failed'
          mail_forwarding_payload?: Json
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          stage?: 'intake' | 'ready' | 'queued' | 'submitting' | 'submitted' | 'approved' | 'rejected' | 'needs_info' | 'failed'
          state_code?: string
          filing_type?: 'LLC_FORMATION' | 'ANNUAL_REPORT' | 'EIN' | 'AMENDMENT'
          quoted_total_cents?: number
          paid_total_cents?: number
          external_ref?: Json | null
          ein_service?: boolean
          mail_forwarding?: boolean
          registered_agent_address?: string
          use_fileflow_registered_agent?: boolean
          ein_status?: 'pending' | 'queued' | 'submitting' | 'submitted' | 'approved' | 'failed'
          ein_payload?: Json
          mail_forwarding_status?: 'pending' | 'queued' | 'active' | 'paused' | 'canceled' | 'failed'
          mail_forwarding_payload?: Json
          created_at?: string
        }
      }
      filing_tasks: {
        Row: {
          id: string
          filing_id: string
          code: string
          label: string
          status: 'todo' | 'in_progress' | 'blocked' | 'done' | 'error'
          payload: Json | null
          result: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          filing_id: string
          code: string
          label: string
          status?: 'todo' | 'in_progress' | 'blocked' | 'done' | 'error'
          payload?: Json | null
          result?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          filing_id?: string
          code?: string
          label?: string
          status?: 'todo' | 'in_progress' | 'blocked' | 'done' | 'error'
          payload?: Json | null
          result?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          name: string
          description: string | null
          base_price_cents: number
          includes: Json | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          base_price_cents: number
          includes?: Json | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          base_price_cents?: number
          includes?: Json | null
        }
      }
      addons: {
        Row: {
          id: string
          name: string
          description: string | null
          price_cents: number
          code: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price_cents: number
          code: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price_cents?: number
          code?: string
        }
      }
      state_pricing: {
        Row: {
          id: string
          state_code: string
          package_id: string
          govt_fee_cents: number
          surcharge_cents: number
        }
        Insert: {
          id?: string
          state_code: string
          package_id: string
          govt_fee_cents: number
          surcharge_cents?: number
        }
        Update: {
          id?: string
          state_code?: string
          package_id?: string
          govt_fee_cents?: number
          surcharge_cents?: number
        }
      }
      states: {
        Row: {
          code: string
          display_name: string
          requires_ra: boolean
          notes: string | null
        }
        Insert: {
          code: string
          display_name: string
          requires_ra?: boolean
          notes?: string | null
        }
        Update: {
          code?: string
          display_name?: string
          requires_ra?: boolean
          notes?: string | null
        }
      }
    }
  }
}