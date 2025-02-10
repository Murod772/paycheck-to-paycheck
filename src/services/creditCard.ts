import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Collections, CreditCard, CreditCardPayment } from '../types/collections';
import { WalletService } from './wallet';

export class CreditCardService {
  private static getUserCreditCardsCollection(userId: string) {
    return collection(db, Collections.USERS, userId, Collections.USER_CREDIT_CARDS);
  }

  private static getUserCreditCardDoc(userId: string, cardId: string) {
    return doc(db, Collections.USERS, userId, Collections.USER_CREDIT_CARDS, cardId);
  }

  private static getUserCreditCardPaymentsCollection(userId: string) {
    return collection(db, Collections.USERS, userId, Collections.USER_CREDIT_CARD_PAYMENTS);
  }

  static async createCreditCard(
    name: string,
    statementBalance: number,
    dueDate: Date,
    minimumPayment?: number,
    allowOverpayment: boolean = false
  ): Promise<CreditCard> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const lastStatementDate = new Date();
    const nextStatementDate = new Date(dueDate);
    nextStatementDate.setMonth(nextStatementDate.getMonth() + 1);

    const creditCard = {
      userId,
      name,
      statementBalance,
      currentBalance: statementBalance, // Initially same as statement balance
      dueDate: dueDate instanceof Date ? dueDate.getDate() : Number(dueDate), // Ensure we store day of month
      minimumPayment,
      allowOverpayment,
      isActive: true,
      paymentHistory: [],
      lastStatementDate: Timestamp.fromDate(lastStatementDate),
      nextStatementDate: Timestamp.fromDate(nextStatementDate),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(this.getUserCreditCardsCollection(userId), creditCard);
    return {
      ...creditCard,
      id: docRef.id,
    } as CreditCard;
  }

  static async getCreditCards(): Promise<CreditCard[]> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const q = query(
      this.getUserCreditCardsCollection(userId),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert timestamp to day of month if it's a timestamp
      let dueDate = data.dueDate;
      if (dueDate > 31) { // If it's a timestamp, convert to day of month
        const date = new Date(dueDate);
        dueDate = date.getDate();
      }
      return {
        id: doc.id,
        ...data,
        dueDate: Number(dueDate), // Ensure dueDate is a number
        lastStatementDate: data.lastStatementDate?.toDate(),
        nextStatementDate: data.nextStatementDate?.toDate(),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    }) as CreditCard[];
  }

  static async makePayment(
    cardId: string,
    amount: number
  ): Promise<CreditCardPayment> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const cardRef = this.getUserCreditCardDoc(userId, cardId);
    const cardDoc = await getDoc(cardRef);
    
    if (!cardDoc.exists()) {
      throw new Error('Credit card not found');
    }

    const card = cardDoc.data() as CreditCard;
    
    // Check if payment amount is valid
    if (!card.allowOverpayment && amount > card.statementBalance) {
      throw new Error('Payment amount exceeds statement balance and overpayment is not allowed');
    }

    // Create the payment record
    const payment = {
      userId,
      creditCardId: cardId,
      amount,
      date: Timestamp.now().toDate(),
      statementPeriodStart: card.lastStatementDate.toDate(),
      statementPeriodEnd: card.nextStatementDate.toDate(),
      createdAt: Timestamp.now(),
    };

    // First check if we can make the wallet transaction
    await WalletService.updateBalance(
      -amount, // Negative amount since it's an expense
      'expense',
      `Credit Card Payment - ${card.name}`,
      'Credit Card',
      cardId
    );

    // If wallet transaction succeeded, update the card's statement balance
    const newBalance = card.statementBalance - amount;
    await updateDoc(cardRef, {
      statementBalance: newBalance,
      updatedAt: Timestamp.now(),
    });

    // Add the payment record
    const paymentRef = await addDoc(
      this.getUserCreditCardPaymentsCollection(userId),
      payment
    );

    return {
      ...payment,
      id: paymentRef.id,
      date: payment.date,
      statementPeriodStart: payment.statementPeriodStart,
      statementPeriodEnd: payment.statementPeriodEnd
    } as CreditCardPayment;
  }

  static async getPaymentHistory(cardId: string): Promise<CreditCardPayment[]> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const q = query(
      this.getUserCreditCardPaymentsCollection(userId),
      where('creditCardId', '==', cardId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      date: doc.data().date.toDate(),
      statementPeriodStart: doc.data().statementPeriodStart.toDate(),
      statementPeriodEnd: doc.data().statementPeriodEnd.toDate(),
    })) as CreditCardPayment[];
  }

  static async updateStatementBalance(
    cardId: string,
    newBalance: number,
    newDueDate: Date
  ): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const cardRef = this.getUserCreditCardDoc(userId, cardId);
    const cardDoc = await getDoc(cardRef);
    
    if (!cardDoc.exists()) {
      throw new Error('Credit card not found');
    }

    const lastStatementDate = new Date();
    const nextStatementDate = new Date(newDueDate);
    nextStatementDate.setMonth(nextStatementDate.getMonth() + 1);

    await updateDoc(cardRef, {
      statementBalance: newBalance,
      dueDate: newDueDate instanceof Date ? newDueDate.getDate() : Number(newDueDate), // Ensure we store day of month
      lastStatementDate: Timestamp.fromDate(lastStatementDate),
      nextStatementDate: Timestamp.fromDate(nextStatementDate),
      updatedAt: Timestamp.now(),
    });
  }

  static async updateDueDate(
    cardId: string,
    dueDate: number
  ): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    // Validate due date
    if (dueDate < 1 || dueDate > 31) {
      throw new Error('Due date must be between 1 and 31');
    }

    const cardRef = this.getUserCreditCardDoc(userId, cardId);
    await updateDoc(cardRef, {
      dueDate,
      updatedAt: Timestamp.now(),
    });
  }
}
