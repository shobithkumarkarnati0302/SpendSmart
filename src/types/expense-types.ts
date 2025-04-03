
import { Database } from "@/integrations/supabase/types";

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  date: string;
  category_id: string;
  is_income: boolean;
  created_at: string;
  updated_at: string;
}

export type NewExpense = Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type ExpenseUpdate = Partial<Expense>;
