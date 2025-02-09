import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Loan } from '../types/collections';
import { LoanService } from '../services/loan';

interface LoanFormProps {
  onSuccess: () => void;
  initialData?: Loan;
}

export function LoanForm({ onSuccess, initialData }: LoanFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [initialPrincipal, setInitialPrincipal] = useState(
    initialData?.initialPrincipal?.toString() || ''
  );
  const [monthlyPayment, setMonthlyPayment] = useState(
    initialData?.monthlyPayment?.toString() || ''
  );
  const [interestRate, setInterestRate] = useState(
    initialData?.interestRate?.toString() || ''
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate?.toString() || ''
  );
  const [startDate, setStartDate] = useState(
    initialData?.startDate
      ? new Date(initialData.startDate.toDate()).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [lender, setLender] = useState(initialData?.lender || '');
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
      const loanData = {
        name,
        initialPrincipal: parseFloat(initialPrincipal),
        monthlyPayment: parseFloat(monthlyPayment),
        ...(interestRate ? { interestRate: parseFloat(interestRate) } : {}),
        dueDate: parseInt(dueDate, 10),
        startDate: Timestamp.fromDate(new Date(startDate)),
        lender,
      };

      if (initialData?.id) {
        await LoanService.updateLoan(initialData.id, loanData);
      } else {
        await LoanService.createLoan(loanData);
      }

      onSuccess();
      if (!initialData) {
        setName('');
        setInitialPrincipal('');
        setMonthlyPayment('');
        setInterestRate('');
        setDueDate('');
        setLender('');
      }
    } catch (err: any) {
      console.error('Error saving loan:', err);
      setError(err.message || 'Failed to save loan');
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
          Loan Name
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClasses}
          placeholder="e.g., Car Loan"
        />
      </div>

      <div>
        <label htmlFor="initialPrincipal" className={labelClasses}>
          Initial Principal
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            id="initialPrincipal"
            type="number"
            step="0.01"
            value={initialPrincipal}
            onChange={(e) => setInitialPrincipal(e.target.value)}
            required
            placeholder="0.00"
            className={`${inputClasses} pl-7`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="monthlyPayment" className={labelClasses}>
          Monthly Payment
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            id="monthlyPayment"
            type="number"
            step="0.01"
            value={monthlyPayment}
            onChange={(e) => setMonthlyPayment(e.target.value)}
            required
            placeholder="0.00"
            className={`${inputClasses} pl-7`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="interestRate" className={labelClasses}>
          Interest Rate (%)
        </label>
        <div className="relative rounded-md shadow-sm">
          <input
            id="interestRate"
            type="number"
            step="0.01"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className={inputClasses}
            placeholder="Optional"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">%</span>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="dueDate" className={labelClasses}>
          Due Date (Day of Month)
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          id="dueDate"
          type="number"
          min="1"
          max="31"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
          className={inputClasses}
          placeholder="1-31"
        />
      </div>

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

      <div>
        <label htmlFor="lender" className={labelClasses}>
          Lender
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          id="lender"
          type="text"
          value={lender}
          onChange={(e) => setLender(e.target.value)}
          required
          className={inputClasses}
          placeholder="e.g., Bank Name"
        />
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialData ? 'Update Loan' : 'Add Loan'}
        </button>
      </div>
    </form>
  );
}
