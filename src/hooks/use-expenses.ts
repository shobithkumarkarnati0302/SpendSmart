
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Expense } from "@/types/expense-types";
import { 
  fetchExpenses, 
  addExpense as addExpenseService, 
  updateExpense as updateExpenseService,
  deleteExpense as deleteExpenseService 
} from "@/services/expense-service";

export type { Expense } from "@/types/expense-types";

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadExpenses = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await fetchExpenses(user.id);
      
      if (error) {
        throw error;
      }

      setExpenses(data || []);
    } catch (error: any) {
      setError(error);
      toast({
        variant: "destructive",
        title: "Error loading expenses",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return false;
    
    try {
      const { success, error } = await addExpenseService(expense, user.id);
      
      if (!success) throw error;
      
      toast({ title: "Expense added successfully" });
      await loadExpenses();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding expense",
        description: error.message
      });
      return false;
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    if (!user) return false;
    
    try {
      const { success, error } = await updateExpenseService(id, expense, user.id);
      
      if (!success) throw error;
      
      toast({ title: "Expense updated successfully" });
      await loadExpenses();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating expense",
        description: error.message
      });
      return false;
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return false;
    
    try {
      const { success, error } = await deleteExpenseService(id, user.id);
      
      if (!success) throw error;
      
      toast({ title: "Expense deleted successfully" });
      await loadExpenses();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting expense",
        description: error.message
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      loadExpenses();
    } else {
      setExpenses([]);
      setIsLoading(false);
    }
  }, [user]);

  return {
    expenses,
    isLoading,
    error,
    fetchExpenses: loadExpenses,
    addExpense,
    updateExpense,
    deleteExpense
  };
};
