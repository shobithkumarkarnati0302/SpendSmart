
import { useState, useEffect } from "react";
import { categories } from "@/data/mockData";
import ExpenseChart from "@/components/Dashboard/ExpenseChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ExpenseSummary from "@/components/Dashboard/ExpenseSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MonthlyExpenseByCategory } from "@/components/Dashboard/MonthlyExpenseByCategory";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const Reports = () => {
  const [period, setPeriod] = useState("monthly");
  const [expenses, setExpenses] = useState([]);
  const [incomeVsExpenseData, setIncomeVsExpenseData] = useState([
    { name: "Income", amount: 0 },
    { name: "Expenses", amount: 0 }
  ]);
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [monthlyExpenseTotals, setMonthlyExpenseTotals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const loadReportData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch user's expenses
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*');
      
      if (expenseError) throw expenseError;
      
      setExpenses(expenseData || []);
      
      // Calculate income vs expense totals
      const incomesTotal = expenseData
        ? expenseData.filter(e => e.is_income).reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0)
        : 0;
      
      const expensesTotal = expenseData
        ? expenseData.filter(e => !e.is_income).reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0)
        : 0;
      
      setIncomeVsExpenseData([
        { name: "Income", amount: incomesTotal },
        { name: "Expenses", amount: expensesTotal }
      ]);
      
      // Calculate category totals
      const catTotals = categories.map(category => {
        const total = expenseData
          ? expenseData
              .filter(e => !e.is_income && e.category_id === category.id)
              .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0)
          : 0;
        
        return {
          id: category.id,
          name: category.name,
          amount: total,
          color: category.color
        };
      }).filter(cat => cat.amount > 0);
      
      setCategoryTotals(catTotals.length > 0 ? catTotals : []);
      
      // Calculate monthly expense totals
      // Group expenses by month
      const monthlyTotals = [];
      if (expenseData && expenseData.length > 0) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentYear = new Date().getFullYear();
        const months = {};
        
        // Initialize months
        for (let i = 0; i < 12; i++) {
          months[monthNames[i]] = 0;
        }
        
        // Sum expenses by month
        expenseData
          .filter(e => !e.is_income && new Date(e.date).getFullYear() === currentYear)
          .forEach(expense => {
            const month = monthNames[new Date(expense.date).getMonth()];
            months[month] += parseFloat(expense.amount.toString());
          });
        
        // Convert to array format for the chart
        for (const [month, amount] of Object.entries(months)) {
          monthlyTotals.push({ name: month, amount });
        }
      }
      
      setMonthlyExpenseTotals(monthlyTotals.length > 0 ? monthlyTotals : [
        { name: "Jan", amount: 0 }, { name: "Feb", amount: 0 }, 
        { name: "Mar", amount: 0 }, { name: "Apr", amount: 0 },
        { name: "May", amount: 0 }, { name: "Jun", amount: 0 },
        { name: "Jul", amount: 0 }, { name: "Aug", amount: 0 },
        { name: "Sep", amount: 0 }, { name: "Oct", amount: 0 },
        { name: "Nov", amount: 0 }, { name: "Dec", amount: 0 }
      ]);
    } catch (error) {
      console.error("Error loading report data:", error);
      toast({
        variant: "destructive",
        title: "Error loading reports",
        description: "Could not load your financial reports."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [user]);

  const exportToPdf = async () => {
    try {
      toast({
        title: "Preparing your report...",
        description: "Please wait while we generate your PDF."
      });

      const reportElement = document.getElementById('financial-report');
      if (!reportElement) return;
      
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Configure PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`financial-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      
      toast({
        title: "Report downloaded!",
        description: "Your financial report has been exported successfully."
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting your report."
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analyze your financial data
          </p>
        </div>
        <Button onClick={exportToPdf} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="spending">Spending</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>

          <div className="mt-6" id="financial-report">
            <TabsContent value="overview" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Financial Overview</h2>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="py-8 text-center">Loading your reports...</div>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Income vs Expenses</CardTitle>
                        <CardDescription>Comparison of your income and expenses</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 py-4">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="text-2xl font-bold text-expense-success">
                              ₹{incomeVsExpenseData[0].amount.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Income</div>
                          </div>
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="text-2xl font-bold text-expense-danger">
                              ₹{incomeVsExpenseData[1].amount.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Expenses</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-4 border-t">
                          <div className="text-sm text-muted-foreground">Net Income</div>
                          <div className={`text-lg font-bold ${
                            incomeVsExpenseData[0].amount - incomeVsExpenseData[1].amount > 0
                              ? "text-expense-success"
                              : "text-expense-danger"
                          }`}>
                            ₹{(incomeVsExpenseData[0].amount - incomeVsExpenseData[1].amount).toFixed(2)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <ExpenseSummary data={categoryTotals} />
                  </div>

                  <ExpenseChart 
                    data={monthlyExpenseTotals} 
                    title="Spending Trends" 
                    description={`Your ${period} spending over time`}
                    variant="area"
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="spending">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Spending Analysis</h2>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <ExpenseSummary data={categoryTotals} />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Expenses</CardTitle>
                      <CardDescription>Your largest expenses this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="py-8 text-center">Loading...</div>
                      ) : (
                        <div className="space-y-4">
                          {expenses
                            .filter(t => !t.is_income)
                            .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
                            .slice(0, 5)
                            .map((expense, index) => {
                              const category = categories.find(c => c.id === expense.category_id) || categories[0];
                              return (
                                <div key={expense.id} className="flex items-center justify-between py-2">
                                  <div className="flex items-center gap-3">
                                    <span className="text-muted-foreground text-sm">{index + 1}</span>
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: category.color }}
                                    />
                                    <div>
                                      <p className="font-medium">{expense.description}</p>
                                      <p className="text-xs text-muted-foreground">{category.name}</p>
                                    </div>
                                  </div>
                                  <p className="text-expense-danger font-medium">
                                    -₹{parseFloat(expense.amount).toFixed(2)}
                                  </p>
                                </div>
                              );
                            })}

                          {expenses.filter(t => !t.is_income).length === 0 && (
                            <div className="text-center py-4 text-muted-foreground">
                              No expense transactions recorded
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="income">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Income Analysis</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Income Sources</CardTitle>
                    <CardDescription>Breakdown of your income sources</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="py-8 text-center">Loading...</div>
                    ) : (
                      <div className="space-y-4">
                        {expenses
                          .filter(t => t.is_income)
                          .map((income) => {
                            const category = categories.find(c => c.id === income.category_id) || categories[0];
                            return (
                              <div key={income.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div>
                                  <p className="font-medium">{income.description}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(income.date).toLocaleDateString()}
                                  </p>
                                </div>
                                <p className="text-expense-success font-medium">
                                  +₹{parseFloat(income.amount).toFixed(2)}
                                </p>
                              </div>
                            );
                          })}
                          
                        {expenses.filter(t => t.is_income).length === 0 && (
                          <div className="text-center py-4 text-muted-foreground">
                            No income transactions recorded
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
