import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { ExpenseModel } from '../types/collections';
import { ExpenseService } from '../services/expense';

interface ExpenseFormProps {
  onSuccess: () => void;
  initialData?: ExpenseModel;
}

export function ExpenseForm({ onSuccess, initialData }: ExpenseFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate
      ? new Date(initialData.dueDate.toDate()).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  const [recurringDay, setRecurringDay] = useState(
    initialData?.recurringDay?.toString() || ''
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Common style classes
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const inputClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm";
  const selectClasses = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const expenseData = {
        name,
        amount: parseFloat(amount),
        description,
        category,
        dueDate: Timestamp.fromDate(new Date(dueDate)),
        isRecurring,
        ...(isRecurring && recurringDay
          ? { recurringDay: parseInt(recurringDay, 10) }
          : {}),
      };

      if (initialData?.id) {
        await ExpenseService.updateExpense(initialData.id, expenseData);
      } else {
        await ExpenseService.createExpense(expenseData);
      }

      onSuccess();
      if (!initialData) {
        setName('');
        setAmount('');
        setDescription('');
        setCategory('');
        setDueDate(new Date().toISOString().split('T')[0]);
        setIsRecurring(false);
        setRecurringDay('');
      }
    } catch (err: any) {
      console.error('Error saving expense:', err);
      setError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div>
        <label htmlFor="name" className={labelClasses}>
          Name
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClasses}
          placeholder="e.g., Rent"
        />
      </div>

      <div>
        <label htmlFor="amount" className={labelClasses}>
          Amount
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="0.00"
            className={`${inputClasses} pl-7`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="category" className={labelClasses}>
          Category
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className={selectClasses}
        >
          <option value="">Select a category</option>
          <option value="rent">Rent</option>
          <option value="utilities">Utilities</option>
          <option value="groceries">Groceries</option>
          <option value="transportation">Transportation</option>
          <option value="entertainment">Entertainment</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className={labelClasses}>
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClasses}
          rows={3}
          placeholder="Add any additional details..."
        />
      </div>

      <div>
        <label htmlFor="dueDate" className={labelClasses}>
          Due Date
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
          className={inputClasses}
        />
      </div>

      <div className="flex items-center">
        <input
          id="isRecurring"
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900">
          Is this a recurring expense?
        </label>
      </div>

      {isRecurring && (
        <div>
          <label htmlFor="recurringDay" className={labelClasses}>
            Day of Month (1-31)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            id="recurringDay"
            type="number"
            min="1"
            max="31"
            value={recurringDay}
            onChange={(e) => setRecurringDay(e.target.value)}
            required={isRecurring}
            className={inputClasses}
          />
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialData ? 'Update Expense' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
}
