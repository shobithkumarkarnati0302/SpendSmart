
import { Budget, Category, Transaction } from "../types/expense";

export const categories: Category[] = [
  { id: "1", name: "Food & Dining", color: "#FF9800", icon: "utensils" },
  { id: "2", name: "Transportation", color: "#03A9F4", icon: "car" },
  { id: "3", name: "Housing", color: "#4CAF50", icon: "home" },
  { id: "4", name: "Entertainment", color: "#9C27B0", icon: "film" },
  { id: "5", name: "Shopping", color: "#E91E63", icon: "shopping-bag" },
  { id: "6", name: "Utilities", color: "#607D8B", icon: "bolt" },
  { id: "7", name: "Health", color: "#F44336", icon: "heart" },
  { id: "8", name: "Travel", color: "#8BC34A", icon: "plane" },
  { id: "9", name: "Income", color: "#4ADE80", icon: "banknote" },
];

export const transactions: Transaction[] = [
  {
    id: "t1",
    amount: 45.99,
    description: "Grocery shopping",
    date: "2023-11-20T10:30:00",
    category: categories[0],
    isIncome: false,
  },
  {
    id: "t2",
    amount: 25.50,
    description: "Gas station",
    date: "2023-11-19T15:20:00",
    category: categories[1],
    isIncome: false,
  },
  {
    id: "t3",
    amount: 1200.00,
    description: "Rent payment",
    date: "2023-11-15T09:00:00",
    category: categories[2],
    isIncome: false,
  },
  {
    id: "t4",
    amount: 18.99,
    description: "Netflix subscription",
    date: "2023-11-14T18:45:00",
    category: categories[3],
    isIncome: false,
  },
  {
    id: "t5",
    amount: 3500.00,
    description: "Salary deposit",
    date: "2023-11-01T08:30:00",
    category: categories[8],
    isIncome: true,
  },
  {
    id: "t6",
    amount: 120.75,
    description: "New shoes",
    date: "2023-11-10T14:15:00",
    category: categories[4],
    isIncome: false,
  },
  {
    id: "t7",
    amount: 85.40,
    description: "Electricity bill",
    date: "2023-11-08T11:20:00",
    category: categories[5],
    isIncome: false,
  },
  {
    id: "t8",
    amount: 65.00,
    description: "Doctor appointment",
    date: "2023-11-05T09:30:00",
    category: categories[6],
    isIncome: false,
  },
  {
    id: "t9",
    amount: 350.25,
    description: "Flight tickets",
    date: "2023-11-03T16:45:00",
    category: categories[7],
    isIncome: false,
  },
  {
    id: "t10",
    amount: 200.00,
    description: "Freelance payment",
    date: "2023-11-17T13:10:00",
    category: categories[8],
    isIncome: true,
  },
];

export const budgets: Budget[] = [
  {
    id: "b1",
    name: "Food Budget",
    amount: 500,
    currentSpending: 250.75,
    categoryId: "1",
    period: "monthly",
  },
  {
    id: "b2",
    name: "Transportation Budget",
    amount: 200,
    currentSpending: 125.50,
    categoryId: "2",
    period: "monthly",
  },
  {
    id: "b3",
    name: "Entertainment Budget",
    amount: 150,
    currentSpending: 68.99,
    categoryId: "4",
    period: "monthly",
  },
  {
    id: "b4",
    name: "Shopping Budget",
    amount: 300,
    currentSpending: 220.75,
    categoryId: "5",
    period: "monthly",
  },
];

export const monthlyExpenseTotals = [
  { month: "Jan", amount: 2100 },
  { month: "Feb", amount: 2300 },
  { month: "Mar", amount: 1950 },
  { month: "Apr", amount: 2400 },
  { month: "May", amount: 2200 },
  { month: "Jun", amount: 2700 },
  { month: "Jul", amount: 2450 },
  { month: "Aug", amount: 2300 },
  { month: "Sep", amount: 2600 },
  { month: "Oct", amount: 2150 },
  { month: "Nov", amount: 2350 },
  { month: "Dec", amount: 2800 },
];

export const categoryTotals = categories.map(category => ({
  name: category.name,
  amount: Math.floor(Math.random() * 500) + 100,
  color: category.color,
})).filter(cat => cat.name !== "Income");
