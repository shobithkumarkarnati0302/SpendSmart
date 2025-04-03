
import { supabase } from "@/integrations/supabase/client";

/**
 * Updates the spending amount for a budget based on an expense
 */
export const updateBudgetSpending = async (categoryId: string, amount: number, isIncome: boolean, userId: string) => {
  if (!userId || !categoryId) return;
  
  try {
    // First get the budget for this category
    const { data: budgets, error: fetchError } = await supabase
      .from('budgets')
      .select('*')
      .eq('category_id', categoryId)
      .eq('user_id', userId);
    
    if (fetchError) {
      console.error("Error fetching budget:", fetchError);
      throw fetchError;
    }
    
    if (!budgets || budgets.length === 0) {
      console.log(`No budget found for category ${categoryId}`);
      return;
    }
    
    // Update the budget's current spending
    const budget = budgets[0];
    const updatedSpending = isIncome 
      ? Math.max(0, budget.current_spending - amount) 
      : budget.current_spending + amount;
    
    const { error: updateError } = await supabase
      .from('budgets')
      .update({ 
        current_spending: updatedSpending, 
        updated_at: new Date().toISOString()
      })
      .eq('id', budget.id);
    
    if (updateError) {
      console.error("Error updating budget:", updateError);
      throw updateError;
    }
    
    console.log(`Budget updated successfully: ${budget.id}, new spending: ${updatedSpending}`);
  } catch (err: any) {
    console.error("Error updating budget spending:", err);
  }
};

/**
 * Resets budget spending to zero
 */
export const resetBudgetSpending = async (budgetId: string, userId: string) => {
  if (!userId || !budgetId) return;
  
  try {
    const { error } = await supabase
      .from('budgets')
      .update({ 
        current_spending: 0, 
        updated_at: new Date().toISOString()
      })
      .eq('id', budgetId)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    console.log(`Budget ${budgetId} spending reset successfully`);
    return true;
  } catch (err: any) {
    console.error("Error resetting budget spending:", err);
    return false;
  }
};
