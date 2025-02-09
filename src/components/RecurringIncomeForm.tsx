import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { RecurringIncome, RecurringSchedule } from '../types/collections';
import { RecurringIncomeService } from '../services/recurringIncome';

interface RecurringIncomeFormProps {
  onSuccess: () => void;
  initialData?: RecurringIncome;
}

export function RecurringIncomeForm({ onSuccess, initialData }: RecurringIncomeFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [scheduleType, setScheduleType] = useState<RecurringSchedule['type']>(initialData?.schedule.type || 'weekly');
  const [dayOfWeek, setDayOfWeek] = useState(initialData?.schedule.dayOfWeek?.toString() || '0');
  const [dayOfMonth, setDayOfMonth] = useState(initialData?.schedule.dayOfMonth?.toString() || '1');
  const [startDate, setStartDate] = useState(
    initialData?.startDate 
      ? new Date(initialData.startDate.toDate()).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const schedule: RecurringSchedule = {
        type: scheduleType,
        ...(scheduleType === 'weekly' || scheduleType === 'biweekly' 
          ? { dayOfWeek: parseInt(dayOfWeek) }
          : scheduleType === 'monthly'
          ? { dayOfMonth: parseInt(dayOfMonth) }
          : {})
      };

      const incomeData = {
        name,
        amount: parseFloat(amount),
        category,
        description,
        schedule,
        startDate: Timestamp.fromDate(new Date(startDate)),
        isActive: true
      };

      if (initialData?.id) {
        await RecurringIncomeService.updateRecurringIncome(initialData.id, incomeData);
      } else {
        await RecurringIncomeService.createRecurringIncome(incomeData as any);
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving recurring income:', err);
      setError('Failed to save recurring income');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400" +
    " focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" +
    " disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none" +
    " invalid:border-pink-500 invalid:text-pink-600" +
    " focus:invalid:border-pink-500 focus:invalid:ring-pink-500";

  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

  const selectClasses = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Name Field */}
        <div className="col-span-2">
          <label htmlFor="name" className={labelClasses}>
            Income Name
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Monthly Salary"
            className={inputClasses}
          />
        </div>

        {/* Amount Field */}
        <div className="relative">
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

        {/* Category Field */}
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
            <option value="salary">Salary</option>
            <option value="freelance">Freelance</option>
            <option value="investment">Investment</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Schedule Type Field */}
        <div>
          <label htmlFor="scheduleType" className={labelClasses}>
            Schedule Type
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            id="scheduleType"
            value={scheduleType}
            onChange={(e) => setScheduleType(e.target.value as RecurringSchedule['type'])}
            required
            className={selectClasses}
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Day Selection based on Schedule Type */}
        {(scheduleType === 'weekly' || scheduleType === 'biweekly') && (
          <div>
            <label htmlFor="dayOfWeek" className={labelClasses}>
              Day of Week
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="dayOfWeek"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              required
              className={selectClasses}
            >
              <option value="0">Sunday</option>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
            </select>
          </div>
        )}

        {scheduleType === 'monthly' && (
          <div>
            <label htmlFor="dayOfMonth" className={labelClasses}>
              Day of Month
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="dayOfMonth"
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              required
              placeholder="1-31"
              className={inputClasses}
            />
          </div>
        )}

        {/* Start Date Field */}
        <div>
          <label htmlFor="startDate" className={labelClasses}>
            Start Date
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className={inputClasses}
          />
        </div>

        {/* Description Field */}
        <div className="col-span-2">
          <label htmlFor="description" className={labelClasses}>
            Description
            <span className="text-gray-400 text-xs ml-2">(Optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add any additional notes or details..."
            className={`${inputClasses} resize-none`}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mt-4">
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
      )}

      <div className="flex justify-end pt-5">
        <button
          type="button"
          onClick={() => onSuccess()}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            initialData ? 'Update Income' : 'Create Income'
          )}
        </button>
      </div>
    </form>
  );
}
