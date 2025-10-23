/**
 * TypeScript types for FinControl database schema
 * Generated from Supabase schema
 *
 * These types provide full type safety when using Supabase client
 */

// =====================================================
// DATABASE TYPES (generated from Supabase schema)
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: TUser;
        Insert: TUserInsert;
        Update: TUserUpdate;
      };
      accounts: {
        Row: TAccount;
        Insert: TAccountInsert;
        Update: TAccountUpdate;
      };
      account_members: {
        Row: TAccountMember;
        Insert: TAccountMemberInsert;
        Update: TAccountMemberUpdate;
      };
      categories: {
        Row: TCategory;
        Insert: TCategoryInsert;
        Update: TCategoryUpdate;
      };
      transactions: {
        Row: TTransaction;
        Insert: TTransactionInsert;
        Update: TTransactionUpdate;
      };
      budgets: {
        Row: TBudget;
        Insert: TBudgetInsert;
        Update: TBudgetUpdate;
      };
      export_history: {
        Row: TExportHistory;
        Insert: TExportHistoryInsert;
        Update: TExportHistoryUpdate;
      };
      user_phones: {
        Row: TUserPhone;
        Insert: TUserPhoneInsert;
        Update: TUserPhoneUpdate;
      };
    };
    Views: {
      monthly_summary: {
        Row: TMonthlySummary;
      };
      category_spending: {
        Row: TCategorySpending;
      };
    };
    Functions: {};
    Enums: {
      transaction_type: "income" | "expense";
      account_type: "personal" | "shared";
      member_role: "owner" | "member";
      created_via: "web" | "whatsapp" | "email" | "api";
      export_format: "pdf" | "excel" | "csv" | "json";
    };
  };
}

// =====================================================
// TABLE TYPES
// =====================================================

export interface TUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TUserInsert {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface TUserUpdate {
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

// =====================================================

export interface TAccount {
  id: string;
  user_id: string;
  name: string;
  type: "personal" | "shared";
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TAccountInsert {
  user_id: string;
  name: string;
  type: "personal" | "shared";
  color?: string;
  icon?: string;
  is_active?: boolean;
}

export interface TAccountUpdate {
  name?: string;
  type?: "personal" | "shared";
  color?: string;
  icon?: string;
  is_active?: boolean;
}

// =====================================================

export interface TAccountMember {
  id: string;
  account_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: string;
}

export interface TAccountMemberInsert {
  account_id: string;
  user_id: string;
  role: "owner" | "member";
}

export interface TAccountMemberUpdate {
  role?: "owner" | "member";
}

// =====================================================

export interface TCategory {
  id: string;
  account_id: string | null;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense";
  budget_limit: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TCategoryInsert {
  account_id?: string | null;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense";
  budget_limit?: number | null;
  is_default?: boolean;
}

export interface TCategoryUpdate {
  name?: string;
  icon?: string;
  color?: string;
  type?: "income" | "expense";
  budget_limit?: number | null;
}

// =====================================================

export interface TTransaction {
  id: string;
  account_id: string;
  category_id: string | null;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  transaction_date: string;
  created_via: "web" | "whatsapp" | "email" | "api" | null;
  attachment_url: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export interface TTransactionInsert {
  account_id: string;
  category_id?: string | null;
  type: "income" | "expense";
  amount: number;
  description?: string | null;
  transaction_date?: string;
  created_via?: "web" | "whatsapp" | "email" | "api" | null;
  attachment_url?: string | null;
  metadata?: Json | null;
}

export interface TTransactionUpdate {
  category_id?: string | null;
  type?: "income" | "expense";
  amount?: number;
  description?: string | null;
  transaction_date?: string;
  attachment_url?: string | null;
  metadata?: Json | null;
}

// =====================================================

export interface TBudget {
  id: string;
  account_id: string;
  category_id: string | null;
  month_year: string;
  planned_amount: number;
  actual_amount: number;
  created_at: string;
  updated_at: string;
}

export interface TBudgetInsert {
  account_id: string;
  category_id?: string | null;
  month_year: string;
  planned_amount: number;
  actual_amount?: number;
}

export interface TBudgetUpdate {
  planned_amount?: number;
  actual_amount?: number;
}

// =====================================================

export interface TExportHistory {
  id: string;
  user_id: string;
  format: "pdf" | "excel" | "csv" | "json";
  period_start: string;
  period_end: string;
  file_url: string | null;
  file_size_bytes: number | null;
  created_at: string;
}

export interface TExportHistoryInsert {
  user_id: string;
  format: "pdf" | "excel" | "csv" | "json";
  period_start: string;
  period_end: string;
  file_url?: string | null;
  file_size_bytes?: number | null;
}

export interface TExportHistoryUpdate {
  file_url?: string | null;
  file_size_bytes?: number | null;
}

// =====================================================

export interface TUserPhone {
  id: string;
  user_id: string;
  phone_number: string;
  is_verified: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface TUserPhoneInsert {
  user_id: string;
  phone_number: string;
  is_verified?: boolean;
  is_primary?: boolean;
}

export interface TUserPhoneUpdate {
  phone_number?: string;
  is_verified?: boolean;
  is_primary?: boolean;
}

// =====================================================
// VIEW TYPES
// =====================================================

export interface TMonthlySummary {
  account_id: string;
  account_name: string;
  month_year: string;
  total_income: number;
  total_expense: number;
  net_balance: number;
  transaction_count: number;
}

export interface TCategorySpending {
  account_id: string;
  account_name: string;
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  total_spent: number;
  transaction_count: number;
  month_year: string;
}

// =====================================================
// UTILITY TYPES (with relations)
// =====================================================

/**
 * Transaction with related data (category, account)
 */
export interface TTransactionWithRelations extends TTransaction {
  category: TCategory | null;
  account: TAccount;
}

/**
 * Account with members
 */
export interface TAccountWithMembers extends TAccount {
  account_members: Array<TAccountMember & { user: TUser }>;
}

/**
 * Category with transaction count and total
 */
export interface TCategoryWithStats extends TCategory {
  transaction_count: number;
  total_amount: number;
  percentage: number;
}
