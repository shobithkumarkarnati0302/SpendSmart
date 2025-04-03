
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  current_spending: number;
  category_id: string;
  period: string;
  created_at: string;
  updated_at: string;
}

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBudgets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)  // Filter by current user's ID
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }

      console.log("Fetched budgets:", data); // Debug logging
      setBudgets(data || []);
    } catch (error: any) {
      console.error("Error fetching budgets:", error);
      setError(error);
      toast({
        variant: "destructive",
        title: "Error loading budgets",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    try {
      const newBudget = {
        user_id: user.id,
        ...budget,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error, data } = await supabase
        .from('budgets')
        .insert(newBudget)
        .select();
      
      if (error) throw error;
      
      toast({ title: "Budget added successfully" });
      await fetchBudgets();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding budget",
        description: error.message
      });
      return false;
    }
  };

  const updateBudget = async (id: string, budget: Partial<Budget>) => {
    if (!user) return;
    
    try {
      const updates = {
        ...budget,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      toast({ title: "Budget updated successfully" });
      await fetchBudgets();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating budget",
        description: error.message
      });
      return false;
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({ title: "Budget deleted successfully" });
      await fetchBudgets();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting budget",
        description: error.message
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchBudgets();
    } else {
      setBudgets([]);
      setIsLoading(false);
    }
  }, [user]);

  return {
    budgets,
    isLoading,
    error,
    fetchBudgets,
    addBudget,
    updateBudget,
    deleteBudget
  };
};
