import { useState } from 'react';
import { usePayments } from '../../hooks/usePayment';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { CreditCard, Search, Download, PlusCircle, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { PaymentForm } from './components/PaymentForm';
import { PaymentQRCode } from './components/PaymentQRCode';

export function PaymentsPage() {
  const { data: payments, isLoading } = usePayments();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  const filteredPayments = payments?.filter(payment =>
    payment.appointment_id.toLowerCase().includes(search.toLowerCase())
  );

  const downloadReport = () => {
    if (!payments) return;

    const csv = [
      ['Data', 'Valor', 'Método', 'Status', 'Vencimento'].join(','),
      ...payments.map(payment => [
        format(new Date(payment.created_at), 'dd/MM/yyyy'),
        payment.amount,
        payment.payment_method,
        payment.status,
        format(new Date(payment.due_date), 'dd/MM/yyyy')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-gray-600 mt-1">
            Gerencie pagamentos e acompanhe o fluxo de caixa
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadReport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Pagamento
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar pagamentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Método
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vencimento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayments?.map((payment) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(payment.created_at), 'dd/MM/yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(payment.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center">
                    {payment.payment_method === 'credit_card' && <CreditCard className="w-4 h-4 mr-1" />}
                    {payment.payment_method === 'pix' && <QrCode className="w-4 h-4 mr-1" />}
                    {payment.payment_method}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(payment.due_date), 'dd/MM/yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {payment.payment_method === 'pix' && payment.status === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedPayment(payment.id);
                        setShowQRCode(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Ver QR Code
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <PaymentForm onClose={() => setShowForm(false)} />
      )}

      {showQRCode && selectedPayment && (
        <PaymentQRCode
          paymentId={selectedPayment}
          onClose={() => {
            setShowQRCode(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
}