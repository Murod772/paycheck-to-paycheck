import { Timestamp, FieldValue } from 'firebase/firestore';

// Base interface for all documents
interface BaseDocument {
  id: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User Profile
export interface UserProfile extends BaseDocument {
  email: string;
  displayName?: string;
  phoneNumber?: string;
  preferences: {
    allowNegativeBalance: boolean;
    startOfWeek: number; // 0-6 (Sunday-Saturday)
    paymentBehavior: 'warn' | 'disallow' | 'allow';
    creditCardOverpayment: 'allow' | 'cap';
  };
}

// Wallet
export interface Wallet extends BaseDocument {
  currentBalance: number;
  lastUpdated: Timestamp;
  cycleStartDate: Timestamp;
  previousBalance: number; // Balance from previous cycle
}

// Income Sources
export interface Income extends BaseDocument {
  name: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly/biweekly
  dayOfMonth?: number; // 1-31 for monthly
  startDate: Timestamp;
  endDate?: Timestamp; // Optional end date for temporary income
  isActive: boolean;
}

// Recurring Schedule type
export type RecurringSchedule = {
  type: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  dayOfWeek?: number; // 0-6 for Sunday-Saturday
  dayOfMonth?: number; // 1-31
  weekOfMonth?: number; // 1-5 for first-last week
  customPattern?: string; // For more complex patterns using cron-like syntax
};

// Recurring Income
export interface RecurringIncome extends BaseDocument {
  name: string;
  amount: number;
  schedule: RecurringSchedule;
  startDate: Timestamp;
  endDate?: Timestamp;
  lastProcessed?: Timestamp;
  nextScheduledDate?: Timestamp;
  isActive: boolean;
  category: string;
  description?: string;
}

// Expenses (Base)
export interface Expense extends BaseDocument {
  name: string;
  amount: number;
  dueDate: number; // Day of month (1-31)
  category: 'rent' | 'utilities' | 'subscription' | 'other';
  isRecurring: boolean;
  frequency: 'monthly' | 'yearly';
  lastPaidDate?: Timestamp;
  nextDueDate: Timestamp;
  isActive: boolean;
  notes?: string;
}

// Loans
export interface Loan extends BaseDocument {
  name: string;
  initialPrincipal: number;
  currentBalance: number;
  interestRate?: number;
  monthlyPayment: number;
  dueDate: number; // Day of month (1-31)
  startDate: Timestamp;
  estimatedEndDate?: Timestamp;
  lender: string;
  isActive: boolean;
  paymentHistory: {
    date: Timestamp;
    amount: number;
    principalPaid: number;
    interestPaid: number;
  }[];
}

// Credit Cards
export interface CreditCard extends BaseDocument {
  name: string;
  statementBalance: number;
  currentBalance: number;
  dueDate: number;
  minimumPayment: number;
  isActive: boolean;
  allowOverpayment: boolean;
  paymentHistory: {
    date: Timestamp;
    amount: number;
  }[];
  lastStatementDate: Timestamp;
  nextStatementDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// New CreditCard type
export interface NewCreditCard {
  id: string;
  userId: string;
  name: string;
  statementBalance: number;
  dueDate: Date;
  minimumPayment?: number;
  allowOverpayment: boolean;
  lastStatementDate: Date;
  nextStatementDate: Date;
  createdAt: any;
  updatedAt: any;
}

// New CreditCardPayment type
export interface CreditCardPayment {
  id: string;
  userId: string;
  creditCardId: string;
  amount: number;
  date: Date;
  statementPeriodStart: Date;
  statementPeriodEnd: Date;
  createdAt: FieldValue;
}

// Transaction History
export interface Transaction extends BaseDocument {
  date: Timestamp;
  amount: number;
  type: 'income' | 'expense' | 'loan_payment' | 'credit_card_payment';
  category: string;
  description: string;
  relatedDocId?: string; // Reference to related loan, credit card, or expense
  balance: number; // Wallet balance after this transaction
}

// Collection Names
export enum Collections {
  USERS = 'users',
  USER_WALLETS = 'wallets',
  USER_EXPENSES = 'expenses',
  USER_INCOMES = 'incomes',
  USER_LOANS = 'loans',
  USER_CREDIT_CARDS = 'creditCards',
  USER_CREDIT_CARD_PAYMENTS = 'creditCardPayments',
  USER_RECURRING_INCOMES = 'recurringIncomes',
  WALLETS = 'wallets',
  TRANSACTIONS = 'transactions',
  EXPENSES = 'expenses'
}

// Helper type for collection names
export type CollectionName = typeof Collections[keyof typeof Collections];

export interface ExpenseModel {
  id: string;
  userId: string;
  name: string;
  description?: string;
  amount: number;
  dueDate: Timestamp;
  isPaid: boolean;
  paidDate?: Timestamp;
  category: string;
  isRecurring: boolean;
  recurringDay?: number; // Day of month for recurring expenses
  lastProcessedDate?: Timestamp;
  nextDueDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
