import { useState, useEffect } from 'react';
import { WalletService } from '../services/wallet';
import { Wallet } from '../types/collections';
import { deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export function WalletDebug() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWallets = async () => {
    try {
      const data = await WalletService.listAllWallets();
      setWallets(data);
      setError('');
    } catch (err: any) {
      console.error('Error loading wallets:', err);
      setError('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const deleteWallet = async (walletId: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Not authenticated');
      
      await deleteDoc(doc(db, 'users', userId, 'wallets', walletId));
      await loadWallets(); // Refresh the list
    } catch (err) {
      console.error('Error deleting wallet:', err);
      setError('Failed to delete wallet');
    }
  };

  if (loading) {
    return <div>Loading wallets...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden p-4">
      <h2 className="text-xl font-semibold mb-4">Wallet Debug</h2>
      <div className="space-y-4">
        {wallets.map(wallet => (
          <div key={wallet.id} className="border p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <p><strong>ID:</strong> {wallet.id}</p>
                <p><strong>Current Balance:</strong> ${wallet.currentBalance}</p>
                <p><strong>Previous Balance:</strong> ${wallet.previousBalance}</p>
                <p><strong>Created:</strong> {wallet.createdAt?.toDate?.()?.toLocaleString()}</p>
              </div>
              <button
                onClick={() => deleteWallet(wallet.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
