import { useState, useEffect } from 'react';
import { RecurringIncomeService } from '../services/recurringIncome';
import { CreditCardService } from '../services/creditCard';
import { LoanService } from '../services/loan';

interface OverviewData {
  monthlyIncome: number;
  creditCardPayments: number;
  totalLoanAmount: number;
}

export function Overview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading overview data...'); // Debug log
        const [monthlyIncome, creditCardPayments, totalLoanAmount] = await Promise.all([
          RecurringIncomeService.getTotalMonthlyIncome(),
          CreditCardService.getTotalMonthlyPaymentsDue(),
          LoanService.getTotalLoanAmount()
        ]);

        console.log('Monthly income calculated:', monthlyIncome); // Debug log
        console.log('Credit card payments:', creditCardPayments); // Debug log
        console.log('Total loan amount:', totalLoanAmount); // Debug log

        setData({
          monthlyIncome,
          creditCardPayments,
          totalLoanAmount
        });
      } catch (err: any) {
        console.error('Error loading overview data:', err);
        setError(err.message || 'Failed to load overview data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Monthly Income */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800">Monthly Income</h3>
            <p className="mt-2 text-2xl font-semibold text-green-900">
              {formatCurrency(data.monthlyIncome)}
            </p>
          </div>

          {/* Credit Card Payments */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800">Credit Card Payments Due</h3>
            <p className="mt-2 text-2xl font-semibold text-blue-900">
              {formatCurrency(data.creditCardPayments)}
            </p>
          </div>

          {/* Total Loan Amount */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-800">Total Loan Amount</h3>
            <p className="mt-2 text-2xl font-semibold text-purple-900">
              {formatCurrency(data.totalLoanAmount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
