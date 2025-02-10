import { db, auth } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  serverTimestamp,
  runTransaction,
  orderBy
} from 'firebase/firestore';
import { Collections, ExpenseModel } from '../types/collections';
import { WalletService } from './wallet';

export class ExpenseService {
  private static getUserExpensesCollection(userId: string) {
    return collection(db, Collections.USERS, userId, Collections.USER_EXPENSES);
  }

  private static getUserExpenseDoc(userId: string, expenseId: string) {
    return doc(db, Collections.USERS, userId, Collections.USER_EXPENSES, expenseId);
  }

  /**
   * Create a new expense
   */
  static async createExpense(data: Omit<ExpenseModel, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isPaid' | 'paidDate'>): Promise<ExpenseModel> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const expense: Omit<ExpenseModel, 'id'> = {
      ...data,
      userId,
      isPaid: false,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };

    const docRef = await addDoc(this.getUserExpensesCollection(userId), expense);
    return {
      id: docRef.id,
      ...expense
    };
  }

  /**
   * Get all expenses for the current user
   */
  static async getUserExpenses(): Promise<ExpenseModel[]> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    try {
      // First try with ordering
      const expensesQuery = query(
        this.getUserExpensesCollection(userId),
        orderBy('dueDate', 'asc')
      );
      const snapshot = await getDocs(expensesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ExpenseModel));
    } catch (error: any) {
      // If index error, fall back to unordered query
      if (error.message.includes('requires an index')) {
        console.warn('Expense index not found, falling back to unordered query. Please create the index using the following URL:', error.message);
        
        const fallbackQuery = query(
          this.getUserExpensesCollection(userId)
        );
        const snapshot = await getDocs(fallbackQuery);
        const expenses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ExpenseModel));

        // Sort in memory
        return expenses.sort((a, b) => 
          a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime()
        );
      }
      throw error;
    }
  }

  /**
   * Mark an expense as paid
   */
  static async markAsPaid(expenseId: string, allowNegativeBalance: boolean = false): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    // Initialize wallet if it doesn't exist
    await WalletService.initializeWallet();

    const expenseRef = this.getUserExpenseDoc(userId, expenseId);
    const expenseDoc = await getDoc(expenseRef);

    if (!expenseDoc.exists()) {
      throw new Error('Expense not found');
    }

    const expense = expenseDoc.data() as ExpenseModel;
    if (expense.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (expense.isPaid) {
      throw new Error('Expense is already paid');
    }

    const wallet = await WalletService.getWallet();
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Check if wallet has sufficient balance
    if (!allowNegativeBalance && wallet.currentBalance < expense.amount) {
      throw new Error('Insufficient funds');
    }

    await runTransaction(db, async (transaction) => {
      // Update expense
      transaction.update(expenseRef, {
        isPaid: true,
        paidDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update wallet balance
      await WalletService.updateBalance(
        -expense.amount,
        'expense',
        `Expense Payment - ${expense.name}`,
        expense.category,
        expenseId,
        allowNegativeBalance
      );
    });
  }

  /**
   * Mark an expense as unpaid
   */
  static async markAsUnpaid(expenseId: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const expenseRef = this.getUserExpenseDoc(userId, expenseId);
    const wallet = await WalletService.getWallet();

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    await runTransaction(db, async (transaction) => {
      const expenseDoc = await transaction.get(expenseRef);
      if (!expenseDoc.exists()) {
        throw new Error('Expense not found');
      }

      const expense = expenseDoc.data() as ExpenseModel;
      if (expense.userId !== userId) {
        throw new Error('Unauthorized');
      }

      if (!expense.isPaid) {
        throw new Error('Expense is already unpaid');
      }

      // Update expense
      transaction.update(expenseRef, {
        isPaid: false,
        paidDate: null,
        updatedAt: serverTimestamp()
      });

      // Update wallet balance
      const walletRef = doc(db, Collections.WALLETS, wallet.id);
      transaction.update(walletRef, {
        previousBalance: wallet.currentBalance,
        currentBalance: wallet.currentBalance + expense.amount,
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create transaction record
      const transactionRef = doc(collection(db, Collections.TRANSACTIONS));
      const newTransaction = {
        userId,
        amount: expense.amount,
        type: 'adjustment',
        category: expense.category,
        description: `Reversed payment for: ${expense.name}`,
        date: serverTimestamp(),
        balance: wallet.currentBalance + expense.amount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      transaction.set(transactionRef, newTransaction);
    });
  }

  /**
   * Delete an expense
   */
  static async deleteExpense(expenseId: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const expenseRef = this.getUserExpenseDoc(userId, expenseId);
    const expenseDoc = await getDoc(expenseRef);

    if (!expenseDoc.exists()) {
      throw new Error('Expense not found');
    }

    const expense = expenseDoc.data() as ExpenseModel;
    if (expense.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (expense.isPaid) {
      throw new Error('Cannot delete a paid expense');
    }

    await updateDoc(expenseRef, {
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Update expense details
   */
  static async updateExpense(
    expenseId: string,
    data: Partial<Omit<ExpenseModel, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isPaid' | 'paidDate'>>
  ): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const expenseRef = this.getUserExpenseDoc(userId, expenseId);
    const expenseDoc = await getDoc(expenseRef);

    if (!expenseDoc.exists()) {
      throw new Error('Expense not found');
    }

    const expense = expenseDoc.data() as ExpenseModel;
    if (expense.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (expense.isPaid) {
      throw new Error('Cannot update a paid expense');
    }

    await updateDoc(expenseRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }
}
