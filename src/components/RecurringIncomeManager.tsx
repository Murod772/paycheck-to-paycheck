import { useState, useEffect } from 'react';
import { RecurringIncome } from '../types/collections';
import { RecurringIncomeService } from '../services/recurringIncome';
import { RecurringIncomeForm } from './RecurringIncomeForm';

export function RecurringIncomeManager() {
  const [incomes, setIncomes] = useState<RecurringIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<RecurringIncome | undefined>();

  useEffect(() => {
    loadIncomes();
  }, []);

  const loadIncomes = async () => {
    try {
      const data = await RecurringIncomeService.getUserRecurringIncomes();
      setIncomes(data);
      setError('');
    } catch (err) {
      console.error('Error loading recurring incomes:', err);
      setError('Failed to load recurring incomes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recurring income?')) {
      return;
    }

    try {
      await RecurringIncomeService.deleteRecurringIncome(id);
      await loadIncomes();
    } catch (err) {
      console.error('Error deleting recurring income:', err);
      setError('Failed to delete recurring income');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedIncome(undefined);
    loadIncomes();
  };

  const formatDate = (timestamp: any) => {
    return new Date(timestamp.toDate()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatSchedule = (income: RecurringIncome) => {
    const { schedule } = income;
    switch (schedule.type) {
      case 'weekly':
        return `Every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.dayOfWeek || 0]}`;
      case 'biweekly':
        return `Every other ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.dayOfWeek || 0]}`;
      case 'monthly':
        return `Monthly on day ${schedule.dayOfMonth}`;
      default:
        return 'Custom schedule';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-500 text-sm">Loading incomes...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedIncome ? 'Edit' : 'Add'} Recurring Income
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedIncome(undefined);
              }}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6">
          <RecurringIncomeForm
            onSuccess={handleFormSuccess}
            initialData={selectedIncome}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recurring Income</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your recurring income sources and schedules
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Income
          </button>
        </div>
      </div>

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
        {incomes.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recurring incomes</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first recurring income.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Income
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {incomes.map((income) => (
              <div
                key={income.id}
                className="relative group bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">{income.name}</h3>
                      <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {income.category}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500 space-y-1">
                      <p>{formatSchedule(income)}</p>
                      <p className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Next: {formatDate(income.nextScheduledDate)}
                      </p>
                      {income.description && (
                        <p className="text-gray-500 italic">{income.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <span className="text-lg font-medium text-green-600">
                      {formatCurrency(income.amount)}
                    </span>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedIncome(income);
                          setShowForm(true);
                        }}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <span className="sr-only">Edit</span>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => income.id && handleDelete(income.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <span className="sr-only">Delete</span>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
