
import { Transaction } from "@/types/expense";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TransactionsListProps {
  transactions: Transaction[];
  limit?: number;
}

const TransactionsList = ({ transactions, limit = 5 }: TransactionsListProps) => {
  const displayTransactions = limit
    ? transactions.slice(0, limit)
    : transactions;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
        </div>
        <CardDescription>
          Your most recent transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {displayTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-4"
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: transaction.category.color + '20', color: transaction.category.color }}
            >
              <span className="text-lg">{transaction.category.icon}</span>
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium leading-none">{transaction.description}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(transaction.date), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div className={cn(
              "text-sm tabular-nums text-right font-medium",
              transaction.isIncome ? "text-expense-success" : "text-expense-danger"
            )}>
              {transaction.isIncome ? "+" : "-"}${transaction.amount.toFixed(2)}
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No transactions found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
