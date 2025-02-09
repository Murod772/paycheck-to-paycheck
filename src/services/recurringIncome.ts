import { 
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { Collections, RecurringIncome, RecurringSchedule } from '../types/collections';
import { auth, db } from '../config/firebase';
import { WalletService } from './wallet';

export class RecurringIncomeService {
  private static getUserRecurringIncomesCollection(userId: string) {
    return collection(db, Collections.USERS, userId, Collections.USER_RECURRING_INCOMES);
  }

  private static getUserRecurringIncomeDoc(userId: string, incomeId: string) {
    return doc(db, Collections.USERS, userId, Collections.USER_RECURRING_INCOMES, incomeId);
  }

  /**
   * Create a new recurring income
   */
  static async createRecurringIncome(data: Omit<RecurringIncome, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastProcessed' | 'nextScheduledDate'>): Promise<RecurringIncome> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User must be authenticated');

    const nextDate = this.calculateNextOccurrence(data.schedule, data.startDate.toDate());
    
    const newIncome: Omit<RecurringIncome, 'id'> = {
      ...data,
      userId,
      nextScheduledDate: Timestamp.fromDate(nextDate),
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };

    const newId = await this.generateId();
    await setDoc(this.getUserRecurringIncomeDoc(userId, newId), newIncome);
    return {
      ...newIncome,
      id: newId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as RecurringIncome;
  }

  /**
   * Get all recurring incomes for current user
   */
  static async getUserRecurringIncomes(): Promise<RecurringIncome[]> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User must be authenticated');

    const q = query(
      this.getUserRecurringIncomesCollection(userId),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RecurringIncome);
  }

  /**
   * Update a recurring income
   */
  static async updateRecurringIncome(incomeId: string, data: Partial<Omit<RecurringIncome, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User must be authenticated');

    const incomeRef = this.getUserRecurringIncomeDoc(userId, incomeId);
    const incomeDoc = await getDoc(incomeRef);

    if (!incomeDoc.exists()) {
      throw new Error('Income not found');
    }

    const income = incomeDoc.data() as RecurringIncome;
    if (income.userId !== userId) {
      throw new Error('Unauthorized access to income');
    }

    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };

    if (data.schedule || data.startDate) {
      const schedule = data.schedule || income.schedule;
      const startDate = data.startDate || income.startDate;
      const nextDate = this.calculateNextOccurrence(schedule, startDate.toDate());
      updateData.nextScheduledDate = Timestamp.fromDate(nextDate);
    }

    await updateDoc(incomeRef, updateData);
  }

  /**
   * Delete a recurring income
   */
  static async deleteRecurringIncome(incomeId: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User must be authenticated');

    const incomeRef = this.getUserRecurringIncomeDoc(userId, incomeId);
    const incomeDoc = await getDoc(incomeRef);

    if (!incomeDoc.exists()) {
      throw new Error('Income not found');
    }

    const income = incomeDoc.data() as RecurringIncome;
    if (income.userId !== userId) {
      throw new Error('Unauthorized access to income');
    }

    await deleteDoc(incomeRef);
  }

  /**
   * Process due recurring incomes
   */
  static async processRecurringIncomes(): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User must be authenticated');

    const now = new Date();
    const q = query(
      this.getUserRecurringIncomesCollection(userId),
      where('nextScheduledDate', '<=', Timestamp.fromDate(now))
    );

    const snapshot = await getDocs(q);
    const incomes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RecurringIncome);

    for (const income of incomes) {
      try {
        // Add the income amount to wallet
        await WalletService.updateBalance(
          income.amount,
          'income',
          income.name,
          (income.category || 'Uncategorized') as string,
          income.id
        );

        // Update the recurring income record
        const nextDate = this.calculateNextOccurrence(income.schedule, now);
        await this.updateRecurringIncome(income.id, {
          lastProcessed: Timestamp.fromDate(now),
          nextScheduledDate: Timestamp.fromDate(nextDate)
        });
      } catch (error) {
        console.error(`Failed to process recurring income ${income.id}:`, error);
      }
    }
  }

  /**
   * Calculate the next occurrence of a recurring schedule
   */
  private static calculateNextOccurrence(schedule: RecurringSchedule, fromDate: Date): Date {
    const nextDate = new Date(fromDate);

    switch (schedule.type) {
      case 'weekly':
        if (schedule.dayOfWeek !== undefined) {
          nextDate.setDate(nextDate.getDate() + ((7 + schedule.dayOfWeek - nextDate.getDay()) % 7));
        }
        break;

      case 'biweekly':
        if (schedule.dayOfWeek !== undefined) {
          nextDate.setDate(nextDate.getDate() + ((7 + schedule.dayOfWeek - nextDate.getDay()) % 7));
          nextDate.setDate(nextDate.getDate() + 14);
        }
        break;

      case 'monthly':
        if (schedule.dayOfMonth !== undefined) {
          nextDate.setDate(1);
          nextDate.setMonth(nextDate.getMonth() + 1);
          nextDate.setDate(Math.min(schedule.dayOfMonth, this.getLastDayOfMonth(nextDate)));
        }
        break;

      case 'custom':
        if (schedule.customPattern) {
          // For custom patterns, you might want to use a cron parser library
          // This is a simplified version that just adds 1 month
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
    }

    return nextDate;
  }

  /**
   * Get the last day of the month for a given date
   */
  private static getLastDayOfMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  private static async generateId(): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User must be authenticated');

    const docRef = doc(collection(db, Collections.USERS, userId, Collections.USER_RECURRING_INCOMES));
    await setDoc(docRef, {});
    await deleteDoc(docRef);
    return docRef.id;
  }
}
