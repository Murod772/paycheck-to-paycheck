import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletService } from '../wallet';
import { addDoc, collection, getDocs, query, updateDoc, where } from 'firebase/firestore';

describe('WalletService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateBalance', () => {
    it('should update wallet balance and create transaction record', async () => {
      const mockWallet = {
        id: 'test-wallet-id',
        currentBalance: 1000,
      };

      // Mock getting current wallet
      (getDocs as any).mockResolvedValue({
        docs: [{
          id: mockWallet.id,
          data: () => mockWallet,
        }],
      });

      // Mock transaction creation
      const mockTransactionRef = { id: 'test-transaction-id' };
      (addDoc as any).mockResolvedValue(mockTransactionRef);

      await WalletService.updateBalance(
        -500,
        'expense',
        'Test Payment',
        'Credit Card',
        'test-card-id'
      );

      // Should update wallet balance
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          currentBalance: 500,
        })
      );

      // Should create transaction record
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          amount: -500,
          type: 'expense',
          description: 'Test Payment',
          category: 'Credit Card',
          relatedDocId: 'test-card-id',
          balance: 500,
        })
      );
    });

    it('should throw error if negative balance not allowed', async () => {
      const mockWallet = {
        id: 'test-wallet-id',
        currentBalance: 100,
        preferences: {
          allowNegativeBalance: false,
        },
      };

      (getDocs as any).mockResolvedValue({
        docs: [{
          id: mockWallet.id,
          data: () => mockWallet,
        }],
      });

      await expect(
        WalletService.updateBalance(-500, 'expense', 'Test Payment', 'Credit Card')
      ).rejects.toThrow('Insufficient funds and negative balance is not allowed');
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transactions in correct order', async () => {
      const mockTransactions = [
        { id: '1', date: new Date(2025, 1, 1), amount: -500 },
        { id: '2', date: new Date(2025, 1, 2), amount: 1000 },
      ];

      (getDocs as any).mockResolvedValue({
        docs: mockTransactions.map(t => ({
          id: t.id,
          data: () => t,
        })),
      });

      const transactions = await WalletService.getTransactionHistory();
      expect(transactions).toHaveLength(2);
      expect(transactions[0].id).toBe('1');
      expect(transactions[1].id).toBe('2');
    });
  });
});
