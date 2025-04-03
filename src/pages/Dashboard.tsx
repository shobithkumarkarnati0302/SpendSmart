import { CircleDollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import StatCard from "@/components/Dashboard/StatCard";
import TransactionsList from "@/components/Dashboard/TransactionsList";
import ExpenseChart from "@/components/Dashboard/ExpenseChart";
import BudgetProgress from "@/components/Dashboard/BudgetProgress";
import ExpenseSummary from "@/components/Dashboard/ExpenseSummary";
import { useEffect, useState } from "react";
import { categories } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Transaction, Budget as UIBudget } from "@/types/expense";
import { useCurrency } from "@/context/CurrencyContext";

interface DashboardExpense {
  id: string;
  amount: number;
  description: string;
  date: string;
  category_id: string;
  is_income: boolean;
}

interface DashboardBudget {
  id: string;
  name: string;
  amount: number;
  current_spending: number;
  category_id: string;
  period: string;
}

interface CategoryTotal {
  name: string;
  amount: number;
  color: string;
}

interface MonthlyTotal {
  month: string;
  amount: number;
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<DashboardExpense[]>([]);
  const [budgets, setBudgets] = useState<DashboardBudget[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  
  const { user } = useAuth();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    if (user) {
      fetchData();

      // Set up interval to refresh data every 10 seconds to keep budgets updated
      const intervalId = setInterval(() => {
        fetchData();
      }, 10000);

      return () => clearInterval(intervalId);
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      
      if (expensesError) throw expensesError;
      
      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*');
      
      if (budgetsError) throw budgetsError;

      setExpenses(expensesData || []);
      setBudgets(budgetsData || []);
      
      // Calculate derived data
      calculateCategoryTotals(expensesData || []);
      calculateMonthlyTotals(expensesData || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCategoryTotals = (expenses: DashboardExpense[]) => {
    const categoryMap: Record<string, number> = {};
    
    // Sum expenses by category
    expenses
      .filter(expense => !expense.is_income)
      .forEach(expense => {
        if (!categoryMap[expense.category_id]) {
          categoryMap[expense.category_id] = 0;
        }
        categoryMap[expense.category_id] += expense.amount;
      });
    
    // Convert to the format needed for the chart
    const totals: CategoryTotal[] = Object.entries(categoryMap).map(([categoryId, amount]) => {
      const category = categories.find(c => c.id === categoryId) || categories[0];
      return {
        name: category.name,
        amount,
        color: category.color
      };
    });
    
    setCategoryTotals(totals);
  };

  const calculateMonthlyTotals = (expenses: DashboardExpense[]) => {
    const monthMap: Record<string, number> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize with zero values for the last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      monthMap[monthKey] = 0;
    }
    
    // Sum expenses by month for the last 6 months
    expenses
      .filter(expense => !expense.is_income)
      .filter(expense => {
        const expDate = new Date(expense.date);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return expDate >= sixMonthsAgo;
      })
      .forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`;
        if (monthMap[monthKey] !== undefined) {
          monthMap[monthKey] += expense.amount;
        }
      });
    
    // Convert to the format needed for the chart
    const totals: MonthlyTotal[] = Object.entries(monthMap).map(([month, amount]) => ({
      month,
      amount
    }));
    
    // Sort by date
    totals.sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      const aMonthIndex = months.indexOf(aMonth);
      const bMonthIndex = months.indexOf(bMonth);
      
      if (aYear !== bYear) {
        return parseInt(aYear) - parseInt(bYear);
      }
      
      return aMonthIndex - bMonthIndex;
    });
    
    setMonthlyTotals(totals);
  };

  // Convert to the format needed for TransactionsList
  const transactionsFormatted: Transaction[] = expenses.slice(0, 5).map(expense => {
    const category = categories.find(c => c.id === expense.category_id) || categories[0];
    return {
      id: expense.id,
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
      category,
      isIncome: expense.is_income
    };
  });

  // Convert budgets to the format needed for BudgetProgress component
  const uiBudgets: UIBudget[] = budgets.map(budget => {
    return {
      id: budget.id,
      name: budget.name,
      amount: budget.amount,
      currentSpending: budget.current_spending,
      categoryId: budget.category_id,
      period: budget.period as "daily" | "weekly" | "monthly" | "yearly",
    };
  });

  // Calculate total income
  const totalIncome = expenses
    .filter((e) => e.is_income)
    .reduce((sum, e) => sum + e.amount, 0);

  // Calculate total expenses
  const totalExpenses = expenses
    .filter((e) => !e.is_income)
    .reduce((sum, e) => sum + e.amount, 0);

  // Calculate balance
  const balance = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your financial situation
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Balance"
          value={formatAmount(balance)}
          trend={balance > 0 ? "up" : "down"}
          trendValue="Your Remaining Balance"
          icon={<CircleDollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Total Income"
          value={formatAmount(totalIncome)}
          trend="up"
          trendValue="Your Total Income This Month"
          icon={<TrendingUp className="h-4 w-4" />}
          className="border-l-4 border-expense-success"
        />
        <StatCard
          title="Total Expenses"
          value={formatAmount(totalExpenses)}
          trend="down"
          trendValue="Your Total Expenses This Month"
          icon={<TrendingDown className="h-4 w-4" />}
          className="border-l-4 border-expense-danger"
        />
        <StatCard
          title="Active Budgets"
          value={budgets.length.toString()}
          description="Across categories"
          icon={<Wallet className="h-4 w-4" />}
        />
      </div>

      {/* Charts and Data */}
      <div className="grid gap-4 md:grid-cols-2">
        <ExpenseChart 
          data={monthlyTotals} 
          title="Monthly Expenses" 
          description="Your spending over the past 6 months"
          variant="bar"
        />
        <ExpenseSummary data={categoryTotals} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TransactionsList transactions={transactionsFormatted} limit={5} />
        <BudgetProgress budgets={uiBudgets} categories={categories} />
      </div>
    </div>
  );
};

export default Dashboard;
