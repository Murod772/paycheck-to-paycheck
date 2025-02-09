import { useState, useEffect } from 'react';
import { WalletService } from '../services/wallet';
import { Wallet } from '../types/collections';
import { WalletBalanceEdit } from './WalletBalanceEdit';

export function WalletDisplay() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditBalance, setShowEditBalance] = useState(false);

  const loadWallet = async () => {
    try {
      let data = await WalletService.getWallet();
      if (!data) {
        await WalletService.initializeWallet();
        data = await WalletService.getWallet();
      }
      setWallet(data);
      setError('');
    } catch (err: any) {
      console.error('Error loading wallet:', err);
      setError('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-500 text-sm">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return null;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Current Balance</h2>
            <div className="mt-1 flex items-baseline">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(wallet.currentBalance)}
              </p>
              {wallet.previousBalance !== wallet.currentBalance && (
                <span className={`ml-2 text-sm ${
                  wallet.currentBalance > wallet.previousBalance
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {wallet.currentBalance > wallet.previousBalance ? '↑' : '↓'}
                  {formatCurrency(Math.abs(wallet.currentBalance - wallet.previousBalance))}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowEditBalance(true)}
            className="text-gray-400 hover:text-blue-500 transition-colors"
          >
            <span className="sr-only">Edit balance</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        {wallet.lastUpdated && (
          <p className="mt-1 text-sm text-gray-500">
            Last updated: {wallet.lastUpdated.toDate().toLocaleString()}
          </p>
        )}
      </div>

      {showEditBalance && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <WalletBalanceEdit
              currentBalance={wallet.currentBalance}
              onClose={() => setShowEditBalance(false)}
              onSuccess={loadWallet}
            />
          </div>
        </div>
      )}
    </div>
  );
}
