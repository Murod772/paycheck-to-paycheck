import { useState, useEffect } from 'react';
import { CreditCardService } from '../services/creditCard';
import { CreditCard, CreditCardPayment } from '../types/collections';
import { CreditCardPayment as CreditCardPaymentModal } from './CreditCardPayment';
import { NewCreditCard } from './NewCreditCard';
import { UpdateStatement } from './UpdateStatement';

interface CardWithPayments extends CreditCard {
  recentPayments?: CreditCardPayment[];
  totalPaid?: number;
}

export function CreditCardList() {
  const [cards, setCards] = useState<CardWithPayments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [cardToUpdate, setCardToUpdate] = useState<CreditCard | null>(null);

  const loadCards = async () => {
    try {
      const cardsData = await CreditCardService.getCreditCards();
      console.log('Loaded cards:', cardsData);
      
      // Load recent payments for each card
      const cardsWithPayments = await Promise.all(
        cardsData.map(async (card) => {
          const payments = await CreditCardService.getPaymentHistory(card.id);
          console.log(`Payments for card ${card.id}:`, payments);
          const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
          return {
            ...card,
            recentPayments: payments,
            totalPaid
          };
        })
      );
      
      setCards(cardsWithPayments);
      setError('');
    } catch (err: any) {
      console.error('Error loading credit cards:', err);
      setError('Failed to load credit cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date | number) => {
    try {
      if (typeof date === 'number') {
        // Validate the day of month
        if (date < 1 || date > 31) {
          console.error('Invalid day of month:', date);
          return 'Invalid date';
        }
        // If it's a day of month, create a date for the current month
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth(), date);
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric'
        }).format(targetDate);
      }
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.error('Invalid date object:', date);
        return 'Invalid date';
      }
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', date);
      return 'Invalid date';
    }
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

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Credit Cards</h2>
          <button
            onClick={() => setShowAddCard(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Credit Card
          </button>
        </div>

        {cards.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No credit cards added yet.</p>
        ) : (
          <div className="space-y-6">
            {cards.map(card => (
              <div
                key={card.id}
                className="border rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{card.name}</h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {formatCurrency(card.statementBalance)}
                    </p>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Due Date: {formatDate(card.dueDate)}</p>
                      {card.minimumPayment && (
                        <p>Minimum Payment: {formatCurrency(card.minimumPayment)}</p>
                      )}
                      {card.totalPaid && card.totalPaid > 0 && (
                        <p className="text-green-600">
                          Total Paid This Cycle: {formatCurrency(card.totalPaid)}
                        </p>
                      )}
                    </div>
                    
                    {/* Payment Status */}
                    {card.totalPaid !== undefined && (
                      <div className="mt-2">
                        {card.totalPaid >= card.statementBalance ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Fully Paid
                          </span>
                        ) : card.totalPaid > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Partially Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No Payments
                          </span>
                        )}
                      </div>
                    )}

                    {/* Recent Payments */}
                    {card.recentPayments && card.recentPayments.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900">Recent Payments</h4>
                        <div className="mt-2 space-y-2">
                          {card.recentPayments.slice(0, 3).map(payment => (
                            <div key={payment.id} className="text-sm text-gray-500">
                              {formatCurrency(payment.amount)} on {formatDate(payment.date)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCard(card)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      Make Payment
                    </button>
                    <button
                      onClick={() => setCardToUpdate(card)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Update Statement
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCard && (
        <CreditCardPaymentModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onPaymentComplete={() => {
            setSelectedCard(null);
            loadCards();
          }}
        />
      )}

      {showAddCard && (
        <NewCreditCard
          onClose={() => setShowAddCard(false)}
          onCardCreated={() => {
            setShowAddCard(false);
            loadCards();
          }}
        />
      )}

      {cardToUpdate && (
        <UpdateStatement
          card={cardToUpdate}
          onClose={() => setCardToUpdate(null)}
          onUpdateComplete={() => {
            setCardToUpdate(null);
            loadCards();
          }}
        />
      )}
    </div>
  );
}
