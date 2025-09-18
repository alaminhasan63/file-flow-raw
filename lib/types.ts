import { Database } from "./supabase/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Filing = Database["public"]["Tables"]["filings"]["Row"];
export type FilingTask = Database["public"]["Tables"]["filing_tasks"]["Row"];
// export type Document = Database["public"]["Tables"]["documents"]["Row"]; // Table doesn't exist in database types
export type Package = Database["public"]["Tables"]["packages"]["Row"];
export type Addon = Database["public"]["Tables"]["addons"]["Row"];
export type StatePricing = Database["public"]["Tables"]["state_pricing"]["Row"];
export type State = Database["public"]["Tables"]["states"]["Row"];
// export type Payment = Database["public"]["Tables"]["payments"]["Row"]; // Table doesn't exist in database types
// export type Message = Database["public"]["Tables"]["messages"]["Row"]; // Table doesn't exist in database types

// Temporary type definitions for missing tables
export type Document = {
  id: string;
  name: string;
  doc_type: string;
  storage_path: string;
  created_at: string;
  filing_id: string;
};

export type Payment = {
  id: string;
  amount_cents: number;
  status: string;
  created_at: string;
};

export type Message = {
  id: string;
  body: string;
  from_role: string;
  created_at: string;
  filing_id: string | null;
};

export type FilingStage =
  | "intake"
  | "ready"
  | "queued"
  | "submitting"
  | "submitted"
  | "approved"
  | "rejected"
  | "needs_info"
  | "failed";
export type FilingType =
  | "LLC_FORMATION"
  | "ANNUAL_REPORT"
  | "EIN"
  | "AMENDMENT";
export type EntityType = "LLC" | "CORP" | "NONPROFIT" | "OTHER";
export type UserRole = "customer" | "admin" | "ops";

export interface FilingWithBusiness extends Filing {
  business: Business & {
    owner: Profile;
  };
}

export interface FilingWithDetails extends Filing {
  business: Business & {
    owner: Profile;
  };
  filing_tasks: FilingTask[];
  payments: Payment[];
  documents: Document[];
}
