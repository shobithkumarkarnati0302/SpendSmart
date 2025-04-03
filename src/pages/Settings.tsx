
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const currencies = [
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" }
];

interface UserSettings {
  darkMode: boolean;
  compactLayout: boolean;
  animations: boolean;
  showRecentTransactions: boolean;
  showBudgetProgress: boolean;
  showExpenseCharts: boolean;
  showFinancialGoals: boolean;
  budgetAlerts: boolean;
  largeExpenses: boolean;
  billReminders: boolean;
  weeklyReports: boolean;
  currency: string;
  numberFormat: string;
}

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>({
    darkMode: false,
    compactLayout: false,
    animations: true,
    showRecentTransactions: true,
    showBudgetProgress: true,
    showExpenseCharts: true,
    showFinancialGoals: false,
    budgetAlerts: true,
    largeExpenses: true,
    billReminders: true,
    weeklyReports: false,
    currency: "INR", // Default to INR as requested
    numberFormat: "1,000.00"
  });

  useEffect(() => {
    fetchUserProfile();
    // Check if dark mode is active in localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setSettings(prev => ({ ...prev, darkMode: isDarkMode }));
    
    // Apply dark mode class if needed
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      // Get user profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setEmail(data.email || "");
        setFullName(data.full_name || "");
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const updateUserProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const updates = {
        full_name: fullName,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCurrencySettings = () => {
    // In a real application, this would save to user preferences in database
    localStorage.setItem('currency', settings.currency);
    localStorage.setItem('numberFormat', settings.numberFormat);
    
    toast({ title: "Currency settings updated successfully" });
  };
  
  const toggleSetting = (settingName: keyof UserSettings) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [settingName]: !prev[settingName]
      };
      
      // Special handling for dark mode
      if (settingName === 'darkMode') {
        // Store in localStorage
        localStorage.setItem('darkMode', String(!prev.darkMode));
        
        // Toggle dark mode class on <html> element
        if (!prev.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      return newSettings;
    });
    
    // In a real application, this would save to user preferences in database
    toast({ title: `Setting updated: ${settingName}` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    disabled
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={updateUserProfile}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currency Settings</CardTitle>
              <CardDescription>
                Configure your primary currency and display options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Primary Currency</Label>
                  <select
                    id="currency"
                    className="expense-input w-full"
                    value={settings.currency}
                    onChange={(e) => setSettings({...settings, currency: e.target.value})}
                  >
                    {currencies.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format">Number Format</Label>
                  <select
                    id="format"
                    className="expense-input w-full"
                    value={settings.numberFormat}
                    onChange={(e) => setSettings({...settings, numberFormat: e.target.value})}
                  >
                    <option value="1,000.00">1,000.00</option>
                    <option value="1 000,00">1 000,00</option>
                    <option value="1.000,00">1.000,00</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={updateCurrencySettings}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch 
                  checked={settings.darkMode} 
                  onCheckedChange={() => toggleSetting('darkMode')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Compact Layout</p>
                  <p className="text-sm text-muted-foreground">
                    Display more information in less space
                  </p>
                </div>
                <Switch 
                  checked={settings.compactLayout}
                  onCheckedChange={() => toggleSetting('compactLayout')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Animations</p>
                  <p className="text-sm text-muted-foreground">
                    Enable UI animations and transitions
                  </p>
                </div>
                <Switch 
                  checked={settings.animations}
                  onCheckedChange={() => toggleSetting('animations')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard Settings</CardTitle>
              <CardDescription>
                Configure what appears on your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Recent Transactions</p>
                </div>
                <Switch 
                  checked={settings.showRecentTransactions}
                  onCheckedChange={() => toggleSetting('showRecentTransactions')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Budget Progress</p>
                </div>
                <Switch 
                  checked={settings.showBudgetProgress}
                  onCheckedChange={() => toggleSetting('showBudgetProgress')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Expense Charts</p>
                </div>
                <Switch 
                  checked={settings.showExpenseCharts}
                  onCheckedChange={() => toggleSetting('showExpenseCharts')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Financial Goals</p>
                </div>
                <Switch 
                  checked={settings.showFinancialGoals}
                  onCheckedChange={() => toggleSetting('showFinancialGoals')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Budget Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you're close to your budget limit
                  </p>
                </div>
                <Switch 
                  checked={settings.budgetAlerts}
                  onCheckedChange={() => toggleSetting('budgetAlerts')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Large Expenses</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about unusually large expenses
                  </p>
                </div>
                <Switch 
                  checked={settings.largeExpenses}
                  onCheckedChange={() => toggleSetting('largeExpenses')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Bill Reminders</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified before bills are due
                  </p>
                </div>
                <Switch 
                  checked={settings.billReminders}
                  onCheckedChange={() => toggleSetting('billReminders')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of your finances
                  </p>
                </div>
                <Switch 
                  checked={settings.weeklyReports}
                  onCheckedChange={() => toggleSetting('weeklyReports')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={() => toast({ title: "Password updated successfully" })}>
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Secure your account with an authentication app
                    </p>
                  </div>
                  <Switch 
                    checked={false}
                    onCheckedChange={() => toast({ title: "2FA settings updated" })}
                  />
                </div>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => toast({ title: "2FA setup initiated" })}
                >
                  Setup Two-Factor Authentication
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
