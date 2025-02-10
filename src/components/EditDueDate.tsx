import { useState } from 'react';
import { CreditCard } from '../types/collections';
import { CreditCardService } from '../services/creditCard';

interface EditDueDateProps {
  card: CreditCard;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditDueDate({ card, onClose, onUpdate }: EditDueDateProps) {
  const [dueDate, setDueDate] = useState(card.dueDate.toString());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const dueDateNum = parseInt(dueDate, 10);
      if (isNaN(dueDateNum) || dueDateNum < 1 || dueDateNum > 31) {
        throw new Error('Please enter a valid day between 1 and 31');
      }

      await CreditCardService.updateDueDate(card.id, dueDateNum);
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update due date');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Due Date</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dueDate">
              Due Date (Day of Month)
            </label>
            <input
              type="number"
              id="dueDate"
              min="1"
              max="31"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {error && (
            <div className="mb-4 text-red-500 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
