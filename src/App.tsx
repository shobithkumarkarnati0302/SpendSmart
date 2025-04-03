
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/Layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Budgets from "./pages/Budgets";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { AuthProvider } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Initialize dark mode from localStorage
const initializeDarkMode = () => {
  if (
    localStorage.getItem('darkMode') === 'true' ||
    (localStorage.getItem('darkMode') === null &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
  }
};

const App = () => {
  useEffect(() => {
    initializeDarkMode();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
            <TooltipProvider delayDuration={300}>
              <Routes>
                {/* Public Routes */}
                <Route path="/auth" element={<Auth />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  } />
                  <Route path="/expenses" element={
                    <AppLayout>
                      <Expenses />
                    </AppLayout>
                  } />
                  <Route path="/budgets" element={
                    <AppLayout>
                      <Budgets />
                    </AppLayout>
                  } />
                  <Route path="/reports" element={
                    <AppLayout>
                      <Reports />
                    </AppLayout>
                  } />
                  <Route path="/settings" element={
                    <AppLayout>
                      <Settings />
                    </AppLayout>
                  } />
                </Route>

                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
