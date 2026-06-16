export type Currency =
  | 'IDR' | 'USD' | 'EUR' | 'TWD' | 'JPY' | 'SGD' | 'GBP'
  | 'AUD' | 'CNY' | 'HKD' | 'KRW' | 'MYR' | 'THB' | 'PHP' | 'VND';

export type AccountType = 'cash' | 'bank' | 'savings' | 'credit_card' | 'investment' | 'other';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';
export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type CategoryType = 'income' | 'expense' | 'both';
export type TransferType = 'debit' | 'credit';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  base_currency: Currency;
  default_account_id: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  color: string;
  icon: string;
  is_active: boolean;
  include_in_net_worth: boolean;
  created_at: string;
  updated_at: string;
  // computed
  balance_in_base?: number;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  currency: Currency;
  exchange_rate_used: number;
  base_currency_amount: number;
  description: string | null;
  date: string;
  transfer_id: string | null;
  transfer_type: TransferType | null;
  recurring_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  account?: Account;
  category?: Category;
}

export interface Transfer {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  from_amount: number;
  to_amount: number;
  from_currency: Currency;
  to_currency: Currency;
  exchange_rate: number;
  date: string;
  description: string | null;
  debit_transaction_id: string | null;
  credit_transaction_id: string | null;
  created_at: string;
  // joined
  from_account?: Account;
  to_account?: Account;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  currency: Currency;
  period: BudgetPeriod;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined
  category?: Category;
  // computed
  spent?: number;
  remaining?: number;
  percentage?: number;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  currency: Currency;
  target_date: string | null;
  icon: string;
  color: string;
  is_completed: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // computed
  percentage?: number;
  monthly_needed?: number;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  account_id: string | null;
  amount: number;
  currency: Currency;
  exchange_rate: number;
  base_currency_amount: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: 'income' | 'expense';
  amount: number;
  currency: Currency;
  description: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  last_generated_date: string | null;
  is_active: boolean;
  auto_generate: boolean;
  created_at: string;
  updated_at: string;
  // joined
  account?: Account;
  category?: Category;
}

export interface ExchangeRate {
  id: string;
  base_currency: Currency;
  target_currency: Currency;
  rate: number;
  date: string;
  created_at: string;
}

// Dashboard types
export interface DashboardData {
  net_worth: number;
  monthly_income: number;
  monthly_expenses: number;
  monthly_savings_rate: number;
  accounts: Account[];
  recent_transactions: Transaction[];
  top_categories: CategorySpending[];
  spending_trend: SpendingTrend[];
  budget_overview: BudgetOverview[];
  upcoming_recurring: RecurringTransaction[];
}

export interface CategorySpending {
  category_id: string | null;
  category_name: string;
  category_icon: string;
  category_color: string;
  total_base: number;
  transaction_count: number;
  percentage?: number;
}

export interface SpendingTrend {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface BudgetOverview {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
}

// Form types
export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  color: string;
  icon: string;
  include_in_net_worth: boolean;
}

export interface CreateTransactionInput {
  account_id: string;
  category_id: string | null;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  date: string;
  notes: string | null;
}

export interface CreateTransferInput {
  from_account_id: string;
  to_account_id: string;
  from_amount: number;
  to_amount: number;
  exchange_rate: number;
  date: string;
  description: string | null;
}

export interface CreateBudgetInput {
  category_id: string | null;
  name: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string | null;
}

export interface CreateGoalInput {
  name: string;
  description: string | null;
  target_amount: number;
  target_date: string | null;
  icon: string;
  color: string;
}