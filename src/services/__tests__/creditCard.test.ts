import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreditCardService } from '../creditCard';
import { addDoc, collection, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { WalletService } from '../wallet';

// Mock WalletService
vi.mock('../wallet', () => ({
  WalletService: {
    updateBalance: vi.fn(),
  },
}));

describe('CreditCardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCreditCard', () => {
    it('should create a credit card with correct day of month for due date', async () => {
      const dueDate = new Date(2025, 1, 15); // February 15, 2025
      const mockDocRef = { id: 'test-card-id' };
      (addDoc as any).mockResolvedValue(mockDocRef);

      const result = await CreditCardService.createCreditCard(
        'Test Card',
        1000,
        dueDate,
        50,
        false
      );

      expect(addDoc).toHaveBeenCalled();
      expect(result.dueDate).toBe(15); // Should store just the day
      expect(result.statementBalance).toBe(1000);
      expect(result.minimumPayment).toBe(50);
    });
  });

  describe('makePayment', () => {
    it('should update card balance and wallet when making a payment', async () => {
      const mockCard = {
        id: 'test-card-id',
        name: 'Test Card',
        statementBalance: 1000,
        allowOverpayment: false,
        lastStatementDate: new Date(),
        nextStatementDate: new Date(),
      };

      (getDocs as any).mockResolvedValue({
        docs: [{
          id: mockCard.id,
          data: () => mockCard,
          exists: () => true,
        }],
      });

      const payment = await CreditCardService.makePayment('test-card-id', 500);

      expect(updateDoc).toHaveBeenCalled();
      expect(WalletService.updateBalance).toHaveBeenCalledWith(
        -500,
        'expense',
        'Credit Card Payment - Test Card',
        'Credit Card',
        'test-card-id'
      );
      expect(payment.amount).toBe(500);
    });

    it('should throw error if payment exceeds balance and overpayment not allowed', async () => {
      const mockCard = {
        id: 'test-card-id',
        name: 'Test Card',
        statementBalance: 1000,
        allowOverpayment: false,
        lastStatementDate: new Date(),
        nextStatementDate: new Date(),
      };

      (getDocs as any).mockResolvedValue({
        docs: [{
          id: mockCard.id,
          data: () => mockCard,
          exists: () => true,
        }],
      });

      await expect(
        CreditCardService.makePayment('test-card-id', 1500)
      ).rejects.toThrow('Payment amount exceeds statement balance and overpayment is not allowed');
    });
  });

  describe('getCreditCards', () => {
    it('should convert timestamp dueDate to day of month', async () => {
      const mockTimestamp = new Date(2025, 1, 15).getTime(); // February 15, 2025
      const mockCard = {
        id: 'test-card-id',
        dueDate: mockTimestamp,
        statementBalance: 1000,
      };

      (getDocs as any).mockResolvedValue({
        docs: [{
          id: mockCard.id,
          data: () => mockCard,
        }],
      });

      const cards = await CreditCardService.getCreditCards();
      expect(cards[0].dueDate).toBe(15);
    });
  });
});
