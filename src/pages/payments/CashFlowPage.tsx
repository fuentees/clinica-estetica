import { useState } from 'react';
import { usePayments } from '../../hooks/usePayment';
import { Button } from '../../components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function CashFlowPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { data: payments } = usePayments();

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const monthlyPayments = payments?.filter(payment => {
    const paymentDate = new Date(payment.created_at);
    return paymentDate >= monthStart && paymentDate <= monthEnd;
  });

  const totalRevenue = monthlyPayments?.reduce((sum, payment) => 
    payment.status === 'paid' ? sum + payment.amount : sum, 0) || 0;

  const pendingRevenue = monthlyPayments?.reduce((sum, payment) => 
    payment.status === 'pending' ? sum + payment.amount : sum, 0) || 0;

  const overdueRevenue = monthlyPayments?.reduce((sum, payment) => 
    payment.status === 'overdue' ? sum + payment.amount : sum, 0) || 0;

  const paymentsByMethod = monthlyPayments?.reduce((acc, payment) => {
    acc[payment.payment_method] = (acc[payment.payment_method] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
        <input
          type="month"
          value={format(selectedMonth, 'yyyy-MM')}
          onChange={(e) => setSelectedMonth(new Date(e.target.value))}
          className="px-4 py-2 border rounded-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(totalRevenue)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendente</p>
              <p className="text-2xl font-bold text-yellow-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(pendingRevenue)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Em Atraso</p>
              <p className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(overdueRevenue)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Receita por Método de Pagamento</h2>
        <div className="space-y-4">
          {Object.entries(paymentsByMethod).map(([method, amount]) => (
            <div key={method} className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-gray-500" />
                <span className="capitalize">{method.replace('_', ' ')}</span>
              </div>
              <span className="font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}