
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categories } from "@/data/mockData";

export interface MonthlyCategoryData {
  name: string;
  [key: string]: string | number;
}

interface MonthlyExpenseByCategoryProps {
  data?: MonthlyCategoryData[];
}

export const MonthlyExpenseByCategory = ({
  data,
}: MonthlyExpenseByCategoryProps) => {
  const [chartData, setChartData] = useState<MonthlyCategoryData[]>([]);

  useEffect(() => {
    if (data) {
      setChartData(data);
    } else {
      // Generate mock data
      const months = ["Jan", "Feb", "Mar", "Apr", "May"];
      const mockData = months.map((month) => {
        const monthData: MonthlyCategoryData = { name: month };
        
        categories.forEach((category) => {
          if (category.name !== "Income") {
            monthData[category.name] = Math.floor(Math.random() * 300) + 50;
          }
        });
        
        return monthData;
      });
      
      setChartData(mockData);
    }
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Expenses by Category</CardTitle>
        <CardDescription>
          Compare your spending across categories over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, ""]} />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: "20px" }} />
              
              {categories
                .filter((category) => category.name !== "Income")
                .map((category, index) => (
                  <Bar
                    key={category.id}
                    dataKey={category.name}
                    stackId="a"
                    fill={category.color}
                  />
                ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
