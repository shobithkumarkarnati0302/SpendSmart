
import { supabase } from "@/integrations/supabase/client";
import { Expense, NewExpense, ExpenseUpdate } from "@/types/expense-types";
import { updateBudgetSpending } from "@/utils/budget-utils";

/**
 * Fetches all expenses for the current user
 */
export const fetchExpenses = async (userId: string | undefined) => {
  if (!userId) return { data: null, error: new Error("User ID is required") };
  
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};

/**
 * Creates a new expense
 */
export const addExpense = async (expense: NewExpense, userId: string | undefined) => {
  if (!userId) return { success: false, error: new Error("User ID is required") };
  
  try {
    const newExpense = {
      user_id: userId,
      ...expense
    };
    
    const { error } = await supabase
      .from('expenses')
      .insert(newExpense);
    
    if (error) throw error;
    
    // Update budget spending if this is an expense (not income)
    if (!expense.is_income) {
      await updateBudgetSpending(expense.category_id, expense.amount, false, userId);
    } else {
      // If it's income, we potentially reduce spending
      await updateBudgetSpending(expense.category_id, expense.amount, true, userId);
    }
    
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
};

/**
 * Updates an existing expense
 */
export const updateExpense = async (id: string, expense: ExpenseUpdate, userId: string | undefined) => {
  if (!userId) return { success: false, error: new Error("User ID is required") };
  
  try {
    // Get the original expense to compare for budget updates
    const { data: originalExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    const updates = {
      ...expense,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
    
    // Update budget spending if amount, category or income status has changed
    if (originalExpense && 
        (expense.amount !== undefined || 
         expense.category_id !== undefined || 
         expense.is_income !== undefined)) {
      
      // If category has changed, update both old and new category budgets
      if (expense.category_id && expense.category_id !== originalExpense.category_id) {
        // Remove amount from old category
        await updateBudgetSpending(
          originalExpense.category_id,
          originalExpense.amount,
          true, // Subtract from old category
          userId
        );
        
        // Add amount to new category if it's an expense
        if (expense.is_income !== undefined ? !expense.is_income : !originalExpense.is_income) {
          await updateBudgetSpending(
            expense.category_id,
            expense.amount || originalExpense.amount,
            false, // Add to new category
            userId
          );
        }
      } 
      // If just the amount changed or income status changed
      else {
        const category = expense.category_id || originalExpense.category_id;
        const newAmount = expense.amount !== undefined ? expense.amount : originalExpense.amount;
        const oldAmount = originalExpense.amount;
        
        const wasIncome = originalExpense.is_income;
        const isIncome = expense.is_income !== undefined ? expense.is_income : wasIncome;
        
        // Several cases to handle:
        if (wasIncome && !isIncome) {
          // Changed from income to expense - add the full amount to budget
          await updateBudgetSpending(category, newAmount, false, userId);
        } else if (!wasIncome && isIncome) {
          // Changed from expense to income - remove the full amount from budget
          await updateBudgetSpending(category, oldAmount, true, userId);
        } else if (!wasIncome && !isIncome && newAmount !== oldAmount) {
          // Expense amount changed - adjust the difference
          if (newAmount > oldAmount) {
            // Add the difference
            await updateBudgetSpending(category, newAmount - oldAmount, false, userId);
          } else {
            // Subtract the difference
            await updateBudgetSpending(category, oldAmount - newAmount, true, userId);
          }
        }
        // If it's income and amount changed, no need to update budgets
      }
    }
    
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
};

/**
 * Deletes an expense
 */
export const deleteExpense = async (id: string, userId: string | undefined) => {
  if (!userId) return { success: false, error: new Error("User ID is required") };
  
  try {
    // Get the expense details before deleting
    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Update budget spending if this was an expense (not income)
    if (expense && !expense.is_income) {
      await updateBudgetSpending(expense.category_id, expense.amount, true, userId);
    }
    
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
};
