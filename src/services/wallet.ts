import { 
  doc, 
  runTransaction,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { Collections, Transaction, Wallet } from '../types/collections';
import { auth, db } from '../config/firebase';

export class WalletService {
  private static getUserWalletsCollection(userId: string) {
    return collection(db, Collections.USERS, userId, Collections.USER_WALLETS);
  }

  private static getUserWalletDoc(userId: string) {
    return doc(db, Collections.USERS, userId, Collections.USER_WALLETS, 'primary');
  }

  private static getUserTransactionsCollection(userId: string) {
    return collection(db, Collections.USERS, userId, Collections.USER_TRANSACTIONS);
  }

  /**
   * Initialize or get a user's wallet
   */
  static async initializeWallet(): Promise<string> {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const wallet = await this.getWallet();
    if (wallet) {
      return wallet.id;
    }

    return this.createWallet().then(wallet => wallet.id);
  }

  /**
   * Get the user's wallet
   */
  static async getWallet(): Promise<Wallet | null> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const walletDoc = await getDoc(this.getUserWalletDoc(userId));
    if (!walletDoc.exists()) {
      return null;
    }

    return {
      ...walletDoc.data(),
      id: walletDoc.id,
    } as Wallet;
  }

  static async createWallet(initialBalance: number = 0): Promise<Wallet> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const wallet = {
      userId,
      currentBalance: initialBalance,
      previousBalance: 0,
      lastUpdated: serverTimestamp(),
      cycleStartDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const walletRef = this.getUserWalletDoc(userId);
    await setDoc(walletRef, wallet);

    return {
      ...wallet,
      id: walletRef.id,
    } as Wallet;
  }

  /**
   * Update wallet balance with transaction
   */
  static async updateBalance(
    amount: number,
    type: Transaction['type'],
    description: string,
    category: string,
    relatedDocId?: string
  ): Promise<void> {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const wallet = await this.getWallet();
    if (!wallet) {
      throw new Error('No wallet found');
    }

    const walletRef = this.getUserWalletDoc(userId);
    const transactionRef = this.getUserTransactionsCollection(userId);

    await runTransaction(db, async (transaction) => {
      const walletDoc = await transaction.get(walletRef);
      if (!walletDoc.exists()) {
        throw new Error('Wallet not found');
      }

      const currentBalance = walletDoc.data().currentBalance;
      // For expenses, we use the amount directly since it should already be negative
      // For income, we ensure it's positive
      const newBalance = type === 'income' ? currentBalance + Math.abs(amount) : currentBalance + amount;

      // Update wallet
      transaction.update(walletRef, {
        currentBalance: newBalance,
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create transaction record
      const newTransaction: Omit<Transaction, 'id'> = {
        userId,
        amount,
        type,
        category,
        description,
        relatedDocId,
        date: serverTimestamp() as any,
        balance: newBalance,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any
      };

      // Create a new document reference with a random ID
      const newTransactionRef = doc(transactionRef);
      transaction.set(newTransactionRef, newTransaction);
    });
  }

  /**
   * Get recent transactions
   */
  static async getRecentTransactions(limitCount: number = 10): Promise<Transaction[]> {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const transactionsQuery = query(
      this.getUserTransactionsCollection(userId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(transactionsQuery);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as Transaction)
      .sort((a, b) => b.date.toMillis() - a.date.toMillis());
  }

  /**
   * Set wallet balance manually
   */
  static async setBalance(
    newBalance: number,
    reason: string
  ): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const wallet = await this.getWallet();
    if (!wallet) {
      throw new Error('No wallet found');
    }

    const walletRef = this.getUserWalletDoc(userId);
    const transactionRef = this.getUserTransactionsCollection(userId);

    await runTransaction(db, async (transaction) => {
      const walletDoc = await transaction.get(walletRef);
      if (!walletDoc.exists()) {
        throw new Error('Wallet not found');
      }

      const currentBalance = walletDoc.data().currentBalance;
      const difference = newBalance - currentBalance;

      // Update wallet
      transaction.update(walletRef, {
        previousBalance: currentBalance,
        currentBalance: newBalance,
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create adjustment transaction record
      const newTransaction: Omit<Transaction, 'id'> = {
        userId,
        amount: Math.abs(difference),
        type: difference >= 0 ? 'income' : 'expense',
        category: 'adjustment',
        description: `Manual balance adjustment: ${reason}`,
        date: serverTimestamp() as any,
        balance: newBalance,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any
      };

      // Create a new document reference with a random ID
      const newTransactionRef = doc(transactionRef);
      transaction.set(newTransactionRef, newTransaction);
    });
  }

  /**
   * Debug method to list all wallets for the current user
   */
  static async listAllWallets(): Promise<Wallet[]> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const q = query(
      this.getUserWalletsCollection(userId),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Wallet[];
  }
}
