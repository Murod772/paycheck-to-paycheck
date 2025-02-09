import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreditCardService } from '../../services/creditCard';
import { WalletService } from '../../services/wallet';
import { addDoc, collection, getDocs, query, updateDoc, where } from 'firebase/firestore';

describe('Credit Card and Wallet Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Credit Card Payment Flow', () => {
    it('should update both credit card balance and wallet balance correctly', async () => {
      // Setup initial state
      const mockWallet = {
        id: 'test-wallet-id',
        currentBalance: 2000,
        preferences: {
          allowNegativeBalance: false,
        },
      };

      const mockCard = {
        id: 'test-card-id',
        name: 'Test Card',
        statementBalance: 1000,
        allowOverpayment: false,
        lastStatementDate: new Date(),
        nextStatementDate: new Date(),
      };

      // Mock wallet queries
      (getDocs as any).mockImplementation((q) => {
        // Check if it's a wallet query
        if (q._collection?.path?.includes('wallets')) {
          return {
            docs: [{
              id: mockWallet.id,
              data: () => mockWallet,
            }],
          };
        }
        // Otherwise it's a credit card query
        return {
          docs: [{
            id: mockCard.id,
            data: () => mockCard,
            exists: () => true,
          }],
        };
      });

      // Track the updates to both wallet and credit card
      let updatedWalletBalance;
      let updatedCardBalance;
      
      (updateDoc as any).mockImplementation((ref, data) => {
        if (ref.path?.includes('wallets')) {
          updatedWalletBalance = data.currentBalance;
        } else {
          updatedCardBalance = data.statementBalance;
        }
      });

      // Make a credit card payment
      const paymentAmount = 500;
      await CreditCardService.makePayment('test-card-id', paymentAmount);

      // Verify wallet balance was reduced
      expect(updatedWalletBalance).toBe(1500);

      // Verify credit card balance was reduced
      expect(updatedCardBalance).toBe(500);

      // Verify transaction was recorded
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          amount: -paymentAmount,
          type: 'expense',
          category: 'Credit Card',
          balance: 1500,
        })
      );
    });

    it('should handle insufficient funds correctly', async () => {
      // Setup initial state with low balance
      const mockWallet = {
        id: 'test-wallet-id',
        currentBalance: 200,
        preferences: {
          allowNegativeBalance: false,
        },
      };

      const mockCard = {
        id: 'test-card-id',
        name: 'Test Card',
        statementBalance: 1000,
        allowOverpayment: false,
        lastStatementDate: new Date(),
        nextStatementDate: new Date(),
      };

      (getDocs as any).mockImplementation((q) => {
        if (q._collection?.path?.includes('wallets')) {
          return {
            docs: [{
              id: mockWallet.id,
              data: () => mockWallet,
            }],
          };
        }
        return {
          docs: [{
            id: mockCard.id,
            data: () => mockCard,
            exists: () => true,
          }],
        };
      });

      // Attempt to make a payment larger than wallet balance
      await expect(
        CreditCardService.makePayment('test-card-id', 500)
      ).rejects.toThrow('Insufficient funds');

      // Verify no updates were made
      expect(updateDoc).not.toHaveBeenCalled();
      expect(addDoc).not.toHaveBeenCalled();
    });
  });
});
