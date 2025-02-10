import { db, auth } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { Collections, Loan } from '../types/collections';
import { WalletService } from './wallet';

export class LoanService {
  private static getUserLoansCollection(userId: string) {
    return collection(db, Collections.USERS, userId, Collections.USER_LOANS);
  }

  private static getUserLoanDoc(userId: string, loanId: string) {
    return doc(db, Collections.USERS, userId, Collections.USER_LOANS, loanId);
  }

  static async createLoan(data: Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<Loan> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const loan = {
      ...data,
      userId,
      currentBalance: data.initialPrincipal,
      isActive: true,
      paymentHistory: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(this.getUserLoansCollection(userId), loan);
    return {
      ...loan,
      id: docRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as Loan;
  }

  static async getUserLoans(): Promise<Loan[]> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const q = query(
      this.getUserLoansCollection(userId),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const loans = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Loan[];

    // Sort loans by dueDate after fetching
    return loans.sort((a, b) => a.dueDate - b.dueDate);
  }

  static async makePayment(loanId: string, amount: number, allowNegativeBalance: boolean = false): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    await runTransaction(db, async (transaction) => {
      // Get loan document
      const loanRef = this.getUserLoanDoc(userId, loanId);
      const loanDoc = await transaction.get(loanRef);
      
      if (!loanDoc.exists()) {
        throw new Error('Loan not found');
      }

      const loan = loanDoc.data() as Loan;
      if (loan.userId !== userId) {
        throw new Error('Unauthorized access to loan');
      }

      // Calculate payment breakdown
      let principalPaid = amount;
      let interestPaid = 0;

      if (loan.interestRate) {
        // Simple interest calculation for this payment
        const monthlyInterestRate = loan.interestRate / 12 / 100;
        const interestDue = loan.currentBalance * monthlyInterestRate;
        
        if (amount <= interestDue) {
          interestPaid = amount;
          principalPaid = 0;
        } else {
          interestPaid = interestDue;
          principalPaid = amount - interestDue;
        }
      }

      // Deduct the payment amount from the wallet
      await WalletService.updateBalance(
        -amount,
        'loan_payment',
        `Loan Payment - ${loan.name}`,
        'Loan',
        loanId,
        allowNegativeBalance
      );

      // Update loan
      const newBalance = loan.currentBalance - principalPaid;
      const paymentRecord = {
        date: Timestamp.now(),
        amount,
        principalPaid,
        interestPaid,
      };

      transaction.update(loanRef, {
        currentBalance: newBalance,
        paymentHistory: [...loan.paymentHistory, paymentRecord],
        updatedAt: serverTimestamp(),
      });
    });
  }

  static async updateLoan(loanId: string, data: Partial<Loan>): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const loanRef = this.getUserLoanDoc(userId, loanId);
    const loanDoc = await getDoc(loanRef);

    if (!loanDoc.exists()) {
      throw new Error('Loan not found');
    }

    const loan = loanDoc.data() as Loan;
    if (loan.userId !== userId) {
      throw new Error('Unauthorized access to loan');
    }

    await updateDoc(loanRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
}
