import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { categories } from "@/data/mockData";
import { Category } from "@/types/expense";
import { cn } from "@/lib/utils";
import { Edit2, FilePlus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useBudgets, Budget } from "@/hooks/use-budgets";
import { supabase } from "@/integrations/supabase/client";

const budgetFormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  category_id: z.string().min(1, "Category is required"),
  period: z.string().min(1, "Period is required")
});

const Budgets = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const { budgets, isLoading, fetchBudgets, addBudget, updateBudget, deleteBudget } = useBudgets();

  const form = useForm<z.infer<typeof budgetFormSchema>>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      amount: 0,
      category_id: "",
      period: "monthly"
    }
  });

  useEffect(() => {
    if (editingBudget) {
      form.reset({
        amount: editingBudget.amount,
        category_id: editingBudget.category_id,
        period: editingBudget.period
      });
    } else {
      form.reset({
        amount: 0,
        category_id: "",
        period: "monthly"
      });
    }
  }, [editingBudget, form]);

  const onSubmit = async (values: z.infer<typeof budgetFormSchema>) => {
    try {
      const category = getCategoryById(values.category_id);
      if (editingBudget) {
        const success = await updateBudget(editingBudget.id, {
          amount: values.amount,
          category_id: values.category_id,
          period: values.period
        });
        
        if (success) {
          setDialogOpen(false);
          setEditingBudget(null);
        }
      } else {
        const success = await addBudget({
          name: category.name, // Use category name as budget name
          amount: values.amount,
          current_spending: 0,
          category_id: values.category_id,
          period: values.period
        });
        
        if (success) {
          setDialogOpen(false);
        }
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error saving budget", 
        description: error.message 
      });
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!budgetToDelete) return;

    const success = await deleteBudget(budgetToDelete);
    if (success) {
      setBudgetToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const getCategoryById = (id: string): Category => {
    return categories.find(category => category.id === id) || categories[0];
  };

  useEffect(() => {
    fetchBudgets();
    setInitialLoadDone(true);

    // Real-time subscription to budgets table
    const subscription = supabase
      .channel('budgets-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          fetchBudgets(); // Refetch budgets on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchBudgets, user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">
            Manage your monthly spending limits
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => {
            setEditingBudget(null);
            setDialogOpen(true);
          }}
        >
          <FilePlus className="h-4 w-4" />
          Create Budget
        </Button>
      </div>

      {/* Budget Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && !initialLoadDone ? (
          <div className="col-span-full text-center py-12">
            Loading budgets...
          </div>
        ) : (
          <>
            {budgets.map((budget) => {
              const category = getCategoryById(budget.category_id);
              const percentage = Math.round((budget.current_spending / budget.amount) * 100);
              
              let statusColor = "bg-primary";
              let textColor = "text-primary";
              
              if (percentage >= 90) {
                statusColor = "bg-expense-danger";
                textColor = "text-expense-danger";
              } else if (percentage >= 75) {
                statusColor = "bg-expense-warning";
                textColor = "text-expense-warning";
              }
              
              return (
                <Card key={budget.id} className="expense-card">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(budget)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-expense-danger hover:text-expense-danger"
                          onClick={() => {
                            setBudgetToDelete(budget.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <CardDescription>
                        {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} budget
                      </CardDescription>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm text-muted-foreground">Spent</p>
                          <p className="text-2xl font-bold">${budget.current_spending.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Budget</p>
                          <p className="text-lg">${budget.amount.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Progress
                          value={percentage}
                          className="h-2"
                          indicatorClassName={cn(statusColor)}
                        />
                        <div className="flex justify-between text-xs">
                          <span className={cn(textColor, "font-medium")}>{percentage}% used</span>
                          <span className="text-muted-foreground">
                            ${(budget.amount - budget.current_spending).toFixed(2)} remaining
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {budgets.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg">
                No budgets created yet. Create your first budget to start tracking your spending.
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Budget Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Edit Budget" : "Create Budget"}</DialogTitle>
            <DialogDescription>
              {editingBudget 
                ? "Update the details for this budget" 
                : "Enter the details for your new budget"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">
                  {editingBudget ? "Update" : "Create"} Budget
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this budget? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Budgets;