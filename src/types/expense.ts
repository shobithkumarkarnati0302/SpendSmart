
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: Category;
  isIncome: boolean;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  currentSpending: number;
  categoryId: string;
  period: "daily" | "weekly" | "monthly" | "yearly";
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
