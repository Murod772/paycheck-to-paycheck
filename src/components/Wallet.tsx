import { useEffect, useState } from 'react';
import { WalletService } from '../services/wallet';
import { Transaction, Wallet } from '../types/collections';

export function WalletDisplay() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Initialize wallet if it doesn't exist
        await WalletService.initializeWallet();
        await fetchWalletAndTransactions();
      } catch (err) {
        console.error('Error initializing wallet:', err);
        setError('Failed to initialize wallet');
      } finally {
        setLoading(false);
      }
    };

    initializeWallet();
  }, []);

  const fetchWalletAndTransactions = async () => {
    try {
      const [walletData, recentTransactions] = await Promise.all([
        WalletService.getWallet(),
        WalletService.getRecentTransactions(5)
      ]);
      setWallet(walletData);
      setTransactions(recentTransactions);
      setError(null);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to fetch wallet data');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    return new Date(timestamp.toDate()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-6">
      {/* Balance Display */}
      <div className="text-center">
        <h2 className="text-gray-500 text-sm font-medium">Current Balance</h2>
        <div className={`text-4xl font-bold mt-2 ${wallet?.currentBalance && wallet.currentBalance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
          {wallet ? formatCurrency(wallet.currentBalance) : '$0.00'}
        </div>
        <p className="text-gray-400 text-xs mt-1">
          Last updated: {wallet?.lastUpdated ? formatDate(wallet.lastUpdated) : 'Never'}
        </p>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-gray-700 font-medium mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center text-sm">No recent transactions</p>
          ) : (
            transactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">{transaction.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                </div>
                <div className={`text-sm font-medium ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
