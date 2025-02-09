import { useState } from 'react';
import { CreditCard } from '../types/collections';
import { CreditCardService } from '../services/creditCard';

interface CreditCardPaymentProps {
  card: CreditCard;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export function CreditCardPayment({ card, onClose, onPaymentComplete }: CreditCardPaymentProps) {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Please enter a valid payment amount');
      setLoading(false);
      return;
    }

    try {
      await CreditCardService.makePayment(card.id, paymentAmount);
      onPaymentComplete();
    } catch (err: any) {
      console.error('Error making payment:', err);
      setError(err.message || 'Failed to make payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Make Payment - {card.name}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                  max={card.allowOverpayment ? undefined : card.statementBalance}
                />
              </div>
              {!card.allowOverpayment && (
                <p className="mt-1 text-sm text-gray-500">
                  Maximum payment: ${card.statementBalance}
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
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
                {loading ? 'Processing...' : 'Make Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
