import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Edit2, FilePlus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format as formatDate } from "date-fns";
import { useBudgets } from "@/hooks/use-budgets";

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  category_id: string;
  is_income: boolean;
}

const expenseFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  category_id: z.string().min(1, "Category is required"),
  is_income: z.boolean().default(false),
  date: z.date()
});

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all-categories");
  const [typeFilter, setTypeFilter] = useState<string>("all-types");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const { budgets, fetchBudgets } = useBudgets();

  const form = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: "",
      amount: 0,
      category_id: "",
      is_income: false,
      date: new Date()
    }
  });

  useEffect(() => {
    fetchExpenses();
    fetchBudgets(); // Initial fetch of budgets
  }, [user]);

  useEffect(() => {
    if (editingExpense) {
      form.reset({
        description: editingExpense.description,
        amount: editingExpense.amount,
        category_id: editingExpense.category_id,
        is_income: editingExpense.is_income,
        date: new Date(editingExpense.date)
      });
    } else {
      form.reset({
        description: "",
        amount: 0,
        category_id: "",
        is_income: false,
        date: new Date()
      });
    }
  }, [editingExpense, form]);

  const fetchExpenses = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }

      setExpenses(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive", 
        title: "Error loading expenses",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateBudgetSpending = async (categoryId: string, amount: number, isIncome: boolean, isEdit: boolean = false, oldAmount?: number) => {
    if (isIncome) return; // Don't update budget for income

    const currentMonth = format(new Date(), "yyyy-MM");
    const matchingBudget = budgets.find(b => 
      b.category_id === categoryId && 
      b.period === "monthly" && 
      b.created_at?.startsWith(currentMonth)
    );

    if (matchingBudget) {
      const adjustment = isEdit && oldAmount ? amount - oldAmount : amount;
      const newSpending = matchingBudget.current_spending + adjustment;

      try {
        const { error } = await supabase
          .from('budgets')
          .update({ current_spending: newSpending })
          .eq('id', matchingBudget.id);

        if (error) throw error;
      } catch (error: any) {
        console.error('Error updating budget:', error.message);
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof expenseFormSchema>) => {
    try {
      if (editingExpense) {
        const updates = {
          description: values.description,
          amount: values.amount,
          category_id: values.is_income ? "income" : values.category_id, // Force "income" for income entries
          is_income: values.is_income,
          date: values.date.toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('expenses')
          .update(updates)
          .eq('id', editingExpense.id);
        
        if (error) throw error;

        await updateBudgetSpending(
          values.category_id,
          values.amount,
          values.is_income,
          true,
          editingExpense.amount
        );

        toast({ title: "Expense updated successfully" });
      } else {
        const newExpense = {
          user_id: user!.id,
          description: values.description,
          amount: values.amount,
          category_id: values.is_income ? "income" : values.category_id, // Force "income" for income entries
          is_income: values.is_income,
          date: values.date.toISOString()
        };

        const { error } = await supabase
          .from('expenses')
          .insert(newExpense);
        
        if (error) throw error;

        await updateBudgetSpending(values.category_id, values.amount, values.is_income);

        toast({ title: `${values.is_income ? "Income" : "Expense"} added successfully` });
      }

      setDialogOpen(false);
      setEditingExpense(null);
      fetchExpenses();
      fetchBudgets();
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error saving expense", 
        description: error.message 
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;

    try {
      const expense = expenses.find(e => e.id === expenseToDelete);
      if (expense && !expense.is_income) {
        const matchingBudget = budgets.find(b => 
          b.category_id === expense.category_id && 
          b.period === "monthly"
        );

        if (matchingBudget) {
          const newSpending = Math.max(0, matchingBudget.current_spending - expense.amount);
          await supabase
            .from('budgets')
            .update({ current_spending: newSpending })
            .eq('id', matchingBudget.id);
        }
      }

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseToDelete);
      
      if (error) throw error;
      
      toast({ title: "Expense deleted successfully" });
      fetchExpenses();
      fetchBudgets();
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error deleting expense", 
        description: error.message 
      });
    } finally {
      setExpenseToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const filteredExpenses = expenses
    .filter((expense) => {
      const matchesSearch = expense.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all-categories" || expense.category_id === categoryFilter;
      const matchesType =
        typeFilter === "all-types" ||
        (typeFilter === "income" && expense.is_income) ||
        (typeFilter === "expense" && !expense.is_income);
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "amount") {
        return sortOrder === "asc"
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
      return 0;
    });

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const incomeCategory = { id: "income", name: "Income", color: "#22c55e" }; // Define "Income" category

  const getCategoryById = (id: string) => {
    if (id === "income") return incomeCategory; // Explicitly return "Income" for income category
    return categories.find(cat => cat.id === id) || categories[0]; // Fallback to first category if not found
  };

  // Filter categories: budget categories for expenses, add "Income" for income
  const budgetCategories = categories.filter(category => 
    budgets.some(budget => budget.category_id === category.id)
  );
  const availableCategories = form.watch("is_income")
    ? [...budgetCategories, incomeCategory] // Include "Income" when is_income is true
    : budgetCategories;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            View and manage all your expenses and income
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => {
            setEditingExpense(null);
            setDialogOpen(true);
          }}
          disabled={budgets.length === 0 && !form.watch("is_income")} // Enable if adding income
        >
          <FilePlus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-categories">All Categories</SelectItem>
              {[...budgetCategories, incomeCategory].map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-types">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={sortBy} onValueChange={(value) => toggleSort(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}</SelectItem>
              <SelectItem value="amount">Amount {sortBy === "amount" && (sortOrder === "asc" ? "↑" : "↓")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    Loading expenses...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredExpenses.map((expense) => {
                    const category = getCategoryById(expense.category_id);
                    return (
                      <tr key={expense.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 text-sm">{expense.description}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {expense.is_income ? "Income" : category.name} {/* Force "Income" for income entries */}
                          </div>
                        </td>
                        <td className={cn(
                          "px-4 py-3 text-sm text-right font-medium tabular-nums",
                          expense.is_income ? "text-expense-success" : "text-expense-danger"
                        )}>
                          {expense.is_income ? "+" : "-"}${expense.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex justify-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(expense)}
                              disabled={!expense.is_income && !budgets.some(b => b.category_id === expense.category_id)} // Enable for income
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-expense-danger hover:text-expense-danger"
                              onClick={() => {
                                setExpenseToDelete(expense.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No expenses found
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
            <DialogDescription>
              {editingExpense 
                ? "Update the details for this expense. Income can use the 'Income' category anytime."
                : "Enter the details for your new expense or income. Expenses require a budget, but income can use the 'Income' category anytime."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Groceries, Salary, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
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
                          <SelectValue placeholder={availableCategories.length > 0 ? "Select a category" : "No budgets available"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCategories.length > 0 ? (
                          availableCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground">
                            Create a budget first to add expenses (income is always available)
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="is_income"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      value={field.value ? "income" : "expense"} 
                      onValueChange={(value) => field.onChange(value === "income")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">
                  {editingExpense ? "Update" : "Add"} {form.getValues("is_income") ? "Income" : "Expense"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
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

export default Expenses;