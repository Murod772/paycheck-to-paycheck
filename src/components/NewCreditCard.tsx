import { useState } from 'react';
import { CreditCardService } from '../services/creditCard';

interface NewCreditCardProps {
  onClose: () => void;
  onCardCreated: () => void;
}

export function NewCreditCard({ onClose, onCardCreated }: NewCreditCardProps) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [allowOverpayment, setAllowOverpayment] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const balanceAmount = parseFloat(balance);
    const minPayment = minimumPayment ? parseFloat(minimumPayment) : undefined;
    const dueDateObj = new Date(dueDate);

    if (!name || isNaN(balanceAmount) || !dueDate) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      await CreditCardService.createCreditCard(
        name,
        balanceAmount,
        dueDateObj,
        minPayment,
        allowOverpayment
      );
      onCardCreated();
    } catch (err: any) {
      console.error('Error creating credit card:', err);
      setError(err.message || 'Failed to create credit card');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Add New Credit Card
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Card Name*
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Visa, MasterCard, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Statement Balance*
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Due Date*
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Payment
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={minimumPayment}
                    onChange={(e) => setMinimumPayment(e.target.value)}
                    className="block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="allowOverpayment"
                    type="checkbox"
                    checked={allowOverpayment}
                    onChange={(e) => setAllowOverpayment(e.target.checked)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="allowOverpayment" className="font-medium text-gray-700">
                    Allow Overpayment
                  </label>
                  <p className="text-gray-500">Allow paying more than the statement balance</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-5 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Card'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
