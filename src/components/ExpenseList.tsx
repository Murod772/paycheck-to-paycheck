import { useState, useEffect } from 'react';
import { ExpenseService } from '../services/expense';
import { ExpenseModel } from '../types/collections';
import { ExpenseForm } from './ExpenseForm';

export function ExpenseList() {
  const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allowNegativeBalance, setAllowNegativeBalance] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await ExpenseService.getUserExpenses();
      setExpenses(data);
      setError('');
    } catch (err: any) {
      console.error('Error loading expenses:', err);
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (expenseId: string) => {
    try {
      await ExpenseService.markAsPaid(expenseId, allowNegativeBalance);
      await loadExpenses();
    } catch (err: any) {
      if (err.message === 'Insufficient funds') {
        if (window.confirm('Insufficient funds. Would you like to allow negative balance?')) {
          setAllowNegativeBalance(true);
          await ExpenseService.markAsPaid(expenseId, true);
          await loadExpenses();
        }
      } else {
        console.error('Error marking expense as paid:', err);
        setError(err.message || 'Failed to mark expense as paid');
      }
    }
  };

  const handleMarkAsUnpaid = async (expenseId: string) => {
    try {
      await ExpenseService.markAsUnpaid(expenseId);
      await loadExpenses();
    } catch (err: any) {
      console.error('Error marking expense as unpaid:', err);
      setError(err.message || 'Failed to mark expense as unpaid');
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
      year: 'numeric'
    });
  };

  const isOverdue = (expense: ExpenseModel) => {
    if (expense.isPaid) return false;
    const dueDate = expense.dueDate.toDate();
    const today = new Date();
    return dueDate < today;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-500 text-sm">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your bills and expenses
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={allowNegativeBalance}
                onChange={(e) => setAllowNegativeBalance(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-600">Allow negative balance</span>
            </label>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {showAddForm ? 'Cancel' : 'Add Expense'}
            </button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-4 rounded shadow">
          <ExpenseForm
            onSuccess={() => {
              setShowAddForm(false);
              loadExpenses();
            }}
          />
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4">
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
        </div>
      )}

      <div className="px-6 py-4">
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first expense.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Expense
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className={`relative group bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  isOverdue(expense) ? 'border-red-300 bg-red-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">{expense.name}</h3>
                      <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {expense.category}
                      </span>
                      {isOverdue(expense) && (
                        <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Overdue
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-500 space-y-1">
                      {expense.description && (
                        <p className="text-gray-500">{expense.description}</p>
                      )}
                      <p className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Due: {formatDate(expense.dueDate)}
                      </p>
                      {expense.isPaid && expense.paidDate && (
                        <p className="flex items-center text-green-600">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Paid on {formatDate(expense.paidDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <span className="text-lg font-medium text-gray-900">
                      {formatCurrency(expense.amount)}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => expense.isPaid ? handleMarkAsUnpaid(expense.id) : handleMarkAsPaid(expense.id)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          expense.isPaid
                            ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                            : 'text-white bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {expense.isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
