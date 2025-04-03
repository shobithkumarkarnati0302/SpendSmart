
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Budget, Category } from "@/types/expense";
import { cn } from "@/lib/utils";

interface BudgetProgressProps {
  budgets: Budget[];
  categories: Category[];
}

const BudgetProgress = ({ budgets, categories }: BudgetProgressProps) => {
  const getCategoryById = (id: string) => {
    return categories.find(category => category.id === id) || categories[0];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
        <CardDescription>Your monthly budget progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {budgets.map((budget) => {
            const category = getCategoryById(budget.categoryId);
            const percentage = Math.round((budget.currentSpending / budget.amount) * 100);
            let progressColor = "bg-primary";
            
            if (percentage >= 90) {
              progressColor = "bg-expense-danger";
            } else if (percentage >= 75) {
              progressColor = "bg-expense-warning";
            }
            
            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">{budget.name}</span>
                  </div>
                  <div className="text-sm font-medium">
                    ${budget.currentSpending.toFixed(2)} / ${budget.amount.toFixed(2)}
                  </div>
                </div>
                <Progress
                  value={percentage}
                  className="h-2"
                  indicatorClassName={cn(progressColor)}
                />
              </div>
            );
          })}
          
          {budgets.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No budgets created yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetProgress;
