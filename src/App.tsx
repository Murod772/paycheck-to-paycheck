import { useState, useEffect } from 'react'
import { onAuthStateChanged, User } from "firebase/auth";
import { Login } from './components/Login';
import { WalletDisplay } from './components/WalletDisplay';
import { WalletDebug } from './components/WalletDebug';
import { RecurringIncomeManager } from './components/RecurringIncomeManager';
import { ExpenseList } from './components/ExpenseList';
import { LoanList } from './components/LoanList';
import { CreditCardList } from './components/CreditCardList';
import { Overview } from './components/Overview';
import { auth } from './config/firebase';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Paycheck to Paycheck</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => auth.signOut()}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          <Overview />
          <div className="space-y-6">
            <WalletDisplay />
            <div className="hidden">
              <WalletDebug />
            </div>
            <CreditCardList />
            <RecurringIncomeManager />
            <ExpenseList />
            <LoanList />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App
