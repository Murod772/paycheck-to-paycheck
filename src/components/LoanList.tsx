import { useState, useEffect } from 'react';
import { LoanService } from '../services/loan';
import { Loan } from '../types/collections';
import { LoanForm } from './LoanForm';

export function LoanList() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [allowNegativeBalance, setAllowNegativeBalance] = useState(false);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const data = await LoanService.getUserLoans();
      setLoans(data);
      setError('');
    } catch (err: any) {
      console.error('Error loading loans:', err);
      setError('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedLoan) return;

    try {
      await LoanService.makePayment(
        selectedLoan.id!,
        parseFloat(paymentAmount),
        allowNegativeBalance
      );
      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedLoan(null);
      await loadLoans();
    } catch (err: any) {
      console.error('Error making payment:', err);
      setError(err.message || 'Failed to make payment');
    }
  };

  const PaymentModal = () => {
    if (!showPaymentModal || !selectedLoan) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
        <div className="bg-white p-5 rounded-lg shadow-xl max-w-md w-full">
          <h3 className="text-lg font-bold mb-4">
            Make Payment - {selectedLoan.name}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder={`Monthly payment: $${selectedLoan.monthlyPayment}`}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={allowNegativeBalance}
                onChange={(e) => setAllowNegativeBalance(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Allow negative balance
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedLoan(null);
                  setPaymentAmount('');
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                Make Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Loans</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showAddForm ? 'Cancel' : 'Add Loan'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-4 rounded shadow">
          <LoanForm
            onSuccess={() => {
              setShowAddForm(false);
              loadLoans();
            }}
          />
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading loans...</div>
      ) : loans.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900">No loans found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first loan.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Loan
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className="bg-white p-4 rounded-lg shadow space-y-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{loan.name}</h3>
                  <p className="text-sm text-gray-500">Lender: {loan.lender}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedLoan(loan);
                    setPaymentAmount(loan.monthlyPayment.toString());
                    setShowPaymentModal(true);
                  }}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Make Payment
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Current Balance</p>
                  <p className="text-lg font-semibold">
                    ${loan.currentBalance.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Payment</p>
                  <p className="text-lg font-semibold">
                    ${loan.monthlyPayment.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="text-lg font-semibold">Day {loan.dueDate}</p>
                </div>
                {loan.interestRate && (
                  <div>
                    <p className="text-sm text-gray-500">Interest Rate</p>
                    <p className="text-lg font-semibold">
                      {loan.interestRate.toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
              {loan.paymentHistory.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">
                    Last Payment:
                  </p>
                  <p className="text-sm text-gray-500">
                    ${loan.paymentHistory[loan.paymentHistory.length - 1].amount.toFixed(2)} on{' '}
                    {new Date(
                      loan.paymentHistory[
                        loan.paymentHistory.length - 1
                      ].date.toDate()
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <PaymentModal />
    </div>
  );
}
